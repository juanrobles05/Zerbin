from sqlalchemy import Column, Integer, String, DateTime, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base

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
    status = Column(String, default="pending")  # pending, in_progress, resolved
    priority = Column(Integer, default=1)  # 1=low, 2=medium, 3=high

    # Usuario (opcional para reportes anónimos)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user = relationship("User", back_populates="reports")  # 🔹 usar string

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<Report(id={self.id}, waste_type={self.waste_type}, status={self.status})>"
