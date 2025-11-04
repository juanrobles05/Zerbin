from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional

class NotificationBase(BaseModel):
    """Schema base para notificaciones"""
    title: str = Field(..., max_length=200)
    message: str = Field(..., max_length=1000)
    type: str = Field(default="general")

class NotificationCreate(NotificationBase):
    """Schema para crear notificación"""
    user_id: int
    report_id: Optional[int] = None
    metadata: Optional[str] = None

class NotificationResponse(NotificationBase):
    """Schema de respuesta de notificación"""
    id: int
    user_id: int
    report_id: Optional[int]
    is_read: bool
    is_sent: bool
    created_at: datetime
    read_at: Optional[datetime]
    
    model_config = ConfigDict(from_attributes=True)

class NotificationListResponse(BaseModel):
    """Respuesta con lista de notificaciones"""
    notifications: list[NotificationResponse]
    total: int
    unread_count: int

class MarkAsReadRequest(BaseModel):
    """Request para marcar notificaciones como leídas"""
    notification_ids: list[int]