from transformers import pipeline
from PIL import Image
import io
from app.core.config import settings


class AIService:
    """Servicio de clasificación IA.

    Nota: el modelo se carga de forma perezosa (lazy) en la primera invocación
    para evitar bloqueos durante el import/module init del servidor.
    """
    def __init__(self):
        self.classifier = None

    def _load_model(self):
        # carga pesada; se ejecutará en hilo si se invoca desde un endpoint async
        if self.classifier is None:
            self.classifier = pipeline("image-classification", model=settings.AI_MODEL_ID)

    def classify_waste(self, image_data: bytes):
        """
        Clasifica una imagen de residuo y devuelve tipo y confianza.
        :param image_data: bytes de la imagen subida
        :return: dict con {type, confidence}
        """
        try:
            img = Image.open(io.BytesIO(image_data)).convert("RGB")
        except Exception as e:
            raise ValueError("Imagen inválida o corrupta") from e

        # asegúrate de que el modelo esté cargado (puede ser costoso)
        if self.classifier is None:
            self._load_model()

        # Ejecutar clasificación
        results = self.classifier(img)
        top_result = results[0]  # El de mayor confianza

        return {
            "type": top_result['label'],
            "confidence": round(top_result['score'] * 100, 2)  # en porcentaje
        }