from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.schemas.report import ReportCreate, ReportResponse, ReportListResponse
from app.services.report_service import ReportService
from app.services.image_service import ImageService
from app.services.ai_service import AIService

router = APIRouter()

@router.post("/", response_model=ReportResponse)
async def create_report(
    image: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Crear un nuevo reporte de residuo con imagen
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

@router.get("/", response_model=ReportListResponse)
async def get_reports(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    waste_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Obtener lista de reportes con filtros opcionales
    """
    reports, total = await ReportService.get_reports(
        db=db, 
        skip=skip, 
        limit=limit,
        status=status,
        waste_type=waste_type
    )
    
    return ReportListResponse(
        reports=reports,
        total=total,
        page=(skip // limit) + 1,
        per_page=limit
    )

@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(report_id: int, db: Session = Depends(get_db)):
    """
    Obtener un reporte específico por ID
    """
    report = await ReportService.get_report_by_id(db=db, report_id=report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    
    return report

@router.put("/{report_id}/status")
async def update_report_status(
    report_id: int,
    status: str,
    db: Session = Depends(get_db)
):
    """
    Actualizar el estado de un reporte (para administradores)
    """
    updated_report = await ReportService.update_report_status(
        db=db,
        report_id=report_id,
        status=status
    )
    
    if not updated_report:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    
    return {"message": "Estado actualizado correctamente", "status": status}