"""
Prueba simple del sistema de priorización sin dependencias externas
"""

from typing import Dict

class SimplePriorityService:
    """Versión simplificada del servicio de prioridad para pruebas"""
    
    PRIORITY_THRESHOLDS = {
        7: 3,      # <= 7 días: alta prioridad
        30: 2,     # <= 30 días: media prioridad
        365: 1     # <= 365 días: baja prioridad
    }
    
    DEFAULT_WASTE_DATA = {
        "organic": {
            "decomposition_time_days": 7,
            "description": "Residuos orgánicos que se descomponen rápidamente"
        },
        "food": {
            "decomposition_time_days": 14,
            "description": "Restos de comida y materiales alimentarios"
        },
        "paper": {
            "decomposition_time_days": 90,
            "description": "Papel y cartón"
        },
        "plastic": {
            "decomposition_time_days": 1825,  # ~5 años
            "description": "Plásticos diversos"
        },
        "glass": {
            "decomposition_time_days": 365000,  # ~1000 años
            "description": "Vidrio y cristal"
        },
        "metal": {
            "decomposition_time_days": 18250,  # ~50 años
            "description": "Metales diversos"
        },
    }

    def _calculate_priority_from_days(self, decomposition_days: int) -> int:
        """Calcula el nivel de prioridad basado en el tiempo de descomposición"""
        for threshold_days, priority in sorted(self.PRIORITY_THRESHOLDS.items()):
            if decomposition_days <= threshold_days:
                return priority
        return 1  # Prioridad baja por defecto

    def get_priority_for_waste_type(self, waste_type: str) -> Dict[str, any]:
        """Obtiene la prioridad para un tipo de residuo específico"""
        normalized_type = waste_type.lower().strip()
        
        if normalized_type in self.DEFAULT_WASTE_DATA:
            data = self.DEFAULT_WASTE_DATA[normalized_type]
            priority = self._calculate_priority_from_days(data["decomposition_time_days"])
            
            return {
                "priority": priority,
                "decomposition_days": data["decomposition_time_days"],
                "is_urgent": priority == 3,
                "waste_type": normalized_type,
                "description": data["description"]
            }
        
        # Fallback para tipos no reconocidos
        return {
            "priority": 1,
            "decomposition_days": 365,
            "is_urgent": False,
            "waste_type": normalized_type,
            "description": "Tipo de residuo no clasificado"
        }

    def should_generate_alert(self, waste_type: str, confidence: float = 0.0) -> bool:
        """Determina si se debe generar una alerta urgente"""
        priority_info = self.get_priority_for_waste_type(waste_type)
        high_confidence = confidence >= 0.7  # 70% umbral por defecto
        is_urgent = priority_info["is_urgent"]
        return is_urgent and high_confidence

def test_priority_system():
    """Función de prueba para el sistema de priorización"""
    service = SimplePriorityService()
    
    print("🧪 Pruebas del Sistema de Priorización\n")
    
    # Test 1: Residuos orgánicos (alta prioridad)
    print("📋 Test 1: Residuos orgánicos")
    organic_result = service.get_priority_for_waste_type("organic")
    print(f"   Tipo: {organic_result['waste_type']}")
    print(f"   Prioridad: {organic_result['priority']} ({'ALTA' if organic_result['priority'] == 3 else 'MEDIA' if organic_result['priority'] == 2 else 'BAJA'})")
    print(f"   Descomposición: {organic_result['decomposition_days']} días")
    print(f"   Es urgente: {'SÍ' if organic_result['is_urgent'] else 'NO'}")
    print(f"   ✅ Test {'EXITOSO' if organic_result['priority'] == 3 and organic_result['is_urgent'] else 'FALLIDO'}\n")
    
    # Test 2: Plásticos (baja prioridad)
    print("📋 Test 2: Residuos plásticos")
    plastic_result = service.get_priority_for_waste_type("plastic")
    print(f"   Tipo: {plastic_result['waste_type']}")
    print(f"   Prioridad: {plastic_result['priority']} ({'ALTA' if plastic_result['priority'] == 3 else 'MEDIA' if plastic_result['priority'] == 2 else 'BAJA'})")
    print(f"   Descomposición: {plastic_result['decomposition_days']} días")
    print(f"   Es urgente: {'SÍ' if plastic_result['is_urgent'] else 'NO'}")
    print(f"   ✅ Test {'EXITOSO' if plastic_result['priority'] == 1 and not plastic_result['is_urgent'] else 'FALLIDO'}\n")
    
    # Test 3: Generación de alertas
    print("📋 Test 3: Generación de alertas")
    
    # Caso 1: Alta prioridad + alta confianza = ALERTA
    should_alert_1 = service.should_generate_alert("organic", 0.85)
    print(f"   Orgánico con 85% confianza: {'ALERTA' if should_alert_1 else 'SIN ALERTA'}")
    
    # Caso 2: Alta prioridad + baja confianza = SIN ALERTA
    should_alert_2 = service.should_generate_alert("organic", 0.50)
    print(f"   Orgánico con 50% confianza: {'ALERTA' if should_alert_2 else 'SIN ALERTA'}")
    
    # Caso 3: Baja prioridad + alta confianza = SIN ALERTA
    should_alert_3 = service.should_generate_alert("plastic", 0.90)
    print(f"   Plástico con 90% confianza: {'ALERTA' if should_alert_3 else 'SIN ALERTA'}")
    
    alert_test_passed = should_alert_1 and not should_alert_2 and not should_alert_3
    print(f"   ✅ Test {'EXITOSO' if alert_test_passed else 'FALLIDO'}\n")
    
    # Test 4: Tipo de residuo desconocido
    print("📋 Test 4: Tipo de residuo desconocido")
    unknown_result = service.get_priority_for_waste_type("tipo_desconocido")
    print(f"   Tipo: {unknown_result['waste_type']}")
    print(f"   Prioridad: {unknown_result['priority']} (BAJA por defecto)")
    print(f"   ✅ Test {'EXITOSO' if unknown_result['priority'] == 1 else 'FALLIDO'}\n")
    
    # Resumen
    all_tests_passed = (
        organic_result['priority'] == 3 and organic_result['is_urgent'] and
        plastic_result['priority'] == 1 and not plastic_result['is_urgent'] and
        alert_test_passed and
        unknown_result['priority'] == 1
    )
    
    print("🎯 Resumen de Pruebas:")
    print(f"   {'✅ TODOS LOS TESTS EXITOSOS' if all_tests_passed else '❌ ALGUNOS TESTS FALLARON'}")
    
    if all_tests_passed:
        print("\n🎉 El sistema de priorización funciona correctamente!")
        print("   - Identifica residuos de descomposición rápida")
        print("   - Asigna prioridad automáticamente")
        print("   - Genera alertas para casos urgentes")
    
    return all_tests_passed

if __name__ == "__main__":
    test_priority_system()