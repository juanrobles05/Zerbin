from transformers import pipeline
from PIL import Image
import io
import threading
from app.core.config import settings
from time import time


class AIService:
    """Servicio de clasificación IA (carga perezosa y segura para hilos)."""

    _lock = threading.Lock()
    _pipeline = None  # modelo compartido entre instancias

    def __init__(self):
        # Inicialización perezosa (solo una vez)
        with self._lock:
            if AIService._pipeline is None:
                print("⚙️ Cargando modelo IA (solo una vez)...")
                AIService._pipeline = pipeline(
                    "image-classification",
                    model=settings.AI_MODEL_ID,
                    device="cpu",
                    use_fast=True
                )

    @property
    def classifier(self):
        """Retorna el pipeline ya cargado (thread-safe)."""
        return self._pipeline

    def classify_waste(self, image_data: bytes):
        """Clasifica una imagen de residuo y devuelve tipo y confianza."""
        try:
            img = Image.open(io.BytesIO(image_data)).convert("RGB")
        except Exception as e:
            raise ValueError("Imagen inválida o corrupta") from e

        if self.classifier is None:
            raise RuntimeError("El modelo IA no está inicializado correctamente")

        # Realiza la clasificación
        results = self.classifier(img)
        top_result = results[0]

        return {
            "type": top_result["label"],
            "confidence": round(top_result["score"] * 100, 2),
        }