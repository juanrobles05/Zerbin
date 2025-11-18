from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr


# Para crear un usuario (registro)
class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Contraseña en texto plano")


# Para actualizar perfil
class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr]
    password: Optional[str] = Field(None, min_length=6)


# Respuesta de usuario (sin contraseña)
class UserResponse(UserBase):
    id: int
    created_at: datetime
    role: Optional[str] = "user"  # Incluir rol en la respuesta

    class Config:
        from_attributes = True


# Para login
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# Para respuesta de login con token
class UserLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse