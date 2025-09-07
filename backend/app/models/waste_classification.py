from transformers import pipeline
from PIL import Image
import io

class WasteClassifier:
    def __init__(self):
        # Carga el modelo de clasificación al iniciar (para eficiencia)
        self.classifier = pipeline("image-classification", model="prithivMLmods/Trash-Net")

    def classify(self, image_data):
        # Convierte los datos de imagen a un objeto PIL
        img = Image.open(io.BytesIO(image_data))
        # Obtiene la predicción
        results = self.classifier(img)
        top_result = results[0]  # Toma el resultado con mayor confianza
        return {
            "type": top_result['label'],
            "confidence": round(top_result['score'] * 100, 2)  # En porcentaje
        }