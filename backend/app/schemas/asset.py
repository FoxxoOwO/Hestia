import datetime
from typing import Optional, List
from pydantic import BaseModel

class AssetBase(BaseModel):
    name: str
    category: str = "large_appliance"  # large_appliance, small_appliance, electronics, tools_garden, furniture, plumbing_hvac, other
    room: str = "kitchen"              # kitchen, bathroom, living_room, bedroom, hallway, garage, garden, workshop, attic_cellar, general
    brand: Optional[str] = None
    model_number: Optional[str] = None
    serial_number: Optional[str] = None
    purchase_date: Optional[str] = None  # YYYY-MM-DD
    warranty_months: int = 24
    purchase_price: Optional[float] = None
    store_or_vendor: Optional[str] = None
    invoice_url: Optional[str] = None
    manual_url: Optional[str] = None
    status: str = "active"  # active, in_repair, disposed, sold
    notes: Optional[str] = None
    contact_service: Optional[str] = None

class AssetCreate(AssetBase):
    pass

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    room: Optional[str] = None
    brand: Optional[str] = None
    model_number: Optional[str] = None
    serial_number: Optional[str] = None
    purchase_date: Optional[str] = None
    warranty_months: Optional[int] = None
    purchase_price: Optional[float] = None
    store_or_vendor: Optional[str] = None
    invoice_url: Optional[str] = None
    manual_url: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    contact_service: Optional[str] = None

class AssetResponse(AssetBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime
    
    # Computed warranty fields
    warranty_expiry_date: Optional[str] = None
    days_until_warranty_expiry: Optional[int] = None
    warranty_status: str = "none"  # "valid", "expiring_soon", "expired", "none"
    is_under_warranty: bool = False

    class Config:
        from_attributes = True

class AssetStats(BaseModel):
    total_assets: int
    total_value: float
    active_warranties: int
    expiring_soon_warranties: int
    expired_warranties: int
