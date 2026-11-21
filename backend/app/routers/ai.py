import base64
import binascii
import logging
import os
from fastapi import APIRouter, Depends, HTTPException, Request, status, UploadFile, File, Form
from app.config import settings
from app.utils.uploads import read_upload, RECIPE_EXT, MAX_UPLOAD_BYTES
from app.models.user import User
from app.schemas.gemini import (
    GeminiImportRequest, GeminiExtractedRecipe,
    RecipeFileImportResponse, GeminiBase64FileImportRequest
)
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
from app.utils.ingredient_parser import sanitize_ingredients
from app.utils.rate_limit import check_ai_quota, register_ai_use

logger = logging.getLogger(__name__)


async def _ai_quota_guard(request: Request, current_user: User = Depends(get_current_user)) -> User:
    """Omezí počet drahých Gemini volání na uživatele (20/hodinu)."""
    if request.method == "POST":
        if not settings.GEMINI_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Gemini API klíč není nakonfigurován. Nastavte GEMINI_API_KEY v .env.",
            )
        key = f"ai|{current_user.id}"
        check_ai_quota(key)
        register_ai_use(key)
    return current_user


router = APIRouter(
    prefix="/ai",
    tags=["Gemini AI Assistant"],
    dependencies=[Depends(_ai_quota_guard)],
)

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
        extracted.ingredients = sanitize_ingredients(extracted.ingredients)
        return extracted
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        logger.exception("Gemini recipe import failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Zpracování receptu pomocí Gemini AI se nepodařilo. Zkuste to prosím později."
        )

@router.post("/import-recipe-file", response_model=RecipeFileImportResponse)
async def import_recipe_from_file(
    file: UploadFile = File(...),
    target_language: str = Form("cs"),
    current_user: User = Depends(get_current_user)
):
    try:
        orig_name, _, content = await read_upload(file, RECIPE_EXT)

        service = GeminiRecipeService(api_key=settings.GEMINI_API_KEY)
        recipes = await service.parse_recipe_file(
            file_bytes=content,
            filename=orig_name or "recept.txt",
            content_type=file.content_type,
            target_language=target_language or current_user.preferred_language or "cs"
        )
        for r in recipes:
            r.ingredients = sanitize_ingredients(r.ingredients)
        return RecipeFileImportResponse(
            recipes=recipes,
            total=len(recipes),
            filename=orig_name or "recept"
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception("Gemini recipe file import failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Zpracování souboru s receptem se nepodařilo."
        )

@router.post("/import-recipe-base64", response_model=RecipeFileImportResponse)
async def import_recipe_from_base64(
    req: GeminiBase64FileImportRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        clean_name = os.path.basename((req.filename or "recept.txt").replace("\\", "/")) or "recept.txt"
        ext = os.path.splitext(clean_name)[1].lower()
        if ext and ext not in RECIPE_EXT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Nepodporovaný typ souboru ({ext}).",
            )

        clean_b64 = req.file_base64
        if "," in clean_b64:
            clean_b64 = clean_b64.split(",", 1)[1]

        if len(clean_b64) > (MAX_UPLOAD_BYTES * 4) // 3 + 64:
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail=f"Soubor je příliš velký (limit {MAX_UPLOAD_BYTES // (1024 * 1024)} MB).",
            )

        try:
            file_bytes = base64.b64decode(clean_b64, validate=True)
        except (binascii.Error, ValueError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Neplatný Base64 obsah souboru.",
            )

        if len(file_bytes) > MAX_UPLOAD_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail=f"Soubor je příliš velký (limit {MAX_UPLOAD_BYTES // (1024 * 1024)} MB).",
            )
        if not file_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Obsah souboru v Base64 je prázdný."
            )

        service = GeminiRecipeService(api_key=settings.GEMINI_API_KEY)
        recipes = await service.parse_recipe_file(
            file_bytes=file_bytes,
            filename=clean_name,
            target_language=req.target_language or current_user.preferred_language or "cs"
        )
        for r in recipes:
            r.ingredients = sanitize_ingredients(r.ingredients)
        return RecipeFileImportResponse(
            recipes=recipes,
            total=len(recipes),
            filename=clean_name
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception("Gemini base64 recipe import failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Zpracování Base64 souboru s receptem se nepodařilo."
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
    except Exception:
        logger.exception("Gemini plant analysis failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Botanická analýza rostliny se nepodařila."
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
    except Exception:
        logger.exception("Gemini plant diagnosis failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Diagnostika rostliny se nepodařila."
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
    except Exception:
        logger.exception("Gemini food safety check failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Kontrola bezpečnosti potraviny se nepodařila."
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
    except Exception:
        logger.exception("Gemini vet consultation failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Veterinární konzultace se nepodařila."
        )

