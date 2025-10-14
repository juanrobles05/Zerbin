from datetime import datetime, timezone
from typing import Optional

class PriorityService:
    """
    Servicio para calcular la prioridad de reportes basándose en:
    - Tipo de residuo
    - Tamaño estimado (basado en confidence score y clasificación)
    - Tiempo de exposición
    """

    WASTE_TYPE_WEIGHTS = {
        "battery": 5,
        "e-waste": 5,
        "medical": 5,
        "hazardous": 5,
        "toxic": 5,
        "glass": 4,
        "metal": 4,
        "electronics": 4,
        "plastic": 3,
        "cardboard": 3,
        "paper": 2,
        "organic": 3,
        "food": 3,
        "biological": 3,
        "trash": 2,
        "unknown": 2,
    }

    SIZE_WEIGHTS = {
        "small": 1,
        "medium": 2,
        "large": 3,
    }

    @staticmethod
    def estimate_size_from_confidence(confidence_score: float) -> str:
        if confidence_score >= 80:
            return "small"
        elif confidence_score >= 60:
            return "medium"
        else:
            return "large"

    @staticmethod
    def get_exposure_time_hours(created_at: datetime) -> float:
        now = datetime.now(timezone.utc)
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        return (now - created_at).total_seconds() / 3600

    @staticmethod
    def calculate_exposure_weight(hours: float) -> int:
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
        if not waste_type:
            return "unknown"
        waste_type_lower = waste_type.lower().strip()
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
        normalized = type_mappings.get(waste_type_lower, waste_type_lower)
        if normalized not in PriorityService.WASTE_TYPE_WEIGHTS:
            return "trash"
        return normalized

    @staticmethod
    def calculate_priority(
        waste_type: Optional[str],
        confidence_score: Optional[float],
        created_at: datetime
    ) -> tuple[int, str]:
        score = 0
        normalized_type = PriorityService.normalize_waste_type(waste_type)
        type_weight = PriorityService.WASTE_TYPE_WEIGHTS.get(normalized_type, 2)
        score += type_weight

        if confidence_score is not None:
            size = PriorityService.estimate_size_from_confidence(confidence_score)
            size_weight = PriorityService.SIZE_WEIGHTS.get(size, 1)
            score += size_weight
        else:
            score += 2

        exposure_hours = PriorityService.get_exposure_time_hours(created_at)
        exposure_weight = PriorityService.calculate_exposure_weight(exposure_hours)
        score += exposure_weight

        if score >= 8:
            return 3, "High"
        elif score >= 5:
            return 2, "Medium"
        else:
            return 1, "Low"

    @staticmethod
    def get_priority_details(
        waste_type: Optional[str],
        confidence_score: Optional[float],
        created_at: datetime
    ) -> dict:
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