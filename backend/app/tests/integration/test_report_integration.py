# Pruebas de integración del flujo completo de reportes.
# Integra: ImageService → AIService → PriorityService → Database
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.core.database import Base, get_db
from app.models.user import User
from PIL import Image
import io


# Base de datos de prueba totalmente en memoria (no deja archivos residuales)
SQLALCHEMY_TEST_URL = "sqlite:///:memory:"


@pytest.fixture(scope="module")
def test_engine():
    """Fixture: Motor de BD de prueba en memoria compartida entre hilos."""
    engine = create_engine(
        SQLALCHEMY_TEST_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture(scope="module")
def TestingSessionLocal(test_engine):
    """Fixture: Sesión de BD de prueba"""
    return sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session(TestingSessionLocal):
    """Fixture: Sesión de BD por prueba"""
    session = TestingSessionLocal()
    yield session
    session.close()


@pytest.fixture(scope="module")
def client(TestingSessionLocal):
    """Fixture: Cliente de prueba con BD en memoria"""
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture
def test_user(db_session):
    """Fixture: Usuario de prueba en BD"""
    user = User(
        username="test_user",
        email="test@example.com",
        hashed_password="hashed_password",
        points=0
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def sample_image():
    """Fixture: Imagen de prueba"""
    img = Image.new('RGB', (300, 300), color='blue')
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    buf.seek(0)
    return buf


class TestReportIntegration:
    """Pruebas de integración del sistema de reportes"""

    # ==================== PRUEBA 1: Flujo Completo ====================

    def test_create_report_full_flow(self, client, sample_image):
        """
        INTEGRACIÓN COMPLETA:
        1. Usuario sube imagen
        2. ImageService valida y procesa
        3. AIService clasifica
        4. PriorityService calcula prioridad
        5. ReportService guarda en BD
        6. Sistema asigna puntos
        """
        response = client.post(
            "/api/v1/reports/",
            files={"image": ("test.jpg", sample_image, "image/jpeg")},
            data={
                "latitude": "4.7110",
                "longitude": "-74.0721",
                "description": "Test integration report"
            }
        )

        # Verificar respuesta exitosa
        assert response.status_code == 200, f"Error: {response.text}"

        data = response.json()

        # Verificar estructura completa
        assert "id" in data
        assert "waste_type" in data
        assert "confidence_score" in data
        assert "priority" in data
        assert "status" in data
        assert "created_at" in data
        assert "image_url" in data

        # Verificar valores válidos
        assert data["status"] == "pending"
        assert 1 <= data["priority"] <= 3
        assert 0 <= data["confidence_score"] <= 100
        assert data["latitude"] == 4.7110
        assert data["longitude"] == -74.0721

    # ==================== PRUEBA 2: Validación de Datos ====================

    @pytest.mark.parametrize("invalid_data", [
        {"latitude": "invalid", "longitude": "-74.0721"},  # Latitud inválida
        {"latitude": "4.7110", "longitude": "200"},        # Longitud fuera de rango
        {"latitude": "91", "longitude": "-74.0721"},       # Latitud > 90
    ])
    def test_create_report_invalid_coordinates(self, client, sample_image, invalid_data):
        """
        GIVEN: Coordenadas inválidas
        WHEN: Se intenta crear reporte
        THEN: Debe retornar error 400/422
        """
        response = client.post(
            "/api/v1/reports/",
            files={"image": ("test.jpg", sample_image, "image/jpeg")},
            data={**invalid_data, "description": "Test"}
        )

        assert response.status_code in [400, 422], \
            "Debe rechazar coordenadas inválidas"

    # ==================== PRUEBA 3: Filtrado de Reportes ====================

    def test_get_reports_with_filters(self, client, sample_image):
        """
        GIVEN: Múltiples reportes creados
        WHEN: Se filtran por status y priority
        THEN: Debe retornar solo los que cumplan los criterios
        """
        # Crear varios reportes
        for i in range(3):
            client.post(
                "/api/v1/reports/",
                files={"image": (f"test{i}.jpg", sample_image, "image/jpeg")},
                data={
                    "latitude": f"{4.7110 + i*0.001}",
                    "longitude": "-74.0721",
                    "description": f"Report {i}"
                }
            )

        # Filtrar por status
        response = client.get("/api/v1/reports/?status=pending&limit=10")

        assert response.status_code == 200
        data = response.json()

        assert "reports" in data
        assert "total" in data
        assert data["total"] >= 3  # Al menos los 3 que creamos
        assert all(r["status"] == "pending" for r in data["reports"])

    # ==================== PRUEBA 4: Reportes Urgentes ====================

    def test_get_urgent_reports(self, client):
        """
        GIVEN: Reportes con diferentes prioridades
        WHEN: Se consultan reportes urgentes
        THEN: Debe retornar solo los de prioridad 3
        """
        response = client.get("/api/v1/reports/urgent?limit=10")

        assert response.status_code == 200
        reports = response.json()

        # Todos deben tener prioridad 3
        assert all(r["priority"] == 3 for r in reports)

    # ==================== PRUEBA 5: Actualización de Estado ====================

    def test_update_report_status(self, client, sample_image):
        """
        GIVEN: Un reporte existente
        WHEN: Se actualiza su estado a "resolved"
        THEN: Debe cambiar el estado y asignar puntos adicionales
        """
        # Crear reporte
        create_response = client.post(
            "/api/v1/reports/",
            files={"image": ("test.jpg", sample_image, "image/jpeg")},
            data={
                "latitude": "4.7110",
                "longitude": "-74.0721",
                "description": "Test status update"
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

    # ==================== PRUEBA 6: Corrección Manual ====================

    def test_update_manual_classification(self, client, sample_image):
        """
        GIVEN: Un reporte clasificado automáticamente
        WHEN: El usuario corrige la clasificación
        THEN: Debe actualizarse y recalcular prioridad
        """
        # Crear reporte
        create_response = client.post(
            "/api/v1/reports/",
            files={"image": ("test.jpg", sample_image, "image/jpeg")},
            data={
                "latitude": "4.7110",
                "longitude": "-74.0721"
            }
        )

        report_id = create_response.json()["id"]
        original_waste_type = create_response.json()["waste_type"]

        # Corregir clasificación
        update_response = client.patch(
            f"/api/v1/reports/{report_id}/classification",
            json={"corrected_type": "glass"}
        )

        assert update_response.status_code == 200
        updated_report = update_response.json()

        assert updated_report["waste_type"] == "glass"
        assert updated_report["manual_classification"] == "glass"

    # ==================== PRUEBA 7: Recálculo de Prioridad ====================

    def test_recalculate_priority(self, client, sample_image):
        """
        GIVEN: Un reporte con prioridad calculada
        WHEN: Se solicita recálculo (ej: después de corrección manual)
        THEN: Debe recalcular según los datos actuales
        """
        # Crear reporte
        create_response = client.post(
            "/api/v1/reports/",
            files={"image": ("test.jpg", sample_image, "image/jpeg")},
            data={
                "latitude": "4.7110",
                "longitude": "-74.0721"
            }
        )

        report_id = create_response.json()["id"]
        original_priority = create_response.json()["priority"]

        # Recalcular prioridad
        recalc_response = client.post(f"/api/v1/reports/{report_id}/recalculate-priority")

        assert recalc_response.status_code == 200
        updated_report = recalc_response.json()

        # La prioridad puede cambiar o mantenerse, pero el endpoint debe funcionar
        assert "priority" in updated_report
        assert 1 <= updated_report["priority"] <= 3

    # ==================== PRUEBA 8: Estadísticas ====================

    def test_get_priority_statistics(self, client):
        """
        GIVEN: Reportes en el sistema
        WHEN: Se consultan estadísticas de prioridad
        THEN: Debe retornar conteo por nivel
        """
        response = client.get("/api/v1/reports/stats/priority")

        assert response.status_code == 200
        stats = response.json()

        assert "high" in stats
        assert "medium" in stats
        assert "low" in stats
        assert "total" in stats

        # Verificar consistencia
        assert stats["total"] == stats["high"] + stats["medium"] + stats["low"]