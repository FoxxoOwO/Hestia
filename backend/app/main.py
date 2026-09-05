import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
import app.models  # Ensure all SQLAlchemy models are registered
from app.database import engine, Base, SessionLocal
from app.services.seed_data import seed_initial_data
from app.routers import auth, recipes, pantry, shopping, ai, plants, pets, chores, finance

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is created
    Base.metadata.create_all(bind=engine)
    
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
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for local network and web access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": "Hestia Smart Home OS",
        "version": "1.0.0",
        "modules": ["recipes", "pantry", "shopping", "auth", "gemini-ai"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
