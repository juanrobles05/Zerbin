from datetime import timedelta
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserLogin, UserLoginResponse
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token
)
from app.core.config import settings


class AuthService:
    """Servicio para manejar autenticación y registro de usuarios."""
    
    @staticmethod
    def register_user(db: Session, user_data: UserCreate) -> UserResponse:
        """
        Registra un nuevo usuario en el sistema.
        
        Args:
            db: Sesión de base de datos
            user_data: Datos del usuario a registrar
            
        Returns:
            Usuario creado
            
        Raises:
            HTTPException: Si el email o username ya existe
        """
        # Verificar si el email ya existe
        existing_user = db.query(User).filter(
            (User.email == user_data.email) | (User.username == user_data.username)
        ).first()
        
        if existing_user:
            if existing_user.email == user_data.email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already taken"
                )
        
        # Crear el nuevo usuario
        hashed_password = get_password_hash(user_data.password)
        new_user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_password,
            points=0
        )
        
        try:
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            return UserResponse.model_validate(new_user)
        except IntegrityError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Error creating user. Please try again."
            )
    
    @staticmethod
    def authenticate_user(db: Session, login_data: UserLogin) -> Optional[User]:
        """
        Autentica un usuario verificando sus credenciales.
        
        Args:
            db: Sesión de base de datos
            login_data: Credenciales de login (email y password)
            
        Returns:
            Usuario si las credenciales son válidas, None si no
        """
        user = db.query(User).filter(User.email == login_data.email).first()
        
        if not user:
            return None
        
        if not verify_password(login_data.password, user.hashed_password):
            return None
        
        return user
    
    @staticmethod
    def login_user(db: Session, login_data: UserLogin) -> UserLoginResponse:
        """
        Realiza el login de un usuario y genera su token JWT.
        
        Args:
            db: Sesión de base de datos
            login_data: Credenciales de login
            
        Returns:
            Token de acceso y datos del usuario
            
        Raises:
            HTTPException: Si las credenciales son inválidas
        """
        user = AuthService.authenticate_user(db, login_data)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Crear el access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=access_token_expires
        )
        
        # Retornar el token y los datos del usuario
        return UserLoginResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.model_validate(user)
        )
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        """Obtiene un usuario por su ID."""
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Obtiene un usuario por su email."""
        return db.query(User).filter(User.email == email).first()
