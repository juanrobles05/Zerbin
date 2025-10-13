from app.models.report import Report

# Dummy implementation of get_address_from_coords
def get_address_from_coords(latitude, longitude):
    # Replace this with actual logic to get address from coordinates
    return f"Address for ({latitude}, {longitude})"

class ReportService:
    def __init__(self):
        pass

    @staticmethod
    async def create_report(db, report_data):

        # Crear instancia del modelo Report
        report = Report(
            latitude=report_data.latitude,
            longitude=report_data.longitude,
            description=report_data.description,
            image_url=report_data.image_url,
            address=get_address_from_coords(report_data.latitude, report_data.longitude),
            waste_type=report_data.ai_classification.get("type"),
            confidence_score=report_data.ai_classification.get("confidence"),
            status="pending"
        )
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

    def update_report_classification(db, report_id, corrected_type: str):
        """Save a user-corrected classification for a report."""
        report = db.query(Report).filter(Report.id == report_id).first()
        if not report:
            return None
        report.manual_classification = corrected_type
        # Optionally update the active waste_type so reads reflect corrected value
        report.waste_type = corrected_type
        db.commit()
        db.refresh(report)
        return report