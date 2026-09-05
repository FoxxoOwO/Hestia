from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.recipe import Recipe
from app.models.pantry import PantryItem
from app.models.user import User
from app.schemas.recipe import (
    RecipeCreate, RecipeUpdate, RecipeResponse, ScaledRecipeResponse, ScaledIngredientItem
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/recipes", tags=["Recipes"])

def match_ingredient_in_pantry(ing_name: str, pantry_items: List[PantryItem]):
    ing_clean = ing_name.lower().strip()
    for p in pantry_items:
        p_name = p.name.lower().strip()
        # Direct or substring match
        if p_name in ing_clean or ing_clean in p_name:
            return True, p.quantity
    return False, None

def format_recipe_response(recipe: Recipe) -> dict:
    d = {
        "id": recipe.id,
        "title": recipe.title,
        "description": recipe.description,
        "image_url": recipe.image_url,
        "prep_time_minutes": recipe.prep_time_minutes,
        "cook_time_minutes": recipe.cook_time_minutes,
        "total_time_minutes": (recipe.prep_time_minutes or 0) + (recipe.cook_time_minutes or 0),
        "difficulty": recipe.difficulty,
        "price_level": recipe.price_level,
        "default_servings": recipe.default_servings,
        "tags": recipe.tags or [],
        "utensils": recipe.utensils or [],
        "ingredients": recipe.ingredients or [],
        "instructions": recipe.instructions or [],
        "source_url": recipe.source_url,
        "is_favorite": recipe.is_favorite or False,
        "created_by_id": recipe.created_by_id,
        "created_at": recipe.created_at,
        "updated_at": recipe.updated_at,
    }
    return d

@router.get("", response_model=List[RecipeResponse])
def get_recipes(
    query: Optional[str] = Query(None, description="Search in title or description"),
    difficulty: Optional[str] = Query(None, description="easy, medium, hard"),
    price_level: Optional[str] = Query(None, description="low, medium, high"),
    max_time: Optional[int] = Query(None, description="Max total time in minutes"),
    tag: Optional[str] = Query(None, description="Tag/Category filter"),
    favorite_only: Optional[bool] = Query(False, description="Filter only favorites"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Recipe)

    if query:
        search = f"%{query.lower()}%"
        q = q.filter(or_(Recipe.title.ilike(search), Recipe.description.ilike(search)))

    if difficulty:
        q = q.filter(Recipe.difficulty == difficulty)

    if price_level:
        q = q.filter(Recipe.price_level == price_level)

    if favorite_only:
        q = q.filter(Recipe.is_favorite == True)

    recipes = q.order_by(Recipe.updated_at.desc()).all()

    # Filter in-memory for total_time and tag JSON fields (SQLite JSON portability)
    results = []
    for r in recipes:
        total = (r.prep_time_minutes or 0) + (r.cook_time_minutes or 0)
        if max_time and total > max_time:
            continue
        if tag:
            tags = [t.lower() for t in (r.tags or [])]
            if tag.lower() not in tags:
                continue
        results.append(format_recipe_response(r))

    return results

@router.get("/{recipe_id}", response_model=RecipeResponse)
def get_recipe(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recept nebyl nalezen")
    return format_recipe_response(recipe)

@router.post("", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
def create_recipe(
    recipe_in: RecipeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_recipe = Recipe(
        title=recipe_in.title,
        description=recipe_in.description,
        image_url=recipe_in.image_url,
        prep_time_minutes=recipe_in.prep_time_minutes,
        cook_time_minutes=recipe_in.cook_time_minutes,
        difficulty=recipe_in.difficulty,
        price_level=recipe_in.price_level,
        default_servings=recipe_in.default_servings,
        tags=recipe_in.tags,
        utensils=recipe_in.utensils,
        ingredients=[item.model_dump() for item in recipe_in.ingredients],
        instructions=[item.model_dump() for item in recipe_in.instructions],
        source_url=recipe_in.source_url,
        is_favorite=recipe_in.is_favorite,
        created_by_id=current_user.id
    )
    db.add(new_recipe)
    db.commit()
    db.refresh(new_recipe)
    return format_recipe_response(new_recipe)

@router.put("/{recipe_id}", response_model=RecipeResponse)
def update_recipe(
    recipe_id: int,
    recipe_in: RecipeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recept nebyl nalezen")

    update_data = recipe_in.model_dump(exclude_unset=True)
    if "ingredients" in update_data and update_data["ingredients"] is not None:
        update_data["ingredients"] = [item.model_dump() if hasattr(item, "model_dump") else item for item in recipe_in.ingredients]
    if "instructions" in update_data and update_data["instructions"] is not None:
        update_data["instructions"] = [item.model_dump() if hasattr(item, "model_dump") else item for item in recipe_in.instructions]

    for key, value in update_data.items():
        setattr(recipe, key, value)

    db.commit()
    db.refresh(recipe)
    return format_recipe_response(recipe)

@router.delete("/{recipe_id}")
def delete_recipe(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recept nebyl nalezen")
    db.delete(recipe)
    db.commit()
    return {"status": "success", "message": "Recept byl úspěšně smazán"}

@router.post("/{recipe_id}/toggle-favorite", response_model=RecipeResponse)
def toggle_favorite(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recept nebyl nalezen")
    recipe.is_favorite = not recipe.is_favorite
    db.commit()
    db.refresh(recipe)
    return format_recipe_response(recipe)

@router.get("/{recipe_id}/scale", response_model=ScaledRecipeResponse)
def scale_recipe_servings(
    recipe_id: int,
    servings: int = Query(..., ge=1, le=50, description="Cílový počet porcí"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recept nebyl nalezen")

    default_servings = recipe.default_servings or 4
    scale_factor = servings / default_servings

    pantry_items = db.query(PantryItem).all()
    scaled_ingredients = []

    for ing in (recipe.ingredients or []):
        orig_amount = float(ing.get("amount", 1.0))
        scaled_amount = round(orig_amount * scale_factor, 2)
        # Format whole floats cleanly e.g. 2.0 -> 2
        if scaled_amount.is_integer():
            scaled_amount = float(int(scaled_amount))

        is_in_stock, p_qty = match_ingredient_in_pantry(ing.get("name", ""), pantry_items)
        scaled_ingredients.append(
            ScaledIngredientItem(
                name=ing.get("name", ""),
                original_amount=orig_amount,
                scaled_amount=scaled_amount,
                unit=ing.get("unit", "ks"),
                note=ing.get("note"),
                category=ing.get("category", "other"),
                is_in_pantry=is_in_stock,
                pantry_amount=p_qty
            )
        )

    return ScaledRecipeResponse(
        recipe=format_recipe_response(recipe),
        target_servings=servings,
        scale_factor=round(scale_factor, 2),
        scaled_ingredients=scaled_ingredients
    )
