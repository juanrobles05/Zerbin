from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.database import get_db
from app.core.security import get_current_admin_user
from app.models.user import User
from app.models.report import Report
from app.schemas.report import ReportResponse
from pydantic import BaseModel

router = APIRouter()


class ReportWithUser(BaseModel):
    """Schema para reportes con información del usuario"""
    id: int
    latitude: float
    longitude: float
    description: Optional[str]
    image_url: str
    address: Optional[str]
    waste_type: Optional[str]
    confidence_score: Optional[float]
    manual_classification: Optional[str] = None  # Corrección manual de clasificación
    status: str
    priority: int
    created_at: str
    updated_at: Optional[str]
    resolved_at: Optional[str]

    # Información del usuario
    user_id: Optional[int]
    username: Optional[str]
    user_email: Optional[str]

    class Config:
        from_attributes = True


class UpdateReportStatusRequest(BaseModel):
    """Request para actualizar el estado de un reporte"""
    status: str

    class Config:
        json_schema_extra = {
            "example": {
                "status": "resolved"
            }
        }


@router.get("/reports", response_model=List[ReportWithUser])
async def get_all_reports(
    status: Optional[str] = Query(None, description="Filter by status: pending, in_progress, resolved"),
    priority: Optional[int] = Query(None, description="Filter by priority: 1 (low), 2 (medium), 3 (high)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Obtener todos los reportes del sistema (solo administradores).

    Permite filtrar por:
    - status: pending, in_progress, resolved
    - priority: 1 (low), 2 (medium), 3 (high)

    Retorna información completa del reporte y del usuario que lo creó.
    """
    query = db.query(Report).outerjoin(User, Report.user_id == User.id)

    # Aplicar filtros
    if status:
        query = query.filter(Report.status == status)
    if priority is not None:
        query = query.filter(Report.priority == priority)

    # Ordenar por prioridad (alta primero) y fecha (más recientes primero)
    query = query.order_by(Report.priority.desc(), Report.created_at.desc())

    # Paginación
    reports = query.offset(skip).limit(limit).all()

    # Construir respuesta con información del usuario
    result = []
    for report in reports:
        user = db.query(User).filter(User.id == report.user_id).first() if report.user_id else None

        report_data = {
            "id": report.id,
            "latitude": report.latitude,
            "longitude": report.longitude,
            "description": report.description,
            "image_url": report.image_url,
            "address": report.address,
            "waste_type": report.waste_type,
            "confidence_score": report.confidence_score,
            "manual_classification": report.manual_classification,
            "status": report.status,
            "priority": report.priority,
            "created_at": report.created_at.isoformat() if report.created_at else None,
            "updated_at": report.updated_at.isoformat() if report.updated_at else None,
            "resolved_at": report.resolved_at.isoformat() if report.resolved_at else None,
            "user_id": user.id if user else None,
            "username": user.username if user else "Anónimo",
            "user_email": user.email if user else None,
        }
        result.append(ReportWithUser(**report_data))

    return result


@router.patch("/reports/{report_id}/status", response_model=ReportResponse)
async def update_report_status(
    report_id: int,
    status_update: UpdateReportStatusRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Actualizar el estado de un reporte (solo administradores).

    Estados permitidos:
    - pending: Pendiente de atención
    - in_progress: En proceso de resolución
    - resolved: Resuelto
    """
    # Validar estado
    allowed_statuses = ["pending", "in_progress", "resolved"]
    if status_update.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Allowed values: {', '.join(allowed_statuses)}"
        )

    # Buscar el reporte
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Actualizar estado
    old_status = report.status
    report.status = status_update.status

    # Si se marca como resuelto, registrar timestamp
    if status_update.status == "resolved" and old_status != "resolved":
        from datetime import datetime, timezone
        report.resolved_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(report)

    return report


@router.get("/stats")
async def get_admin_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Obtener estadísticas generales del sistema (solo administradores).

    Retorna:
    - Total de reportes
    - Reportes por estado
    - Reportes por prioridad
    - Total de usuarios
    """
    total_reports = db.query(Report).count()
    total_users = db.query(User).count()

    # Reportes por estado
    pending = db.query(Report).filter(Report.status == "pending").count()
    in_progress = db.query(Report).filter(Report.status == "in_progress").count()
    resolved = db.query(Report).filter(Report.status == "resolved").count()

    # Reportes por prioridad
    high_priority = db.query(Report).filter(Report.priority == 3, Report.status != "resolved").count()
    medium_priority = db.query(Report).filter(Report.priority == 2, Report.status != "resolved").count()
    low_priority = db.query(Report).filter(Report.priority == 1, Report.status != "resolved").count()

    return {
        "total_reports": total_reports,
        "total_users": total_users,
        "reports_by_status": {
            "pending": pending,
            "in_progress": in_progress,
            "resolved": resolved
        },
        "active_reports_by_priority": {
            "high": high_priority,
            "medium": medium_priority,
            "low": low_priority
        }
    }
