from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.shopping import ShoppingItem
from app.models.user import User
from app.schemas.shopping import (
    ShoppingItemCreate, ShoppingItemUpdate, ShoppingItemResponse,
    AddRecipeToShoppingRequest
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/shopping", tags=["Shopping List"])

@router.get("", response_model=List[ShoppingItemResponse])
def get_shopping_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Unchecked first, then checked, ordered by creation
    return db.query(ShoppingItem).order_by(ShoppingItem.is_checked.asc(), ShoppingItem.created_at.asc()).all()

@router.post("", response_model=ShoppingItemResponse, status_code=status.HTTP_201_CREATED)
def create_shopping_item(
    item_in: ShoppingItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = ShoppingItem(
        name=item_in.name,
        amount=item_in.amount,
        unit=item_in.unit,
        category=item_in.category or "other",
        is_checked=item_in.is_checked,
        recipe_id=item_in.recipe_id,
        added_by_id=current_user.id
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.put("/{item_id}", response_model=ShoppingItemResponse)
def update_shopping_item(
    item_id: int,
    item_in: ShoppingItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(ShoppingItem).filter(ShoppingItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Položka nebyla nalezena")

    update_data = item_in.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(item, key, val)

    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}")
def delete_shopping_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(ShoppingItem).filter(ShoppingItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Položka nebyla nalezena")
    db.delete(item)
    db.commit()
    return {"status": "success", "message": "Položka byla smazána"}

@router.post("/add-from-recipe", response_model=List[ShoppingItemResponse])
def add_from_recipe(
    req: AddRecipeToShoppingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    created_items = []
    for ing in req.ingredients:
        item = ShoppingItem(
            name=ing.name,
            amount=ing.amount,
            unit=ing.unit,
            category=ing.category or "other",
            is_checked=False,
            recipe_id=req.recipe_id,
            added_by_id=current_user.id
        )
        db.add(item)
        created_items.append(item)

    db.commit()
    for item in created_items:
        db.refresh(item)
    return created_items

@router.post("/clear-completed")
def clear_completed(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    count = db.query(ShoppingItem).filter(ShoppingItem.is_checked == True).delete()
    db.commit()
    return {"status": "success", "deleted_count": count}

@router.post("/clear-all")
def clear_all(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    count = db.query(ShoppingItem).delete()
    db.commit()
    return {"status": "success", "deleted_count": count}
