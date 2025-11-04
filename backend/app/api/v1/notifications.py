from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.schemas.notification import (
    NotificationResponse,
    NotificationListResponse,
    MarkAsReadRequest
)
from app.services.notification_service import NotificationService

router = APIRouter()

@router.get("/", response_model=NotificationListResponse)
async def get_user_notifications(
    user_id: int = Query(..., description="ID del usuario"),
    skip: int = 0,
    limit: int = 20,
    unread_only: bool = False,
    db: Session = Depends(get_db)
):
    """
    Obtener notificaciones del usuario con paginación
    """
    notifications, total, unread_count = NotificationService.get_user_notifications(
        db=db,
        user_id=user_id,
        skip=skip,
        limit=limit,
        unread_only=unread_only
    )
    
    return NotificationListResponse(
        notifications=notifications,
        total=total,
        unread_count=unread_count
    )

@router.get("/unread-count")
async def get_unread_count(
    user_id: int = Query(..., description="ID del usuario"),
    db: Session = Depends(get_db)
):
    """
    Obtener conteo de notificaciones no leídas
    """
    _, _, unread_count = NotificationService.get_user_notifications(
        db=db,
        user_id=user_id,
        skip=0,
        limit=1
    )
    
    return {"user_id": user_id, "unread_count": unread_count}

@router.post("/mark-as-read")
async def mark_notifications_as_read(
    request: MarkAsReadRequest,
    user_id: int = Query(..., description="ID del usuario"),
    db: Session = Depends(get_db)
):
    """
    Marcar notificaciones específicas como leídas
    """
    updated = NotificationService.mark_as_read(
        db=db,
        notification_ids=request.notification_ids,
        user_id=user_id
    )
    
    return {
        "message": f"{updated} notificaciones marcadas como leídas",
        "updated_count": updated
    }

@router.post("/mark-all-as-read")
async def mark_all_as_read(
    user_id: int = Query(..., description="ID del usuario"),
    db: Session = Depends(get_db)
):
    """
    Marcar todas las notificaciones como leídas
    """
    updated = NotificationService.mark_all_as_read(db=db, user_id=user_id)
    
    return {
        "message": "Todas las notificaciones marcadas como leídas",
        "updated_count": updated
    }

@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: int,
    user_id: int = Query(..., description="ID del usuario"),
    db: Session = Depends(get_db)
):
    """
    Eliminar una notificación
    """
    deleted = NotificationService.delete_notification(
        db=db,
        notification_id=notification_id,
        user_id=user_id
    )
    
    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Notificación no encontrada"
        )
    
    return {"message": "Notificación eliminada exitosamente"}