from decouple import config
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    DEBUG: bool = config("DEBUG", default=False, cast=bool)
    PROJECT_NAME: str = "Zerbin API"
    VERSION: str = "1.0.0"

    # Supabase
    SUPABASE_URL: str = config("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY: str = config("SUPABASE_SERVICE_ROLE_KEY", default="")
    SUPABASE_BUCKET_NAME: str = config("SUPABASE_BUCKET_NAME", default="reports")

    # Database
    DATABASE_URL: str = config("DATABASE_URL")
    SECRET_KEY: str = config("SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = config(
        "ACCESS_TOKEN_EXPIRE_MINUTES", default=60 * 24, cast=int
    )

    # CORS settings
    ALLOWED_ORIGINS: List[str] = ["*"]
    ALLOWED_METHODS: List[str] = ["*"]
    ALLOWED_HEADERS: List[str] = ["*"]
    ALLOWED_CREDENTIALS: bool = True

    # Image upload settings
    IMAGE_QUALITY: int = config("IMAGE_QUALITY", default=80, cast=int)
    IMAGE_MAX_SIZE_MB: int = config("IMAGE_MAX_SIZE_MB", default=5, cast=int)
    IMAGE_ALLOWED_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".webp"]


    # AI / ML
    AI_MODEL_ID: str = config("AI_MODEL_ID", default="prithivMLmods/Trash-Net")
    CONFIDENCE_THRESHOLD: float = config("CONFIDENCE_THRESHOLD", default=0.7, cast=float)

    # Notifications
    ENABLE_NOTIFICATIONS: bool = config("ENABLE_NOTIFICATIONS", default=True, cast=bool)

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()