from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from .base import Base

class Reward(Base):
    __tablename__ = "rewards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    points_required = Column(Integer, nullable=False)
    image_url = Column(String, nullable=True)

    redemptions = relationship("RewardRedemption", back_populates="reward")  # opcional