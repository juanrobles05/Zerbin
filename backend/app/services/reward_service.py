from sqlalchemy.orm import Session
from datetime import datetime
from app.models.reward import Reward
from app.models.reward_redemption import RewardRedemption
from app.models.user import User
from app.schemas.reward import RewardCreate, RewardRedemptionCreate

# Crear recompensa
def create_reward(db: Session, reward: RewardCreate):
    db_reward = Reward(
        name=reward.name,
        description=reward.description,
        points_required=reward.points_required,
        image_url=reward.image_url
    )
    db.add(db_reward)
    db.commit()
    db.refresh(db_reward)
    return db_reward

# Listar todas las recompensas ordenadas de menor a mayor por puntos
def get_all_rewards(db: Session):
    return db.query(Reward).order_by(Reward.points_required.asc()).all()

# Canjear recompensa
def redeem_reward(db: Session, data: RewardRedemptionCreate):
    user = db.query(User).filter(User.id == data.user_id).first()
    reward = db.query(Reward).filter(Reward.id == data.reward_id).first()

    if not user:
        raise ValueError("Usuario no encontrado")
    if not reward:
        raise ValueError("Recompensa no encontrada")
    if user.points < reward.points_required:
        raise ValueError("Puntos insuficientes")

    # Descontar puntos y registrar canje
    user.points -= reward.points_required
    redemption = RewardRedemption(
        user_id=user.id,
        reward_id=reward.id,
        redeemed_at=datetime.utcnow()
    )
    db.add(redemption)
    db.commit()
    db.refresh(redemption)
    db.refresh(user)

    # Devolver información completa del canje
    return {
        "id": redemption.id,
        "user_id": user.id,
        "reward_id": reward.id,
        "redeemed_at": redemption.redeemed_at,
        "reward_name": reward.name,
        "reward_description": reward.description,
        "points_redeemed": reward.points_required,
        "user_points": user.points,
        "pickup_message": "Puedes recoger tu recompensa en las oficinas de Zerbin presentando tu código de canje.",
        "redemption_code": f"ZERBIN-{redemption.id:06d}"
    }
