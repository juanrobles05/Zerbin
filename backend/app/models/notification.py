from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base
import enum

class NotificationType(str, enum.Enum):
    """Tipos de notificación"""
    STATUS_CHANGE = "status_change"
    PRIORITY_CHANGE = "priority_change"
    ASSIGNMENT = "assignment"
    COLLECTION_COMPLETE = "collection_complete"
    REJECTION = "rejection"
    GENERAL = "general"

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    
    # Usuario destinatario
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="notifications")
    
    # Reporte relacionado (opcional)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=True)
    report = relationship("Report", back_populates="notifications")
    
    # Contenido de la notificación
    type = Column(String, default=NotificationType.GENERAL.value)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    
    # Estado de la notificación
    is_read = Column(Boolean, default=False)
    is_sent = Column(Boolean, default=False)  # Para notificaciones push
    
    # Datos adicionales (JSON serializado como string)
    extra_data = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True), nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<Notification(id={self.id}, user_id={self.user_id}, type={self.type}, is_read={self.is_read})>"
