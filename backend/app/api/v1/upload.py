from fastapi import APIRouter, HTTPException, UploadFile, File
from app.services.ai_service import AIService
import asyncio

router = APIRouter()
ai_service = AIService()


@router.post("/classify/")
async def classify_waste_from_file(
    image: UploadFile = File(...)
):
    """Clasifica el residuo a partir de una imagen subida.

    Ejecuta la clasificación en un hilo (asyncio.to_thread) para no bloquear
    el event loop de FastAPI/uvicorn cuando el modelo hace trabajo pesado.
    """
    try:
        file_bytes = await image.read()
        # run CPU-bound or blocking classification in a thread
        result = await asyncio.to_thread(ai_service.classify_waste, file_bytes)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clasificando imagen: {str(e)}")