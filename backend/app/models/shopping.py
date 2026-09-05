import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class ShoppingItem(Base):
    __tablename__ = "shopping_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    amount = Column(Float, nullable=True)
    unit = Column(String, nullable=True)
    category = Column(String, default="other")  # dairy, produce, meat, pantry, bakery, beverages, household, other
    is_checked = Column(Boolean, default=False)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=True)
    added_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    recipe = relationship("Recipe", backref="shopping_items")
    added_by = relationship("User")
