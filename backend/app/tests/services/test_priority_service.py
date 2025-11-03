"""
Pruebas completas del servicio de priorización.
Incluye: Unitarias, Propiedades e Integración.
"""
import pytest
from datetime import datetime, timezone, timedelta
from app.services.priority_service import PriorityService
from app.models.waste_classification import WasteClassification
from unittest.mock import Mock


class TestPriorityServiceUnit:
    """Pruebas unitarias del cálculo de prioridad"""

    @pytest.fixture
    def priority_service(self):
        return PriorityService(db=None)

    # ==================== PRUEBAS UNITARIAS ====================

    def test_calculate_priority_from_days_high(self, priority_service):
        """
        GIVEN: Residuo con descomposición ≤ 7 días
        WHEN: Se calcula la prioridad
        THEN: Debe ser ALTA (3)
        """
        assert priority_service._calculate_priority_from_days(3) == 3
        assert priority_service._calculate_priority_from_days(7) == 3

    def test_calculate_priority_from_days_medium(self, priority_service):
        """
        GIVEN: Residuo con descomposición entre 8 y 30 días
        WHEN: Se calcula la prioridad
        THEN: Debe ser MEDIA (2)
        """
        assert priority_service._calculate_priority_from_days(15) == 2
        assert priority_service._calculate_priority_from_days(30) == 2

    def test_calculate_priority_from_days_low(self, priority_service):
        """
        GIVEN: Residuo con descomposición > 30 días
        WHEN: Se calcula la prioridad
        THEN: Debe ser BAJA (1)
        """
        assert priority_service._calculate_priority_from_days(100) == 1
        assert priority_service._calculate_priority_from_days(365) == 1

    # ==================== PRUEBAS DE PROPIEDADES ====================

    @pytest.mark.parametrize("waste_type,confidence,hours_old", [
        ("plastic", 85.0, 1),
        ("organic", 90.0, 48),
        ("battery", 75.0, 168),
        ("unknown", 50.0, 0),
    ])
    def test_priority_always_in_valid_range(self, priority_service, waste_type, confidence, hours_old):
        """
        PROPIEDAD: La prioridad SIEMPRE debe estar entre 1 y 3
        GIVEN: Cualquier combinación de tipo, confianza y tiempo
        WHEN: Se calcula la prioridad
        THEN: El resultado debe ser 1, 2 o 3
        """
        created_at = datetime.now(timezone.utc) - timedelta(hours=hours_old)
        priority, _ = PriorityService.calculate_priority(waste_type, confidence, created_at)

        assert 1 <= priority <= 3, \
            f"Prioridad fuera de rango: {priority} para {waste_type}"

    @pytest.mark.parametrize("waste_type", [
        "organic", "plastic", "glass", "paper", "metal",
        "battery", "e-waste", "hazardous", "unknown"
    ])
    def test_urgency_label_matches_priority(self, priority_service, waste_type):
        """
        PROPIEDAD: El label de urgencia debe coincidir con el nivel de prioridad
        GIVEN: Cualquier tipo de residuo
        WHEN: Se calcula prioridad y label
        THEN: priority=3 → "High", priority=2 → "Medium", priority=1 → "Low"
        """
        created_at = datetime.now(timezone.utc)
        priority, label = PriorityService.calculate_priority(waste_type, 80.0, created_at)

        expected_labels = {1: "Low", 2: "Medium", 3: "High"}
        assert label == expected_labels[priority], \
            f"Label '{label}' no coincide con prioridad {priority}"

    # ==================== PRUEBAS DE INTEGRACIÓN CON DB ====================

    def test_get_priority_from_database(self):
        """
        GIVEN: Una base de datos con clasificaciones
        WHEN: Se consulta un tipo de residuo existente
        THEN: Debe retornar datos de la BD
        """
        # Mock de base de datos
        mock_db = Mock()
        mock_classification = WasteClassification(
            waste_type="organic",
            decomposition_time_days=7,
            priority_level=3,
            description="Residuos orgánicos"
        )
        mock_db.query.return_value.filter.return_value.first.return_value = mock_classification

        service = PriorityService(db=mock_db)
        result = service.get_priority_for_waste_type("organic")

        assert result["priority"] == 3
        assert result["decomposition_days"] == 7
        assert result["is_urgent"] is True

    def test_fallback_when_db_unavailable(self):
        """
        GIVEN: Base de datos no disponible o sin datos
        WHEN: Se consulta un tipo de residuo
        THEN: Debe usar heurística como fallback
        """
        mock_db = Mock()
        mock_db.query.return_value.filter.return_value.first.return_value = None

        service = PriorityService(db=mock_db)
        result = service.get_priority_for_waste_type("plastic")

        # Debe retornar resultado aunque la BD no tenga datos
        assert result is not None
        assert "priority" in result
        assert "decomposition_days" in result

    # ==================== PRUEBAS DE ALERTAS ====================

    @pytest.mark.parametrize("waste_type,confidence,should_alert", [
        ("organic", 0.85, True),    # Alta prioridad + alta confianza
        ("organic", 0.70, False),   # Alta prioridad + baja confianza
        ("plastic", 0.90, False),   # Baja prioridad + alta confianza
    ])
    def test_alert_generation_logic(self, priority_service, waste_type, confidence, should_alert):
        """
        GIVEN: Diferentes combinaciones de tipo y confianza
        WHEN: Se evalúa si generar alerta
        THEN: Solo debe alertar si prioridad=3 Y confianza≥75%
        """
        result = priority_service.should_generate_alert(waste_type, confidence)

        assert result == should_alert, \
            f"Esperaba alerta={should_alert} para {waste_type} con {confidence*100}%"

    # ==================== PRUEBAS DE NORMALIZACIÓN ====================

    @pytest.mark.parametrize("input_type,expected", [
        ("PLASTIC", "plastic"),
        ("Organic  ", "organic"),
        ("E_WASTE", "e-waste"),
        ("batteries", "battery"),
        ("unknown_type", "trash"),
    ])
    def test_waste_type_normalization(self, input_type, expected):
        """
        GIVEN: Tipos de residuo en diferentes formatos
        WHEN: Se normalizan
        THEN: Deben convertirse al formato estándar
        """
        result = PriorityService.normalize_waste_type(input_type)
        assert result == expected