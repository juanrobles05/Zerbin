from fastapi import APIRouter, HTTPException, UploadFile, File
from app.services.ai_service import AIService

router = APIRouter()
ai_service = AIService()

@router.post("/classify/")
async def classify_waste_from_file(
    image: UploadFile = File(...)
):
    """Clasifica el residuo a partir de una imagen subida"""
    try:
        file_bytes = await image.read()
        result = ai_service.classify_waste(file_bytes)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clasificando imagen: {str(e)}")