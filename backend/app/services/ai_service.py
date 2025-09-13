from transformers import pipeline
from PIL import Image
import io

class AIService:
    def __init__(self):
        # Carga el modelo de HuggingFace solo una vez
        self.classifier = pipeline("image-classification", model="prithivMLmods/Trash-Net")

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

        # Ejecutar clasificación
        results = self.classifier(img)
        top_result = results[0]  # El de mayor confianza

        return {
            "type": top_result['label'],
            "confidence": round(top_result['score'] * 100, 2)  # en porcentaje
        }