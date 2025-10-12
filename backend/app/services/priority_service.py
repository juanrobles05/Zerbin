from datetime import datetime, timezone
from typing import Optional

class PriorityService:
    """
    Servicio para calcular la prioridad de reportes basándose en:
    - Tipo de residuo
    - Tamaño estimado (basado en confidence score y clasificación)
    - Tiempo de exposición
    """
    
    # Pesos de peligrosidad por tipo de residuo
    WASTE_TYPE_WEIGHTS = {
        # Residuos peligrosos - Alta prioridad
        "battery": 5,
        "e-waste": 5,
        "medical": 5,
        "hazardous": 5,
        "toxic": 5,
        
        # Residuos problemáticos - Media-Alta prioridad
        "glass": 4,
        "metal": 4,
        "electronics": 4,
        
        # Residuos comunes grandes - Media prioridad
        "plastic": 3,
        "cardboard": 3,
        "paper": 2,
        
        # Residuos orgánicos - Media-Baja prioridad (pero urgente por descomposición)
        "organic": 3,
        "food": 3,
        "biological": 3,
        
        # Residuos no clasificados
        "trash": 2,
        "unknown": 2,
    }
    
    # Umbrales para clasificación de tamaño
    SIZE_SMALL = "small"    # confidence > 80% = imagen clara = objeto pequeño/cercano
    SIZE_MEDIUM = "medium"  # confidence 60-80%
    SIZE_LARGE = "large"    # confidence < 60% = imagen borrosa = objeto grande/lejano
    
    # Pesos por tamaño
    SIZE_WEIGHTS = {
        SIZE_SMALL: 1,
        SIZE_MEDIUM: 2,
        SIZE_LARGE: 3,
    }
    
    @staticmethod
    def estimate_size_from_confidence(confidence_score: float) -> str:
        """
        Estima el tamaño del residuo basándose en el confidence score.
        Mayor confianza = imagen más clara = objeto más pequeño o más cercano
        Menor confianza = imagen menos clara = objeto más grande o acumulación
        """
        if confidence_score >= 80:
            return PriorityService.SIZE_SMALL
        elif confidence_score >= 60:
            return PriorityService.SIZE_MEDIUM
        else:
            return PriorityService.SIZE_LARGE
    
    @staticmethod
    def get_exposure_time_hours(created_at: datetime) -> float:
        """
        Calcula las horas que lleva expuesto el residuo.
        """
        now = datetime.now(timezone.utc)
        
        # Asegurar que created_at tenga timezone
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        
        delta = now - created_at
        return delta.total_seconds() / 3600  # Convertir a horas
    
    @staticmethod
    def calculate_exposure_weight(hours: float) -> int:
        """
        Calcula el peso adicional por tiempo de exposición.
        - 0-24 horas: +0 (nuevo)
        - 24-72 horas: +1 (1-3 días)
        - 72-168 horas: +2 (3-7 días)
        - >168 horas: +3 (más de 1 semana)
        """
        if hours < 24:
            return 0
        elif hours < 72:
            return 1
        elif hours < 168:
            return 2
        else:
            return 3
    
    @staticmethod
    def normalize_waste_type(waste_type: str) -> str:
        """
        Normaliza el tipo de residuo para que coincida con los pesos definidos.
        """
        if not waste_type:
            return "unknown"
        
        waste_type_lower = waste_type.lower().strip()
        
        # Mapeo de variaciones comunes
        type_mappings = {
            "batteries": "battery",
            "e_waste": "e-waste",
            "ewaste": "e-waste",
            "electronic": "electronics",
            "plastics": "plastic",
            "papers": "paper",
            "organics": "organic",
            "foods": "food",
            "glasses": "glass",
            "metals": "metal",
            "medicals": "medical",
        }
        
        # Buscar mapeo
        normalized = type_mappings.get(waste_type_lower, waste_type_lower)
        
        # Si no está en los pesos definidos, retornar 'unknown'
        if normalized not in PriorityService.WASTE_TYPE_WEIGHTS:
            return "trash"
        
        return normalized
    
    @staticmethod
    def calculate_priority(
        waste_type: Optional[str],
        confidence_score: Optional[float],
        created_at: datetime
    ) -> tuple[int, str]:
        """
        Calcula la prioridad de un reporte.
        
        Retorna:
            tuple[int, str]: (nivel_prioridad, urgencia_label)
            - nivel_prioridad: 1 (Low), 2 (Medium), 3 (High)
            - urgencia_label: "Low", "Medium", "High"
        """
        score = 0
        
        # 1. Peso por tipo de residuo (0-5 puntos)
        normalized_type = PriorityService.normalize_waste_type(waste_type)
        type_weight = PriorityService.WASTE_TYPE_WEIGHTS.get(normalized_type, 2)
        score += type_weight
        
        # 2. Peso por tamaño (1-3 puntos)
        if confidence_score is not None:
            size = PriorityService.estimate_size_from_confidence(confidence_score)
            size_weight = PriorityService.SIZE_WEIGHTS.get(size, 1)
            score += size_weight
        else:
            score += 2  # Peso medio si no hay confidence
        
        # 3. Peso por tiempo de exposición (0-3 puntos)
        exposure_hours = PriorityService.get_exposure_time_hours(created_at)
        exposure_weight = PriorityService.calculate_exposure_weight(exposure_hours)
        score += exposure_weight
        
        # Convertir score a nivel de prioridad (1-3)
        # Score máximo posible: 5 + 3 + 3 = 11
        # Score mínimo posible: 0 + 1 + 0 = 1
        if score >= 8:  # Alta prioridad: residuos peligrosos, grandes, o con mucho tiempo
            priority_level = 3
            urgency_label = "High"
        elif score >= 5:  # Media prioridad
            priority_level = 2
            urgency_label = "Medium"
        else:  # Baja prioridad
            priority_level = 1
            urgency_label = "Low"
        
        return priority_level, urgency_label
    
    @staticmethod
    def get_priority_details(
        waste_type: Optional[str],
        confidence_score: Optional[float],
        created_at: datetime
    ) -> dict:
        """
        Retorna detalles completos del cálculo de prioridad para debugging/análisis.
        """
        normalized_type = PriorityService.normalize_waste_type(waste_type)
        type_weight = PriorityService.WASTE_TYPE_WEIGHTS.get(normalized_type, 2)
        
        size = PriorityService.estimate_size_from_confidence(
            confidence_score if confidence_score else 70.0
        )
        size_weight = PriorityService.SIZE_WEIGHTS.get(size, 1)
        
        exposure_hours = PriorityService.get_exposure_time_hours(created_at)
        exposure_weight = PriorityService.calculate_exposure_weight(exposure_hours)
        
        total_score = type_weight + size_weight + exposure_weight
        priority_level, urgency_label = PriorityService.calculate_priority(
            waste_type, confidence_score, created_at
        )
        
        return {
            "normalized_waste_type": normalized_type,
            "type_weight": type_weight,
            "estimated_size": size,
            "size_weight": size_weight,
            "exposure_hours": round(exposure_hours, 2),
            "exposure_weight": exposure_weight,
            "total_score": total_score,
            "priority_level": priority_level,
            "urgency_label": urgency_label,
        }