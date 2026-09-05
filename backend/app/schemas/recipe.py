from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class IngredientItem(BaseModel):
    name: str
    amount: float = 1.0
    unit: str = "ks"
    note: Optional[str] = None
    category: Optional[str] = "other"  # produce, dairy, meat, pantry, spices, bakery, other

class InstructionStep(BaseModel):
    step: int
    text: str
    timer_minutes: Optional[int] = None

class RecipeBase(BaseModel):
    title: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    prep_time_minutes: int = 15
    cook_time_minutes: int = 30
    difficulty: str = "medium"  # easy, medium, hard
    price_level: str = "medium"  # low, medium, high
    default_servings: int = 4
    tags: List[str] = Field(default_factory=list)
    utensils: List[str] = Field(default_factory=list)
    ingredients: List[IngredientItem] = Field(default_factory=list)
    instructions: List[InstructionStep] = Field(default_factory=list)
    source_url: Optional[str] = None
    is_favorite: bool = False

class RecipeCreate(RecipeBase):
    pass

class RecipeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    prep_time_minutes: Optional[int] = None
    cook_time_minutes: Optional[int] = None
    difficulty: Optional[str] = None
    price_level: Optional[str] = None
    default_servings: Optional[int] = None
    tags: Optional[List[str]] = None
    utensils: Optional[List[str]] = None
    ingredients: Optional[List[IngredientItem]] = None
    instructions: Optional[List[InstructionStep]] = None
    source_url: Optional[str] = None
    is_favorite: Optional[bool] = None

class RecipeResponse(RecipeBase):
    id: int
    total_time_minutes: int = 0
    created_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ScaledIngredientItem(BaseModel):
    name: str
    original_amount: float
    scaled_amount: float
    unit: str
    note: Optional[str] = None
    category: Optional[str] = "other"
    is_in_pantry: bool = False
    pantry_amount: Optional[float] = None

class ScaledRecipeResponse(BaseModel):
    recipe: RecipeResponse
    target_servings: int
    scale_factor: float
    scaled_ingredients: List[ScaledIngredientItem]
