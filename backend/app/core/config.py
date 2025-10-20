from typing import List
from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    DEBUG: bool = False
    PROJECT_NAME: str = "Zerbin API"
    VERSION: str = "1.0.0"

    # Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_BUCKET_NAME: str = "reports"

    # Database
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # CORS
    ALLOWED_ORIGINS: List[str] = ["*"]
    ALLOWED_METHODS: List[str] = ["*"]
    ALLOWED_HEADERS: List[str] = ["*"]
    ALLOWED_CREDENTIALS: bool = True

    # Imagen
    IMAGE_QUALITY: int = 80
    IMAGE_MAX_SIZE_MB: int = 5
    IMAGE_ALLOWED_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".webp"]

    # AI / ML
    AI_MODEL_ID: str = "prithivMLmods/Trash-Net"
    CONFIDENCE_THRESHOLD: float = 0.7

    # Notificaciones
    ENABLE_NOTIFICATIONS: bool = True

    # Nueva forma (reemplaza la clase Config)
    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8"
    )


settings = Settings()