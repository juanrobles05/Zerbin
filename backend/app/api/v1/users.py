from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.report import Report
from app.services.report_service import POINTS_BY_WASTE_TYPE, DEFAULT_POINTS

router = APIRouter()

@router.get("/{user_id}/points")
def get_user_points(user_id: int, db: Session = Depends(get_db)):
    # Obtener el usuario
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Devolver los puntos actuales del usuario (que se actualizan al crear reportes y canjear recompensas)
    return {
        "user_id": user_id,
        "points": user.points
    }


# ENDPOINT SOLO PARA DEBUG Y TESTS
@router.get("/debug/list", tags=["debug"])
def list_users_debug(db: Session = Depends(get_db)):
    """
    Devuelve una lista de usuarios existentes para debugging.
    Permite ver qué IDs de usuario están disponibles para pruebas.
    """
    users = db.query(User).all()
    if not users:
        return {"message": "⚠ No hay usuarios en la base de datos o no se puede acceder"}

    return [
        {
            "id": user.id,
            "email": getattr(user, "email", None),
            "points": getattr(user, "points", 0)
        }
        for user in users
    ]
