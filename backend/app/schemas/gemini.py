from typing import List, Optional
from pydantic import BaseModel, HttpUrl
from app.schemas.recipe import IngredientItem, InstructionStep

class GeminiImportRequest(BaseModel):
    url: Optional[str] = None
    raw_text: Optional[str] = None
    target_language: Optional[str] = "cs"  # cs or en

class GeminiExtractedRecipe(BaseModel):
    title: str
    description: Optional[str] = ""
    image_url: Optional[str] = ""
    prep_time_minutes: int = 15
    cook_time_minutes: int = 30
    difficulty: str = "medium"  # easy, medium, hard
    price_level: str = "medium"  # low, medium, high
    default_servings: int = 4
    tags: List[str] = []
    utensils: List[str] = []
    ingredients: List[IngredientItem] = []
    instructions: List[InstructionStep] = []
    source_url: Optional[str] = None

class GeminiBatchExtractedRecipes(BaseModel):
    recipes: List[GeminiExtractedRecipe] = []

class RecipeFileImportResponse(BaseModel):
    recipes: List[GeminiExtractedRecipe] = []
    total: int = 0
    filename: str = ""

class GeminiBase64FileImportRequest(BaseModel):
    file_base64: str
    filename: str
    target_language: Optional[str] = "cs"
