import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    prep_time_minutes = Column(Integer, default=15)
    cook_time_minutes = Column(Integer, default=30)
    difficulty = Column(String, default="medium")  # easy, medium, hard
    price_level = Column(String, default="medium")  # low, medium, high
    default_servings = Column(Integer, default=4)
    
    # JSON arrays/objects
    tags = Column(JSON, default=list)  # ["Snídaně", "Rychlovka", "Bezlepkové"]
    utensils = Column(JSON, default=list)  # ["Pánev wok", "Tyčový mixér", "Plech"]
    ingredients = Column(JSON, default=list)  
    # list of dicts: [{"name": "Cibule", "amount": 1, "unit": "ks", "note": "nakrájená", "category": "produce"}]
    instructions = Column(JSON, default=list)
    # list of dicts: [{"step": 1, "text": "Cibuli osmahneme...", "timer_minutes": 5}]

    source_url = Column(String, nullable=True)
    is_favorite = Column(Boolean, default=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    created_by = relationship("User", backref="recipes")
