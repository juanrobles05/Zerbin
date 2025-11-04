from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional

class ReportBase(BaseModel):
    latitude: float = Field(..., ge=-90, le=90, description="Latitud del reporte")
    longitude: float = Field(..., ge=-180, le=180, description="Longitud del reporte")
    description: Optional[str] = Field(None, max_length=500)
    manual_classification: Optional[str] = None
    address: Optional[str] = Field(None, max_length=255, description="Dirección del reporte")

class ReportCreate(ReportBase):
    image_url: str = Field(..., description="URL de la imagen del reporte")
    ai_classification: dict = Field(..., description="Clasificación automática proporcionada por el servicio de IA")

class ReportUpdate(BaseModel):
    description: Optional[str] = None
    manual_classification: Optional[str] = None
    status: Optional[str] = None

    @validator('status')
    def validate_status(cls, v):
        allowed_statuses = ['pending', 'in_progress', 'resolved']
        if v and v not in allowed_statuses:
            raise ValueError(f'Status debe ser uno de: {allowed_statuses}')
        return v

class ReportResponse(ReportBase):
    id: int
    image_url: str
    address: Optional[str]
    waste_type: Optional[str]
    confidence_score: Optional[float]
    status: str
    priority: int
    priority_label: Optional[str] = None  # "Low", "Medium", "High"
    created_at: datetime
    updated_at: Optional[datetime]
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True
    
    @validator('priority_label', always=True)
    def set_priority_label(cls, v, values):
        """Genera automáticamente la etiqueta de prioridad"""
        priority = values.get('priority', 1)
        labels = {1: "Low", 2: "Medium", 3: "High"}
        return labels.get(priority, "Low")

class ReportListResponse(BaseModel):
    reports: list[ReportResponse]
    total: int
    page: int
    per_page: int

class PriorityStatsResponse(BaseModel):
    """Respuesta con estadísticas de prioridades"""
    high: int = Field(..., description="Número de reportes con prioridad alta")
    medium: int = Field(..., description="Número de reportes con prioridad media")
    low: int = Field(..., description="Número de reportes con prioridad baja")
    total: int = Field(..., description="Total de reportes activos")

class ReportStatusUpdate(BaseModel):
    """Schema para actualizar estado de reporte"""
    status: str = Field(..., description="Nuevo estado del reporte")
    #assigned_to: Optional[str] = Field(None, description="Asignado a")
    #rejection_reason: Optional[str] = Field(None, max_length=500)
    #collection_notes: Optional[str] = Field(None, max_length=500)
    
    @field_validator('status')
    def validate_status(cls, v):
        from app.models.report import ReportStatus
        allowed = [s.value for s in ReportStatus]
        if v not in allowed:
            raise ValueError(f'Status debe ser uno de: {allowed}')
        return v

class UserDashboardResponse(BaseModel):
    """Respuesta del dashboard del usuario"""
    user_id: int
    total_reports: int
    reports_by_status: dict[str, int]
    total_points: int
    recent_reports: list[ReportResponse]
    pending_notifications: int