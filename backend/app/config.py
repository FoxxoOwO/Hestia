import os
from pydantic_settings import BaseSettings

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
    SECRET_KEY: str = os.getenv("SECRET_KEY", "hestia-super-secret-key-change-in-production-123456789")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./hestia.db")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    FRONTEND_DIST_DIR: str = _resolve_frontend_dist()
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()
