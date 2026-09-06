from typing import Optional, Dict
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.utils.auth import get_current_active_admin, verify_password
from app.services.clean_data import clean_all_sample_data
from app.services.activity_service import log_activity

router = APIRouter(prefix="/system", tags=["System & Maintenance"])


class ResetDataRequest(BaseModel):
    confirmation: str
    password: Optional[str] = None


@router.post("/reset-data")
def reset_all_system_data(
    payload: ResetDataRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Purges all household data across all modules (recipes, pantry, shopping, plants,
    pets, chores, finance, documents, vehicles, medicines, activities).
    Preserves the logged-in administrator account.
    Requires confirmation string 'SMAZAT' and optional admin password check.
    """
    if payload.confirmation.strip().upper() not in ["SMAZAT", "CONFIRM", "DELETE"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pro potvrzení smazání zadejte přesné slovo 'SMAZAT'."
        )

    if payload.password and not verify_password(payload.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Zadané administrátorské heslo je nesprávné."
        )

    # Perform the full wipe preserving the current admin
    counts = clean_all_sample_data(db, preserve_user_id=current_user.id)

    # Log the system reset action in the freshly cleaned activity log
    log_activity(
        db=db,
        user=current_user,
        module="system",
        action_type="reset",
        title="Resetování všech dat",
        description=f"Správce {current_user.display_name} smazal veškerá data domácnosti v systému Hestia.",
        entity_type="System",
        entity_id=0
    )
    db.commit()

    return {
        "status": "success",
        "message": "Veškerá data domácnosti byla úspěšně smazána. Váš administrátorský účet byl zachován.",
        "deleted_counts": counts
    }
