from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class ShoppingItemBase(BaseModel):
    name: str
    amount: Optional[float] = None
    unit: Optional[str] = None
    category: str = "other"  # dairy, produce, meat, pantry, bakery, beverages, household, other
    is_checked: bool = False
    recipe_id: Optional[int] = None

class ShoppingItemCreate(ShoppingItemBase):
    pass

class ShoppingItemUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[float] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    is_checked: Optional[bool] = None

class ShoppingItemResponse(ShoppingItemBase):
    id: int
    added_by_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AddFromRecipeIngredient(BaseModel):
    name: str
    amount: Optional[float] = None
    unit: Optional[str] = None
    category: Optional[str] = "other"

class AddRecipeToShoppingRequest(BaseModel):
    recipe_id: int
    ingredients: List[AddFromRecipeIngredient]
