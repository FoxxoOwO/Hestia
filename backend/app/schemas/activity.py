from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel

class ActivityLogBase(BaseModel):
    module: str
    action_type: str
    title: str
    description: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None

class ActivityLogCreate(ActivityLogBase):
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    user_avatar_color: Optional[str] = None

class ActivityLogResponse(ActivityLogBase):
    id: int
    user_id: Optional[int] = None
    user_name: str
    user_avatar_color: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ActivityStatsResponse(BaseModel):
    total_activities: int
    activities_today: int
    module_counts: Dict[str, int]
    most_active_member: Optional[str] = None

class ActivityListResponse(BaseModel):
    items: List[ActivityLogResponse]
    total: int
    limit: int
    offset: int
