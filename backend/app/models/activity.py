from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    user_name = Column(String(100), nullable=False)
    user_avatar_color = Column(String(50), default="#f97316")
    
    # Module category: auth, chores, finance, vehicles, medicines, documents, plants, pets, recipes, shopping, settings
    module = Column(String(50), nullable=False, index=True)
    
    # Action type: login, logout, create, update, delete, complete, refuel, mileage, service, dose, budget, settle, reward
    action_type = Column(String(50), nullable=False, index=True)
    
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
