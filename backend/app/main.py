from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn


from app.core.config import settings
from app.core.database import engine
from app.models import base
from app.api.v1.api import api_router
from app.services.ai_service import AIService
from app.core.exceptions import register_exception_handlers

# Crear tablas
base.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Zerbin API",
    description="API para la aplicación Zerbin - Reporte de residuos en Medellín",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

register_exception_handlers(app)

async def startup_event():
    print("Iniciando la aplicación Zerbin API...")
    AIService()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=settings.ALLOWED_CREDENTIALS,
    allow_methods=settings.ALLOWED_METHODS,
    allow_headers=settings.ALLOWED_HEADERS,
)

# Incluir rutas de la API
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "message": "Zerbin API - Reporta residuos en Medellín",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "zerbin-api"}

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
