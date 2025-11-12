"""
Script de pruebas E2E para el sistema de autenticación
Prueba los endpoints de registro, login y obtener usuario actual
"""
import requests
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000/api/v1"
AUTH_URL = f"{BASE_URL}/auth"

# Colores para output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def print_test(message):
    print(f"\n{Colors.BLUE}🧪 TEST: {message}{Colors.RESET}")

def print_success(message):
    print(f"{Colors.GREEN}✅ {message}{Colors.RESET}")

def print_error(message):
    print(f"{Colors.RED}❌ {message}{Colors.RESET}")

def print_info(message):
    print(f"{Colors.YELLOW}ℹ️  {message}{Colors.RESET}")

# Variables globales para el flujo de pruebas
test_user_data = {
    "username": f"testuser_{datetime.now().strftime('%Y%m%d%H%M%S')}",
    "email": f"test_{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com",
    "password": "testpass123"
}
access_token = None

def test_01_register():
    """Prueba 1: Registro de usuario"""
    print_test("Registrar nuevo usuario")
    
    try:
        response = requests.post(
            f"{AUTH_URL}/register",
            json=test_user_data
        )
        
        if response.status_code == 201:
            data = response.json()
            print_success(f"Usuario registrado: {data['username']}")
            print_info(f"  Email: {data['email']}")
            print_info(f"  Puntos iniciales: {data['points']}")
            print_info(f"  ID: {data['id']}")
            return True
        else:
            print_error(f"Error al registrar: {response.status_code}")
            print_error(f"Respuesta: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Excepción: {str(e)}")
        return False

def test_02_register_duplicate_email():
    """Prueba 2: Intentar registrar con email duplicado"""
    print_test("Intentar registro con email duplicado (debe fallar)")
    
    try:
        duplicate_data = {
            "username": "otheruser",
            "email": test_user_data["email"],  # Email duplicado
            "password": "password123"
        }
        
        response = requests.post(
            f"{AUTH_URL}/register",
            json=duplicate_data
        )
        
        if response.status_code == 400:
            print_success("Validación correcta: Email duplicado rechazado")
            return True
        else:
            print_error(f"Error: Debería retornar 400, pero retornó {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Excepción: {str(e)}")
        return False

def test_03_login():
    """Prueba 3: Login con credenciales correctas"""
    global access_token
    print_test("Login con credenciales correctas")
    
    try:
        login_data = {
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        }
        
        response = requests.post(
            f"{AUTH_URL}/login",
            json=login_data
        )
        
        if response.status_code == 200:
            data = response.json()
            access_token = data['access_token']
            print_success(f"Login exitoso para: {data['user']['username']}")
            print_info(f"  Token recibido: {access_token[:20]}...")
            print_info(f"  Puntos: {data['user']['points']}")
            return True
        else:
            print_error(f"Error al hacer login: {response.status_code}")
            print_error(f"Respuesta: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Excepción: {str(e)}")
        return False

def test_04_login_wrong_password():
    """Prueba 4: Login con contraseña incorrecta"""
    print_test("Login con contraseña incorrecta (debe fallar)")
    
    try:
        wrong_data = {
            "email": test_user_data["email"],
            "password": "wrongpassword"
        }
        
        response = requests.post(
            f"{AUTH_URL}/login",
            json=wrong_data
        )
        
        if response.status_code == 401:
            print_success("Validación correcta: Credenciales incorrectas rechazadas")
            return True
        else:
            print_error(f"Error: Debería retornar 401, pero retornó {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Excepción: {str(e)}")
        return False

def test_05_get_current_user():
    """Prueba 5: Obtener información del usuario autenticado"""
    print_test("Obtener información del usuario actual con token")
    
    if not access_token:
        print_error("No hay token de acceso. Ejecuta test_03_login primero")
        return False
    
    try:
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        response = requests.get(
            f"{AUTH_URL}/me",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Usuario obtenido: {data['username']}")
            print_info(f"  Email: {data['email']}")
            print_info(f"  Puntos: {data['points']}")
            print_info(f"  Creado: {data['created_at']}")
            return True
        else:
            print_error(f"Error al obtener usuario: {response.status_code}")
            print_error(f"Respuesta: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Excepción: {str(e)}")
        return False

def test_06_get_current_user_no_token():
    """Prueba 6: Intentar obtener usuario sin token"""
    print_test("Intentar obtener usuario sin token (debe fallar)")
    
    try:
        response = requests.get(f"{AUTH_URL}/me")
        
        if response.status_code == 401:
            print_success("Validación correcta: Petición sin token rechazada")
            return True
        else:
            print_error(f"Error: Debería retornar 401, pero retornó {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Excepción: {str(e)}")
        return False

def test_07_get_current_user_invalid_token():
    """Prueba 7: Intentar obtener usuario con token inválido"""
    print_test("Intentar obtener usuario con token inválido (debe fallar)")
    
    try:
        headers = {
            "Authorization": "Bearer invalid_token_12345"
        }
        
        response = requests.get(
            f"{AUTH_URL}/me",
            headers=headers
        )
        
        if response.status_code == 401:
            print_success("Validación correcta: Token inválido rechazado")
            return True
        else:
            print_error(f"Error: Debería retornar 401, pero retornó {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Excepción: {str(e)}")
        return False

def run_all_tests():
    """Ejecuta todas las pruebas"""
    print(f"\n{'='*60}")
    print(f"{Colors.BLUE}🚀 INICIANDO SUITE DE PRUEBAS E2E - AUTENTICACIÓN{Colors.RESET}")
    print(f"{'='*60}")
    
    tests = [
        test_01_register,
        test_02_register_duplicate_email,
        test_03_login,
        test_04_login_wrong_password,
        test_05_get_current_user,
        test_06_get_current_user_no_token,
        test_07_get_current_user_invalid_token,
    ]
    
    results = []
    for test in tests:
        result = test()
        results.append(result)
    
    # Resumen
    print(f"\n{'='*60}")
    print(f"{Colors.BLUE}📊 RESUMEN DE PRUEBAS{Colors.RESET}")
    print(f"{'='*60}")
    
    passed = sum(results)
    total = len(results)
    failed = total - passed
    
    print(f"\n✅ Pasadas: {passed}/{total}")
    print(f"❌ Falladas: {failed}/{total}")
    
    if failed == 0:
        print(f"\n{Colors.GREEN}🎉 ¡TODAS LAS PRUEBAS PASARON!{Colors.RESET}")
    else:
        print(f"\n{Colors.RED}⚠️  Algunas pruebas fallaron{Colors.RESET}")
    
    print(f"\n{'='*60}\n")

if __name__ == "__main__":
    run_all_tests()
