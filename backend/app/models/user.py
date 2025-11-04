from sqlalchemy import Column, Integer, String, DateTime, Boolean, func
from sqlalchemy.orm import relationship
from .base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Sistema de puntos
    points = Column(Integer, default=0, nullable=False)
    
    # Preferencias de notificaciones
    enable_push_notifications = Column(Boolean, default=True)
    enable_email_notifications = Column(Boolean, default=True)
    
    # Relationships
    reports = relationship("Report", back_populates="user")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")