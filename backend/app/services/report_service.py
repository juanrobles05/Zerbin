from app.models.report import Report
from datetime import datetime

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
        # Crear reporte con estado "pending" por defecto
        waste_type = report_data.ai_classification.get("type")
        confidence = report_data.ai_classification.get("confidence")

        forced_user_id = 1

        report = Report(
            latitude=report_data.latitude,
            longitude=report_data.longitude,
            description=report_data.description,
            image_url=report_data.image_url,
            address=get_address_from_coords(report_data.latitude, report_data.longitude),
            waste_type=waste_type,
            confidence_score=confidence,
            status="pending",
            user_id=forced_user_id # ⚠ IMPORTANTE: el frontend debe enviar esto
        )

        db.add(report)
        db.commit()
        db.refresh(report)

        
        if report.user_id:
            points = POINTS_BY_WASTE_TYPE.get((waste_type or "").lower(), DEFAULT_POINTS)
            from app.models.user import User
            user = db.query(User).filter(User.id == report.user_id).first()
            if user:
                user.points = (user.points or 0) + points
                db.commit()

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
