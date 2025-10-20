from transformers import pipeline
from PIL import Image
import io
import threading
from app.core.config import settings

class AIService:
    """Servicio de clasificación IA (carga perezosa y segura para hilos)."""

    _lock = threading.Lock()
    _pipeline = None  # modelo compartido entre instancias

    def __init__(self):
        # No cargar el modelo en la inicialización para permitir lazy-loading en tests.
        # Cada instancia mantiene una bandera indicando si "ha solicitado" el pipeline.
        self._owns_pipeline = False

    @property
    def classifier(self):
        """Retorna el pipeline solo si esta instancia ya lo 'posee' (lo pidió)."""
        return AIService._pipeline if self._owns_pipeline else None

    @classmethod
    def _ensure_pipeline_loaded(cls, instance: "AIService"):
        """Carga el pipeline (una vez) y marca la instancia como poseedora."""
        # Fast path: si ya está cargado, simplemente marcar la instancia
        if cls._pipeline is not None:
            instance._owns_pipeline = True
            return

        with cls._lock:
            if cls._pipeline is None:
                cls._pipeline = pipeline(
                    "image-classification",
                    model=settings.AI_MODEL_ID,
                    device="cpu",
                    use_fast=True
                )
            # marcar la instancia que solicitó la carga
            instance._owns_pipeline = True

    def classify_waste(self, image_data: bytes):
        """Clasifica una imagen de residuo y devuelve tipo y confianza."""
        try:
            img = Image.open(io.BytesIO(image_data)).convert("RGB")
        except Exception as e:
            raise ValueError("Imagen inválida o corrupta") from e

        # Lazy-load seguro para hilos: cargar solo cuando se necesita y marcar la instancia.
        AIService._ensure_pipeline_loaded(self)

        if self.classifier is None:
            raise RuntimeError("El modelo IA no se pudo inicializar")

        # Realiza la clasificación
        results = self.classifier(img)
        top_result = results[0]

        return {
            "type": top_result["label"],
            "confidence": round(top_result["score"] * 100, 2),
        }