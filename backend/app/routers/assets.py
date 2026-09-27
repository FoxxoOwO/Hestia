import os
import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.asset import Asset
from app.schemas.asset import AssetCreate, AssetUpdate, AssetResponse, AssetStats
from app.utils.auth import get_current_user
from app.services.activity_service import log_activity

router = APIRouter(prefix="/assets", tags=["Assets & Appliances"])

def _compute_asset_warranty(asset: Asset) -> tuple[Optional[str], Optional[int], str, bool]:
    if not asset.purchase_date or not asset.warranty_months or asset.warranty_months <= 0:
        return None, None, "none", False
    try:
        p_date = datetime.datetime.strptime(asset.purchase_date[:10], "%Y-%m-%d").date()
        month = p_date.month - 1 + asset.warranty_months
        year = p_date.year + month // 12
        month = month % 12 + 1
        days_in_month = [31, 29 if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0) else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
        day = min(p_date.day, days_in_month[month - 1])
        exp_date = datetime.date(year, month, day)
        
        today = datetime.date.today()
        days_left = (exp_date - today).days
        exp_str = exp_date.isoformat()
        
        if days_left < 0:
            return exp_str, days_left, "expired", False
        elif days_left <= 30:
            return exp_str, days_left, "expiring_soon", True
        else:
            return exp_str, days_left, "valid", True
    except Exception:
        return None, None, "none", False

def _format_asset_response(asset: Asset) -> AssetResponse:
    exp_date, days_left, w_status, is_under = _compute_asset_warranty(asset)
    resp = AssetResponse.model_validate(asset)
    resp.warranty_expiry_date = exp_date
    resp.days_until_warranty_expiry = days_left
    resp.warranty_status = w_status
    resp.is_under_warranty = is_under
    return resp

@router.get("", response_model=List[AssetResponse])
def get_assets(
    category: Optional[str] = None,
    room: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    warranty_status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Asset)

    if category:
        query = query.filter(Asset.category == category)
    if room:
        query = query.filter(Asset.room == room)
    if status_filter:
        query = query.filter(Asset.status == status_filter)
    if search:
        s = f"%{search}%"
        query = query.filter(
            or_(
                Asset.name.ilike(s),
                Asset.brand.ilike(s),
                Asset.model_number.ilike(s),
                Asset.serial_number.ilike(s),
                Asset.store_or_vendor.ilike(s),
                Asset.notes.ilike(s)
            )
        )

    assets = query.order_by(Asset.room.asc(), Asset.name.asc()).all()
    formatted = [_format_asset_response(a) for a in assets]

    if warranty_status:
        formatted = [a for a in formatted if a.warranty_status == warranty_status]

    return formatted

@router.get("/stats", response_model=AssetStats)
def get_asset_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assets = db.query(Asset).filter(Asset.status == "active").all()
    total_val = sum(a.purchase_price or 0.0 for a in assets)

    active_w = 0
    expiring_soon_w = 0
    expired_w = 0

    for a in assets:
        _, _, w_status, _ = _compute_asset_warranty(a)
        if w_status == "valid":
            active_w += 1
        elif w_status == "expiring_soon":
            expiring_soon_w += 1
        elif w_status == "expired":
            expired_w += 1

    return AssetStats(
        total_assets=len(assets),
        total_value=round(total_val, 2),
        active_warranties=active_w,
        expiring_soon_warranties=expiring_soon_w,
        expired_warranties=expired_w
    )

@router.get("/{asset_id}", response_model=AssetResponse)
def get_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Spotřebič / majetek nebyl nalezen")
    return _format_asset_response(asset)

@router.post("", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
def create_asset(
    asset_in: AssetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    asset = Asset(**asset_in.model_dump())
    db.add(asset)
    db.commit()
    db.refresh(asset)

    try:
        log_activity(
            db=db,
            user_id=current_user.id,
            action_type="create",
            entity_type="asset",
            entity_id=asset.id,
            description=f"Přidán spotřebič/vybavení: {asset.name} ({asset.brand or 'bez značky'})",
            extra_data={"room": asset.room, "category": asset.category}
        )
    except Exception:
        pass

    return _format_asset_response(asset)

@router.put("/{asset_id}", response_model=AssetResponse)
def update_asset(
    asset_id: int,
    asset_in: AssetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Spotřebič / majetek nebyl nalezen")

    update_data = asset_in.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(asset, key, val)

    db.commit()
    db.refresh(asset)

    try:
        log_activity(
            db=db,
            user_id=current_user.id,
            action_type="update",
            entity_type="asset",
            entity_id=asset.id,
            description=f"Upraveny informace o spotřebiči: {asset.name}"
        )
    except Exception:
        pass

    return _format_asset_response(asset)

@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Spotřebič / majetek nebyl nalezen")

    name = asset.name
    db.delete(asset)
    db.commit()

    try:
        log_activity(
            db=db,
            user_id=current_user.id,
            action_type="delete",
            entity_type="asset",
            entity_id=asset_id,
            description=f"Odstraněn spotřebič: {name}"
        )
    except Exception:
        pass

@router.post("/{asset_id}/upload-file")
async def upload_asset_file(
    asset_id: int,
    file_type: str = Query("invoice", pattern="^(invoice|manual)$"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Spotřebič / majetek nebyl nalezen")

    ext = os.path.splitext(file.filename)[1].lower() or ".pdf"
    unique_filename = f"asset_{asset_id}_{file_type}_{uuid.uuid4().hex[:8]}{ext}"
    asset_upload_dir = os.path.join(settings.UPLOAD_DIR, "assets")
    os.makedirs(asset_upload_dir, exist_ok=True)
    
    file_path = os.path.join(asset_upload_dir, unique_filename)
    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    rel_url = f"/uploads/assets/{unique_filename}"
    if file_type == "invoice":
        asset.invoice_url = rel_url
    else:
        asset.manual_url = rel_url

    db.commit()
    db.refresh(asset)
    return {"url": rel_url, "file_type": file_type, "asset": _format_asset_response(asset)}
