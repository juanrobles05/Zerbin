from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
import json
from app.core.database import get_db
from app.schemas.report import ReportResponse, ReportListResponse, ReportBase
from pydantic import ValidationError
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
    ai_classification: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Crear un nuevo reporte de residuo con imagen.
    1. Sube la imagen a Supabase
    2. Clasifica la imagen con IA
    3. Guarda el reporte en la base de datos
    """
    file_bytes = await image.read()
    image_filename = image.filename

    # Validar que lat/long esten en el rango correcto
    try:
        ReportBase(latitude=latitude, longitude=longitude, description=description)
    except ValidationError as e:
        # Convertir errores de validación a respuesta HTTP 400
        raise HTTPException(status_code=400, detail=e.errors())

    # Subir imagen a Supabase
    public_url = await ImageService().upload_to_supabase(
        file_bytes=file_bytes,
        original_filename=image_filename
    )

    # Usar la clasificación realizada anteriormente si existe (evita recalcular)
    if ai_classification is not None and str(ai_classification).strip() != "string":
        try:
            ai_result = json.loads(ai_classification)
        except Exception:
            raise HTTPException(status_code=400, detail="ai_classification debe ser un JSON válido")
    else:
        ai_result = AIService().classify_waste(file_bytes)

    # Crear objeto de datos para el reporte
    report_data = type('ReportData', (), {})()
    report_data.latitude = latitude
    report_data.longitude = longitude
    report_data.description = description
    report_data.image_url = public_url
    report_data.ai_classification = ai_result

    # Crear el reporte en la base de datos
    created_report = await ReportService.create_report(
        db=db,
        report_data=report_data
    )
    return created_report


@router.get("/", response_model=ReportListResponse)
async def get_reports(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    waste_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Obtener lista de reportes con filtros opcionales"""
    reports, total = ReportService.get_reports(
        db=db, skip=skip, limit=limit, status=status, waste_type=waste_type
    )
    return ReportListResponse(
        reports=reports,
        total=total,
        page=(skip // limit) + 1,
        per_page=limit
    )


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(report_id: int, db: Session = Depends(get_db)):
    """Obtener un reporte específico por ID"""
    report = ReportService.get_report_by_id(db=db, report_id=report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    return report


@router.put("/{report_id}/status", response_model=ReportResponse)
async def update_report_status(
    report_id: int,
    status: str,
    db: Session = Depends(get_db)
):
    """Actualizar el estado de un reporte (para administradores)"""
    updated_report = ReportService.update_report_status(
        db=db, report_id=report_id, status=status
    )
    if not updated_report:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    return updated_report