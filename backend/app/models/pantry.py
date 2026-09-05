import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime
from app.database import Base

class PantryItem(Base):
    __tablename__ = "pantry_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    category = Column(String, default="pantry")  # fridge, freezer, pantry, produce, spices, bakery, other
    quantity = Column(Float, default=1.0)
    unit = Column(String, default="ks")  # g, kg, ml, l, ks, balení...
    expiration_date = Column(String, nullable=True)  # YYYY-MM-DD
    min_quantity = Column(Float, nullable=True)  # alert threshold
    note = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
