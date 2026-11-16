import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
import app.models  # Ensure all SQLAlchemy models are registered
from app.database import SessionLocal
from app.services.seed_data import seed_initial_data
from app.migrations import run_migrations
from app.routers import auth, recipes, pantry, shopping, ai, plants, pets, chores, finance, documents, vehicles, medicines, activities, system, assets, meal_plans

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Schéma databáze spravují Alembic migrace (backend/alembic/versions)
    run_migrations()
    
    # Ensure uploads dir exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    # Run seeder for first-time setup
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()
        
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Komplexní modulární self-hosted systém pro chytrou domácnost Hestia",
    version="1.6.0",
    lifespan=lifespan
)

# CORS middleware for local network and web access
# Auth je přes Bearer token v hlavičce (žádné cookies) → allow_credentials=False,
# aby wildcard "*" zůstal validní; konkrétní originy lze omezit přes CORS_ORIGINS.
_cors_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()] or ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploads
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include API v1 routers
api_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=api_prefix)
app.include_router(recipes.router, prefix=api_prefix)
app.include_router(pantry.router, prefix=api_prefix)
app.include_router(shopping.router, prefix=api_prefix)
app.include_router(ai.router, prefix=api_prefix)
app.include_router(plants.router, prefix=api_prefix)
app.include_router(pets.router, prefix=api_prefix)
app.include_router(chores.router, prefix=api_prefix)
app.include_router(finance.router, prefix=api_prefix)
app.include_router(documents.router, prefix=api_prefix)
app.include_router(vehicles.router, prefix=api_prefix)
app.include_router(medicines.router, prefix=api_prefix)
app.include_router(activities.router, prefix=api_prefix)
app.include_router(system.router, prefix=api_prefix)
app.include_router(assets.router, prefix=api_prefix)
app.include_router(meal_plans.router, prefix=api_prefix)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": "Hestia Smart Home OS",
        "version": "1.6.0",
        "modules": ["recipes", "pantry", "shopping", "auth", "gemini-ai", "plants", "pets", "chores", "finance", "documents", "vehicles", "medicines", "activities", "assets", "meal-plans"]
    }

# Optional frontend SPA serving for single-container Docker deployments
if getattr(settings, "FRONTEND_DIST_DIR", None) and os.path.exists(settings.FRONTEND_DIST_DIR):
    from fastapi.responses import FileResponse
    from fastapi import HTTPException
    
    assets_path = os.path.join(settings.FRONTEND_DIST_DIR, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa_frontend(full_path: str):
        # Don't intercept API or upload routes
        if full_path.startswith("api/") or full_path.startswith("uploads/"):
            raise HTTPException(status_code=404, detail="Not Found")
        
        dist_root = os.path.realpath(settings.FRONTEND_DIST_DIR)
        file_path = os.path.realpath(os.path.join(dist_root, full_path))
        # Keeps "..%2f" traversal inside the built frontend directory
        if os.path.commonpath([dist_root, file_path]) == dist_root and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(settings.FRONTEND_DIST_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Index file not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
