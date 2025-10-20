"""
Pruebas de integración para el servicio IA.
Valida la interacción con el pipeline de transformers.
"""
import pytest
from app.services.ai_service import AIService
from PIL import Image
import io
import time


class TestAIServiceIntegration:
    """Pruebas de integración del servicio IA"""

    @pytest.fixture(scope="class")
    def ai_service(self):
        """Fixture de clase: Una instancia compartida para todas las pruebas"""
        return AIService()

    def create_test_image(self, size=(224, 224), color='red'):
        """Helper: Crear imagen de prueba"""
        img = Image.new('RGB', size, color=color)
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG')
        buffer.seek(0)
        return buffer.getvalue()

    # ==================== PRUEBA 1 ====================
    def test_classify_with_real_model(self, ai_service):
        """
        GIVEN: El modelo real de transformers cargado
        WHEN: Se clasifica una imagen
        THEN: El proceso debe completarse sin errores
        """
        image_bytes = self.create_test_image()

        start_time = time.time()
        result = ai_service.classify_waste(image_bytes)
        elapsed_time = time.time() - start_time

        # Verificar que se obtuvo resultado
        assert result is not None
        assert 'type' in result

        # Verificar tiempo de respuesta razonable (< 5 segundos)
        assert elapsed_time < 5.0, \
            f"La clasificación tardó {elapsed_time:.2f}s (máximo: 5s)"

    # ==================== PRUEBA 2 ====================
    def test_multiple_classifications_reuse_model(self, ai_service):
        """
        GIVEN: Un servicio IA ya inicializado
        WHEN: Se clasifican múltiples imágenes consecutivamente
        THEN: Debe reutilizar el modelo (no recargarlo)
        """
        image_bytes = self.create_test_image()

        # Primera clasificación
        result1 = ai_service.classify_waste(image_bytes)
        model_ref1 = ai_service.classifier

        # Segunda clasificación
        result2 = ai_service.classify_waste(image_bytes)
        model_ref2 = ai_service.classifier

        # Verificar que es la misma instancia del modelo
        assert model_ref1 is model_ref2, \
            "El modelo debe reutilizarse, no recargarse"

        # Ambas clasificaciones deben retornar resultados
        assert result1 is not None
        assert result2 is not None

    # ==================== PRUEBA 3 ====================
    @pytest.mark.parametrize("size", [
        (100, 100),   # Pequeña
        (224, 224),   # Tamaño del modelo
        (500, 500),   # Grande
    ])
    def test_classify_different_image_sizes(self, ai_service, size):
        """
        GIVEN: Imágenes de diferentes tamaños
        WHEN: Se clasifican
        THEN: El modelo debe manejarlas correctamente (resize interno)
        """
        image_bytes = self.create_test_image(size=size)
        result = ai_service.classify_waste(image_bytes)

        assert result is not None
        assert 'type' in result
        assert 'confidence' in result

    # ==================== PRUEBA 4 ====================
    def test_classify_image_formats(self, ai_service):
        """
        GIVEN: Imágenes en diferentes formatos (JPEG, PNG)
        WHEN: Se clasifican
        THEN: Deben convertirse correctamente a RGB
        """
        formats_to_test = ['JPEG', 'PNG']

        for fmt in formats_to_test:
            img = Image.new('RGB', (200, 200), color='blue')
            buffer = io.BytesIO()
            img.save(buffer, format=fmt)
            buffer.seek(0)
            image_bytes = buffer.getvalue()

            result = ai_service.classify_waste(image_bytes)

            assert result is not None, f"Falló con formato {fmt}"
            assert 'type' in result, f"Respuesta incompleta con formato {fmt}"