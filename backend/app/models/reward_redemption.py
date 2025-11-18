from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base

class RewardRedemption(Base):
    __tablename__ = "reward_redemptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reward_id = Column(Integer, ForeignKey("rewards.id"), nullable=False)
    redeemed_at = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    user = relationship("User", back_populates="redemptions")  # usar string "User" si hay riesgo de circular import
    reward = relationship("Reward", back_populates="redemptions")  # define también back_populates en Reward

    def __repr__(self):
        return f"<RewardRedemption(id={self.id}, user_id={self.user_id}, reward_id={self.reward_id})>"
