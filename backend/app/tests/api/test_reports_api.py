"""
Pruebas completas de la API de reportes.
Valida endpoints, validaciones, respuestas y contratos.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from PIL import Image
import io


@pytest.fixture
def client():
    """Fixture: Cliente de prueba"""
    return TestClient(app)


@pytest.fixture
def valid_image():
    """Fixture: Imagen válida"""
    img = Image.new('RGB', (300, 300), color='green')
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    buf.seek(0)
    return buf


class TestReportsAPI:
    """Pruebas de la API REST de reportes"""

    # ==================== PRUEBA 1: Health Check ====================

    def test_health_endpoint(self, client):
        """
        GIVEN: API funcionando
        WHEN: Se consulta /health
        THEN: Debe retornar 200 con status healthy
        """
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "healthy"
        assert data["service"] == "zerbin-api"

    # ==================== PRUEBA 2: Root Endpoint ====================

    def test_root_endpoint(self, client):
        """
        GIVEN: API funcionando
        WHEN: Se consulta la raíz /
        THEN: Debe retornar información de la API
        """
        response = client.get("/")

        assert response.status_code == 200
        data = response.json()

        assert "message" in data
        assert "version" in data
        assert "docs" in data

    # ==================== PRUEBA 3: Crear Reporte - Happy Path ====================

    def test_create_report_success(self, client, valid_image):
        """
        GIVEN: Datos válidos de reporte
        WHEN: POST a /api/v1/reports/
        THEN: Debe retornar 200 con el reporte creado
        """
        response = client.post(
            "/api/v1/reports/",
            files={"image": ("test.jpg", valid_image, "image/jpeg")},
            data={
                "latitude": "4.7110",
                "longitude": "-74.0721",
                "description": "Test report from API"
            }
        )

        assert response.status_code == 200
        data = response.json()

        # Verificar contrato de respuesta
        required_fields = [
            "id", "image_url", "latitude", "longitude",
            "waste_type", "confidence_score", "priority",
            "status", "created_at"
        ]

        for field in required_fields:
            assert field in data, f"Campo obligatorio faltante: {field}"

        # Verificar tipos de datos
        assert isinstance(data["id"], int)
        assert isinstance(data["latitude"], float)
        assert isinstance(data["longitude"], float)
        assert isinstance(data["priority"], int)
        assert data["status"] == "pending"

    # ==================== PRUEBA 4: Validaciones de Entrada ====================

    @pytest.mark.parametrize("invalid_data,expected_status", [
        ({"longitude": "-74.0721", "description": "No latitude"}, 422),
        ({"latitude": "4.7110", "description": "No longitude"}, 422),
        ({"latitude": "91", "longitude": "-74.0721"}, 400),  # lat > 90
        ({"latitude": "4.7110", "longitude": "181"}, 400),   # lon > 180
    ])
    def test_create_report_validation_errors(self, client, valid_image, invalid_data, expected_status):
        """
        GIVEN: Datos inválidos
        WHEN: Se intenta crear reporte
        THEN: Debe retornar error con código apropiado
        """
        response = client.post(
            "/api/v1/reports/",
            files={"image": ("test.jpg", valid_image, "image/jpeg")},
            data=invalid_data
        )

        assert response.status_code in [400, 422], \
            f"Esperaba error 400/422, obtuvo {response.status_code}"

    # ==================== PRUEBA 5: Sin Imagen ====================

    def test_create_report_without_image(self, client):
        """
        GIVEN: Reporte sin imagen
        WHEN: POST a /api/v1/reports/
        THEN: Debe retornar 422 (campo requerido)
        """
        response = client.post(
            "/api/v1/reports/",
            data={
                "latitude": "4.7110",
                "longitude": "-74.0721",
                "description": "No image attached"
            }
        )

        assert response.status_code == 422

    # ==================== PRUEBA 6: GET Reportes ====================

    def test_get_reports_list(self, client):
        """
        GIVEN: Reportes en el sistema
        WHEN: GET a /api/v1/reports/
        THEN: Debe retornar lista paginada
        """
        response = client.get("/api/v1/reports/?skip=0&limit=10")

        assert response.status_code == 200
        data = response.json()

        # Verificar estructura de paginación
        assert "reports" in data
        assert "total" in data
        assert "page" in data
        assert "per_page" in data

        assert isinstance(data["reports"], list)
        assert isinstance(data["total"], int)
        assert data["per_page"] == 10

    # ==================== PRUEBA 7: GET Reporte por ID ====================

    def test_get_report_by_id(self, client, valid_image):
        """
        GIVEN: Un reporte existente
        WHEN: GET a /api/v1/reports/{id}
        THEN: Debe retornar el reporte específico
        """
        # Crear reporte
        create_response = client.post(
            "/api/v1/reports/",
            files={"image": ("test.jpg", valid_image, "image/jpeg")},
            data={
                "latitude": "4.7110",
                "longitude": "-74.0721"
            }
        )

        report_id = create_response.json()["id"]

        # Consultar por ID
        get_response = client.get(f"/api/v1/reports/{report_id}")

        assert get_response.status_code == 200
        data = get_response.json()

        assert data["id"] == report_id

    # ==================== PRUEBA 8: Reporte No Existente ====================

    def test_get_nonexistent_report(self, client):
        """
        GIVEN: Un ID de reporte que no existe
        WHEN: GET a /api/v1/reports/{id}
        THEN: Debe retornar 404
        """
        response = client.get("/api/v1/reports/99999")

        assert response.status_code == 404
        detail = response.json()["detail"].lower()
        assert "not found" in detail or "no encontrado" in detail

    # ==================== PRUEBA 9: Filtros ====================

    @pytest.mark.parametrize("filter_params", [
        {"status": "pending"},
        {"priority": "3"},
        {"waste_type": "plastic"},
        {"status": "pending", "priority": "2"},
    ])
    def test_get_reports_with_filters(self, client, filter_params):
        """
        GIVEN: Parámetros de filtro
        WHEN: GET con query params
        THEN: Debe retornar reportes filtrados
        """
        query_string = "&".join([f"{k}={v}" for k, v in filter_params.items()])
        response = client.get(f"/api/v1/reports/?{query_string}")

        assert response.status_code == 200
        data = response.json()

        # Verificar que los reportes cumplen el filtro (si hay resultados)
        if data["reports"]:
            for report in data["reports"]:
                if "status" in filter_params:
                    assert report["status"] == filter_params["status"]
                if "priority" in filter_params:
                    assert report["priority"] == int(filter_params["priority"])

    # ==================== PRUEBA 10: Update Status ====================

    def test_update_report_status(self, client, valid_image):
        """
        GIVEN: Un reporte pendiente
        WHEN: PUT a /api/v1/reports/{id}/status
        THEN: Debe actualizar el estado
        """
        # Crear reporte
        create_response = client.post(
            "/api/v1/reports/",
            files={"image": ("test.jpg", valid_image, "image/jpeg")},
            data={
                "latitude": "4.7110",
                "longitude": "-74.0721"
            }
        )

        report_id = create_response.json()["id"]

        # Actualizar estado
        update_response = client.put(
            f"/api/v1/reports/{report_id}/status",
            params={"status": "resolved"}
        )

        assert update_response.status_code == 200
        updated_report = update_response.json()

        assert updated_report["status"] == "resolved"
        assert updated_report["resolved_at"] is not None

    # ==================== PRUEBA 11: Reportes Urgentes ====================

    def test_get_urgent_reports(self, client):
        """
        GIVEN: Sistema con reportes
        WHEN: GET a /api/v1/reports/urgent
        THEN: Debe retornar solo reportes de prioridad 3
        """
        response = client.get("/api/v1/reports/urgent?limit=10")

        assert response.status_code == 200
        reports = response.json()

        assert isinstance(reports, list)

        # Todos deben tener prioridad 3
        for report in reports:
            assert report["priority"] == 3
            assert report["status"] == "pending"

    # ==================== PRUEBA 12: Estadísticas ====================

    def test_get_priority_stats(self, client):
        """
        GIVEN: Reportes en el sistema
        WHEN: GET a /api/v1/reports/stats/priority
        THEN: Debe retornar estadísticas por prioridad
        """
        response = client.get("/api/v1/reports/stats/priority")

        assert response.status_code == 200
        stats = response.json()

        assert "high" in stats
        assert "medium" in stats
        assert "low" in stats
        assert "total" in stats

        # Verificar consistencia matemática
        assert stats["total"] == stats["high"] + stats["medium"] + stats["low"]