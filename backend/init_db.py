"""
Script para inicializar la base de datos con datos de clasificación de residuos
y priorización por tiempo de descomposición.
"""

from app.core.database import engine, SessionLocal
from app.models.base import Base
from app.models.waste_classification import WasteClassification
from app.services.priority_service import PriorityService
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_database():
    """Inicializa la base de datos con tablas y datos por defecto"""
    
    # Crear todas las tablas
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Tablas de la base de datos creadas")
    
    # Inicializar datos de clasificación de residuos
    db = SessionLocal()
    try:
        priority_service = PriorityService(db)
        logger.info("✅ Datos de clasificación de residuos inicializados")
        
        # Verificar que los datos se insertaron correctamente
        classifications = priority_service.get_all_classifications()
        logger.info(f"✅ {len(classifications)} clasificaciones de residuos disponibles:")
        
        for classification in classifications:
            priority_label = {1: "BAJA", 2: "MEDIA", 3: "ALTA"}[classification.priority_level]
            logger.info(f"  - {classification.waste_type}: {classification.decomposition_time_days} días (Prioridad {priority_label})")
            
    except Exception as e:
        logger.error(f"❌ Error inicializando datos: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_database()
    logger.info("🎉 Base de datos inicializada correctamente")