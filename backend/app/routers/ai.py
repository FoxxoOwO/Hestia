from fastapi import APIRouter, Depends, HTTPException, status
from app.config import settings
from app.models.user import User
from app.schemas.gemini import GeminiImportRequest, GeminiExtractedRecipe
from app.schemas.plant import (
    PlantAiAnalyzeRequest, PlantAiExtracted,
    PlantDiagnosisRequest, PlantDiagnosisResponse
)
from app.schemas.pet import (
    PetFoodSafetyCheckRequest, PetFoodSafetyCheckResponse,
    PetSymptomCheckRequest, PetSymptomCheckResponse
)
from app.services.gemini_service import GeminiRecipeService
from app.services.gemini_plant_service import GeminiPlantService
from app.services.gemini_pet_service import GeminiPetService
from app.utils.auth import get_current_user

router = APIRouter(prefix="/ai", tags=["Gemini AI Assistant"])

@router.get("/status")
def get_ai_status(current_user: User = Depends(get_current_user)):
    return {
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "model": "gemini-3.7-flash"
    }

@router.post("/import-recipe", response_model=GeminiExtractedRecipe)
async def import_recipe_with_gemini(
    req: GeminiImportRequest,
    current_user: User = Depends(get_current_user)
):
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Gemini API klíč není nakonfigurován. Nastavte prosím GEMINI_API_KEY v .env souboru nebo proměnných prostředí."
        )

    if not req.url and not req.raw_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Musíte zadat buď URL adresu webu nebo vložit text receptu."
        )

    try:
        service = GeminiRecipeService(api_key=settings.GEMINI_API_KEY)
        extracted = await service.parse_recipe(
            url=req.url,
            raw_text=req.raw_text,
            target_language=req.target_language or current_user.preferred_language or "cs"
        )
        return extracted
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chyba při zpracování receptu pomocí Gemini AI: {str(e)}"
        )

@router.post("/analyze-plant", response_model=PlantAiExtracted)
async def analyze_plant_with_gemini(
    req: PlantAiAnalyzeRequest,
    current_user: User = Depends(get_current_user)
):
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Gemini API klíč není nakonfigurován. Nastavte prosím GEMINI_API_KEY v .env souboru."
        )

    if not req.plant_name and not req.image_base64 and not req.image_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Zadejte název rostliny nebo nahrajte její fotografii."
        )

    try:
        service = GeminiPlantService(api_key=settings.GEMINI_API_KEY)
        result = await service.analyze_plant(
            plant_name=req.plant_name,
            image_base64=req.image_base64,
            image_url=req.image_url,
            target_language=req.target_language or current_user.preferred_language or "cs"
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chyba při botanické analýze rostliny přes Gemini AI: {str(e)}"
        )

@router.post("/diagnose-plant-health", response_model=PlantDiagnosisResponse)
async def diagnose_plant_health_with_gemini(
    req: PlantDiagnosisRequest,
    current_user: User = Depends(get_current_user)
):
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Gemini API klíč není nakonfigurován. Nastavte prosím GEMINI_API_KEY v .env souboru."
        )

    if not req.symptoms_description and not req.image_base64:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Popište příznaky problému nebo přiložte fotografii poškozeného listu/stonku."
        )

    try:
        service = GeminiPlantService(api_key=settings.GEMINI_API_KEY)
        result = await service.diagnose_health(
            symptoms_description=req.symptoms_description,
            plant_name=req.plant_name,
            image_base64=req.image_base64,
            image_url=req.image_url,
            target_language=req.target_language or current_user.preferred_language or "cs"
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chyba při diagnostice rostliny přes AI Doktora: {str(e)}"
        )


@router.post("/check-pet-food-safety", response_model=PetFoodSafetyCheckResponse)
async def check_pet_food_safety_with_gemini(
    req: PetFoodSafetyCheckRequest,
    current_user: User = Depends(get_current_user)
):
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Gemini API klíč není nakonfigurován. Nastavte prosím GEMINI_API_KEY v .env souboru."
        )

    if not req.food_name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Zadejte název potraviny pro kontrolu bezpečnosti."
        )

    try:
        service = GeminiPetService(api_key=settings.GEMINI_API_KEY)
        result = await service.check_food_safety(
            species=req.species,
            food_name=req.food_name.strip(),
            target_language=req.target_language or current_user.preferred_language or "cs"
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chyba při kontrole bezpečnosti potraviny přes Gemini AI: {str(e)}"
        )


@router.post("/diagnose-pet-symptoms", response_model=PetSymptomCheckResponse)
async def diagnose_pet_symptoms_with_gemini(
    req: PetSymptomCheckRequest,
    current_user: User = Depends(get_current_user)
):
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Gemini API klíč není nakonfigurován. Nastavte prosím GEMINI_API_KEY v .env souboru."
        )

    if not req.symptoms_description and not req.image_base64:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Popište příznaky zdravotních potíží nebo nahrajte fotografii."
        )

    try:
        service = GeminiPetService(api_key=settings.GEMINI_API_KEY)
        result = await service.diagnose_symptoms(
            symptoms_description=req.symptoms_description,
            pet_species=req.pet_species,
            pet_name=req.pet_name,
            pet_age=req.pet_age,
            image_base64=req.image_base64,
            image_url=req.image_url,
            target_language=req.target_language or current_user.preferred_language or "cs"
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chyba při veterinární konzultaci přes Gemini AI: {str(e)}"
        )

