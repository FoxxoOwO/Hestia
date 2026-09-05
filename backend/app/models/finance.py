import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class FinanceTransaction(Base):
    __tablename__ = "finance_transactions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    transaction_type = Column(String, default="expense", index=True)  # expense, income
    category = Column(String, default="groceries", index=True)  # groceries, housing, utilities, transport, pets, health, entertainment, kids, shopping, income, other
    date = Column(String, nullable=False, index=True)  # YYYY-MM-DD
    
    # Family splitting
    payer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_shared = Column(Boolean, default=True)
    split_type = Column(String, default="equal")  # equal, custom, full
    split_details = Column(Text, default="{}")  # JSON string of user_id -> share: {"1": 0.5, "2": 0.5}
    is_settled = Column(Boolean, default=False)

    receipt_url = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    payer = relationship("User", foreign_keys=[payer_id])


class CategoryBudget(Base):
    __tablename__ = "finance_category_budgets"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, unique=True, nullable=False)
    monthly_limit = Column(Float, default=5000.0)
    icon = Column(String, default="Tag")
    color = Column(String, default="#f97316")


class Subscription(Base):
    __tablename__ = "finance_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    billing_cycle = Column(String, default="monthly")  # monthly, yearly, quarterly
    next_billing_date = Column(String, nullable=False)  # YYYY-MM-DD
    category = Column(String, default="entertainment")
    payer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    service_url = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    payer = relationship("User", foreign_keys=[payer_id])


class SavingsGoal(Base):
    __tablename__ = "finance_savings_goals"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0)
    target_date = Column(String, nullable=True)  # YYYY-MM-DD
    icon = Column(String, default="PiggyBank")
    color = Column(String, default="#10b981")
    is_completed = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class UserFinanceProfile(Base):
    __tablename__ = "finance_user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    bank_account = Column(String, nullable=True)  # e.g. "123456789/0800"
    iban = Column(String, nullable=True)  # e.g. "CZ5808000000000123456789"

    user = relationship("User")
