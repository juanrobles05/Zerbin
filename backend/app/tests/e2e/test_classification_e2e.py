"""
Pruebas End-to-End del flujo de clasificación.
Simula el flujo completo: Frontend → API → IA → Response
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from PIL import Image
import io


@pytest.fixture
def client():
    """Fixture: Cliente de prueba de FastAPI"""
    return TestClient(app)


@pytest.fixture
def sample_image_file():
    """Fixture: Archivo de imagen simulado"""
    img = Image.new('RGB', (300, 300), color='green')
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG')
    buffer.seek(0)
    return ("test_waste.jpg", buffer, "image/jpeg")


class TestClassificationE2E:
    """Pruebas E2E del endpoint de clasificación"""

    # ==================== PRUEBA 1 ====================
    def test_classify_endpoint_returns_200(self, client, sample_image_file):
        """
        GIVEN: Una petición al endpoint /classify con una imagen
        WHEN: Se envía la imagen
        THEN: Debe retornar status 200 y estructura válida
        """
        response = client.post(
            "/api/v1/classify/",
            files={"image": sample_image_file}
        )

        assert response.status_code == 200, \
            f"Esperaba 200, obtuvo {response.status_code}"

        data = response.json()
        assert 'type' in data
        assert 'confidence' in data

    # ==================== PRUEBA 2 ====================
    def test_classify_without_image_returns_422(self, client):
        """
        GIVEN: Una petición sin imagen
        WHEN: Se envía
        THEN: Debe retornar 422 (Unprocessable Entity)
        """
        response = client.post("/api/v1/classify/")

        assert response.status_code == 422, \
            "Debe rechazar peticiones sin imagen"

    # ==================== PRUEBA 3 ====================
    def test_classify_invalid_file_returns_500(self, client):
        """
        GIVEN: Un archivo que no es una imagen
        WHEN: Se envía al endpoint
        THEN: Debe retornar 500 con mensaje de error
        """
        fake_file = ("fake.txt", io.BytesIO(b"not an image"), "text/plain")

        response = client.post(
            "/api/v1/classify/",
            files={"image": fake_file}
        )

        assert response.status_code == 500
        assert "Error clasificando imagen" in response.json()['detail']