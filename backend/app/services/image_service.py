from PIL import Image
import io
import uuid
import time
import tempfile
import os
from app.core.supabase_client import supabase
from app.core.config import settings

class ImageService:
    async def upload_to_supabase(
        self,
        file_bytes: bytes,
        original_filename: str,
        bucket: str = settings.SUPABASE_BUCKET_NAME,
        quality: int = settings.IMAGE_QUALITY,
        max_size_mb: int = settings.IMAGE_MAX_SIZE_MB,
    ):
        """
        Valida, comprime y sube la imagen a Supabase Storage. Retorna la URL pública.
        """
        # Validar tamaño
        size_mb = len(file_bytes) / (1024 * 1024)
        if size_mb > max_size_mb:
            raise ValueError(f"La imagen supera el tamaño máximo de {max_size_mb}MB")

        # Validar extensión
        file_ext = original_filename.split('.')[-1].lower()
        allowed_exts = ["jpg", "jpeg", "png", "webp"]
        if file_ext not in allowed_exts:
            raise ValueError(f"Extensión de imagen no permitida: .{file_ext}")

        # Comprimir imagen y crear archivo temporal
        try:
            img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
            img.save(temp_file.name, format="JPEG", quality=quality)
        except Exception as e:
            raise ValueError("No se pudo procesar la imagen para compresión") from e

        # Crear nombre único para la imagen
        timestamp = int(time.time())
        file_name = f"{timestamp}_{uuid.uuid4().hex[:8]}.jpg"

        # Subir a Supabase usando la ruta del archivo temporal
        try:
            response = supabase.storage.from_(bucket).upload(file_name, temp_file.name)
        finally:
            temp_file.close()
            os.remove(temp_file.name)

        # Manejo de errores en la respuesta de Supabase
        if isinstance(response, dict) and response.get("error"):
            raise ValueError(f"Error subiendo la imagen a Supabase: {response['error']}")

        # Obtener la URL pública de la imagen subida
        public_url = supabase.storage.from_(bucket).get_public_url(file_name)
        return public_url