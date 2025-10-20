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
    def normalize_waste_type(waste_type: Optional[str]) -> str:
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

    def __init__(self, db: Optional[object] = None):
        """Optional DB session parameter for future DB-backed weights.

        For now we keep the in-code WASTE_TYPE_WEIGHTS as the source of truth.
        Passing a DB session won't change behavior until we implement DB lookups
        in a later sprint.
        """
        self.db = db

    def calculate_priority_instance(self, waste_type: Optional[str], confidence_score: Optional[float], created_at: datetime) -> tuple[int, str]:
        """Instance wrapper that calls the static calculate_priority to preserve compatibility
        with code that instantiates PriorityService(db).
        """
        return PriorityService.calculate_priority(waste_type, confidence_score, created_at)

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

    # --- Heuristic helpers for DB-less operation ---
    @staticmethod
    def _calculate_priority_from_days(days: int) -> int:
        """Map decomposition days to a priority level:

        - <= 7 days -> High (3)
        - <= 30 days -> Medium (2)
        - > 30 days -> Low (1)
        """
        if days <= 7:
            return 3
        if days <= 30:
            return 2
        return 1

    def get_priority_for_waste_type(self, waste_type: Optional[str]) -> dict:
        """Return priority information for a waste type without requiring DB access.

        If a DB session is attached (self.db) and a WasteClassification exists, it will
        be used. Otherwise a small heuristic is applied:
        - Keyword detection for organics (food, peel, meat, vegetable) -> High
        - Use WASTE_TYPE_WEIGHTS to infer a priority (weight >=5 -> High, 4 -> Medium, <=3 -> Low)
        - Default decomposition_days mapping: High=7, Medium=30, Low=365
        """
        # Normalize input
        if not waste_type:
            return {
                "priority": 1,
                "decomposition_days": 365,
                "is_urgent": False,
                "waste_type": "unknown",
                "description": ""
            }

        norm = PriorityService.normalize_waste_type(waste_type)

        # If DB is attached, try to read the WasteClassification row (non-blocking best-effort)
        if getattr(self, "db", None):
            try:
                from app.models.waste_classification import WasteClassification
                row = self.db.query(WasteClassification).filter(WasteClassification.waste_type == norm).first()
                if row:
                    return {
                        "priority": int(row.priority_level),
                        "decomposition_days": int(row.decomposition_time_days),
                        "is_urgent": bool(row.priority_level == 3),
                        "waste_type": row.waste_type,
                        "description": row.description or "",
                    }
            except Exception:
                # If DB read fails, fall back to heuristic
                pass

        # Heuristic keyword detection for organics
        organic_keywords = ["food", "fruit", "meat", "vegetable", "peel", "compost", "organic"]
        low = norm.lower()
        for kw in organic_keywords:
            if kw in low:
                return {
                    "priority": 3,
                    "decomposition_days": 7,
                    "is_urgent": True,
                    "waste_type": "organic",
                    "description": "heuristic: organic keyword match",
                }

        # Map WASTE_TYPE_WEIGHTS to priority levels
        weight = PriorityService.WASTE_TYPE_WEIGHTS.get(norm, None)
        if weight is not None:
            if weight >= 5:
                pr = 3
                days = 7
            elif weight == 4:
                pr = 2
                days = 30
            else:
                pr = 1
                days = 365

            return {
                "priority": pr,
                "decomposition_days": days,
                "is_urgent": (pr == 3),
                "waste_type": norm,
                "description": "heuristic: mapped from in-code weights",
            }

        # Default fallback
        return {
            "priority": 1,
            "decomposition_days": 365,
            "is_urgent": False,
            "waste_type": norm,
            "description": "fallback: unknown waste type",
        }

    def should_generate_alert(self, waste_type: Optional[str], confidence: float) -> bool:
        """Decide whether to generate an urgent alert.

        - Normalize confidence to 0..1 (if given as percentage >1, divide by 100)
        - Generate alert if priority is high (3) and confidence >= 0.75
        """
        try:
            conf = float(confidence)
        except Exception:
            conf = 0.0
        if conf > 1.0:
            conf = conf / 100.0

        pinfo = self.get_priority_for_waste_type(waste_type)
        return (pinfo.get("priority", 1) == 3) and (conf >= 0.75)