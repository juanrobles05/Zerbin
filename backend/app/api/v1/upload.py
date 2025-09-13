import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
import requests
from io import BytesIO

from app.core.database import get_db
from app.schemas.report import ReportCreate, ReportResponse
from app.services.report_service import ReportService
from app.services.image_service import ImageService
from app.services.ai_service import AIService

router = APIRouter()
ai_service = AIService()

class ClassifyRequest(BaseModel):
    image_url: str

@router.post("/upload-image", response_model=ReportResponse)
def upload_image(
    report: ReportCreate,
    db: Session = Depends(get_db)
):
    created_report = ReportService.create_report(
        db=db,
        report_data=report
    )
    return created_report

@router.post("/classify")
def classify_waste_from_url(request: ClassifyRequest):
    """ Clasifica la imagen desde una URL (Firebase Storage) """
    try:
        # Descargar imagen desde Firebase
        response = requests.get(request.image_url)
        response.raise_for_status()
        # Clasificar usando tu servicio AI
        result = ai_service.classify_waste(response.content)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))