import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class MealPlanItem(Base):
    __tablename__ = "meal_plan_items"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, nullable=False, index=True)  # YYYY-MM-DD
    meal_type = Column(String, nullable=False, index=True)  # breakfast, lunch, dinner, snack
    
    # Either linked to an existing Recipe or custom title
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=True)
    custom_title = Column(String, nullable=True)
    
    servings = Column(Integer, default=4)
    notes = Column(Text, nullable=True)
    is_cooked = Column(Boolean, default=False)
    
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    recipe = relationship("Recipe", backref="meal_plans")
    created_by = relationship("User")
