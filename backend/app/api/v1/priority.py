from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.services.priority_service import PriorityService
from app.models.waste_classification import WasteClassification
from pydantic import BaseModel

router = APIRouter()

class WasteClassificationResponse(BaseModel):
    id: int
    waste_type: str
    decomposition_time_days: int
    priority_level: int
    description: str | None

    class Config:
        from_attributes = True

class WasteClassificationCreate(BaseModel):
    waste_type: str
    decomposition_time_days: int
    description: str | None = None

class PriorityInfoResponse(BaseModel):
    priority: int
    decomposition_days: int
    is_urgent: bool
    waste_type: str
    description: str

@router.get("/classifications", response_model=List[WasteClassificationResponse])
async def get_all_waste_classifications(db: Session = Depends(get_db)):
    """Obtener todas las clasificaciones de residuos disponibles"""
    priority_service = PriorityService(db)
    classifications = priority_service.get_all_classifications()
    return classifications

@router.get("/classifications/{waste_type}/priority", response_model=PriorityInfoResponse)
async def get_priority_info(waste_type: str, db: Session = Depends(get_db)):
    """Obtener información de prioridad para un tipo de residuo específico"""
    priority_service = PriorityService(db)
    priority_info = priority_service.get_priority_for_waste_type(waste_type)
    return PriorityInfoResponse(**priority_info)

@router.post("/classifications", response_model=WasteClassificationResponse)
async def create_waste_classification(
    classification_data: WasteClassificationCreate,
    db: Session = Depends(get_db)
):
    """Crear una nueva clasificación de residuo (para administradores)"""
    priority_service = PriorityService(db)
    
    # Verificar si ya existe
    existing = db.query(WasteClassification).filter(
        WasteClassification.waste_type == classification_data.waste_type.lower().strip()
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400, 
            detail=f"La clasificación para '{classification_data.waste_type}' ya existe"
        )
    
    try:
        new_classification = priority_service.add_waste_classification(
            waste_type=classification_data.waste_type,
            decomposition_days=classification_data.decomposition_time_days,
            description=classification_data.description
        )
        return new_classification
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creando clasificación: {str(e)}")

@router.get("/priority-stats")
async def get_priority_statistics(db: Session = Depends(get_db)):
    """Obtener estadísticas de prioridad de reportes"""
    from app.models.report import Report
    
    # Contar reportes por prioridad
    high_priority = db.query(Report).filter(Report.priority == 3, Report.status == "pending").count()
    medium_priority = db.query(Report).filter(Report.priority == 2, Report.status == "pending").count()
    low_priority = db.query(Report).filter(Report.priority == 1, Report.status == "pending").count()
    
    total_pending = high_priority + medium_priority + low_priority
    
    return {
        "pending_reports": {
            "high_priority": high_priority,
            "medium_priority": medium_priority,
            "low_priority": low_priority,
            "total": total_pending
        },
        "urgent_threshold": 3,
        "priority_levels": {
            "1": "Baja - Mayor a 1 año de descomposición",
            "2": "Media - Entre 1 mes y 1 año de descomposición", 
            "3": "Alta - Menos de 1 semana de descomposición"
        }
    }