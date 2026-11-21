import secrets
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    UserCreate, UserUpdate, UserResponse, Token, LoginRequest, PublicMember,
    ChangePasswordRequest, VerifyPasswordRequest, RefreshRequest
)
from app.utils.auth import (
    verify_password_or_dummy, get_password_hash, create_access_token,
    create_refresh_token, decode_token, get_current_user, get_current_active_admin,
    ACCESS_COOKIE, REFRESH_COOKIE, CSRF_COOKIE,
)
from app.utils.rate_limit import (
    check_login_rate_limit, register_failed_login, reset_login_attempts
)
from app.services.activity_service import log_activity

router = APIRouter(prefix="/auth", tags=["Authentication & Household Members"])


def _set_auth_cookies(response: Response, username: str, token_version: int) -> tuple[str, str, str]:
    """Vytvoří tokeny a nastaví httpOnly cookies (double-submit CSRF)."""
    access_token = create_access_token({"sub": username}, token_version=token_version)
    refresh_token = create_refresh_token(username, token_version)
    csrf_token = secrets.token_urlsafe(32)
    secure = settings.COOKIE_SECURE

    response.set_cookie(
        ACCESS_COOKIE, access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True, secure=secure, samesite="lax", path="/",
    )
    response.set_cookie(
        REFRESH_COOKIE, refresh_token,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        httponly=True, secure=secure, samesite="lax",
        path=f"{settings.API_V1_STR}/auth",
    )
    response.set_cookie(
        CSRF_COOKIE, csrf_token,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        httponly=False, secure=secure, samesite="lax", path="/",
    )
    return access_token, refresh_token, csrf_token


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
def login(login_data: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    rate_key = f"{client_ip}|{login_data.username.strip().lower()}"
    check_login_rate_limit(rate_key)

    user = db.query(User).filter(User.username == login_data.username).first()
    if not verify_password_or_dummy(login_data.password, user.hashed_password if user else None):
        register_failed_login(rate_key)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Neplatné uživatelské jméno nebo heslo (Invalid credentials)"
        )
    if not user.is_active:
        reset_login_attempts(rate_key)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uživatelský účet je deaktivován (Account inactive)"
        )

    reset_login_attempts(rate_key)

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

    access_token, refresh_token, csrf_token = _set_auth_cookies(
        response, user.username, user.token_version
    )
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "csrf_token": csrf_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/refresh")
def refresh_access_token(
    request: Request,
    response: Response,
    payload: Optional[RefreshRequest] = None,
    db: Session = Depends(get_db),
):
    """Vydá nový access token z platného refresh tokenu (cookie nebo tělo)."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Neplatný nebo vypršelý refresh token",
    )
    raw = (
        (payload.refresh_token if payload else None)
        or (request.cookies.get(REFRESH_COOKIE) if request else None)
    )
    if not raw:
        raise credentials_exception
    try:
        decoded = decode_token(raw, expected_type="refresh")
    except Exception:
        raise credentials_exception

    user = db.query(User).filter(User.username == decoded.get("sub")).first()
    if not user or not user.is_active or decoded.get("ver", 0) != user.token_version:
        raise credentials_exception

    access_token, refresh_token, csrf_token = _set_auth_cookies(
        response, user.username, user.token_version
    )
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "csrf_token": csrf_token,
        "token_type": "bearer",
    }


@router.post("/logout")
def logout(response: Response):
    """Smaže autentizační cookies; nativní klient si token odstraní sám."""
    response.delete_cookie(ACCESS_COOKIE, path="/")
    response.delete_cookie(REFRESH_COOKIE, path=f"{settings.API_V1_STR}/auth")
    response.delete_cookie(CSRF_COOKIE, path="/")
    return {"status": "success", "message": "Odhlášeno"}


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Vlastní změna hesla; po úspěchu se zruší příznak povinné změny hesla."""
    client_ip = request.client.host if request.client else "unknown"
    rate_key = f"pwdchange|{client_ip}|{current_user.id}"
    check_login_rate_limit(rate_key)

    if not verify_password_or_dummy(payload.current_password, current_user.hashed_password):
        register_failed_login(rate_key)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aktuální heslo není správné."
        )
    if len(payload.new_password) < 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nové heslo musí mít alespoň 12 znaků."
        )
    if payload.new_password == payload.current_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nové heslo se musí lišit od aktuálního."
        )

    reset_login_attempts(rate_key)
    current_user.hashed_password = get_password_hash(payload.new_password)
    current_user.must_change_password = False
    # Zneplatní všechny staré tokeny (včetně odcizených).
    current_user.token_version += 1

    # Staré tokeny zneplatníme a vydáme nové, aby uživatel zůstal přihlášený.
    _set_auth_cookies(response, current_user.username, current_user.token_version)

    log_activity(
        db=db,
        user=current_user,
        module="auth",
        action_type="update",
        title="Změna hesla",
        description=f"{current_user.display_name} změnil(a) své heslo.",
        entity_type="User",
        entity_id=current_user.id
    )
    db.commit()
    return {"status": "success", "message": "Heslo bylo změněno."}


@router.post("/verify-password")
def verify_password_for_sensitive_action(
    payload: VerifyPasswordRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Opětovné ověření hesla před citlivou operací (export, odemčení trezoru)."""
    client_ip = request.client.host if request.client else "unknown"
    rate_key = f"pwdverify|{client_ip}|{current_user.id}"
    check_login_rate_limit(rate_key)

    if not verify_password_or_dummy(payload.password, current_user.hashed_password):
        register_failed_login(rate_key)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nesprávné heslo."
        )

    reset_login_attempts(rate_key)
    return {"status": "success"}


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
        current_user.must_change_password = False
        current_user.token_version += 1

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
        is_active=True,
        must_change_password=True,
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
        target_user.must_change_password = False
        target_user.token_version += 1

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
