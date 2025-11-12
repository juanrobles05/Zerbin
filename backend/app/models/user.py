from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship
from .base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Campo de puntos para el sistema de recompensas
    points = Column(Integer, default=0, nullable=False)

    # Campo de rol para permisos de administrador
    role = Column(String, default="user", nullable=False)  # "user" o "admin"

    # Relaciones
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")
    redemptions = relationship("RewardRedemption", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, username={self.username}, points={self.points})>"
