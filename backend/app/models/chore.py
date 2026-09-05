import datetime
from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Chore(Base):
    __tablename__ = "chores"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    room = Column(String, default="general", index=True)  # kitchen, bathroom, living_room, bedroom, hallway, kids_room, garden, general
    category = Column(String, default="routine", index=True)  # routine, deep_clean, maintenance, panic_mode
    frequency = Column(String, default="weekly")  # daily, weekly, biweekly, monthly, seasonal, as_needed
    interval_days = Column(Integer, default=7)
    points = Column(Integer, default=10)
    estimated_minutes = Column(Integer, default=15)
    
    # Rotation mechanism
    is_rotation_enabled = Column(Boolean, default=True)
    rotation_member_ids = Column(Text, default="[]")  # JSON string array of user ids: "[1, 2, 3]"
    current_assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Deadlines & Execution
    due_date = Column(String, nullable=True)  # YYYY-MM-DD
    last_completed_at = Column(DateTime, nullable=True)
    last_completed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Supplies & Appliance Service
    cleaning_supplies_needed = Column(String, nullable=True)  # e.g., "Tablety do myčky, čistič"
    is_appliance_maintenance = Column(Boolean, default=False)
    appliance_name = Column(String, nullable=True)  # e.g. "Kávovar DeLonghi", "Myčka Bosch"

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    current_assignee = relationship("User", foreign_keys=[current_assignee_id])
    last_completed_by = relationship("User", foreign_keys=[last_completed_by_id])
    completions = relationship("ChoreCompletion", back_populates="chore", cascade="all, delete-orphan", order_by="desc(ChoreCompletion.completed_at)")


class ChoreCompletion(Base):
    __tablename__ = "chore_completions"

    id = Column(Integer, primary_key=True, index=True)
    chore_id = Column(Integer, ForeignKey("chores.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    points_awarded = Column(Integer, default=10)
    completed_at = Column(DateTime, default=datetime.datetime.utcnow)
    notes = Column(String, nullable=True)

    chore = relationship("Chore", back_populates="completions")
    user = relationship("User")


class ChoreReward(Base):
    __tablename__ = "chore_rewards"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    cost_points = Column(Integer, nullable=False, default=50)
    icon = Column(String, default="Gift")  # Film, Utensils, IceCream, Sparkles, Shield, Gift
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    redemptions = relationship("ChoreRewardRedemption", back_populates="reward", cascade="all, delete-orphan")


class ChoreRewardRedemption(Base):
    __tablename__ = "chore_reward_redemptions"

    id = Column(Integer, primary_key=True, index=True)
    reward_id = Column(Integer, ForeignKey("chore_rewards.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    points_spent = Column(Integer, nullable=False)
    status = Column(String, default="pending")  # pending, approved, completed
    redeemed_at = Column(DateTime, default=datetime.datetime.utcnow)

    reward = relationship("ChoreReward", back_populates="redemptions")
    user = relationship("User")
