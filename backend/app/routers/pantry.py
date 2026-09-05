import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.pantry import PantryItem
from app.models.recipe import Recipe
from app.models.user import User
from app.schemas.pantry import (
    PantryItemCreate, PantryItemUpdate, PantryItemResponse,
    RecipePantryMatch, RecipeMatchIngredient
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/pantry", tags=["Pantry & Food Tracking"])

def compute_pantry_status(expiration_date_str: Optional[str]) -> str:
    if not expiration_date_str:
        return "fresh"
    try:
        exp_date = datetime.date.fromisoformat(expiration_date_str)
        today = datetime.date.today()
        if exp_date < today:
            return "expired"
        elif exp_date <= today + datetime.timedelta(days=3):
            return "expiring_soon"
        else:
            return "fresh"
    except Exception:
        return "fresh"

def format_pantry_response(item: PantryItem) -> dict:
    return {
        "id": item.id,
        "name": item.name,
        "category": item.category,
        "quantity": item.quantity,
        "unit": item.unit,
        "expiration_date": item.expiration_date,
        "min_quantity": item.min_quantity,
        "note": item.note,
        "updated_at": item.updated_at,
        "status": compute_pantry_status(item.expiration_date)
    }

@router.get("", response_model=List[PantryItemResponse])
def get_pantry_items(
    category: Optional[str] = Query(None, description="fridge, freezer, pantry, produce, spices, bakery, other"),
    status_filter: Optional[str] = Query(None, description="fresh, expiring_soon, expired"),
    query: Optional[str] = Query(None, description="Search item name"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(PantryItem)
    if category:
        q = q.filter(PantryItem.category == category)
    if query:
        q = q.filter(PantryItem.name.ilike(f"%{query.lower()}%"))

    items = q.order_by(PantryItem.name.asc()).all()
    results = [format_pantry_response(item) for item in items]

    if status_filter:
        results = [r for r in results if r["status"] == status_filter]

    return results

@router.post("", response_model=PantryItemResponse, status_code=status.HTTP_201_CREATED)
def create_pantry_item(
    item_in: PantryItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = PantryItem(
        name=item_in.name,
        category=item_in.category,
        quantity=item_in.quantity,
        unit=item_in.unit,
        expiration_date=item_in.expiration_date,
        min_quantity=item_in.min_quantity,
        note=item_in.note
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return format_pantry_response(item)

@router.put("/{item_id}", response_model=PantryItemResponse)
def update_pantry_item(
    item_id: int,
    item_in: PantryItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(PantryItem).filter(PantryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Položka nebyla nalezena")

    update_data = item_in.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(item, key, val)

    db.commit()
    db.refresh(item)
    return format_pantry_response(item)

@router.delete("/{item_id}")
def delete_pantry_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(PantryItem).filter(PantryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Položka nebyla nalezena")
    db.delete(item)
    db.commit()
    return {"status": "success", "message": "Položka byla smazána"}

@router.get("/match-recipes", response_model=List[RecipePantryMatch])
def match_recipes_with_pantry(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    recipes = db.query(Recipe).all()
    pantry_items = db.query(PantryItem).all()

    matches = []
    for recipe in recipes:
        recipe_ingredients = recipe.ingredients or []
        if not recipe_ingredients:
            continue

        matched_count = 0
        missing_list = []

        for ing in recipe_ingredients:
            ing_name = ing.get("name", "").strip().lower()
            req_amount = float(ing.get("amount", 1.0))
            req_unit = ing.get("unit", "")

            # Match against pantry
            found = False
            p_qty = None
            for p in pantry_items:
                p_name = p.name.strip().lower()
                if p_name in ing_name or ing_name in p_name:
                    found = True
                    p_qty = p.quantity
                    break

            if found:
                matched_count += 1
            else:
                missing_list.append(
                    RecipeMatchIngredient(
                        ingredient_name=ing.get("name", ""),
                        required_amount=req_amount,
                        unit=req_unit,
                        available_in_pantry=False,
                        pantry_quantity=None
                    )
                )

        total_count = len(recipe_ingredients)
        pct = round((matched_count / total_count) * 100, 1) if total_count > 0 else 0.0

        matches.append(
            RecipePantryMatch(
                recipe_id=recipe.id,
                recipe_title=recipe.title,
                total_ingredients_count=total_count,
                matched_ingredients_count=matched_count,
                missing_ingredients_count=len(missing_list),
                match_percentage=pct,
                missing_ingredients=missing_list,
                can_cook_now=(matched_count == total_count)
            )
        )

    # Sort: can cook now first, then highest percentage
    matches.sort(key=lambda m: (not m.can_cook_now, -m.match_percentage, m.missing_ingredients_count))
    return matches
