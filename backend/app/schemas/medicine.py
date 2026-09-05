from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
import datetime


# ==========================================
# MEDICINE SCHEMAS
# ==========================================
class MedicineBase(BaseModel):
    name: str
    active_substance: Optional[str] = None
    form: str = "tablets"  # tablets, syrup, drops, ointment, spray, injection, dressing, device, other
    category: str = "pain_fever"  # pain_fever, cold_cough, digestion, allergy, injury_disinfection, eyes_ears, chronic_rx, vitamins, first_aid_material, other
    location: str = "bathroom"  # bathroom, kitchen, travel_kit, cottage, car, bedroom, other
    package_size: Optional[str] = None
    current_quantity: float = 1.0
    unit: str = "ks"  # tablety, ml, ks, dávky
    min_quantity_warning: float = 0.0
    expiration_date: Optional[str] = None  # YYYY-MM-DD
    opened_date: Optional[str] = None  # YYYY-MM-DD
    validity_months_after_opening: Optional[int] = None
    is_prescription: bool = False
    requires_refrigeration: bool = False
    age_group: str = "all"  # all, adults_only, kids_from_3yo, infants, seniors
    dosage_instructions: Optional[str] = None
    storage_instructions: Optional[str] = None
    sukl_code_or_url: Optional[str] = None
    notes: Optional[str] = None
    assigned_user_id: Optional[int] = None


class MedicineCreate(MedicineBase):
    pass


class MedicineUpdate(BaseModel):
    name: Optional[str] = None
    active_substance: Optional[str] = None
    form: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    package_size: Optional[str] = None
    current_quantity: Optional[float] = None
    unit: Optional[str] = None
    min_quantity_warning: Optional[float] = None
    expiration_date: Optional[str] = None
    opened_date: Optional[str] = None
    validity_months_after_opening: Optional[int] = None
    is_prescription: Optional[bool] = None
    requires_refrigeration: Optional[bool] = None
    age_group: Optional[str] = None
    dosage_instructions: Optional[str] = None
    storage_instructions: Optional[str] = None
    sukl_code_or_url: Optional[str] = None
    notes: Optional[str] = None
    assigned_user_id: Optional[int] = None


class MedicineResponse(MedicineBase):
    id: int
    created_at: Optional[datetime.datetime] = None
    updated_at: Optional[datetime.datetime] = None
    
    # Calculated fields
    days_until_expiration: Optional[int] = None
    expiration_status: str = "ok"  # "expired", "warning", "ok", "unknown"
    after_opening_expired: bool = False
    is_low_stock: bool = False
    assigned_user_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# MEDICATION SCHEDULE SCHEMAS
# ==========================================
class MedicationScheduleBase(BaseModel):
    medicine_id: int
    user_id: int
    schedule_type: str = "chronic"  # chronic, acute_course, as_needed
    start_date: str  # YYYY-MM-DD
    end_date: Optional[str] = None  # YYYY-MM-DD
    times_per_day: int = 1
    time_slots: List[str] = ["morning"]  # ["morning", "evening"] or ["08:00", "20:00"]
    food_relation: str = "any"  # before_food, with_food, after_food, empty_stomach, any
    dosage_per_take: str = "1 tableta"
    is_active: bool = True
    notes: Optional[str] = None


class MedicationScheduleCreate(MedicationScheduleBase):
    pass


class MedicationScheduleUpdate(BaseModel):
    schedule_type: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    times_per_day: Optional[int] = None
    time_slots: Optional[List[str]] = None
    food_relation: Optional[str] = None
    dosage_per_take: Optional[str] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class MedicationScheduleResponse(MedicationScheduleBase):
    id: int
    created_at: Optional[datetime.datetime] = None
    medicine_name: Optional[str] = None
    user_name: Optional[str] = None
    is_taken_today: bool = False

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# MEDICATION LOG SCHEMAS
# ==========================================
class MedicationLogBase(BaseModel):
    schedule_id: Optional[int] = None
    medicine_id: int
    user_id: int
    time_slot: Optional[str] = None
    dose_taken: Optional[str] = None
    status: str = "taken"  # taken, skipped, postponed
    notes: Optional[str] = None
    decrement_stock: bool = True


class MedicationLogCreate(MedicationLogBase):
    pass


class MedicationLogResponse(BaseModel):
    id: int
    schedule_id: Optional[int] = None
    medicine_id: int
    user_id: int
    taken_at: datetime.datetime
    time_slot: Optional[str] = None
    dose_taken: Optional[str] = None
    status: str
    notes: Optional[str] = None
    medicine_name: Optional[str] = None
    user_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# STATS & PEDIATRIC & FIRST AID SCHEMAS
# ==========================================
class MedicineStatsResponse(BaseModel):
    total_items: int
    expired_count: int
    expiring_soon_count: int
    low_stock_count: int
    prescription_count: int
    requires_fridge_count: int
    active_schedules_count: int
    locations_count: Dict[str, int]
    categories_count: Dict[str, int]


class PediatricPreparation(BaseModel):
    brand_name: str
    concentration: str
    amount_per_single_dose: str  # e.g. "5 ml", "1 čípek"
    note: Optional[str] = None


class PediatricDosageResponse(BaseModel):
    weight_kg: float
    drug: str  # "paracetamol" | "ibuprofen"
    drug_name_cs: str
    single_dose_mg_min: float
    single_dose_mg_max: float
    daily_max_mg: float
    interval_hours: int
    max_doses_per_day: int
    preparations: List[PediatricPreparation]
    safety_warnings: List[str]


class FirstAidGuideItem(BaseModel):
    id: str
    title: str
    category: str  # emergency, trauma, intoxication, illness, allergic
    urgency: str  # "critical", "high", "medium"
    emergency_call: Optional[str] = None  # "155", "112", "224 91 92 93"
    summary: str
    action_steps: List[str]
    dont_do_steps: List[str]
    note: Optional[str] = None
