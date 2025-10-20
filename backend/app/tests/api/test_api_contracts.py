"""
Pruebas de contratos de la API.
Valida que las respuestas cumplan con los esquemas definidos.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from PIL import Image
import io
from datetime import datetime


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def valid_image():
    img = Image.new('RGB', (200, 200), color='blue')
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    buf.seek(0)
    return buf


class TestAPIContracts:
    """Pruebas de contratos (schema validation)"""

    # ==================== CONTRATO: ReportResponse ====================

    def test_report_response_contract(self, client, valid_image):
        """
        CONTRATO: ReportResponse debe cumplir con el esquema definido
        """
        response = client.post(
            "/api/v1/reports/",
            files={"image": ("test.jpg", valid_image, "image/jpeg")},
            data={
                "latitude": "4.7110",
                "longitude": "-74.0721",
                "description": "Contract test"
            }
        )

        assert response.status_code == 200
        data = response.json()

        # Campos obligatorios
        required_fields = {
            "id": int,
            "image_url": str,
            "latitude": float,
            "longitude": float,
            "waste_type": (str, type(None)),
            "confidence_score": (float, type(None)),
            "status": str,
            "priority": int,
            "created_at": str,
        }

        for field, expected_type in required_fields.items():
            assert field in data, f"Campo faltante: {field}"
            if not isinstance(expected_type, tuple):
                expected_type = (expected_type,)
            assert isinstance(data[field], expected_type), \
                f"Tipo incorrecto para {field}: esperaba {expected_type}, obtuvo {type(data[field])}"

        # Validaciones adicionales
        assert 1 <= data["priority"] <= 3
        assert data["status"] in ["pending", "in_progress", "resolved"]

        # Verificar formato de fecha ISO 8601
        try:
            datetime.fromisoformat(data["created_at"].replace('Z', '+00:00'))
        except ValueError:
            pytest.fail(f"created_at no es ISO 8601 válido: {data['created_at']}")

    # ==================== CONTRATO: ReportListResponse ====================

    def test_report_list_response_contract(self, client):
        """
        CONTRATO: ReportListResponse debe tener estructura de paginación
        """
        response = client.get("/api/v1/reports/?skip=0&limit=10")

        assert response.status_code == 200
        data = response.json()

        # Estructura de paginación
        assert "reports" in data
        assert "total" in data
        assert "page" in data
        assert "per_page" in data

        # Tipos
        assert isinstance(data["reports"], list)
        assert isinstance(data["total"], int)
        assert isinstance(data["page"], int)
        assert isinstance(data["per_page"], int)

        # Validaciones lógicas
        assert data["per_page"] == 10
        assert data["page"] >= 1
        assert len(data["reports"]) <= data["per_page"]

    # ==================== CONTRATO: PriorityStatsResponse ====================

    def test_priority_stats_contract(self, client):
        """
        CONTRATO: PriorityStatsResponse debe tener contadores por nivel
        """
        response = client.get("/api/v1/reports/stats/priority")

        assert response.status_code == 200
        data = response.json()

        # Campos requeridos
        required_fields = ["high", "medium", "low", "total"]

        for field in required_fields:
            assert field in data, f"Campo faltante: {field}"
            assert isinstance(data[field], int), \
                f"{field} debe ser entero"
            assert data[field] >= 0, \
                f"{field} no puede ser negativo"

        # Consistencia matemática
        assert data["total"] == data["high"] + data["medium"] + data["low"]