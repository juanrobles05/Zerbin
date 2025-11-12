from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class RewardBase(BaseModel):
    name: str
    description: str
    points_required: int
    image_url: Optional[str] = None

class RewardCreate(RewardBase):
    pass

class Reward(RewardBase):
    id: int

    class Config:
        orm_mode = True

class RewardRedemptionBase(BaseModel):
    user_id: int
    reward_id: int

class RewardRedemptionCreate(RewardRedemptionBase):
    pass

class RewardRedemption(RewardRedemptionBase):
    id: int
    redeemed_at: datetime
    reward: Optional[Reward]
    user_points: int  # 🔹 aquí agregamos user_points

    class Config:
        orm_mode = True
