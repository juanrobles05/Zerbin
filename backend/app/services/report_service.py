from app.models.report import Report

# Dummy implementation of get_address_from_coords
def get_address_from_coords(latitude, longitude):
    # Replace this with actual logic to get address from coordinates
    return f"Address for ({latitude}, {longitude})"

class ReportService:
    def __init__(self):
        pass

    @staticmethod
    def create_report(db, report_data, image_url, ai_classification):
        # Crear instancia del modelo Report
        report = Report(
            latitude=report_data.latitude,
            longitude=report_data.longitude,
            description=report_data.description,
            image_url=image_url,
            address=get_address_from_coords(report_data.latitude, report_data.longitude),  # Si tienes una función para esto
            waste_type=ai_classification.get("type"),
            confidence_score=ai_classification.get("confidence"),
            status="pending"
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        # Retornar el objeto, FastAPI lo serializa usando ReportResponse
        return report

# Debes definir o importar la función get_address_from_coords si quieres calcular la dirección.