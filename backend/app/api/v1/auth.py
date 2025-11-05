from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.user import UserCreate, UserResponse, UserLogin, UserLoginResponse
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Registra un nuevo usuario en el sistema.
    """
    print("Register attempt for email:", user_data.email)

    return AuthService.register_user(db, user_data)


@router.post("/login", response_model=UserLoginResponse)
async def login(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Inicia sesión con credenciales de usuario.
    """

    return AuthService.login_user(db, login_data)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user = Depends(get_current_user)
):
    """
    Obtiene la información del usuario autenticado actual.

    **Requires Authentication:** Bearer token en header Authorization

    **Returns:**
    - 200: Datos del usuario actual
    - 401: Token inválido o expirado
    """
    return UserResponse.model_validate(current_user)
