from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Detectar el tipo de base de datos
is_sqlite = settings.DATABASE_URL.startswith('sqlite')

# Configurar engine según el tipo de base de datos
if is_sqlite:
    # SQLite: requiere check_same_thread=False para FastAPI
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False  # Cambiar a True para debug
    )
else:
    # PostgreSQL: configuración con pool
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=3600,
        connect_args={
            "options": "-c client_encoding=utf8",
        },
        pool_size=5,
        max_overflow=10,
        echo=False
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()