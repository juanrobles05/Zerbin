"""
Script de migración para agregar el sistema de notificaciones
"""
from app.core.database import engine
from app.models.base import Base
from app.models.notification import Notification
from app.models.report import Report
from app.models.user import User
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate_database():
    """Crear las nuevas tablas de notificaciones"""
    try:
        # Crear todas las tablas (solo las nuevas se crearán)
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Migración completada: Tablas de notificaciones creadas")
        
    except Exception as e:
        logger.error(f"❌ Error en migración: {e}")
        raise

if __name__ == "__main__":
    migrate_database()
    logger.info("🎉 Sistema de notificaciones listo para usar")