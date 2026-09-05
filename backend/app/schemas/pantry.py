from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class PantryItemBase(BaseModel):
    name: str
    category: str = "pantry"  # fridge, freezer, pantry, produce, spices, bakery, other
    quantity: float = 1.0
    unit: str = "ks"
    expiration_date: Optional[str] = None  # YYYY-MM-DD
    min_quantity: Optional[float] = None
    note: Optional[str] = None

class PantryItemCreate(PantryItemBase):
    pass

class PantryItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    expiration_date: Optional[str] = None
    min_quantity: Optional[float] = None
    note: Optional[str] = None

class PantryItemResponse(PantryItemBase):
    id: int
    updated_at: datetime
    status: str = "fresh"  # fresh, expiring_soon (within 3 days), expired

    class Config:
        from_attributes = True

class RecipeMatchIngredient(BaseModel):
    ingredient_name: str
    required_amount: float
    unit: str
    available_in_pantry: bool
    pantry_quantity: Optional[float] = None

class RecipePantryMatch(BaseModel):
    recipe_id: int
    recipe_title: str
    total_ingredients_count: int
    matched_ingredients_count: int
    missing_ingredients_count: int
    match_percentage: float
    missing_ingredients: List[RecipeMatchIngredient]
    can_cook_now: bool
