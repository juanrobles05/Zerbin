from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import ValidationError
import json
from app.core.database import get_db
from app.schemas.report import (
    ReportResponse,
    ReportListResponse,
    ReportBase,
    PriorityStatsResponse,
)
from app.services.report_service import ReportService
from app.services.image_service import ImageService
from app.services.ai_service import AIService
from app.services.priority_service import PriorityService
import asyncio

router = APIRouter()


@router.post("/", response_model=ReportResponse)
async def create_report(
    image: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    description: Optional[str] = Form(None),
    ai_classification: Optional[str] = Form(None),
    manual_classification: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Crear un nuevo reporte de residuo con imagen.
    1. Sube la imagen a Supabase
    2. Clasifica la imagen con IA
    3. Calcula la prioridad automáticamente
    4. Guarda el reporte en la base de datos
    """
    file_bytes = await image.read()
    image_filename = image.filename

    try:
        ReportBase(latitude=latitude, longitude=longitude, description=description)
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=e.errors())

    public_url = await ImageService().upload_to_supabase(
        file_bytes=file_bytes,
        original_filename=image_filename
    )

    if ai_classification is not None and str(ai_classification).strip() != "string":
        try:
            ai_result = json.loads(ai_classification)
        except Exception:
            raise HTTPException(status_code=400, detail="ai_classification debe ser un JSON válido")
    else:
        # classification can be CPU-bound; run in a thread to avoid blocking the loop
        ai_service = AIService()
        ai_result = await asyncio.to_thread(ai_service.classify_waste, file_bytes)

    # parse manual_classification if provided; accept either JSON or plain string
    manual_result = None
    if manual_classification:
        # try to decode JSON, but if it's a plain string use it as-is
        try:
            manual_result = json.loads(manual_classification)
        except Exception:
            # not a JSON payload, store raw string (trim whitespace)
            manual_result = str(manual_classification).strip()

    report_data = type('ReportData', (), {})()
    report_data.latitude = latitude
    report_data.longitude = longitude
    report_data.description = description
    report_data.image_url = public_url
    report_data.ai_classification = ai_result
    report_data.manual_classification = manual_result

    created_report = await ReportService.create_report(db=db, report_data=report_data)
    return created_report


@router.get("/", response_model=ReportListResponse)
async def get_reports(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    waste_type: Optional[str] = None,
    priority: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Obtener lista de reportes con filtros opcionales, ordenados por prioridad y fecha."""
    reports, total = ReportService.get_reports(
        db=db, skip=skip, limit=limit, status=status,
        waste_type=waste_type, priority=priority
    )
    return ReportListResponse(
        reports=reports,
        total=total,
        page=(skip // limit) + 1,
        per_page=limit
    )


@router.get("/user/{user_id}", response_model=ReportListResponse)
async def get_user_reports(
    user_id: int,
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Obtener todos los reportes de un usuario específico.
    Ordenados cronológicamente (más recientes primero).
    Permite filtrar por estado: pending, in_progress, resolved.
    """
    reports, total = ReportService.get_user_reports(
        db=db, user_id=user_id, skip=skip, limit=limit, status=status
    )
    return ReportListResponse(
        reports=reports,
        total=total,
        page=(skip // limit) + 1,
        per_page=limit
    )


@router.get("/stats/priority", response_model=PriorityStatsResponse)
async def get_priority_statistics(db: Session = Depends(get_db)):
    """Obtener estadísticas de distribución de prioridades."""
    stats = ReportService.get_priority_stats(db=db)
    return PriorityStatsResponse(
        high=stats.get("High", 0),
        medium=stats.get("Medium", 0),
        low=stats.get("Low", 0),
        total=sum(stats.values())
    )


@router.get("/urgent", response_model=list[ReportResponse])
async def get_urgent_reports(limit: int = 10, db: Session = Depends(get_db)):
    """Obtener los reportes urgentes (alta prioridad)."""
    urgent_reports = ReportService.get_urgent_reports(db=db, limit=limit)
    return urgent_reports


@router.get("/priority/{priority_level}", response_model=ReportListResponse)
async def get_reports_by_priority(
    priority_level: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Obtener reportes filtrados por nivel de prioridad (1=baja, 2=media, 3=alta)."""
    if priority_level not in [1, 2, 3]:
        raise HTTPException(status_code=400, detail="El nivel de prioridad debe ser 1, 2 o 3")

    reports, total = ReportService.get_reports(
        db=db, skip=skip, limit=limit, priority=priority_level
    )
    return ReportListResponse(
        reports=reports,
        total=total,
        page=(skip // limit) + 1,
        per_page=limit
    )


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(report_id: int, db: Session = Depends(get_db)):
    """Obtener un reporte específico por ID."""
    report = ReportService.get_report_by_id(db=db, report_id=report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    return report


@router.get("/{report_id}/priority-details")
async def get_report_priority_details(report_id: int, db: Session = Depends(get_db)):
    """Obtener detalles del cálculo de prioridad de un reporte."""
    report = ReportService.get_report_by_id(db=db, report_id=report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")

    details = PriorityService.get_priority_details(
        waste_type=report.waste_type,
        confidence_score=report.confidence_score,
        created_at=report.created_at
    )
    return {
        "report_id": report.id,
        "current_priority": report.priority,
        "calculation_details": details
    }


@router.put("/{report_id}/status", response_model=ReportResponse)
async def update_report_status(
    report_id: int,
    status: str,
    db: Session = Depends(get_db)
):
    """Actualizar el estado de un reporte."""
    updated_report = ReportService.update_report_status(db=db, report_id=report_id, status=status)
    if not updated_report:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    return updated_report


@router.patch("/{report_id}/classification", response_model=ReportResponse)
async def update_report_classification(
    report_id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db)
):
    """Permite al usuario corregir manualmente el tipo de residuo."""
    corrected_type = payload.get('corrected_type')
    if not corrected_type:
        raise HTTPException(status_code=400, detail="corrected_type is required in body")
    updated = ReportService.update_report_classification(
        db=db, report_id=report_id, corrected_type=corrected_type
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    return updated


@router.post("/{report_id}/recalculate-priority", response_model=ReportResponse)
async def recalculate_report_priority(report_id: int, db: Session = Depends(get_db)):
    """Recalcular la prioridad de un reporte específico."""
    updated_report = ReportService.recalculate_priority(db=db, report_id=report_id)
    if not updated_report:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    return updated_report


@router.post("/recalculate-all-priorities")
async def recalculate_all_priorities(db: Session = Depends(get_db)):
    """Recalcular las prioridades de todos los reportes pendientes."""
    result = ReportService.recalculate_all_priorities(db=db)
    return {
        "message": "Prioridades recalculadas exitosamente",
        "total_checked": result["total_checked"],
        "updated": result["updated"]
    }