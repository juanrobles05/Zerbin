from datetime import datetime, timezone
import logging
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.report import Report
from app.services.priority_service import PriorityService
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)

# Dummy implementation of get_address_from_coords
def get_address_from_coords(latitude, longitude):
    return f"Address for ({latitude}, {longitude})"

# Mapa de puntos
POINTS_BY_WASTE_TYPE = {
    "plastic": 10,
    "glass": 8,
    "paper": 5,
    "organic": 3,
    "metal": 12,
}
DEFAULT_POINTS = 2


class ReportService:
    def __init__(self):
        pass

    @staticmethod
    async def create_report(db, report_data):
        """
        Crea un nuevo reporte con cálculo automático de prioridad y asignación de puntos.
        """
        # Extraer datos de clasificación AI
        waste_type = report_data.ai_classification.get("type")
        confidence_score = report_data.ai_classification.get("confidence")

        # Calcular prioridad automáticamente
        priority_level, urgency_label = PriorityService.calculate_priority(
            waste_type=waste_type,
            confidence_score=confidence_score,
            created_at=datetime.now(timezone.utc)
        )

        # Crear reporte (por ahora user_id forzado hasta integrar autenticación)
        forced_user_id = 1
        report = Report(
            latitude=report_data.latitude,
            longitude=report_data.longitude,
            description=report_data.description,
            image_url=report_data.image_url,
            address=get_address_from_coords(report_data.latitude, report_data.longitude),
            waste_type=waste_type,
            confidence_score=confidence_score,
            status="pending",
            priority=priority_level,
            user_id=forced_user_id
        )

        db.add(report)
        db.commit()
        db.refresh(report)

        # Asignar puntos al usuario si existe
        if report.user_id:
            points = POINTS_BY_WASTE_TYPE.get((waste_type or "").lower(), DEFAULT_POINTS)
            from app.models.user import User
            user = db.query(User).filter(User.id == report.user_id).first()
            if user:
                user.points = (user.points or 0) + points
                db.commit()

        # Log de información si el reporte es urgente
        if priority_level == 3:
            logger.warning(
                f"🚨 ALERTA URGENTE: Residuo de alta prioridad detectado - "
                f"Tipo: {waste_type}, Confianza: {confidence_score}%, "
                f"Ubicación: ({report_data.latitude}, {report_data.longitude})"
            )
            await ReportService._generate_urgent_alert(report)

        return report

    @staticmethod
    async def _generate_urgent_alert(report: Report):
        """Genera una alerta urgente para residuos de alta prioridad."""
        try:
            logger.critical("🚨 ALERTA URGENTE GENERADA 🚨")
            logger.critical(f"Reporte ID: {report.id}")
            logger.critical(f"Tipo de residuo: {report.waste_type}")
            logger.critical(f"Ubicación: {report.address}")
            logger.critical(f"Confianza de IA: {report.confidence_score}%")
            logger.critical(f"Prioridad: {report.priority} (3=alta, 2=media, 1=baja)")
        except Exception as e:
            logger.error(f"Error generando alerta urgente: {e}")

    @staticmethod
    def get_reports(db, skip=0, limit=50, status=None, waste_type=None, priority=None):
        """
        Obtiene reportes con filtros opcionales y ordenados por prioridad descendente.
        """
        query = db.query(Report)
        if status:
            query = query.filter(Report.status == status)
        if waste_type:
            query = query.filter(Report.waste_type == waste_type)
        if priority:
            query = query.filter(Report.priority == priority)

        query = query.order_by(Report.priority.desc(), Report.created_at.desc())
        total = query.count()
        reports = query.offset(skip).limit(limit).all()
        return reports, total

    @staticmethod
    def get_urgent_reports(db, limit=10):
        """Obtiene los reportes urgentes (prioridad alta y pendientes)."""
        query = db.query(Report).filter(
            Report.priority == 3,
            Report.status == "pending"
        ).order_by(Report.created_at.desc())
        return query.limit(limit).all()

    @staticmethod
    def get_report_by_id(db, report_id):
        """Obtiene un reporte específico por ID."""
        return db.query(Report).filter(Report.id == report_id).first()

    @staticmethod
    def update_report_status(
        db: Session,
        report_id: int,
        status: str,
        #assigned_to: Optional[str] = None,
        #rejection_reason: Optional[str] = None,
        #collection_notes: Optional[str] = None
    ):
        """Actualizar el estado de un reporte y notificar al usuario"""
        report = db.query(Report).filter(Report.id == report_id).first()
        if not report:
            return None
        
        # Guardar estado anterior para la notificación
        old_status = report.status
        
        # Actualizar estado
        report.status = status
        """
        # Actualizar campos adicionales según el estado
        if assigned_to:
            report.assigned_to = assigned_to
            report.assigned_at = datetime.now(timezone.utc)
        
        if rejection_reason:
            report.rejection_reason = rejection_reason
        
        if collection_notes:
            report.collection_notes = collection_notes
        """
        # Timestamps específicos
        if status == "collected":
            report.collected_at = datetime.now(timezone.utc)
            report.resolved_at = datetime.now(timezone.utc)
            
            # Asignar puntos adicionales por completar
            if report.user_id:
                from app.models.user import User
                user = db.query(User).filter(User.id == report.user_id).first()
                if user:
                    bonus_points = 5  # Puntos bonus por completar
                    user.points = (user.points or 0) + bonus_points
        
        db.commit()
        db.refresh(report)
        
        # 🔔 Crear notificación de cambio de estado
        if old_status != status and report.user_id:
            try:
                NotificationService.notify_status_change(
                    db=db,
                    report_id=report_id,
                    old_status=old_status,
                    new_status=status
                )
            except Exception as e:
                logger.error(f"Error creando notificación: {e}")
                # No fallar la actualización si la notificación falla
        
        return report


    @staticmethod
    def update_report_classification(db, report_id, corrected_type: str):
        """Guarda la clasificación corregida manualmente por el usuario."""
        report = db.query(Report).filter(Report.id == report_id).first()
        if not report:
            return None
        report.manual_classification = corrected_type
        report.waste_type = corrected_type  # reflejar corrección activa
        db.commit()
        db.refresh(report)
        return report

    @staticmethod
    def recalculate_priority(db, report_id):
        """
        Recalcula la prioridad de un reporte específico.
        """
        report = db.query(Report).filter(Report.id == report_id).first()
        if not report:
            return None

        priority_level, urgency_label = PriorityService.calculate_priority(
            waste_type=report.waste_type,
            confidence_score=report.confidence_score,
            created_at=report.created_at
        )

        if report.priority != priority_level:
            report.priority = priority_level
            db.commit()
            db.refresh(report)

        return report

    @staticmethod
    def recalculate_all_priorities(db):
        """
        Recalcula las prioridades de todos los reportes pendientes.
        Útil para tareas automáticas (cron job).
        """
        pending_reports = db.query(Report).filter(
            Report.status.in_(["pending", "in_progress"])
        ).all()

        updated_count = 0
        for report in pending_reports:
            old_priority = report.priority
            priority_level, _ = PriorityService.calculate_priority(
                waste_type=report.waste_type,
                confidence_score=report.confidence_score,
                created_at=report.created_at
            )
            if old_priority != priority_level:
                report.priority = priority_level
                updated_count += 1

        if updated_count > 0:
            db.commit()

        return {"total_checked": len(pending_reports), "updated": updated_count}

    @staticmethod
    def get_priority_stats(db):
        """Obtiene estadísticas de prioridad de los reportes activos."""
        stats = db.query(
            Report.priority,
            func.count(Report.id).label("count")
        ).filter(
            Report.status.in_(["pending", "in_progress"])
        ).group_by(Report.priority).all()

        priority_labels = {1: "Low", 2: "Medium", 3: "High"}
        return {priority_labels[p]: c for p, c in stats}
    
    @staticmethod
    def get_user_dashboard(db: Session, user_id: int):
        """Obtener datos del dashboard del usuario"""
        from sqlalchemy import func
        from app.models.user import User
        
        # Obtener usuario
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        
        # Total de reportes
        total_reports = db.query(Report).filter(Report.user_id == user_id).count()
        
        # Reportes por estado
        reports_by_status = {}
        status_counts = db.query(
            Report.status,
            func.count(Report.id).label("count")
        ).filter(Report.user_id == user_id).group_by(Report.status).all()
        
        for status, count in status_counts:
            reports_by_status[status] = count
        
        # Reportes recientes (últimos 10)
        recent_reports = db.query(Report).filter(
            Report.user_id == user_id
        ).order_by(Report.created_at.desc()).limit(10).all()
        
        # Notificaciones pendientes
        pending_notifications = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).count()
        
        return {
            "user_id": user_id,
            "username": user.username,
            "email": user.email,
            "total_reports": total_reports,
            "reports_by_status": reports_by_status,
            "total_points": user.points or 0,
            "recent_reports": recent_reports,
            "pending_notifications": pending_notifications
        }