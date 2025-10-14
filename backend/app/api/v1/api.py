from fastapi import APIRouter
from app.api.v1 import reports, upload, priority

# Crea un router principal para la versión 1 de la API.
api_router = APIRouter()

# Incluye los routers de los diferentes endpoints.
# Por ejemplo, el router para los reportes de residuos.
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(upload.router, tags=["upload"])
api_router.include_router(priority.router, prefix="/priority", tags=["priority"])