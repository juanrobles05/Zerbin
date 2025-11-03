from fastapi import APIRouter
from app.api.v1 import reports, upload, users, priority, auth

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(upload.router, tags=["upload"])
api_router.include_router(priority.router, prefix="/priority", tags=["priority"])
api_router.include_router(users.router, prefix="/users", tags=["users"])