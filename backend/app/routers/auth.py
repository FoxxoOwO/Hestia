from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    UserCreate, UserUpdate, UserResponse, Token, LoginRequest, PublicMember
)
from app.utils.auth import (
    verify_password, get_password_hash, create_access_token,
    get_current_user, get_current_active_admin
)
from app.services.activity_service import log_activity

router = APIRouter(prefix="/auth", tags=["Authentication & Household Members"])

@router.get("/public-members", response_model=List[PublicMember])
def get_public_members(db: Session = Depends(get_db)):
    """
    Public unauthenticated endpoint to list household members for avatar selection on the login screen.
    Does not expose sensitive information.
    """
    users = db.query(User).filter(User.is_active == True).all()
    return [
        PublicMember(
            id=u.id,
            username=u.username,
            display_name=u.display_name,
            avatar_color=u.avatar_color,
            role=u.role
        )
        for u in users
    ]

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

    # Log login activity
    log_activity(
        db=db,
        user=user,
        module="auth",
        action_type="login",
        title="Přihlášení do systému",
        description=f"{user.display_name} se úspěšně přihlásil(a) do systému Hestia",
        entity_type="User",
        entity_id=user.id
    )
    db.commit()

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

    log_activity(
        db=db,
        user=current_user,
        module="auth",
        action_type="update",
        title="Úprava profilu",
        description=f"{current_user.display_name} aktualizoval(a) své nastavení profilu" + (" a heslo" if update_data.password else ""),
        entity_type="User",
        entity_id=current_user.id
    )

    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/users", response_model=List[UserResponse])
def get_household_members(
    include_inactive: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if not include_inactive:
        query = query.filter(User.is_active == True)
    return query.all()

@router.post("/users", response_model=UserResponse)
def create_household_member(
    user_data: UserCreate,
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(User).filter(User.username == user_data.username.strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uživatel s tímto jménem již existuje (Username already exists)"
        )

    new_user = User(
        username=user_data.username.strip(),
        display_name=user_data.display_name.strip(),
        email=user_data.email.strip() if user_data.email else None,
        hashed_password=get_password_hash(user_data.password),
        role=user_data.role or "member",
        avatar_color=user_data.avatar_color or "#f97316",
        preferred_language=user_data.preferred_language or "cs",
        preferred_theme=user_data.preferred_theme or "system",
        is_active=True
    )
    db.add(new_user)
    db.flush()

    log_activity(
        db=db,
        user=current_user,
        module="auth",
        action_type="create",
        title="Nový člen domácnosti",
        description=f"Správce {current_user.display_name} vytvořil(a) profil pro člena {new_user.display_name} (@{new_user.username})",
        entity_type="User",
        entity_id=new_user.id
    )

    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/users/{user_id}", response_model=UserResponse)
def update_household_member(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only admins or the user themselves can update this profile
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemáte oprávnění upravovat profil jiného člena domácnosti"
        )

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Člen domácnosti nenalezen (User not found)")

    # Check username uniqueness if changed
    if user_data.username is not None and user_data.username.strip():
        new_uname = user_data.username.strip()
        if new_uname != target_user.username:
            existing = db.query(User).filter(User.username == new_uname, User.id != user_id).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Uživatelské jméno @{new_uname} je již obsazeno."
                )
            target_user.username = new_uname

    # Only admins can change roles
    if user_data.role is not None and user_data.role != target_user.role:
        if current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Pouze správce může měnit role členů"
            )
        # Prevent demoting the last active admin
        if target_user.role == "admin" and user_data.role != "admin":
            admin_count = db.query(User).filter(User.role == "admin", User.is_active == True).count()
            if admin_count <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Nelze odebrat roli správce jedinému správci domácnosti"
                )
        target_user.role = user_data.role

    if user_data.display_name is not None and user_data.display_name.strip():
        target_user.display_name = user_data.display_name.strip()
    if user_data.email is not None:
        target_user.email = user_data.email.strip() if user_data.email else None
    if user_data.avatar_color is not None:
        target_user.avatar_color = user_data.avatar_color
    if user_data.preferred_language is not None:
        target_user.preferred_language = user_data.preferred_language
    if user_data.preferred_theme is not None:
        target_user.preferred_theme = user_data.preferred_theme
    if user_data.password and user_data.password.strip():
        target_user.hashed_password = get_password_hash(user_data.password.strip())

    log_activity(
        db=db,
        user=current_user,
        module="auth",
        action_type="update",
        title="Úprava profilu člena",
        description=f"{current_user.display_name} upravil(a) profil člena {target_user.display_name} (@{target_user.username})" + (" (včetně změny hesla)" if user_data.password else ""),
        entity_type="User",
        entity_id=target_user.id
    )

    db.commit()
    db.refresh(target_user)
    return target_user

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
        raise HTTPException(status_code=404, detail="Člen domácnosti nenalezen")

    if user.role == "admin":
        admin_count = db.query(User).filter(User.role == "admin", User.is_active == True).count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nelze smazat posledního aktivního správce domácnosti"
            )
    
    deleted_name = user.display_name
    deleted_username = user.username

    # Safely unlink pending chores and medication schedules
    from app.models.chore import Chore
    from app.models.medicine import Medicine, MedicationSchedule
    from app.models.finance import UserFinanceProfile

    db.query(Chore).filter(Chore.current_assignee_id == user_id).update({"current_assignee_id": None})
    db.query(Chore).filter(Chore.last_completed_by_id == user_id).update({"last_completed_by_id": None})
    db.query(Medicine).filter(Medicine.assigned_user_id == user_id).update({"assigned_user_id": None})
    db.query(MedicationSchedule).filter(MedicationSchedule.user_id == user_id).delete()
    db.query(UserFinanceProfile).filter(UserFinanceProfile.user_id == user_id).delete()

    log_activity(
        db=db,
        user=current_user,
        module="auth",
        action_type="delete",
        title="Odebrání člena domácnosti",
        description=f"Správce {current_user.display_name} odebral(a) profil člena {deleted_name} (@{deleted_username})",
        entity_type="User",
        entity_id=user_id
    )

    try:
        db.delete(user)
        db.commit()
    except Exception:
        db.rollback()
        # Fallback to safe deactivation if foreign key constraint exists
        target = db.query(User).filter(User.id == user_id).first()
        if target:
            target.is_active = False
            db.commit()

    return {"status": "success", "message": f"Člen domácnosti {deleted_name} byl úspěšně odebrán"}
