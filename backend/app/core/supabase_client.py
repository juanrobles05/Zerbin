from supabase import create_client
from decouple import config

# Leer variables del .env
SUPABASE_URL: str = config("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY: str = config("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_BUCKET_NAME: str = config("SUPABASE_BUCKET_NAME", default="reports")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)