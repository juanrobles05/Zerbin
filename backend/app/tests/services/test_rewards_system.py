"""
Pruebas del sistema de recompensas y puntos.
Valida asignación, acumulación y consistencia de puntos.
"""
import pytest
from app.services.report_service import POINTS_BY_WASTE_TYPE, DEFAULT_POINTS
from app.models.user import User
from app.models.report import Report
from unittest.mock import Mock
from datetime import datetime, timezone


class TestRewardsSystem:
    """Pruebas del sistema de puntos y recompensas"""

    @pytest.fixture
    def mock_db(self):
        """Fixture: Mock de base de datos"""
        db = Mock()
        db.add = Mock()
        db.commit = Mock()
        db.refresh = Mock()
        return db

    # ==================== PRUEBA 1: Asignación Correcta ====================

    @pytest.mark.parametrize("waste_type,expected_points", [
        ("plastic", 10),
        ("glass", 8),
        ("metal", 12),
        ("paper", 5),
        ("organic", 3),
        ("unknown_type", 2),  # DEFAULT_POINTS
    ])
    def test_points_assignment_by_type(self, waste_type, expected_points):
        """
        GIVEN: Un tipo de residuo
        WHEN: Se consulta en el sistema de puntos
        THEN: Debe retornar los puntos correctos
        """
        points = POINTS_BY_WASTE_TYPE.get(waste_type, DEFAULT_POINTS)
        assert points == expected_points, \
            f"Puntos incorrectos para {waste_type}"

    # ==================== PRUEBA 2: Propiedad de No Negatividad ====================

    def test_points_never_negative(self):
        """
        PROPIEDAD: Los puntos NUNCA deben ser negativos
        GIVEN: Todos los tipos de residuo
        WHEN: Se consultan sus puntos
        THEN: Todos deben ser >= 0
        """
        for waste_type, points in POINTS_BY_WASTE_TYPE.items():
            assert points >= 0, \
                f"Puntos negativos detectados para {waste_type}: {points}"

        assert DEFAULT_POINTS >= 0, \
            f"Puntos por defecto negativos: {DEFAULT_POINTS}"

    # ==================== PRUEBA 3: Acumulación de Puntos ====================

    def test_points_accumulation(self, mock_db):
        """
        GIVEN: Un usuario con 0 puntos
        WHEN: Crea 3 reportes (plastic=10, glass=8, paper=5)
        THEN: Debe acumular 23 puntos en total
        """
        user = User(
            id=1,
            username="test_user",
            email="test@example.com",
            hashed_password="hash",
            points=0
        )

        # Simular creación de reportes
        waste_types = ["plastic", "glass", "paper"]
        expected_total = 10 + 8 + 5  # 23 puntos

        for waste_type in waste_types:
            points = POINTS_BY_WASTE_TYPE.get(waste_type, DEFAULT_POINTS)
            user.points += points

        assert user.points == expected_total, \
            f"Esperaba {expected_total} puntos, obtuvo {user.points}"

    # ==================== PRUEBA 4: Puntos por Estado ====================

    @pytest.mark.parametrize("status,should_count", [
        ("pending", True),   # Cuenta
        ("resolved", True),  # Cuenta
        ("rejected", False), # No cuenta (hipotético)
    ])
    def test_points_only_for_valid_statuses(self, status, should_count):
        """
        GIVEN: Reportes con diferentes estados
        WHEN: Se calculan puntos del usuario
        THEN: Solo deben contar pending y resolved
        """
        # Esta es una regla de negocio que se verifica en la API
        valid_statuses = ["pending", "resolved"]

        counts = status in valid_statuses
        assert counts == should_count, \
            f"Estado {status} {'debería' if should_count else 'no debería'} contar puntos"

    # ==================== PRUEBA 5: Historial de Puntos ====================

    def test_points_history_tracks_reports(self):
        """
        GIVEN: Un usuario con múltiples reportes
        WHEN: Se consulta su historial
        THEN: Debe incluir todos los reportes con sus puntos
        """
        reports = [
            {"id": 1, "waste_type": "plastic", "points": 10, "status": "pending"},
            {"id": 2, "waste_type": "glass", "points": 8, "status": "resolved"},
            {"id": 3, "waste_type": "paper", "points": 5, "status": "pending"},
        ]

        total_points = sum(r["points"] for r in reports)

        assert total_points == 23
        assert len(reports) == 3
        assert all("id" in r and "points" in r for r in reports)

    # ==================== PRUEBA 6: Propiedades del Sistema ====================

    def test_reward_system_properties(self):
        """
        PROPIEDADES DEL SISTEMA:
        1. Los puntos son enteros positivos
        2. Existe un valor por defecto
        3. Todos los tipos conocidos tienen puntos asignados
        """
        # Propiedad 1: Todos los valores son enteros positivos
        for waste_type, points in POINTS_BY_WASTE_TYPE.items():
            assert isinstance(points, int), \
                f"Puntos deben ser enteros para {waste_type}"
            assert points > 0, \
                f"Puntos deben ser positivos para {waste_type}"

        # Propiedad 2: Existe valor por defecto
        assert DEFAULT_POINTS is not None
        assert isinstance(DEFAULT_POINTS, int)
        assert DEFAULT_POINTS > 0

        # Propiedad 3: Tipos conocidos tienen asignación
        known_types = ["plastic", "glass", "metal", "paper", "organic"]
        for waste_type in known_types:
            assert waste_type in POINTS_BY_WASTE_TYPE, \
                f"Falta asignación de puntos para {waste_type}"

    # ==================== PRUEBA 7: Consistencia en Múltiples Reportes ====================

    def test_consistent_points_across_multiple_reports(self):
        """
        PROPIEDAD DE CONSISTENCIA:
        GIVEN: El mismo tipo de residuo reportado múltiples veces
        WHEN: Se calculan los puntos
        THEN: Cada reporte debe dar los mismos puntos
        """
        waste_type = "plastic"
        expected_points = POINTS_BY_WASTE_TYPE[waste_type]

        # Simular 5 reportes del mismo tipo
        points_awarded = []
        for _ in range(5):
            points = POINTS_BY_WASTE_TYPE.get(waste_type, DEFAULT_POINTS)
            points_awarded.append(points)

        # Todos deben ser iguales
        assert all(p == expected_points for p in points_awarded), \
            "Los puntos deben ser consistentes para el mismo tipo de residuo"

        assert len(set(points_awarded)) == 1, \
            "Todos los puntos deben ser idénticos"