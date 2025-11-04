from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.schemas.reward import Reward, RewardCreate, RewardRedemptionCreate
from app.services.reward_service import create_reward, get_all_rewards, redeem_reward
from app.core.database import get_db

router = APIRouter()

# Listar recompensas
@router.get("/", response_model=list[Reward])
def list_rewards(db: Session = Depends(get_db)):
    return get_all_rewards(db)

# Crear recompensa
@router.post("/", response_model=Reward)
def add_reward(reward: RewardCreate, db: Session = Depends(get_db)):
    return create_reward(db, reward)

# Canjear recompensa
@router.post("/redeem")
def redeem_reward_endpoint(
    redemption_data: RewardRedemptionCreate = Body(...),
    db: Session = Depends(get_db)
):
    try:
        result = redeem_reward(db, redemption_data)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
