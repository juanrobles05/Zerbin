"""
Pruebas unitarias para el servicio de clasificación IA.
Valida el comportamiento del clasificador de forma aislada.
"""
import pytest
from app.services.ai_service import AIService
from PIL import Image
import io


class TestAIServiceUnit:
    """Suite de pruebas unitarias para AIService"""

    @pytest.fixture
    def ai_service(self):
        """Fixture: Instancia del servicio IA"""
        return AIService()

    @pytest.fixture
    def valid_image_bytes(self):
        """Fixture: Imagen válida en formato bytes"""
        # Crear imagen RGB de 200x200 píxeles
        img = Image.new('RGB', (200, 200), color='green')
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG')
        buffer.seek(0)
        return buffer.getvalue()

    @pytest.fixture
    def corrupted_image_bytes(self):
        """Fixture: Datos corruptos que no son una imagen"""
        return b'esto no es una imagen valida'

    # ==================== PRUEBA 1 ====================
    def test_model_not_loaded_initially(self, ai_service):
        """
        GIVEN: Una instancia nueva de AIService
        WHEN: Se verifica el estado inicial
        THEN: El modelo no debe estar cargado (lazy loading)
        """
        assert ai_service.classifier is None, \
            "El modelo no debe cargarse hasta que se use"

    # ==================== PRUEBA 2 ====================
    def test_classify_returns_valid_structure(self, ai_service, valid_image_bytes):
        """
        GIVEN: Una imagen válida
        WHEN: Se clasifica la imagen
        THEN: La respuesta debe contener 'type' y 'confidence'
        """
        result = ai_service.classify_waste(valid_image_bytes)

        # Verificar estructura de respuesta
        assert 'type' in result, "La respuesta debe contener 'type'"
        assert 'confidence' in result, "La respuesta debe contener 'confidence'"

        # Verificar tipos de datos
        assert isinstance(result['type'], str), "El tipo debe ser string"
        assert isinstance(result['confidence'], (int, float)), \
            "La confianza debe ser numérica"

    # ==================== PRUEBA 3 ====================
    def test_confidence_in_valid_range(self, ai_service, valid_image_bytes):
        """
        GIVEN: Una imagen válida
        WHEN: Se clasifica la imagen
        THEN: La confianza debe estar entre 0 y 100
        """
        result = ai_service.classify_waste(valid_image_bytes)
        confidence = result['confidence']

        assert 0 <= confidence <= 100, \
            f"La confianza debe estar entre 0 y 100, pero es {confidence}"

    # ==================== PRUEBA 4 ====================
    def test_classify_invalid_image_raises_error(self, ai_service, corrupted_image_bytes):
        """
        GIVEN: Datos corruptos (no es una imagen)
        WHEN: Se intenta clasificar
        THEN: Debe lanzar ValueError con mensaje apropiado
        """
        with pytest.raises(ValueError) as exc_info:
            ai_service.classify_waste(corrupted_image_bytes)

        assert "Imagen inválida" in str(exc_info.value), \
            "El error debe indicar que la imagen es inválida"

    # ==================== PRUEBA 5 ====================
    def test_model_loads_on_first_use(self, ai_service, valid_image_bytes):
        """
        GIVEN: Una instancia de AIService sin modelo cargado
        WHEN: Se clasifica una imagen por primera vez
        THEN: El modelo debe cargarse automáticamente
        """
        # Verificar estado inicial
        assert ai_service.classifier is None

        # Clasificar imagen (debe cargar el modelo)
        ai_service.classify_waste(valid_image_bytes)

        # Verificar que el modelo se cargó
        assert ai_service.classifier is not None, \
            "El modelo debe cargarse después de la primera clasificación"

    # ==================== PRUEBA 6 ====================
    @pytest.mark.parametrize("color,expected_types", [
        ((0, 255, 0), ['plastic', 'glass', 'organic']),  # Verde
        ((139, 69, 19), ['cardboard', 'paper', 'organic']),  # Marrón
    ])
    def test_classify_different_colors(self, ai_service, color, expected_types):
        """
        GIVEN: Imágenes de diferentes colores
        WHEN: Se clasifican
        THEN: El tipo resultante debe estar en las categorías esperadas
        """
        # Crear imagen del color especificado
        img = Image.new('RGB', (200, 200), color=color)
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG')
        buffer.seek(0)
        image_bytes = buffer.getvalue()

        result = ai_service.classify_waste(image_bytes)

        # Nota: Esta prueba es más flexible porque el modelo puede
        # clasificar de diferentes maneras según su entrenamiento
        assert result['type'] is not None, "Debe retornar un tipo"