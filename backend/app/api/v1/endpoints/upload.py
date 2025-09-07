from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.schemas.report import ReportCreate, ReportResponse
from app.services.report_service import ReportService
from app.services.image_service import ImageService
from app.services.ai_service import AIService

router = APIRouter()

@router.post("/upload-image", response_model=ReportResponse)
async def upload_image(
    image: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Endpoint para subir imagen y crear reporte de residuo
    """
    # Validar imagen
    if not ImageService.validate_image(image):
        raise HTTPException(status_code=400, detail="Formato de imagen no válido")
    
    # Guardar imagen
    image_url = await ImageService.save_image(image)
    
    # Clasificar con IA
    ai_result = await AIService.classify_waste(image_url)
    
    # Crear reporte
    report_data = ReportCreate(
        latitude=latitude,
        longitude=longitude,
        description=description
    )
    
    report = await ReportService.create_report(
        db=db,
        report_data=report_data,
        image_url=image_url,
        ai_classification=ai_result
    )
    
    return report
