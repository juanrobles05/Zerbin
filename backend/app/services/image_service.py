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
        # === Validar tamaño ===
        size_mb = len(file_bytes) / (1024 * 1024)
        if size_mb > max_size_mb:
            raise ValueError(f"La imagen supera el tamaño máximo de {max_size_mb}MB")

        # === Validar extensión ===
        file_ext = original_filename.split('.')[-1].lower()
        allowed_exts = ["jpg", "jpeg", "png", "webp"]
        if file_ext not in allowed_exts:
            raise ValueError(f"Extensión de imagen no permitida: .{file_ext}")

        # === Comprimir imagen y crear archivo temporal ===
        try:
            img = Image.open(io.BytesIO(file_bytes)).convert("RGB")

            # Crear archivo temporal y guardar la imagen comprimida
            with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_file:
                img.save(temp_file.name, format="JPEG", quality=quality)
                temp_path = temp_file.name  # Guardar ruta antes de cerrar

        except Exception as e:
            raise ValueError("No se pudo procesar la imagen para compresión") from e

        # === Crear nombre único para la imagen ===
        timestamp = int(time.time())
        file_name = f"{timestamp}_{uuid.uuid4().hex[:8]}.jpg"

        # === Subir a Supabase ===
        try:
            # Se pasa el path, no el archivo abierto
            response = supabase.storage.from_(bucket).upload(file_name, temp_path)
        except Exception as e:
            raise ValueError(f"Error subiendo la imagen a Supabase: {e}")
        finally:
            # Esperar un poco y eliminar el archivo si aún existe
            try:
                if os.path.exists(temp_path):
                    time.sleep(0.1)  # pequeño delay para que Windows libere el archivo
                    os.remove(temp_path)
            except Exception as e:
                print(f"⚠️ Advertencia: No se pudo eliminar el archivo temporal ({temp_path}): {e}")

        # === Verificar respuesta de Supabase ===
        if isinstance(response, dict) and response.get("error"):
            raise ValueError(f"Error subiendo la imagen a Supabase: {response['error']}")

        # === Obtener la URL pública ===
        public_url = supabase.storage.from_(bucket).get_public_url(file_name)
        return public_url
