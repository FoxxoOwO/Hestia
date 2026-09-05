from datetime import datetime, timedelta
from typing import Optional, List, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.database import get_db
from app.models.user import User
from app.models.activity import ActivityLog
from app.schemas.activity import (
    ActivityLogResponse, ActivityListResponse, ActivityStatsResponse
)
from app.utils.auth import get_current_user, get_current_active_admin

router = APIRouter(prefix="/activities", tags=["Activities & Audit Log"])

@router.get("", response_model=ActivityListResponse)
def get_activities(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    module: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    action_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(ActivityLog)
    
    if module:
        query = query.filter(ActivityLog.module == module)
    if user_id is not None:
        query = query.filter(ActivityLog.user_id == user_id)
    if action_type:
        query = query.filter(ActivityLog.action_type == action_type)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                ActivityLog.title.ilike(search_fmt),
                ActivityLog.description.ilike(search_fmt),
                ActivityLog.user_name.ilike(search_fmt)
            )
        )
    
    total = query.count()
    items = query.order_by(ActivityLog.created_at.desc()).offset(offset).limit(limit).all()
    
    return ActivityListResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset
    )

@router.get("/stats", response_model=ActivityStatsResponse)
def get_activity_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    
    total_activities = db.query(ActivityLog).count()
    activities_today = db.query(ActivityLog).filter(ActivityLog.created_at >= today_start).count()
    
    # Module counts
    module_rows = db.query(
        ActivityLog.module, func.count(ActivityLog.id)
    ).group_by(ActivityLog.module).all()
    module_counts = {row[0]: row[1] for row in module_rows}
    
    # Most active member (last 30 days)
    thirty_days_ago = now - timedelta(days=30)
    top_user_row = db.query(
        ActivityLog.user_name, func.count(ActivityLog.id).label("count")
    ).filter(
        ActivityLog.created_at >= thirty_days_ago,
        ActivityLog.user_name != "Systém"
    ).group_by(ActivityLog.user_name).order_by(func.count(ActivityLog.id).desc()).first()
    
    most_active_member = top_user_row[0] if top_user_row else None
    
    return ActivityStatsResponse(
        total_activities=total_activities,
        activities_today=activities_today,
        module_counts=module_counts,
        most_active_member=most_active_member
    )

@router.delete("")
def clear_activities(
    older_than_days: Optional[int] = Query(None, ge=1),
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    query = db.query(ActivityLog)
    if older_than_days is not None:
        cutoff = datetime.utcnow() - timedelta(days=older_than_days)
        query = query.filter(ActivityLog.created_at < cutoff)
        
    deleted_count = query.delete(synchronize_session=False)
    db.commit()
    
    return {
        "status": "success",
        "message": f"Smazáno {deleted_count} záznamů historie",
        "deleted_count": deleted_count
    }
