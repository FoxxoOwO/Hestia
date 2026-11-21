import datetime
from typing import Optional
import bcrypt
import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.user import TokenPayload

# auto_error=False -> token lze přijmout i z httpOnly cookie (web) místo hlavičky (Android).
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False
)

ACCESS_COOKIE = "hestia_access"
REFRESH_COOKIE = "hestia_refresh"
CSRF_COOKIE = "hestia_csrf"
CSRF_HEADER = "X-CSRF-Token"

# Falešný bcrypt hash - používá se, když účet neexistuje, aby ověření hesla
# trvalo stejně dlouho a nešlo z času odezvy zjistit, která jména existují.
_DUMMY_HASH = b"$2b$12$.eVBLlTG9s2Qn0B7TsjTQuS906rn//pmzu4vBv5GJpeMBI4bgP4N2"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def verify_password_or_dummy(plain_password: str, hashed_password: Optional[str]) -> bool:
    """Vrací True jen pro správné heslo, ale bcrypt spustí vždy (konstantní čas)."""
    if hashed_password:
        try:
            return verify_password(plain_password, hashed_password)
        except ValueError:
            pass  # poškozený hash v DB = neplatné heslo
    bcrypt.checkpw(plain_password.encode('utf-8'), _DUMMY_HASH)
    return False

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def _utcnow() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc)


def create_access_token(
    data: dict,
    expires_delta: Optional[datetime.timedelta] = None,
    token_version: int = 0,
) -> str:
    to_encode = data.copy()
    expire = _utcnow() + (
        expires_delta or datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({
        "exp": expire,
        "iat": _utcnow(),
        "type": "access",
        "ver": token_version,
        "iss": "hestia",
        "aud": "hestia-web",
    })
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(username: str, token_version: int = 0) -> str:
    expire = _utcnow() + datetime.timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return jwt.encode(
        {
            "sub": username,
            "exp": expire,
            "iat": _utcnow(),
            "type": "refresh",
            "ver": token_version,
            "iss": "hestia",
            "aud": "hestia-web",
        },
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def decode_token(token: str, expected_type: str = "access") -> dict:
    """Dekóduje a ověří typ tokenu; vyhazuje PyJWTError při selhání."""
    payload = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM],
        audience="hestia-web",
        issuer="hestia",
        options={"require": ["exp", "sub", "type", "ver"]},
    )
    if payload.get("type") != expected_type:
        raise jwt.InvalidTokenError(f"Neočekávaný typ tokenu: {payload.get('type')}")
    return payload

VAULT_TOKEN_SCOPE = "vault"
VAULT_TOKEN_TTL_SECONDS = 15 * 60


def create_vault_unlock_token(username: str) -> str:
    """Krátkodobý token potvrzující úspěšné zadání PINu trezoru."""
    expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
        seconds=VAULT_TOKEN_TTL_SECONDS
    )
    return jwt.encode(
        {"sub": username, "scope": VAULT_TOKEN_SCOPE, "exp": expire},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def decode_vault_unlock_token(token: Optional[str]) -> Optional[str]:
    """Vrátí username, pokud je token platný a má scope=vault; jinak None."""
    if not token:
        return None
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={"require": ["exp", "sub", "scope"]},
        )
    except jwt.PyJWTError:
        return None
    if payload.get("scope") != VAULT_TOKEN_SCOPE:
        return None
    return payload.get("sub")


def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Přijme Bearer hlavičku (Android) nebo httpOnly cookie (web)."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    raw_token = token or request.cookies.get(ACCESS_COOKIE)
    if not raw_token:
        raise credentials_exception

    try:
        payload = decode_token(raw_token, expected_type="access")
        username = payload.get("sub")
        if not username:
            raise credentials_exception
        token_data = TokenPayload(sub=username)
    except jwt.PyJWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == token_data.sub).first()
    if user is None or not user.is_active:
        raise credentials_exception
    # Změna hesla zvyšuje verzi -> staré tokeny (i odcizené) okamžitě neplatí.
    if payload.get("ver", 0) != user.token_version:
        raise credentials_exception
    return user

def get_current_active_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user
