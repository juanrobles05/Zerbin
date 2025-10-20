"""
Pruebas unitarias para el servicio de gestión de reportes.
Valida la lógica de negocio de creación, actualización y filtrado de reportes.
"""
import pytest
from datetime import datetime, timezone
from unittest.mock import Mock, patch
from app.services.report_service import ReportService, POINTS_BY_WASTE_TYPE, DEFAULT_POINTS
from app.models.report import Report
from app.models.user import User


class TestReportServiceUnit:
    """Suite de pruebas unitarias para ReportService"""

    @pytest.fixture
    def mock_db(self):
        """Fixture: Mock de sesión de base de datos"""
        db = Mock()
        db.query.return_value = Mock()
        db.add = Mock()
        db.commit = Mock()
        db.refresh = Mock()
        db.rollback = Mock()
        return db

    @pytest.fixture
    def sample_report_data(self):
        """Fixture: Datos de ejemplo para crear un reporte"""
        data = Mock()
        data.latitude = 4.7110
        data.longitude = -74.0721
        data.description = "Basura acumulada en la esquina"
        data.image_url = "https://storage.supabase.co/test/image123.jpg"
        data.ai_classification = {
            "type": "plastic",
            "confidence": 85.5
        }
        data.manual_classification = None
        return data

    @pytest.fixture
    def mock_user(self):
        """Fixture: Usuario mock"""
        user = User(
            id=1,
            username="test_user",
            email="test@example.com",
            hashed_password="hashed",
            points=0
        )
        return user

    # ==================== PRUEBA 1: Creación de Reporte ====================

    @pytest.mark.asyncio
    async def test_create_report_success(self, mock_db, sample_report_data, mock_user):
        """
        GIVEN: Datos válidos de reporte
        WHEN: Se crea un nuevo reporte
        THEN: Debe guardarse en BD con prioridad calculada automáticamente
        """
        # Mock del usuario
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user

        with patch('app.services.report_service.PriorityService.calculate_priority') as mock_priority:
            mock_priority.return_value = (2, "Medium")  # Prioridad media

            # Crear reporte
            report = await ReportService.create_report(mock_db, sample_report_data)

            # Verificaciones
            assert report is not None
            assert report.waste_type == "plastic"
            assert report.confidence_score == 85.5
            assert report.priority == 2
            mock_db.add.assert_called_once()

    # ==================== PRUEBA 2: Asignación de Puntos ====================

    @pytest.mark.parametrize("waste_type,expected_points", [
        ("plastic", 10),
        ("glass", 8),
        ("metal", 12),
        ("paper", 5),
        ("organic", 3),
        ("unknown", 2),  # DEFAULT_POINTS
    ])
    def test_points_assignment_by_waste_type(self, waste_type, expected_points):
        """
        PROPIEDAD: Cada tipo de residuo debe tener puntos específicos asignados
        GIVEN: Un tipo de residuo
        WHEN: Se consulta en el mapeo
        THEN: Debe retornar los puntos correctos
        """
        points = POINTS_BY_WASTE_TYPE.get(waste_type, DEFAULT_POINTS)
        assert points == expected_points, \
            f"Puntos incorrectos para {waste_type}: esperaba {expected_points}, obtuvo {points}"

    # ==================== PRUEBA 3: Actualización de Puntos del Usuario ====================

    @pytest.mark.asyncio
    async def test_create_report_updates_user_points(self, mock_db, sample_report_data):
        """
        GIVEN: Un usuario con 50 puntos y reporte de plástico (10 pts)
        WHEN: Se crea el reporte
        THEN: El usuario debe tener 60 puntos
        """
        # Mock del usuario con puntos iniciales
        mock_user = User(id=1, username="test", email="test@test.com", 
                        hashed_password="hash", points=50)
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user

        with patch('app.services.report_service.PriorityService.calculate_priority') as mock_priority:
            mock_priority.return_value = (1, "Low")

            # Crear reporte con waste_type = plastic (10 puntos)
            await ReportService.create_report(mock_db, sample_report_data)

            # Verificar que se actualizaron los puntos
            assert mock_user.points == 60, \
                f"Esperaba 60 puntos (50+10), pero tiene {mock_user.points}"

    # ==================== PRUEBA 4: Filtrado de Reportes ====================

    def test_get_reports_filters_by_status(self, mock_db):
        """
        GIVEN: Reportes con diferentes estados
        WHEN: Se filtran por status="pending"
        THEN: Solo debe retornar reportes pendientes
        """
        # Mock de reportes
        mock_reports = [
            Report(id=1, status="pending", waste_type="plastic"),
            Report(id=2, status="pending", waste_type="glass"),
        ]

        # Configurar mock
        query_mock = Mock()
        query_mock.filter.return_value = query_mock
        query_mock.order_by.return_value = query_mock
        query_mock.count.return_value = 2
        query_mock.offset.return_value = query_mock
        query_mock.limit.return_value = query_mock
        query_mock.all.return_value = mock_reports

        mock_db.query.return_value = query_mock

        # Ejecutar
        reports, total = ReportService.get_reports(
            db=mock_db,
            skip=0,
            limit=10,
            status="pending"
        )

        # Verificar
        assert total == 2
        assert len(reports) == 2
        assert all(r.status == "pending" for r in reports)

    # ==================== PRUEBA 5: Reportes Urgentes ====================

    def test_get_urgent_reports_filters_high_priority(self, mock_db):
        """
        GIVEN: Reportes con diferentes prioridades
        WHEN: Se solicitan reportes urgentes
        THEN: Solo debe retornar los de prioridad=3 y status=pending
        """
        urgent_reports = [
            Report(id=1, priority=3, status="pending", waste_type="battery"),
            Report(id=2, priority=3, status="pending", waste_type="organic"),
        ]

        query_mock = Mock()
        query_mock.filter.return_value = query_mock
        query_mock.order_by.return_value = query_mock
        query_mock.limit.return_value = query_mock
        query_mock.all.return_value = urgent_reports

        mock_db.query.return_value = query_mock

        # Ejecutar
        result = ReportService.get_urgent_reports(db=mock_db, limit=10)

        # Verificar
        assert len(result) == 2
        assert all(r.priority == 3 for r in result)
        assert all(r.status == "pending" for r in result)

    # ==================== PRUEBA 6: Actualización de Estado ====================

    def test_update_report_status_to_resolved(self, mock_db):
        """
        GIVEN: Un reporte pendiente
        WHEN: Se actualiza a "resolved"
        THEN: Debe marcar resolved_at y asignar puntos adicionales
        """
        # Mock del reporte
        mock_report = Report(
            id=1,
            status="pending",
            waste_type="plastic",
            user_id=1,
            resolved_at=None
        )
        mock_db.query.return_value.filter.return_value.first.return_value = mock_report

        # Mock del usuario
        mock_user = User(id=1, username="test", email="test@test.com",
                        hashed_password="hash", points=10)

        # Controla el orden de las llamadas
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_report,  # primera llamada → Report
            mock_user     # segunda llamada → User
        ]

        # Actualizar estado
        updated = ReportService.update_report_status(mock_db, 1, "resolved")

        # Verificar
        assert updated.status == "resolved"
        assert updated.resolved_at is not None
        mock_db.commit.assert_called()

    # ==================== PRUEBA 7: Clasificación Manual ====================

    def test_update_manual_classification(self, mock_db):
        """
        GIVEN: Un reporte clasificado automáticamente como "plastic"
        WHEN: El usuario corrige manualmente a "glass"
        THEN: Debe actualizarse waste_type y manual_classification
        """
        mock_report = Report(
            id=1,
            waste_type="plastic",
            manual_classification=None
        )
        mock_db.query.return_value.filter.return_value.first.return_value = mock_report

        # Corregir clasificación
        updated = ReportService.update_report_classification(
            db=mock_db,
            report_id=1,
            corrected_type="glass"
        )

        # Verificar
        assert updated.manual_classification == "glass"
        assert updated.waste_type == "glass"  # Se actualiza también el tipo activo
        mock_db.commit.assert_called()

    # ==================== PRUEBA 8: Recálculo de Prioridad ====================

    def test_recalculate_priority_updates_when_changed(self, mock_db):
        """
        GIVEN: Un reporte con prioridad=1
        WHEN: Se recalcula y la nueva prioridad es 3
        THEN: Debe actualizarse en la BD
        """
        mock_report = Report(
            id=1,
            waste_type="battery",  # Alta prioridad
            confidence_score=90.0,
            created_at=datetime.now(timezone.utc),
            priority=1  # Prioridad anterior incorrecta
        )
        mock_db.query.return_value.filter.return_value.first.return_value = mock_report

        with patch('app.services.report_service.PriorityService.calculate_priority') as mock_calc:
            mock_calc.return_value = (3, "High")  # Nueva prioridad calculada

            # Recalcular
            updated = ReportService.recalculate_priority(mock_db, 1)

            # Verificar
            assert updated.priority == 3
            mock_db.commit.assert_called()

    # ==================== PRUEBA 9: Recálculo Masivo ====================

    def test_recalculate_all_priorities(self, mock_db):
        """
        GIVEN: Múltiples reportes pendientes con prioridades desactualizadas
        WHEN: Se recalculan todas las prioridades
        THEN: Debe actualizar solo los que cambiaron
        """
        # Mock de reportes
        report1 = Report(id=1, priority=1, waste_type="battery", 
                        confidence_score=80, status="pending",
                        created_at=datetime.now(timezone.utc))
        report2 = Report(id=2, priority=2, waste_type="plastic", 
                        confidence_score=75, status="pending",
                        created_at=datetime.now(timezone.utc))

        query_mock = Mock()
        query_mock.filter.return_value = query_mock
        query_mock.all.return_value = [report1, report2]
        mock_db.query.return_value = query_mock

        with patch('app.services.report_service.PriorityService.calculate_priority') as mock_calc:
            # report1: cambia de 1 a 3
            # report2: se mantiene en 2
            mock_calc.side_effect = [(3, "High"), (2, "Medium")]

            result = ReportService.recalculate_all_priorities(mock_db)

            # Verificar
            assert result["total_checked"] == 2
            assert result["updated"] == 1  # Solo report1 cambió
            mock_db.commit.assert_called()

    # ==================== PRUEBA 10: Estadísticas de Prioridad ====================

    def test_get_priority_stats(self, mock_db):
        """
        GIVEN: Reportes con diferentes prioridades
        WHEN: Se consultan las estadísticas
        THEN: Debe retornar conteo por nivel de prioridad
        """
        # Mock de resultados de query
        stats_data = [(1, 5), (2, 3), (3, 2)]  # (priority, count)

        query_mock = Mock()
        query_mock.filter.return_value = query_mock
        query_mock.group_by.return_value = query_mock
        query_mock.all.return_value = stats_data

        mock_db.query.return_value = query_mock

        # Ejecutar
        stats = ReportService.get_priority_stats(mock_db)

        # Verificar
        assert stats["Low"] == 5
        assert stats["Medium"] == 3
        assert stats["High"] == 2