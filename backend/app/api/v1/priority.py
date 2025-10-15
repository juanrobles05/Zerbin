from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.waste_classification import WasteClassification
from app.services.priority_service import PriorityService
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

@router.get("/classifications/{waste_type}", response_model=WasteClassificationResponse)
async def calculate_priority(waste_type: str, db: Session = Depends(get_db)):
    """Calcular la prioridad para un tipo de residuo específico"""
    # Try DB first, otherwise use PriorityService heuristic
    wt = waste_type.lower().strip()
    classification = None
    try:
        classification = db.query(WasteClassification).filter(WasteClassification.waste_type == wt).first()
    except Exception:
        classification = None

    if classification:
        return WasteClassificationResponse(**classification.__dict__)

    # Fallback: compute heuristic info without DB
    ps = PriorityService(db=None)
    pinfo = ps.get_priority_for_waste_type(wt)
    return WasteClassificationResponse(
        id=0,
        waste_type=pinfo.get("waste_type"),
        decomposition_time_days=pinfo.get("decomposition_days"),
        priority_level=pinfo.get("priority"),
        description=pinfo.get("description"),
    )

@router.get("/classifications", response_model=List[WasteClassificationResponse])
async def get_all_waste_classifications(db: Session = Depends(get_db)):
    """Obtener todas las clasificaciones de residuos disponibles"""
    classifications = []
    try:
        classifications = db.query(WasteClassification).all()
    except Exception:
        classifications = []

    if classifications:
        return [WasteClassificationResponse(**c.__dict__) for c in classifications]

    # Fallback: return classifications derived from in-code weights
    ps = PriorityService(db=None)
    results = []
    for wt, weight in ps.WASTE_TYPE_WEIGHTS.items():
        p = ps.get_priority_for_waste_type(wt)
        results.append(WasteClassificationResponse(
            id=0,
            waste_type=p.get("waste_type"),
            decomposition_time_days=p.get("decomposition_days"),
            priority_level=p.get("priority"),
            description=p.get("description"),
        ))
    return results

@router.get("/classifications/{waste_type}/priority", response_model=PriorityInfoResponse)
async def get_priority_info(waste_type: str, db: Session = Depends(get_db)):
    """Obtener información de prioridad para un tipo de residuo específico"""
    wt = waste_type.lower().strip()
    classification = None
    try:
        classification = db.query(WasteClassification).filter(WasteClassification.waste_type == wt).first()
    except Exception:
        classification = None

    if classification:
        return PriorityInfoResponse(
            priority=classification.priority_level,
            decomposition_days=classification.decomposition_time_days,
            is_urgent=(classification.priority_level == 3),
            waste_type=classification.waste_type,
            description=classification.description or "",
        )

    # Fallback to heuristic
    ps = PriorityService(db=None)
    p = ps.get_priority_for_waste_type(wt)
    return PriorityInfoResponse(
        priority=p.get("priority"),
        decomposition_days=p.get("decomposition_days"),
        is_urgent=p.get("is_urgent"),
        waste_type=p.get("waste_type"),
        description=p.get("description") or "",
    )

@router.post("/classifications", response_model=WasteClassificationResponse)
async def create_waste_classification(
    classification_data: WasteClassificationCreate,
    db: Session = Depends(get_db)
):
    """Crear una nueva clasificación de residuo (para administradores)"""
    wt = classification_data.waste_type.lower().strip()
    existing = db.query(WasteClassification).filter(WasteClassification.waste_type == wt).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Classification for '{classification_data.waste_type}' already exists")

    try:
        new_classification = WasteClassification(
            waste_type=wt,
            decomposition_time_days=classification_data.decomposition_time_days,
            priority_level=1 if classification_data.decomposition_time_days > 365 else (3 if classification_data.decomposition_time_days < 7 else 2),
            description=classification_data.description,
        )
        db.add(new_classification)
        db.commit()
        db.refresh(new_classification)
        return WasteClassificationResponse(**new_classification.__dict__)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating classification: {str(e)}")

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