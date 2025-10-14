from typing import Dict, Optional
from sqlalchemy.orm import Session
from app.models.waste_classification import WasteClassification
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class PriorityService:
    """
    Servicio para determinar la prioridad de un residuo basado en su tiempo de descomposición.
    """
    
    # Mapeo de tiempo de descomposición a nivel de prioridad
    PRIORITY_THRESHOLDS = {
        7: 3,      # <= 7 días: alta prioridad
        30: 2,     # <= 30 días: media prioridad
        365: 1     # <= 365 días: baja prioridad
    }
    
    # Datos por defecto para tipos de residuos comunes y su tiempo de descomposición
    DEFAULT_WASTE_DATA = {
        "organic": {
            "decomposition_time_days": 7,
            "description": "Residuos orgánicos que se descomponen rápidamente"
        },
        "food": {
            "decomposition_time_days": 14,
            "description": "Restos de comida y materiales alimentarios"
        },
        "paper": {
            "decomposition_time_days": 90,
            "description": "Papel y cartón"
        },
        "cardboard": {
            "decomposition_time_days": 60,
            "description": "Cartón y materiales similares"
        },
        "plastic": {
            "decomposition_time_days": 1825,  # ~5 años
            "description": "Plásticos diversos"
        },
        "glass": {
            "decomposition_time_days": 365000,  # ~1000 años
            "description": "Vidrio y cristal"
        },
        "metal": {
            "decomposition_time_days": 18250,  # ~50 años
            "description": "Metales diversos"
        },
        "trash": {
            "decomposition_time_days": 365,  # Genérico - 1 año
            "description": "Basura general no clasificada"
        },
        "recyclable": {
            "decomposition_time_days": 365,  # Genérico - 1 año
            "description": "Materiales reciclables mixtos"
        }
    }

    def __init__(self, db: Session):
        self.db = db
        self._initialize_default_data()

    def _initialize_default_data(self):
        """
        Inicializa los datos por defecto en la base de datos si no existen.
        """
        try:
            for waste_type, data in self.DEFAULT_WASTE_DATA.items():
                existing = self.db.query(WasteClassification).filter(
                    WasteClassification.waste_type == waste_type
                ).first()
                
                if not existing:
                    priority = self._calculate_priority_from_days(data["decomposition_time_days"])
                    classification = WasteClassification(
                        waste_type=waste_type,
                        decomposition_time_days=data["decomposition_time_days"],
                        priority_level=priority,
                        description=data["description"]
                    )
                    self.db.add(classification)
            
            self.db.commit()
        except Exception as e:
            logger.error(f"Error inicializando datos de clasificación: {e}")
            self.db.rollback()

    def _calculate_priority_from_days(self, decomposition_days: int) -> int:
        """
        Calcula el nivel de prioridad basado en el tiempo de descomposición.
        """
        for threshold_days, priority in sorted(self.PRIORITY_THRESHOLDS.items()):
            if decomposition_days <= threshold_days:
                return priority
        return 1  # Prioridad baja por defecto

    def get_priority_for_waste_type(self, waste_type: str) -> Dict[str, any]:
        """
        Obtiene la prioridad para un tipo de residuo específico.
        """
        # Normalizar el tipo de residuo
        normalized_type = waste_type.lower().strip()
        
        # Buscar en la base de datos
        classification = self.db.query(WasteClassification).filter(
            WasteClassification.waste_type == normalized_type
        ).first()
        
        if classification:
            return {
                "priority": classification.priority_level,
                "decomposition_days": classification.decomposition_time_days,
                "is_urgent": classification.priority_level == 3,
                "waste_type": classification.waste_type,
                "description": classification.description
            }
        
        # Si no se encuentra, usar datos por defecto o calcular basado en palabras clave
        return self._get_fallback_priority(normalized_type)

    def _get_fallback_priority(self, waste_type: str) -> Dict[str, any]:
        """
        Maneja casos donde el tipo de residuo no está en la base de datos.
        """
        # Palabras clave para identificar residuos orgánicos rápidamente descomponibles
        organic_keywords = ["organic", "food", "compost", "fruit", "vegetable", "meat", "fish"]
        
        if any(keyword in waste_type for keyword in organic_keywords):
            return {
                "priority": 3,
                "decomposition_days": 7,
                "is_urgent": True,
                "waste_type": waste_type,
                "description": "Residuo orgánico de descomposición rápida"
            }
        
        # Fallback por defecto
        return {
            "priority": 1,
            "decomposition_days": 365,
            "is_urgent": False,
            "waste_type": waste_type,
            "description": "Tipo de residuo no clasificado"
        }

    def should_generate_alert(self, waste_type: str, confidence: float = 0.0) -> bool:
        """
        Determina si se debe generar una alerta urgente para el residuo.
        """
        priority_info = self.get_priority_for_waste_type(waste_type)
        
        # Generar alerta si es de alta prioridad y la confianza es suficiente
        high_confidence = confidence >= settings.CONFIDENCE_THRESHOLD
        is_urgent = priority_info["is_urgent"]
        
        return is_urgent and high_confidence

    def get_all_classifications(self) -> list:
        """
        Obtiene todas las clasificaciones de residuos disponibles.
        """
        return self.db.query(WasteClassification).all()

    def add_waste_classification(self, waste_type: str, decomposition_days: int, description: str = None) -> WasteClassification:
        """
        Añade una nueva clasificación de residuo.
        """
        priority = self._calculate_priority_from_days(decomposition_days)
        
        classification = WasteClassification(
            waste_type=waste_type.lower().strip(),
            decomposition_time_days=decomposition_days,
            priority_level=priority,
            description=description
        )
        
        self.db.add(classification)
        self.db.commit()
        self.db.refresh(classification)
        
        return classification