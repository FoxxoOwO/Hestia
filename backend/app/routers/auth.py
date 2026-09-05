from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    UserCreate, UserUpdate, UserResponse, Token, LoginRequest
)
from app.utils.auth import (
    verify_password, get_password_hash, create_access_token,
    get_current_user, get_current_active_admin
)

router = APIRouter(prefix="/auth", tags=["Authentication & Household Members"])

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == login_data.username).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Neplatné uživatelské jméno nebo heslo (Invalid credentials)"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uživatelský účet je deaktivován (Account inactive)"
        )

    access_token = create_access_token(data={"sub": user.username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_my_profile(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if update_data.display_name is not None:
        current_user.display_name = update_data.display_name
    if update_data.email is not None:
        current_user.email = update_data.email
    if update_data.avatar_color is not None:
        current_user.avatar_color = update_data.avatar_color
    if update_data.preferred_language is not None:
        current_user.preferred_language = update_data.preferred_language
    if update_data.preferred_theme is not None:
        current_user.preferred_theme = update_data.preferred_theme
    if update_data.password:
        current_user.hashed_password = get_password_hash(update_data.password)

    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/users", response_model=List[UserResponse])
def get_household_members(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(User).all()

@router.post("/users", response_model=UserResponse)
def create_household_member(
    user_data: UserCreate,
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(User).filter(User.username == user_data.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uživatel s tímto jménem již existuje (Username already exists)"
        )

    new_user = User(
        username=user_data.username,
        display_name=user_data.display_name,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        role=user_data.role or "member",
        avatar_color=user_data.avatar_color or "#f97316",
        preferred_language=user_data.preferred_language or "cs",
        preferred_theme=user_data.preferred_theme or "system",
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.delete("/users/{user_id}")
def delete_household_member(
    user_id: int,
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nemůžete smazat svůj vlastní administrátorský účet"
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Uživatel nenalezen")
    db.delete(user)
    db.commit()
    return {"status": "success", "message": "Člen domácnosti byl odebrán"}
