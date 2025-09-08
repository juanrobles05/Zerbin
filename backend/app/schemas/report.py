from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional

class ReportBase(BaseModel):
    latitude: float = Field(..., ge=-90, le=90, description="Latitud del reporte")
    longitude: float = Field(..., ge=-180, le=180, description="Longitud del reporte")
    description: Optional[str] = Field(None, max_length=500)
    manual_classification: Optional[str] = None
    address: str = Field(..., max_length=255, description="Dirección del reporte")

class ReportCreate(ReportBase):
    image_url: str = Field(..., description="URL de la imagen del reporte")

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
    created_at: datetime
    updated_at: Optional[datetime]
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True

class ReportListResponse(BaseModel):
    reports: list[ReportResponse]
    total: int
    page: int
    per_page: int