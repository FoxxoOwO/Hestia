import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic import field_validator
from pydantic_settings import BaseSettings

_backend_dir = Path(__file__).resolve().parent.parent
_repo_root = _backend_dir.parent
if (_backend_dir / ".env").exists():
    load_dotenv(_backend_dir / ".env")
if (_repo_root / ".env").exists():
    load_dotenv(_repo_root / ".env")

# Veřejně známý klíč z .env.example - s ním si kdokoli vyrobí admin token.
_WEAK_SECRET_KEYS = {"hestia-super-secret-key-change-in-production-123456789"}

def _resolve_frontend_dist() -> str:
    env_dist = os.getenv("FRONTEND_DIST_DIR", "")
    if env_dist and os.path.exists(env_dist):
        return env_dist
    repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    candidate = os.path.join(repo_root, "frontend", "dist")
    if os.path.exists(candidate):
        return candidate
    return env_dist


class Settings(BaseSettings):
    PROJECT_NAME: str = "Hestia - Smart Home Management"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./hestia.db")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    # Čárkou oddělený seznam povolených originů; "*" povolí vše (výchozí kvůli LAN přístupu).
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "*")
    FRONTEND_DIST_DIR: str = _resolve_frontend_dist()
    
    @field_validator("SECRET_KEY")
    @classmethod
    def _reject_weak_secret_key(cls, value: str) -> str:
        if len(value) < 32 or value in _WEAK_SECRET_KEYS:
            raise ValueError(
                "SECRET_KEY chybí nebo je příliš slabý (min. 32 znaků, ne výchozí hodnota).\n"
                'Vygenerujte nový: python -c "import secrets; print(secrets.token_urlsafe(48))"\n'
                "a vložte ho do .env jako SECRET_KEY=<vygenerovaná hodnota>."
            )
        return value

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()
