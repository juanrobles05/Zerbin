from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError
import logging
import os

from app.core.config import settings

# Use the single shared Base from app.models.base so all models
# register on the same metadata. Some tests and modules call
# Base.metadata.create_all(bind=engine) expecting this behaviour.
from app.models.base import Base

logger = logging.getLogger(__name__)

# Helper to create engine with SQLite-specific args when needed
def _create_engine_from_url(db_url: str):
    if db_url.startswith("sqlite:"):
        # For sqlite, allow check_same_thread for local dev
        return create_engine(db_url, connect_args={"check_same_thread": False})
    return create_engine(db_url, pool_pre_ping=True, pool_recycle=3600)


# Try to use configured DATABASE_URL. If connection fails (e.g. remote DB creds
# invalid or network issues), fall back to a local sqlite file for development.
database_url = getattr(settings, 'DATABASE_URL', None) or os.getenv('DATABASE_URL')
if not database_url:
    logger.warning("No DATABASE_URL configured; falling back to local sqlite database './dev.db' for development.")
    database_url = 'sqlite:///./dev.db'

try:
    engine = _create_engine_from_url(database_url)
    # Test connection immediately for early failure detection
    with engine.connect() as conn:
        pass
except OperationalError as e:
    logger.warning("Could not connect to configured database (%s). Falling back to local sqlite. Error: %s", database_url, e)
    database_url = 'sqlite:///./dev.db'
    engine = _create_engine_from_url(database_url)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()