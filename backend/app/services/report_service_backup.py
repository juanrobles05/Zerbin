from app.models.report import Report
from app.services.priority_service import PriorityService
import logging

logger = logging.getLogger(__name__)

# Dummy implementation of get_address_from_coords
def get_address_from_coords(latitude, longitude):
    # Replace this with actual logic to get address from coordinates
    return f"Address for ({latitude}, {longitude})"

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
        
        # Crear instancia del modelo Report con prioridad calculada
        report = Report(
            latitude=report_data.latitude,
            longitude=report_data.longitude,
            description=report_data.description,
            image_url=report_data.image_url,
            address=get_address_from_coords(report_data.latitude, report_data.longitude),
            waste_type=waste_type,
            confidence_score=confidence,
            priority=priority_info["priority"],  # Asignar prioridad calculada
            status="pending"
        )
        
        # Log de información para casos urgentes
        if priority_info["is_urgent"]:
            logger.warning(f"ALERTA URGENTE: Residuo de alta prioridad detectado - Tipo: {waste_type}, "
                         f"Descomposición: {priority_info['decomposition_days']} días, "
                         f"Confianza: {confidence}%, Ubicación: ({report_data.latitude}, {report_data.longitude})")
        
        db.add(report)
        db.commit()
        db.refresh(report)
        
        # Generar alerta si es necesario
        if priority_service.should_generate_alert(waste_type, confidence / 100):
            await ReportService._generate_urgent_alert(report, priority_info)
        
        return report

    @staticmethod
    async def _generate_urgent_alert(report: Report, priority_info: dict):
        """
        Genera una alerta urgente para residuos de alta prioridad.
        """
        try:
            # Aquí se puede integrar con servicios de notificación
            # Por ahora, solo registramos en el log
            logger.critical(f"🚨 ALERTA URGENTE GENERADA 🚨")
            logger.critical(f"Reporte ID: {report.id}")
            logger.critical(f"Tipo de residuo: {report.waste_type}")
            logger.critical(f"Tiempo de descomposición: {priority_info['decomposition_days']} días")
            logger.critical(f"Ubicación: {report.address}")
            logger.critical(f"Confianza de IA: {report.confidence_score}%")
            logger.critical(f"Prioridad: {report.priority} (3=alta, 2=media, 1=baja)")
            
            # TODO: Integrar con servicios de notificación reales:
            # - Envío de emails a empresas recolectoras
            # - Notificaciones push
            # - Integración con sistemas de gestión municipal
            
        except Exception as e:
            logger.error(f"Error generando alerta urgente: {e}")
        db.add(report)
        db.commit()
        db.refresh(report)
        return report

    def get_reports(db, skip=0, limit=50, status=None, waste_type=None):
        query = db.query(Report)
        if status:
            query = query.filter(Report.status == status)
        if waste_type:
            query = query.filter(Report.waste_type == waste_type)
        total = query.count()
        reports = query.offset(skip).limit(limit).all()
        return reports, total

    def get_report_by_id(db, report_id):
        return db.query(Report).filter(Report.id == report_id).first()

    def update_report_status(db, report_id, status):
        report = db.query(Report).filter(Report.id == report_id).first()
        if report:
            report.status = status
            if status == "resolved":
                from datetime import datetime
                report.resolved_at = datetime.now()
            db.commit()
            db.refresh(report)
        return report