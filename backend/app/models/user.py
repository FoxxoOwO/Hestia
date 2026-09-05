import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    display_name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="member")  # admin, member
    avatar_color = Column(String, default="#f97316")  # Warm orange default for Hestia
    preferred_language = Column(String, default="cs")  # cs, en
    preferred_theme = Column(String, default="system")  # system, light, dark
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
