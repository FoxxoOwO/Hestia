import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class UserSimple(BaseModel):
    id: int
    username: str
    display_name: str
    avatar_color: Optional[str] = "#f97316"

    class Config:
        from_attributes = True


class ChoreBase(BaseModel):
    title: str
    description: Optional[str] = None
    room: str = "general"
    category: str = "routine"  # routine, deep_clean, maintenance, panic_mode
    frequency: str = "weekly"  # daily, weekly, biweekly, monthly, seasonal, as_needed
    interval_days: int = 7
    points: int = 10
    estimated_minutes: int = 15
    is_rotation_enabled: bool = True
    rotation_member_ids: Optional[List[int]] = []
    current_assignee_id: Optional[int] = None
    due_date: Optional[str] = None  # YYYY-MM-DD
    cleaning_supplies_needed: Optional[str] = None
    is_appliance_maintenance: bool = False
    appliance_name: Optional[str] = None


class ChoreCreate(ChoreBase):
    pass


class ChoreUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    room: Optional[str] = None
    category: Optional[str] = None
    frequency: Optional[str] = None
    interval_days: Optional[int] = None
    points: Optional[int] = None
    estimated_minutes: Optional[int] = None
    is_rotation_enabled: Optional[bool] = None
    rotation_member_ids: Optional[List[int]] = None
    current_assignee_id: Optional[int] = None
    due_date: Optional[str] = None
    cleaning_supplies_needed: Optional[str] = None
    is_appliance_maintenance: Optional[bool] = None
    appliance_name: Optional[str] = None
    is_active: Optional[bool] = None


class ChoreCompleteRequest(BaseModel):
    notes: Optional[str] = None
    custom_points: Optional[int] = None


class ChoreReassignRequest(BaseModel):
    new_assignee_id: int


class ChoreCompletionResponse(BaseModel):
    id: int
    chore_id: int
    user_id: int
    points_awarded: int
    completed_at: datetime.datetime
    notes: Optional[str] = None
    user: Optional[UserSimple] = None

    class Config:
        from_attributes = True


class ChoreResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    room: str
    category: str
    frequency: str
    interval_days: int
    points: int
    estimated_minutes: int
    is_rotation_enabled: bool
    rotation_member_ids: str  # raw json string
    rotation_member_ids_list: List[int] = []
    current_assignee_id: Optional[int] = None
    current_assignee: Optional[UserSimple] = None
    due_date: Optional[str] = None
    days_until_due: Optional[int] = None
    is_overdue: bool = False
    last_completed_at: Optional[datetime.datetime] = None
    last_completed_by_id: Optional[int] = None
    last_completed_by: Optional[UserSimple] = None
    cleaning_supplies_needed: Optional[str] = None
    is_appliance_maintenance: bool = False
    appliance_name: Optional[str] = None
    is_active: bool = True
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True


class ChoreRewardBase(BaseModel):
    title: str
    description: Optional[str] = None
    cost_points: int = 50
    icon: str = "Gift"
    is_active: bool = True


class ChoreRewardCreate(ChoreRewardBase):
    pass


class ChoreRewardResponse(ChoreRewardBase):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class ChoreRedemptionResponse(BaseModel):
    id: int
    reward_id: int
    user_id: int
    points_spent: int
    status: str
    redeemed_at: datetime.datetime
    reward: Optional[ChoreRewardResponse] = None
    user: Optional[UserSimple] = None

    class Config:
        from_attributes = True


class LeaderboardMember(BaseModel):
    user_id: int
    username: str
    display_name: str
    avatar_color: str
    total_points: int
    weekly_points: int
    available_points: int
    chores_completed_count: int
