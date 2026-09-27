import datetime
from typing import Optional, List
from pydantic import BaseModel

class MealPlanItemBase(BaseModel):
    date: str  # YYYY-MM-DD
    meal_type: str = "dinner"  # breakfast, lunch, dinner, snack
    recipe_id: Optional[int] = None
    custom_title: Optional[str] = None
    servings: int = 4
    notes: Optional[str] = None
    is_cooked: bool = False

class MealPlanItemCreate(MealPlanItemBase):
    pass

class MealPlanItemUpdate(BaseModel):
    date: Optional[str] = None
    meal_type: Optional[str] = None
    recipe_id: Optional[int] = None
    custom_title: Optional[str] = None
    servings: Optional[int] = None
    notes: Optional[str] = None
    is_cooked: Optional[bool] = None

class MealPlanItemResponse(MealPlanItemBase):
    id: int
    created_by_id: Optional[int] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    
    # Enriched recipe info for UI convenience
    recipe_title: Optional[str] = None
    recipe_image_url: Optional[str] = None
    recipe_prep_time: Optional[int] = None
    recipe_cook_time: Optional[int] = None
    recipe_difficulty: Optional[str] = None

    class Config:
        from_attributes = True

class GenerateShoppingRequest(BaseModel):
    start_date: str
    end_date: str
    check_pantry: bool = True

class GenerateShoppingResponse(BaseModel):
    added_items_count: int
    already_in_pantry_count: int
    added_items: List[str]
