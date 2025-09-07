from app.models.waste_classification import WasteClassifier

class AIService:
    def __init__(self):
        self.classifier = WasteClassifier()

    async def classify_waste(self, image_data):
        return self.classifier.classify(image_data)