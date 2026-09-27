from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.user import User
from app.models.meal_plan import MealPlanItem
from app.models.recipe import Recipe
from app.models.pantry import PantryItem
from app.models.shopping import ShoppingItem
from app.schemas.meal_plan import (
    MealPlanItemCreate, MealPlanItemUpdate, MealPlanItemResponse,
    GenerateShoppingRequest, GenerateShoppingResponse
)
from app.utils.auth import get_current_user
from app.services.activity_service import log_activity

router = APIRouter(prefix="/meal-plans", tags=["Weekly Meal Planner"])

def _format_meal_plan_item(item: MealPlanItem) -> MealPlanItemResponse:
    resp = MealPlanItemResponse.model_validate(item)
    if item.recipe:
        resp.recipe_title = item.recipe.title
        resp.recipe_image_url = item.recipe.image_url
        resp.recipe_prep_time = item.recipe.prep_time_minutes
        resp.recipe_cook_time = item.recipe.cook_time_minutes
        resp.recipe_difficulty = item.recipe.difficulty
    return resp

@router.get("", response_model=List[MealPlanItemResponse])
def get_meal_plans(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(MealPlanItem)
    if start_date:
        query = query.filter(MealPlanItem.date >= start_date)
    if end_date:
        query = query.filter(MealPlanItem.date <= end_date)

    items = query.order_by(MealPlanItem.date.asc(), MealPlanItem.meal_type.asc()).all()
    return [_format_meal_plan_item(it) for it in items]

@router.post("", response_model=MealPlanItemResponse, status_code=status.HTTP_201_CREATED)
def create_meal_plan_item(
    item_in: MealPlanItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    recipe = None
    if item_in.recipe_id:
        recipe = db.query(Recipe).filter(Recipe.id == item_in.recipe_id).first()
        if not recipe:
            raise HTTPException(status_code=404, detail="Recept nebyl nalezen")

    title = item_in.custom_title or (recipe.title if recipe else "Jídlo")

    item = MealPlanItem(
        date=item_in.date,
        meal_type=item_in.meal_type,
        recipe_id=item_in.recipe_id,
        custom_title=title,
        servings=item_in.servings,
        notes=item_in.notes,
        is_cooked=item_in.is_cooked,
        created_by_id=current_user.id
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    try:
        log_activity(
            db=db,
            user_id=current_user.id,
            action_type="create",
            entity_type="meal_plan",
            entity_id=item.id,
            description=f"Naplánováno jídlo na {item.date}: {title} ({item.meal_type})"
        )
    except Exception:
        pass

    return _format_meal_plan_item(item)

@router.put("/{item_id}", response_model=MealPlanItemResponse)
def update_meal_plan_item(
    item_id: int,
    item_in: MealPlanItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(MealPlanItem).filter(MealPlanItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Položka plánu nebyla nalezena")

    update_data = item_in.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(item, key, val)

    db.commit()
    db.refresh(item)
    return _format_meal_plan_item(item)

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meal_plan_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(MealPlanItem).filter(MealPlanItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Položka plánu nebyla nalezena")

    db.delete(item)
    db.commit()

@router.post("/{item_id}/toggle-cooked", response_model=MealPlanItemResponse)
def toggle_cooked_meal_plan(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(MealPlanItem).filter(MealPlanItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Položka plánu nebyla nalezena")

    item.is_cooked = not item.is_cooked
    db.commit()
    db.refresh(item)
    return _format_meal_plan_item(item)

@router.post("/generate-shopping", response_model=GenerateShoppingResponse)
def generate_shopping_from_meal_plan(
    req: GenerateShoppingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items = db.query(MealPlanItem).filter(
        MealPlanItem.date >= req.start_date,
        MealPlanItem.date <= req.end_date,
        MealPlanItem.recipe_id.isnot(None)
    ).all()

    pantry_names = set()
    if req.check_pantry:
        pantry_items = db.query(PantryItem).all()
        for p in pantry_items:
            if (p.quantity or 0) > 0:
                pantry_names.add(p.name.strip().lower())

    existing_shopping = db.query(ShoppingItem).filter(ShoppingItem.is_checked == False).all()
    shopping_names = {s.name.strip().lower() for s in existing_shopping}

    added_names = []
    already_in_pantry = 0

    for it in items:
        if not it.recipe or not it.recipe.ingredients:
            continue
        
        ratio = (it.servings / (it.recipe.default_servings or 4))
        for ing in it.recipe.ingredients:
            if not isinstance(ing, dict):
                continue
            name = ing.get("name", "").strip()
            if not name:
                continue

            name_lower = name.lower()
            if req.check_pantry and name_lower in pantry_names:
                already_in_pantry += 1
                continue

            if name_lower in shopping_names:
                continue  # already on shopping list

            raw_amount = ing.get("amount")
            scaled_amount = None
            if raw_amount is not None:
                try:
                    scaled_amount = round(float(raw_amount) * ratio, 2)
                except (ValueError, TypeError):
                    scaled_amount = None

            shopping_item = ShoppingItem(
                name=name,
                amount=scaled_amount,
                unit=ing.get("unit"),
                category=ing.get("category") or "other",
                is_checked=False,
                recipe_id=it.recipe.id,
                added_by_id=current_user.id
            )
            db.add(shopping_item)
            shopping_names.add(name_lower)
            added_names.append(f"{name} ({it.recipe.title})")

    db.commit()

    if added_names:
        try:
            log_activity(
                db=db,
                user_id=current_user.id,
                action_type="create",
                entity_type="shopping",
                description=f"Generován nákup z jídelníčku: přidáno {len(added_names)} surovin ({req.start_date} až {req.end_date})"
            )
        except Exception:
            pass

    return GenerateShoppingResponse(
        added_items_count=len(added_names),
        already_in_pantry_count=already_in_pantry,
        added_items=added_names
    )
