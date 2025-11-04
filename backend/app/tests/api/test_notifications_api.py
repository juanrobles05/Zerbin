"""
Pruebas de la API de notificaciones
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    return TestClient(app)

class TestNotificationsAPI:
    """Pruebas de endpoints de notificaciones"""
    
    def test_get_notifications(self, client):
        """
        GIVEN: Un usuario con ID válido
        WHEN: Se consultan sus notificaciones
        THEN: Debe retornar lista con estructura correcta
        """
        response = client.get("/api/v1/notifications/?user_id=1")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "notifications" in data
        assert "total" in data
        assert "unread_count" in data
        assert isinstance(data["notifications"], list)
    
    def test_get_unread_count(self, client):
        """
        GIVEN: Un usuario con notificaciones
        WHEN: Se consulta el conteo de no leídas
        THEN: Debe retornar número válido
        """
        response = client.get("/api/v1/notifications/unread-count?user_id=1")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "user_id" in data
        assert "unread_count" in data
        assert isinstance(data["unread_count"], int)
    
    def test_mark_as_read(self, client):
        """
        GIVEN: IDs de notificaciones válidos
        WHEN: Se marcan como leídas
        THEN: Debe actualizar exitosamente
        """
        response = client.post(
            "/api/v1/notifications/mark-as-read?user_id=1",
            json={"notification_ids": [1, 2, 3]}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "updated_count" in data
        assert isinstance(data["updated_count"], int)