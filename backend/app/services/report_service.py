from app.models.report import Report
from app.services.priority_service import PriorityService
from datetime import datetime
import logging

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
        # Inicializar servicio de prioridad
        priority_service = PriorityService(db)

        # Obtener información de prioridad basada en el tipo de residuo
        waste_type = report_data.ai_classification.get("type", "unknown")
        confidence = report_data.ai_classification.get("confidence", 0.0)
        priority_info = priority_service.get_priority_for_waste_type(waste_type)

        # Crear reporte con estado "pending" y user_id temporal (hasta integrar autenticación)
        forced_user_id = 1

        report = Report(
            latitude=report_data.latitude,
            longitude=report_data.longitude,
            description=report_data.description,
            image_url=report_data.image_url,
            address=get_address_from_coords(report_data.latitude, report_data.longitude),
            waste_type=waste_type,
            confidence_score=confidence,
            priority=priority_info["priority"],
            status="pending",
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

        # Log de información para casos urgentes
        if priority_info["is_urgent"]:
            logger.warning(
                f"ALERTA URGENTE: Residuo de alta prioridad detectado - "
                f"Tipo: {waste_type}, Descomposición: {priority_info['decomposition_days']} días, "
                f"Confianza: {confidence}%, Ubicación: ({report_data.latitude}, {report_data.longitude})"
            )

        # Generar alerta si es necesario
        if priority_service.should_generate_alert(waste_type, confidence / 100):
            await ReportService._generate_urgent_alert(report, priority_info)

        return report

    @staticmethod
    async def _generate_urgent_alert(report: Report, priority_info: dict):
        """Genera una alerta urgente para residuos de alta prioridad."""
        try:
            logger.critical("🚨 ALERTA URGENTE GENERADA 🚨")
            logger.critical(f"Reporte ID: {report.id}")
            logger.critical(f"Tipo de residuo: {report.waste_type}")
            logger.critical(f"Tiempo de descomposición: {priority_info['decomposition_days']} días")
            logger.critical(f"Ubicación: {report.address}")
            logger.critical(f"Confianza de IA: {report.confidence_score}%")
            logger.critical(f"Prioridad: {report.priority} (3=alta, 2=media, 1=baja)")
        except Exception as e:
            logger.error(f"Error generando alerta urgente: {e}")

    @staticmethod
    def get_reports(db, skip=0, limit=50, status=None, waste_type=None, priority=None):
        """Obtener lista de reportes con filtros opcionales, incluyendo prioridad"""
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
        """Obtener reportes urgentes (alta prioridad) para alertas"""
        query = db.query(Report).filter(
            Report.priority == 3,
            Report.status == "pending"
        ).order_by(Report.created_at.desc())

        return query.limit(limit).all()

    @staticmethod
    def get_report_by_id(db, report_id):
        return db.query(Report).filter(Report.id == report_id).first()

    @staticmethod
    def update_report_status(db, report_id, status):
        report = db.query(Report).filter(Report.id == report_id).first()
        if report:
            report.status = status
            if status == "resolved":
                report.resolved_at = datetime.now()

                try:
                    points = POINTS_BY_WASTE_TYPE.get((report.waste_type or "").lower(), DEFAULT_POINTS)
                except Exception:
                    points = DEFAULT_POINTS

                if report.user_id:
                    from app.models.user import User
                    user = db.query(User).filter(User.id == report.user_id).first()
                    if user:
                        user.points = (user.points or 0) + points

            db.commit()
            db.refresh(report)
        return report