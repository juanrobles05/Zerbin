from sqlalchemy import Column, Integer, String, DateTime, Float, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base
import enum

class ReportStatus(str, enum.Enum):
    """Estados posibles de un reporte"""
    PENDING = "pending"           # Pendiente de revisión
    ASSIGNED = "assigned"         # Asignado a un equipo
    IN_PROGRESS = "in_progress"   # En proceso de recolección
    COLLECTED = "collected"       # Recolectado exitosamente
    REJECTED = "rejected"         # Rechazado (duplicado, inválido, etc.)
    CANCELLED = "cancelled"       # Cancelado por el usuario

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    image_url = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String, nullable=True)

    # Clasificación de IA
    waste_type = Column(String, nullable=True)
    confidence_score = Column(Float, nullable=True)
    manual_classification = Column(String, nullable=True)

    # Metadatos
    description = Column(Text, nullable=True)
    status = Column(String, default=ReportStatus.PENDING.value)
    priority = Column(Integer, default=1)

    # Información de seguimiento
    #assigned_to = Column(String, nullable=True)  # Equipo o persona asignada
    #rejection_reason = Column(Text, nullable=True)  # Motivo de rechazo
    #collection_notes = Column(Text, nullable=True)  # Notas de recolección

    # Usuario
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user = relationship("User", back_populates="reports")

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    #assigned_at = Column(DateTime(timezone=True), nullable=True)
    #collected_at = Column(DateTime(timezone=True), nullable=True)

    # Relación con notificaciones
    notifications = relationship("Notification", back_populates="report", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Report(id={self.id}, waste_type={self.waste_type}, status={self.status})>"