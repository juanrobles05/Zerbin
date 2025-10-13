# Archivo de configuración del cliente de Supabase
from supabase import create_client
from app.core.config import settings

# Leer variables del .env
SUPABASE_URL: str = settings.SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY: str = settings.SUPABASE_SERVICE_ROLE_KEY
SUPABASE_BUCKET_NAME: str = settings.SUPABASE_BUCKET_NAME

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)