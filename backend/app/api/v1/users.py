from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.report import Report
from app.services.report_service import POINTS_BY_WASTE_TYPE, DEFAULT_POINTS

router = APIRouter()

@router.get("/{user_id}/points")
def get_user_points(user_id: int, db: Session = Depends(get_db)):
    # Verificar que el usuario existe
    exists = db.query(User.id).filter(User.id == user_id).first()
    if not exists:
        raise HTTPException(status_code=404, detail="User not found")

    # Traer reportes con status "pending" o "resolved"
    relevant_reports = db.query(Report).filter(
        Report.user_id == user_id,
        Report.status.in_(["pending", "resolved"])
    ).all()

    total = 0
    history = []
    for r in relevant_reports:
        pts = POINTS_BY_WASTE_TYPE.get((r.waste_type or "").lower(), DEFAULT_POINTS)
        total += pts
        history.append({
            "report_id": r.id,
            "waste_type": r.waste_type,
            "points": pts,
            "status": r.status,
            "resolved_at": r.resolved_at.isoformat() if getattr(r, "resolved_at", None) else None
        })

    return {
        "user_id": user_id,
        "points": total,
        "history": history
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
