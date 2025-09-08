from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.schemas.report import ReportCreate, ReportResponse
from app.services.report_service import ReportService
from app.services.image_service import ImageService
from app.services.ai_service import AIService

router = APIRouter()
ai_service = AIService()

@router.post("/upload-image", response_model=ReportResponse)
def upload_image(
    image: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):

    contents = image.file.read()
    img_service = ImageService()

    """
    Endpoint para subir imagen y crear reporte de residuo
    """
    # Validar imagen
    try:
        img_service.validate_image(contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Guardar imagen (devuelve URL o path)
    image_url = img_service.save_image(contents)

    # Clasificar con IA
    ai_result = ai_service.classify_waste(contents)

    # Crear reporte
    report_data = ReportCreate(
        latitude=latitude,
        longitude=longitude,
        description=description,
        image_url=image_url,
        address ="Carrera 22"
    )

    report = ReportService.create_report(
        db=db,
        report_data=report_data,
        image_url=image_url,
        ai_classification=ai_result
    )

    return report


@router.post("/classify")
def classify_waste(image: UploadFile = File(...)):
    """
    Solo clasifica la imagen sin crear reporte
    """
    contents = image.file.read()
    result = ai_service.classify_waste(contents)
    return result