from typing import Optional, List
from pydantic import BaseModel, ConfigDict
import datetime


# ==========================================
# REFUELING SCHEMAS
# ==========================================
class VehicleRefuelingBase(BaseModel):
    date: str
    mileage: int
    fuel_amount_l: float
    price_per_l: Optional[float] = None
    total_price: float
    is_full_tank: bool = True
    fuel_brand: Optional[str] = None
    notes: Optional[str] = None


class VehicleRefuelingCreate(VehicleRefuelingBase):
    record_to_finance: bool = False  # If True, also create a transaction in family finance


class VehicleRefuelingResponse(VehicleRefuelingBase):
    id: int
    vehicle_id: int
    calculated_consumption: Optional[float] = None
    created_by_id: Optional[int] = None
    created_at: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# SERVICE RECORD SCHEMAS
# ==========================================
class VehicleServiceRecordBase(BaseModel):
    service_type: str  # regular_service, oil_change, brakes, tires, inspection, repair, other
    title: str
    date: str
    mileage: int
    cost: float = 0.0
    service_shop: Optional[str] = None
    performed_operations: Optional[str] = None
    invoice_file_path: Optional[str] = None


class VehicleServiceRecordCreate(VehicleServiceRecordBase):
    record_to_finance: bool = False  # If True, also create a transaction in family finance


class VehicleServiceRecordResponse(VehicleServiceRecordBase):
    id: int
    vehicle_id: int
    created_by_id: Optional[int] = None
    created_at: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# VEHICLE SCHEMAS
# ==========================================
class VehicleBase(BaseModel):
    name: str
    make: str
    model: str
    year: Optional[int] = None
    color: Optional[str] = None
    license_plate: str
    vin: Optional[str] = None
    fuel_type: str = "diesel"  # petrol, diesel, lpg, cng, hybrid, electric, other
    tank_capacity_l: Optional[float] = 50.0
    engine_power_kw: Optional[int] = None
    engine_displacement_cc: Optional[int] = None
    transmission: str = "manual"  # manual, automatic
    current_mileage: int = 0
    primary_image_url: Optional[str] = None

    # Deadlines & Czech Regulations
    mot_expiry_date: Optional[str] = None  # YYYY-MM-DD (STK & Emise)
    vignette_expiry_date: Optional[str] = None  # YYYY-MM-DD
    vignette_type: Optional[str] = "1_year"  # 1_year, 30_days, 10_days, 1_day, none
    insurance_company: Optional[str] = None
    insurance_policy_number: Optional[str] = None
    insurance_expiry_date: Optional[str] = None
    insurance_assistance_phone: Optional[str] = None
    first_aid_kit_expiry_date: Optional[str] = None

    # Tires
    tire_type: Optional[str] = "winter"  # summer, winter, all_season
    tire_dimension: Optional[str] = None
    tire_tread_depth_mm: Optional[float] = None
    tire_storage_location: Optional[str] = None
    tire_last_swapped_date: Optional[str] = None

    # Maintenance Intervals
    oil_change_interval_km: Optional[int] = 15000
    oil_change_interval_months: Optional[int] = 12
    last_oil_change_mileage: Optional[int] = None
    last_oil_change_date: Optional[str] = None

    notes: Optional[str] = None
    is_favorite: Optional[bool] = False


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    name: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    color: Optional[str] = None
    license_plate: Optional[str] = None
    vin: Optional[str] = None
    fuel_type: Optional[str] = None
    tank_capacity_l: Optional[float] = None
    engine_power_kw: Optional[int] = None
    engine_displacement_cc: Optional[int] = None
    transmission: Optional[str] = None
    current_mileage: Optional[int] = None
    primary_image_url: Optional[str] = None

    mot_expiry_date: Optional[str] = None
    vignette_expiry_date: Optional[str] = None
    vignette_type: Optional[str] = None
    insurance_company: Optional[str] = None
    insurance_policy_number: Optional[str] = None
    insurance_expiry_date: Optional[str] = None
    insurance_assistance_phone: Optional[str] = None
    first_aid_kit_expiry_date: Optional[str] = None

    tire_type: Optional[str] = None
    tire_dimension: Optional[str] = None
    tire_tread_depth_mm: Optional[float] = None
    tire_storage_location: Optional[str] = None
    tire_last_swapped_date: Optional[str] = None

    oil_change_interval_km: Optional[int] = None
    oil_change_interval_months: Optional[int] = None
    last_oil_change_mileage: Optional[int] = None
    last_oil_change_date: Optional[str] = None

    notes: Optional[str] = None
    is_favorite: Optional[bool] = None


class VehicleMileageUpdate(BaseModel):
    mileage: int


class VehicleResponse(VehicleBase):
    id: int
    created_by_id: Optional[int] = None
    created_at: Optional[datetime.datetime] = None
    updated_at: Optional[datetime.datetime] = None

    # Calculated countdowns & statuses
    mot_days_remaining: Optional[int] = None
    mot_status: str = "ok"  # ok ( > 30 ), warning ( 0..30 ), expired ( < 0 )

    vignette_days_remaining: Optional[int] = None
    vignette_status: str = "ok"  # ok, warning, expired, none

    insurance_days_remaining: Optional[int] = None
    insurance_status: str = "ok"

    first_aid_days_remaining: Optional[int] = None

    oil_change_km_remaining: Optional[int] = None
    oil_change_days_remaining: Optional[int] = None
    oil_status: str = "ok"

    overall_status: str = "ok"  # ok, warning, critical

    # Aggregates
    average_consumption: Optional[float] = None  # l/100 km
    total_spent_fuel: float = 0.0
    total_spent_service: float = 0.0
    cost_per_km: Optional[float] = None

    refuelings: List[VehicleRefuelingResponse] = []
    service_records: List[VehicleServiceRecordResponse] = []

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# FLEET STATS SCHEMA
# ==========================================
class VehicleFleetStatsResponse(BaseModel):
    total_vehicles: int
    warning_deadlines_count: int
    expired_deadlines_count: int
    total_spent_fuel_all: float
    total_spent_service_all: float
    fleet_average_consumption: Optional[float] = None
