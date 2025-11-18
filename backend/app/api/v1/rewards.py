from fastapi import APIRouter, Depends, HTTPException, Body, File, UploadFile, Form
from sqlalchemy.orm import Session
from app.schemas.reward import Reward, RewardCreate, RewardRedemptionCreate
from app.services.reward_service import create_reward, get_all_rewards, redeem_reward
from app.core.database import get_db
from typing import Optional
import shutil
import os
from pathlib import Path

router = APIRouter()

# Listar recompensas
@router.get("/", response_model=list[Reward])
def list_rewards(db: Session = Depends(get_db)):
    return get_all_rewards(db)

# Crear recompensa
@router.post("/", response_model=Reward)
async def add_reward(
    name: str = Form(...),
    description: str = Form(...),
    points_required: int = Form(...),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Crear una nueva recompensa con imagen opcional.

    - **name**: Nombre de la recompensa
    - **description**: Descripción de la recompensa
    - **points_required**: Puntos necesarios para canjearla
    - **image**: Archivo de imagen (opcional)
    """
    image_url = None

    # Si se proporciona una imagen, guardarla
    if image:
        # Crear directorio si no existe
        upload_dir = Path("uploads/rewards")
        upload_dir.mkdir(parents=True, exist_ok=True)

        # Generar nombre único para el archivo
        file_extension = os.path.splitext(image.filename)[1]
        # Limpiar el nombre de la recompensa para usarlo en el nombre del archivo
        safe_name = "".join(c for c in name if c.isalnum() or c in (' ', '-', '_')).strip()
        safe_name = safe_name.replace(' ', '_')
        file_name = f"{safe_name}{file_extension}"
        file_path = upload_dir / file_name

        # Guardar el archivo
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        # Guardar la URL relativa o completa según tu configuración
        # Aquí guardamos la ruta relativa, pero podrías usar una URL de Supabase
        image_url = f"/uploads/rewards/{file_name}"

    # Crear el objeto RewardCreate
    reward_data = RewardCreate(
        name=name,
        description=description,
        points_required=points_required,
        image_url=image_url
    )

    return create_reward(db, reward_data)

# Crear recompensa con URL de imagen (para Supabase u otros servicios)
@router.post("/with-url", response_model=Reward)
def add_reward_with_url(reward: RewardCreate, db: Session = Depends(get_db)):
    """
    Crear una nueva recompensa proporcionando directamente la URL de la imagen.
    Útil cuando la imagen ya está subida a Supabase u otro servicio.

    - **name**: Nombre de la recompensa
    - **description**: Descripción de la recompensa
    - **points_required**: Puntos necesarios para canjearla
    - **image_url**: URL completa de la imagen (opcional)
    """
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
