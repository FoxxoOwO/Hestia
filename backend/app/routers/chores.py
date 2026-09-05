import json
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.chore import Chore, ChoreCompletion, ChoreReward, ChoreRewardRedemption
from app.models.shopping import ShoppingItem
from app.schemas.chore import (
    ChoreCreate, ChoreUpdate, ChoreResponse, ChoreCompleteRequest,
    ChoreReassignRequest, ChoreCompletionResponse, ChoreRewardCreate,
    ChoreRewardResponse, ChoreRedemptionResponse, LeaderboardMember, UserSimple
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/chores", tags=["Household Chores & Maintenance"])


def _format_chore_response(chore: Chore) -> dict:
    rotation_list = []
    try:
        rotation_list = json.loads(chore.rotation_member_ids or "[]")
    except Exception:
        rotation_list = []

    days_until = None
    is_overdue = False
    if chore.due_date:
        try:
            due = datetime.datetime.strptime(chore.due_date, "%Y-%m-%d").date()
            today = datetime.date.today()
            delta = (due - today).days
            days_until = delta
            is_overdue = delta < 0
        except ValueError:
            pass

    current_assignee_simple = None
    if chore.current_assignee:
        current_assignee_simple = UserSimple.model_validate(chore.current_assignee)

    last_completed_by_simple = None
    if chore.last_completed_by:
        last_completed_by_simple = UserSimple.model_validate(chore.last_completed_by)

    return {
        "id": chore.id,
        "title": chore.title,
        "description": chore.description,
        "room": chore.room,
        "category": chore.category,
        "frequency": chore.frequency,
        "interval_days": chore.interval_days,
        "points": chore.points,
        "estimated_minutes": chore.estimated_minutes,
        "is_rotation_enabled": chore.is_rotation_enabled,
        "rotation_member_ids": chore.rotation_member_ids or "[]",
        "rotation_member_ids_list": rotation_list,
        "current_assignee_id": chore.current_assignee_id,
        "current_assignee": current_assignee_simple,
        "due_date": chore.due_date,
        "days_until_due": days_until,
        "is_overdue": is_overdue,
        "last_completed_at": chore.last_completed_at,
        "last_completed_by_id": chore.last_completed_by_id,
        "last_completed_by": last_completed_by_simple,
        "cleaning_supplies_needed": chore.cleaning_supplies_needed,
        "is_appliance_maintenance": chore.is_appliance_maintenance,
        "appliance_name": chore.appliance_name,
        "is_active": chore.is_active,
        "created_at": chore.created_at,
        "updated_at": chore.updated_at
    }


@router.get("", response_model=List[ChoreResponse])
def get_chores(
    room: Optional[str] = None,
    category: Optional[str] = None,
    frequency: Optional[str] = None,
    assignee_id: Optional[int] = None,
    is_appliance_maintenance: Optional[bool] = None,
    search: Optional[str] = None,
    is_active: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Chore).filter(Chore.is_active == is_active)

    if room and room != "all":
        query = query.filter(Chore.room == room)
    if category and category != "all":
        query = query.filter(Chore.category == category)
    if frequency and frequency != "all":
        query = query.filter(Chore.frequency == frequency)
    if assignee_id is not None:
        query = query.filter(Chore.current_assignee_id == assignee_id)
    if is_appliance_maintenance is not None:
        query = query.filter(Chore.is_appliance_maintenance == is_appliance_maintenance)
    if search:
        query = query.filter(
            (Chore.title.ilike(f"%{search}%")) |
            (Chore.description.ilike(f"%{search}%")) |
            (Chore.appliance_name.ilike(f"%{search}%"))
        )

    # Order: overdue first, then by due_date ascending
    chores = query.order_by(Chore.due_date.asc().nullslast()).all()
    return [_format_chore_response(c) for c in chores]


@router.post("", response_model=ChoreResponse, status_code=status.HTTP_201_CREATED)
def create_chore(
    payload: ChoreCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    members_list = payload.rotation_member_ids or []
    members_json = json.dumps(members_list)

    assignee_id = payload.current_assignee_id
    if assignee_id is None and members_list:
        assignee_id = members_list[0]
    elif assignee_id is None:
        assignee_id = current_user.id

    due = payload.due_date
    if not due and payload.interval_days:
        due = (datetime.date.today() + datetime.timedelta(days=payload.interval_days)).isoformat()

    chore = Chore(
        title=payload.title,
        description=payload.description,
        room=payload.room,
        category=payload.category,
        frequency=payload.frequency,
        interval_days=payload.interval_days,
        points=payload.points,
        estimated_minutes=payload.estimated_minutes,
        is_rotation_enabled=payload.is_rotation_enabled,
        rotation_member_ids=members_json,
        current_assignee_id=assignee_id,
        due_date=due,
        cleaning_supplies_needed=payload.cleaning_supplies_needed,
        is_appliance_maintenance=payload.is_appliance_maintenance,
        appliance_name=payload.appliance_name,
        is_active=True
    )
    db.add(chore)
    db.commit()
    db.refresh(chore)
    return _format_chore_response(chore)


@router.get("/leaderboard", response_model=List[LeaderboardMember])
def get_leaderboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    users = db.query(User).filter(User.is_active == True).all()
    one_week_ago = datetime.datetime.utcnow() - datetime.timedelta(days=7)

    leaderboard = []
    for u in users:
        # Total points & completions
        total_pts = db.query(func.coalesce(func.sum(ChoreCompletion.points_awarded), 0))\
            .filter(ChoreCompletion.user_id == u.id).scalar() or 0
        
        completions_count = db.query(func.count(ChoreCompletion.id))\
            .filter(ChoreCompletion.user_id == u.id).scalar() or 0

        # Weekly points
        weekly_pts = db.query(func.coalesce(func.sum(ChoreCompletion.points_awarded), 0))\
            .filter(ChoreCompletion.user_id == u.id, ChoreCompletion.completed_at >= one_week_ago).scalar() or 0

        # Spent points
        spent_pts = db.query(func.coalesce(func.sum(ChoreRewardRedemption.points_spent), 0))\
            .filter(ChoreRewardRedemption.user_id == u.id).scalar() or 0

        available_pts = max(0, total_pts - spent_pts)

        leaderboard.append({
            "user_id": u.id,
            "username": u.username,
            "display_name": u.display_name or u.username,
            "avatar_color": u.avatar_color or "#f97316",
            "total_points": int(total_pts),
            "weekly_points": int(weekly_pts),
            "available_points": int(available_pts),
            "chores_completed_count": int(completions_count)
        })

    # Sort descending by weekly points, then total points
    leaderboard.sort(key=lambda x: (x["weekly_points"], x["total_points"]), reverse=True)
    return leaderboard


@router.get("/panic-mode-tasks", response_model=List[ChoreResponse])
def get_panic_mode_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Panic mode tasks: category panic_mode or routine chores with estimated_minutes <= 10
    tasks = db.query(Chore).filter(
        Chore.is_active == True,
        (Chore.category == "panic_mode") | (Chore.estimated_minutes <= 10)
    ).order_by(Chore.estimated_minutes.asc()).limit(8).all()

    return [_format_chore_response(t) for t in tasks]


@router.get("/rewards", response_model=List[ChoreRewardResponse])
def get_rewards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(ChoreReward).filter(ChoreReward.is_active == True).order_by(ChoreReward.cost_points.asc()).all()


@router.post("/rewards", response_model=ChoreRewardResponse, status_code=status.HTTP_201_CREATED)
def create_reward(
    payload: ChoreRewardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reward = ChoreReward(
        title=payload.title,
        description=payload.description,
        cost_points=payload.cost_points,
        icon=payload.icon,
        is_active=payload.is_active
    )
    db.add(reward)
    db.commit()
    db.refresh(reward)
    return reward


@router.post("/rewards/{reward_id}/redeem", response_model=ChoreRedemptionResponse)
def redeem_reward(
    reward_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reward = db.query(ChoreReward).filter(ChoreReward.id == reward_id, ChoreReward.is_active == True).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Odměna nebyla nalezena")

    # Calculate available points
    total_pts = db.query(func.coalesce(func.sum(ChoreCompletion.points_awarded), 0))\
        .filter(ChoreCompletion.user_id == current_user.id).scalar() or 0
    spent_pts = db.query(func.coalesce(func.sum(ChoreRewardRedemption.points_spent), 0))\
        .filter(ChoreRewardRedemption.user_id == current_user.id).scalar() or 0
    available_pts = total_pts - spent_pts

    if available_pts < reward.cost_points:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Nemáte dostatek bodů pro tuto odměnu (Potřeba: {reward.cost_points}, máte: {available_pts})"
        )

    redemption = ChoreRewardRedemption(
        reward_id=reward.id,
        user_id=current_user.id,
        points_spent=reward.cost_points,
        status="pending"
    )
    db.add(redemption)
    db.commit()
    db.refresh(redemption)
    return redemption


@router.get("/{chore_id}", response_model=ChoreResponse)
def get_chore(
    chore_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chore = db.query(Chore).filter(Chore.id == chore_id).first()
    if not chore:
        raise HTTPException(status_code=404, detail="Úkol nebyl nalezen")
    return _format_chore_response(chore)


@router.put("/{chore_id}", response_model=ChoreResponse)
def update_chore(
    chore_id: int,
    payload: ChoreUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chore = db.query(Chore).filter(Chore.id == chore_id).first()
    if not chore:
        raise HTTPException(status_code=404, detail="Úkol nebyl nalezen")

    for field, val in payload.model_dump(exclude_unset=True).items():
        if field == "rotation_member_ids":
            if val is not None:
                chore.rotation_member_ids = json.dumps(val)
        else:
            setattr(chore, field, val)

    db.commit()
    db.refresh(chore)
    return _format_chore_response(chore)


@router.delete("/{chore_id}")
def delete_chore(
    chore_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chore = db.query(Chore).filter(Chore.id == chore_id).first()
    if not chore:
        raise HTTPException(status_code=404, detail="Úkol nebyl nalezen")
    db.delete(chore)
    db.commit()
    return {"status": "success", "message": "Úkol byl smazán"}


@router.post("/{chore_id}/complete", response_model=ChoreResponse)
def complete_chore(
    chore_id: int,
    payload: ChoreCompleteRequest = ChoreCompleteRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chore = db.query(Chore).filter(Chore.id == chore_id).first()
    if not chore:
        raise HTTPException(status_code=404, detail="Úkol nebyl nalezen")

    points_to_award = payload.custom_points if payload.custom_points is not None else chore.points

    # 1. Create completion log
    completion = ChoreCompletion(
        chore_id=chore.id,
        user_id=current_user.id,
        points_awarded=points_to_award,
        completed_at=datetime.datetime.utcnow(),
        notes=payload.notes
    )
    db.add(completion)

    # 2. Update chore completion stats
    chore.last_completed_at = datetime.datetime.utcnow()
    chore.last_completed_by_id = current_user.id

    # 3. Next due date
    if chore.interval_days and chore.interval_days > 0:
        next_due = datetime.date.today() + datetime.timedelta(days=chore.interval_days)
        chore.due_date = next_due.isoformat()

    # 4. Rotation to next family member
    if chore.is_rotation_enabled:
        try:
            members = json.loads(chore.rotation_member_ids or "[]")
        except Exception:
            members = []

        if len(members) > 1:
            curr_id = chore.current_assignee_id
            if curr_id in members:
                idx = members.index(curr_id)
                next_idx = (idx + 1) % len(members)
                chore.current_assignee_id = members[next_idx]
            else:
                chore.current_assignee_id = members[0]

    db.commit()
    db.refresh(chore)
    return _format_chore_response(chore)


@router.post("/{chore_id}/reassign", response_model=ChoreResponse)
def reassign_chore(
    chore_id: int,
    payload: ChoreReassignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chore = db.query(Chore).filter(Chore.id == chore_id).first()
    if not chore:
        raise HTTPException(status_code=404, detail="Úkol nebyl nalezen")

    target_user = db.query(User).filter(User.id == payload.new_assignee_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Vybraný člen rodiny nebyl nalezen")

    chore.current_assignee_id = target_user.id
    db.commit()
    db.refresh(chore)
    return _format_chore_response(chore)


@router.post("/{chore_id}/add-supply-to-shopping")
def add_supply_to_shopping(
    chore_id: int,
    item_name: Optional[str] = None,
    amount: float = 1.0,
    unit: str = "balení",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chore = db.query(Chore).filter(Chore.id == chore_id).first()
    if not chore:
        raise HTTPException(status_code=404, detail="Úkol nebyl nalezen")

    name = item_name or chore.cleaning_supplies_needed or f"Čisticí prostředky pro: {chore.title}"

    shopping_item = ShoppingItem(
        name=name,
        amount=amount,
        unit=unit,
        category="household",
        is_checked=False,
        added_by_id=current_user.id
    )
    db.add(shopping_item)
    db.commit()
    db.refresh(shopping_item)

    return {
        "status": "success",
        "shopping_item_id": shopping_item.id,
        "message": f"Položka '{name}' byla přidána do rodinného nákupního seznamu."
    }
