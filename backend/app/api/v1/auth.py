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
    
    **Acceptance Criteria:**
    - Registration with email and password ✓
    - Field validation and error handling ✓
    - Confirmation of successful registration ✓
    
    **Body Parameters:**
    - username: Nombre de usuario único (3-50 caracteres)
    - email: Email válido y único
    - password: Contraseña (mínimo 6 caracteres)
    
    **Returns:**
    - 201: Usuario creado exitosamente
    - 400: Email o username ya registrado, o validación fallida
    
    **Example:**
    ```json
    {
        "username": "juan_user",
        "email": "juan@example.com",
        "password": "securepass123"
    }
    ```
    """
    return AuthService.register_user(db, user_data)


@router.post("/login", response_model=UserLoginResponse)
async def login(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Inicia sesión con credenciales de usuario.
    
    **Acceptance Criteria:**
    - Login by email/password ✓
    - Display error message if credentials are invalid ✓
    - Upon logging in, the user accesses their dashboard ✓
    
    **Body Parameters:**
    - email: Email del usuario
    - password: Contraseña
    
    **Returns:**
    - 200: Login exitoso con access_token y datos del usuario
    - 401: Credenciales inválidas
    
    **Example:**
    ```json
    {
        "email": "juan@example.com",
        "password": "securepass123"
    }
    ```
    
    **Response:**
    ```json
    {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "token_type": "bearer",
        "user": {
            "id": 1,
            "username": "juan_user",
            "email": "juan@example.com",
            "created_at": "2025-11-02T10:00:00"
        }
    }
    ```
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
