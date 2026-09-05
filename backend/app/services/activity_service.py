from typing import Optional
from sqlalchemy.orm import Session
from app.models.activity import ActivityLog
from app.models.user import User

def log_activity(
    db: Session,
    user: Optional[User] = None,
    module: str = "general",
    action_type: str = "update",
    title: str = "",
    description: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    user_name_override: Optional[str] = None,
    user_avatar_override: Optional[str] = None
) -> Optional[ActivityLog]:
    """
    Log an activity / audit event into the database.
    Catches exceptions to prevent breaking the primary transaction.
    """
    try:
        user_name = user_name_override or (user.display_name if user else "Systém")
        user_avatar = user_avatar_override or (user.avatar_color if user else "#f97316")
        user_id = user.id if user else None
        
        activity = ActivityLog(
            user_id=user_id,
            user_name=user_name,
            user_avatar_color=user_avatar,
            module=module,
            action_type=action_type,
            title=title,
            description=description,
            entity_type=entity_type,
            entity_id=entity_id
        )
        db.add(activity)
        db.flush()
        return activity
    except Exception as e:
        print(f"[ActivityLog Error]: {e}")
        return None
