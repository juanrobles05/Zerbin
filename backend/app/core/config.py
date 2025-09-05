from decouple import config
from typing import List

class Settings:
    # Aplicación
    DEBUG: bool = config("DEBUG", default=False, cast=bool)
    PROJECT_NAME: str = "Zerbin API"
    VERSION: str = "1.0.0"
    
    # Base de datos
    DATABASE_URL: str = config(
        "DATABASE_URL", 
        default="postgresql://user:password@localhost:5432/zerbin_db"
    )
    
    # Seguridad
    SECRET_KEY: str = config("SECRET_KEY", default="your-secret-key-here")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = config("ACCESS_TOKEN_EXPIRE_MINUTES", default=30, cast=int)
    ALGORITHM: str = "HS256"
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8080",
        "exp://127.0.0.1:8081",  # Para Expo Dev
    ]
    
    # Archivos
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_IMAGE_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".webp"]
    
    # IA
    AI_MODEL_PATH: str = "app/ai/models/waste_classifier.h5"
    CONFIDENCE_THRESHOLD: float = 0.7
    
    # Notificaciones
    ENABLE_NOTIFICATIONS: bool = config("ENABLE_NOTIFICATIONS", default=True, cast=bool)
    
settings = Settings()