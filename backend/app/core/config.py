from decouple import config
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    DEBUG: bool = config("DEBUG", default=False, cast=bool)
    PROJECT_NAME: str = "Zerbin API"
    VERSION: str = "1.0.0"

    DATABASE_URL: str = config("DATABASE_URL")

    SECRET_KEY: str = config("SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = config(
        "ACCESS_TOKEN_EXPIRE_MINUTES", default=60 * 24, cast=int
    )

    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8080",
        "exp://127.0.0.1:8081",
    ]

    UPLOAD_DIR: str = config("UPLOAD_DIR", default="uploads")
    MAX_FILE_SIZE: int = config("MAX_FILE_SIZE", default=10 * 1024 * 1024, cast=int)  # 10MB
    ALLOWED_IMAGE_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".webp"]

    AI_MODEL_PATH: str = config("AI_MODEL_PATH", default="app/ai/models/waste_classifier.h5")
    CONFIDENCE_THRESHOLD: float = config("CONFIDENCE_THRESHOLD", default=0.7, cast=float)

    ENABLE_NOTIFICATIONS: bool = config("ENABLE_NOTIFICATIONS", default=True, cast=bool)

    class Config:
        env_file = ".env"

settings = Settings()