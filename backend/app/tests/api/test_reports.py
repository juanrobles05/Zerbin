from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_classify_waste():
    with open('test_image.jpg', 'rb') as image_file:
        response = client.post("/classify", files={"image": image_file})
        assert response.status_code == 200
        assert "type" in response.json()
        assert "confidence" in response.json()