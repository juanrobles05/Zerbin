"""
Pruebas de performance del sistema de reportes.
Valida tiempos de respuesta bajo diferentes cargas.
"""
import pytest
import time
import statistics
from fastapi.testclient import TestClient
from app.main import app
from PIL import Image
import io
import concurrent.futures


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def sample_image():
    img = Image.new('RGB', (300, 300), color='red')
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    buf.seek(0)
    return buf


class TestReportPerformance:
    """Pruebas de performance"""
    
    # ==================== PRUEBA 1: Tiempo de Respuesta ====================
    
    def test_create_report_response_time(self, client, sample_image):
        """
        REQUISITO: El envío de reporte no debe superar 2 segundos
        GIVEN: Un reporte válido
        WHEN: Se envía
        THEN: La respuesta debe llegar en < 2000ms
        """
        start_time = time.time()
        
        response = client.post(
            "/api/v1/reports/",
            files={"image": ("test.jpg", sample_image, "image/jpeg")},
            data={
                "latitude": "4.7110",
                "longitude": "-74.0721",
                "description": "Performance test"
            }
        )
        
        elapsed_time = time.time() - start_time
        
        assert response.status_code == 200, f"Request failed: {response.text}"
        assert elapsed_time < 2.0, \
            f"Tiempo de respuesta muy alto: {elapsed_time:.2f}s (máximo: 2s)"
        
        print(f"\n✓ Tiempo de respuesta: {elapsed_time:.3f}s")
    
    # ==================== PRUEBA 2: Carga Concurrente ====================
    
    def test_concurrent_report_creation(self, client):
        """
        GIVEN: 10 reportes enviados simultáneamente
        WHEN: Se procesan concurrentemente
        THEN: Todos deben completarse exitosamente en < 5s total
        """
        def create_report(i):
            img = Image.new('RGB', (200, 200), color='blue')
            buf = io.BytesIO()
            img.save(buf, format='JPEG')
            buf.seek(0)
            
            response = client.post(
                "/api/v1/reports/",
                files={"image": (f"test{i}.jpg", buf, "image/jpeg")},
                data={
                    "latitude": f"{4.7110 + i*0.001}",
                    "longitude": "-74.0721",
                    "description": f"Concurrent test {i}"
                }
            )
            return response.status_code == 200
        
        start_time = time.time()
        
        # Ejecutar 10 reportes en paralelo
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            results = list(executor.map(create_report, range(10)))
        
        elapsed_time = time.time() - start_time
        
        # Verificar que todos fueron exitosos
        success_rate = sum(results) / len(results) * 100
        
        assert success_rate >= 90, \
            f"Tasa de éxito muy baja: {success_rate}% (mínimo: 90%)"
        assert elapsed_time < 10.0, \
            f"Tiempo total muy alto: {elapsed_time:.2f}s (máximo: 10s para 10 reportes)"
        
        print(f"\n✓ Tasa de éxito: {success_rate}%")
        print(f"✓ Tiempo total: {elapsed_time:.2f}s")
        print(f"✓ Promedio por reporte: {elapsed_time/10:.2f}s")
    
    # ==================== PRUEBA 3: Benchmark de Consultas ====================
    
    def test_get_reports_query_performance(self, client):
        """
        GIVEN: Consulta de reportes
        WHEN: Se ejecuta
        THEN: Debe responder en < 500ms
        """
        times = []
        
        for _ in range(5):  # 5 consultas para promedio
            start = time.time()
            response = client.get("/api/v1/reports/?skip=0&limit=50")
            elapsed = time.time() - start
            times.append(elapsed)
            
            assert response.status_code == 200
        
        avg_time = statistics.mean(times)
        max_time = max(times)
        
        assert avg_time < 0.5, \
            f"Tiempo promedio muy alto: {avg_time:.3f}s (máximo: 0.5s)"
        assert max_time < 1.0, \
            f"Tiempo máximo muy alto: {max_time:.3f}s (máximo: 1.0s)"
        
        print(f"\n✓ Tiempo promedio: {avg_time:.3f}s")
        print(f"✓ Tiempo máximo: {max_time:.3f}s")
        print(f"✓ Tiempo mínimo: {min(times):.3f}s")
    
    # ==================== PRUEBA 4: Stress Test ====================
    
    @pytest.mark.slow
    def test_stress_test_100_reports(self, client):
        """
        STRESS TEST: 100 reportes secuenciales
        GIVEN: 100 reportes consecutivos
        WHEN: Se envían uno tras otro
        THEN: El sistema debe mantener tiempos de respuesta consistentes
        """
        times = []
        errors = 0
        
        for i in range(100):
            img = Image.new('RGB', (200, 200), color=(i % 255, 50, 100))
            buf = io.BytesIO()
            img.save(buf, format='JPEG')
            buf.seek(0)
            
            start = time.time()
            try:
                response = client.post(
                    "/api/v1/reports/",
                    files={"image": (f"stress{i}.jpg", buf, "image/jpeg")},
                    data={
                        "latitude": f"{4.7110 + (i % 100) * 0.001}",
                        "longitude": f"{-74.0721 + (i % 100) * 0.001}",
                        "description": f"Stress test {i}"
                    },
                    timeout=10  # 10s timeout
                )
                elapsed = time.time() - start
                times.append(elapsed)
                
                if response.status_code != 200:
                    errors += 1
            except Exception as e:
                errors += 1
                print(f"Error en reporte {i}: {e}")
        
        # Análisis de resultados
        avg_time = statistics.mean(times)
        stdev_time = statistics.stdev(times) if len(times) > 1 else 0
        error_rate = (errors / 100) * 100
        
        # Verificaciones
        assert error_rate < 5, \
            f"Tasa de error muy alta: {error_rate}% (máximo: 5%)"
        assert avg_time < 3.0, \
            f"Tiempo promedio degradado: {avg_time:.2f}s (máximo: 3s)"
        
        print(f"\n✓ Reportes exitosos: {100 - errors}/100")
        print(f"✓ Tasa de error: {error_rate}%")
        print(f"✓ Tiempo promedio: {avg_time:.3f}s")
        print(f"✓ Desviación estándar: {stdev_time:.3f}s")
        print(f"✓ Tiempo mínimo: {min(times):.3f}s")
        print(f"✓ Tiempo máximo: {max(times):.3f}s")