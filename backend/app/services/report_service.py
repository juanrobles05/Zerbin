from app.models.report import Report
from app.services.priority_service import PriorityService
from datetime import datetime, timezone

# Dummy implementation of get_address_from_coords
def get_address_from_coords(latitude, longitude):
    # Replace this with actual logic to get address from coordinates
    return f"Address for ({latitude}, {longitude})"

class ReportService:
    def __init__(self):
        pass

    @staticmethod
    async def create_report(db, report_data):
        """
        Crea un nuevo reporte con cálculo automático de prioridad.
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
        
        # Crear instancia del modelo Report
        report = Report(
            latitude=report_data.latitude,
            longitude=report_data.longitude,
            description=report_data.description,
            image_url=report_data.image_url,
            address=get_address_from_coords(report_data.latitude, report_data.longitude),
            waste_type=waste_type,
            confidence_score=confidence_score,
            status="pending",
            priority=priority_level  # Asignar prioridad calculada
        )
        
        db.add(report)
        db.commit()
        db.refresh(report)
        return report

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
        
        # Ordenar por prioridad (mayor primero) y luego por fecha de creación
        query = query.order_by(Report.priority.desc(), Report.created_at.asc())
        
        total = query.count()
        reports = query.offset(skip).limit(limit).all()
        return reports, total

    @staticmethod
    def get_report_by_id(db, report_id):
        """
        Obtiene un reporte específico por ID.
        """
        return db.query(Report).filter(Report.id == report_id).first()

    @staticmethod
    def update_report_status(db, report_id, status):
        """
        Actualiza el estado de un reporte y marca fecha de resolución si aplica.
        """
        report = db.query(Report).filter(Report.id == report_id).first()
        if report:
            report.status = status
            if status == "resolved":
                report.resolved_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(report)
        return report
    
    @staticmethod
    def recalculate_priority(db, report_id):
        """
        Recalcula la prioridad de un reporte existente.
        Útil para actualizar prioridades basadas en tiempo de exposición.
        """
        report = db.query(Report).filter(Report.id == report_id).first()
        if not report:
            return None
        
        # Recalcular prioridad con los datos actuales
        priority_level, urgency_label = PriorityService.calculate_priority(
            waste_type=report.waste_type,
            confidence_score=report.confidence_score,
            created_at=report.created_at
        )
        
        # Actualizar solo si cambió
        if report.priority != priority_level:
            report.priority = priority_level
            db.commit()
            db.refresh(report)
        
        return report
    
    @staticmethod
    def recalculate_all_priorities(db):
        """
        Recalcula las prioridades de todos los reportes pendientes.
        Útil para ejecutar periódicamente (ej: tarea cron diaria).
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
        
        return {
            "total_checked": len(pending_reports),
            "updated": updated_count
        }
    
    @staticmethod
    def get_priority_stats(db):
        """
        Obtiene estadísticas de prioridades de reportes activos.
        """
        from sqlalchemy import func
        
        stats = db.query(
            Report.priority,
            func.count(Report.id).label('count')
        ).filter(
            Report.status.in_(["pending", "in_progress"])
        ).group_by(Report.priority).all()
        
        priority_labels = {1: "Low", 2: "Medium", 3: "High"}
        
        return {
            priority_labels[priority]: count 
            for priority, count in stats
        }