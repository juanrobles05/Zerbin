import os
from PIL import Image
import io
import uuid

UPLOAD_DIR = "uploads"

class ImageService:
    def __init__(self):
        os.makedirs(UPLOAD_DIR, exist_ok=True)  # Crea carpeta si no existe

    def save_image(self, image_data: bytes, filename: str = None):
        """
        Guarda la imagen en disco y devuelve la ruta.
        """
        if not filename:
            filename = f"{uuid.uuid4().hex}.jpg"  # Nombre único

        file_path = os.path.join(UPLOAD_DIR, filename)

        try:
            img = Image.open(io.BytesIO(image_data))
            img = img.convert("RGB")  # Normaliza
            img.save(file_path, format="JPEG")
        except Exception as e:
            raise ValueError("No se pudo procesar la imagen") from e

        return file_path

    def validate_image(self, image_data: bytes, max_size_mb: int = 5):
        """
        Valida tamaño y formato de la imagen.
        """
        size_mb = len(image_data) / (1024 * 1024)
        if size_mb > max_size_mb:
            raise ValueError(f"La imagen supera el tamaño máximo de {max_size_mb}MB")

        try:
            Image.open(io.BytesIO(image_data))
        except Exception:
            raise ValueError("El archivo no es una imagen válida")

        return True