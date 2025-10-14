import pytest
from app.services.priority_service import PriorityService
from app.models.waste_classification import WasteClassification
from unittest.mock import Mock


class TestPriorityService:
    """
    Tests para el servicio de priorización basado en tiempo de descomposición
    """
    
    def setup_method(self):
        """Setup para cada test"""
        self.mock_db = Mock()
        self.priority_service = PriorityService(self.mock_db)

    def test_calculate_priority_from_days(self):
        """Test de cálculo de prioridad basado en días"""
        # Casos de prueba para diferentes tiempos de descomposición
        test_cases = [
            (3, 3),      # 3 días -> alta prioridad
            (7, 3),      # 7 días -> alta prioridad
            (15, 2),     # 15 días -> media prioridad 
            (30, 2),     # 30 días -> media prioridad
            (100, 1),    # 100 días -> baja prioridad
            (365, 1),    # 365 días -> baja prioridad
            (1000, 1),   # 1000 días -> baja prioridad
        ]
        
        for days, expected_priority in test_cases:
            result = self.priority_service._calculate_priority_from_days(days)
            assert result == expected_priority, f"Para {days} días, esperaba prioridad {expected_priority}, obtuve {result}"

    def test_get_priority_for_organic_waste(self):
        """Test para residuos orgánicos (alta prioridad)"""
        # Mock de la consulta a la base de datos
        mock_classification = WasteClassification(
            waste_type="organic",
            decomposition_time_days=7,
            priority_level=3,
            description="Residuos orgánicos"
        )
        self.mock_db.query().filter().first.return_value = mock_classification
        
        result = self.priority_service.get_priority_for_waste_type("organic")
        
        assert result["priority"] == 3
        assert result["is_urgent"] == True
        assert result["decomposition_days"] == 7
        assert result["waste_type"] == "organic"

    def test_get_priority_for_plastic_waste(self):
        """Test para residuos plásticos (baja prioridad)"""
        mock_classification = WasteClassification(
            waste_type="plastic",
            decomposition_time_days=1825,  # ~5 años
            priority_level=1,
            description="Plásticos diversos"
        )
        self.mock_db.query().filter().first.return_value = mock_classification
        
        result = self.priority_service.get_priority_for_waste_type("plastic")
        
        assert result["priority"] == 1
        assert result["is_urgent"] == False
        assert result["decomposition_days"] == 1825

    def test_fallback_for_unknown_waste_type(self):
        """Test para tipo de residuo desconocido"""
        # Simular que no se encuentra en la base de datos
        self.mock_db.query().filter().first.return_value = None
        
        result = self.priority_service.get_priority_for_waste_type("unknown_waste")
        
        assert result["priority"] == 1  # Prioridad baja por defecto
        assert result["is_urgent"] == False
        assert result["decomposition_days"] == 365

    def test_should_generate_alert_high_priority_high_confidence(self):
        """Test para generar alerta con alta prioridad y alta confianza"""
        mock_classification = WasteClassification(
            waste_type="organic",
            decomposition_time_days=7,
            priority_level=3,
            description="Residuos orgánicos"
        )
        self.mock_db.query().filter().first.return_value = mock_classification
        
        # Confianza alta (80%)
        should_alert = self.priority_service.should_generate_alert("organic", 0.8)
        assert should_alert == True

    def test_should_not_generate_alert_low_confidence(self):
        """Test para NO generar alerta con baja confianza"""
        mock_classification = WasteClassification(
            waste_type="organic",
            decomposition_time_days=7,
            priority_level=3,
            description="Residuos orgánicos"
        )
        self.mock_db.query().filter().first.return_value = mock_classification
        
        # Confianza baja (50%)
        should_alert = self.priority_service.should_generate_alert("organic", 0.5)
        assert should_alert == False

    def test_should_not_generate_alert_low_priority(self):
        """Test para NO generar alerta con baja prioridad"""
        mock_classification = WasteClassification(
            waste_type="plastic",
            decomposition_time_days=1825,
            priority_level=1,
            description="Plásticos"
        )
        self.mock_db.query().filter().first.return_value = mock_classification
        
        # Aunque la confianza sea alta, la prioridad es baja
        should_alert = self.priority_service.should_generate_alert("plastic", 0.9)
        assert should_alert == False

    def test_organic_keyword_detection(self):
        """Test para detección de palabras clave orgánicas"""
        self.mock_db.query().filter().first.return_value = None
        
        organic_keywords = ["food_waste", "fruit_peel", "meat_scraps", "vegetable_waste"]
        
        for keyword in organic_keywords:
            result = self.priority_service.get_priority_for_waste_type(keyword)
            assert result["priority"] == 3, f"'{keyword}' debería tener alta prioridad"
            assert result["is_urgent"] == True, f"'{keyword}' debería ser urgente"


# Tests de integración
class TestPriorityServiceIntegration:
    """Tests de integración que requieren base de datos real"""
    
    def test_default_data_initialization(self):
        """Test para verificar que los datos por defecto se inicializan correctamente"""
        # Este test requeriría una base de datos de prueba
        # y verificaría que se crean las clasificaciones por defecto
        pass

    def test_add_new_classification(self):
        """Test para agregar nueva clasificación"""
        # Este test verificaría que se puede agregar una nueva clasificación
        # y que se calcula correctamente la prioridad
        pass