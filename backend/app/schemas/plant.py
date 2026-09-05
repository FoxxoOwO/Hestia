from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class PlantTaskBase(BaseModel):
    task_type: str  # water, fertilize, repot, mist, clean_leaves, custom
    due_date: str  # YYYY-MM-DD
    interval_days: int = 7
    notes: Optional[str] = None
    is_completed: bool = False

class PlantTaskCreate(PlantTaskBase):
    pass

class PlantTaskResponse(PlantTaskBase):
    id: int
    plant_id: int
    last_completed_at: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PlantLogEntryBase(BaseModel):
    entry_type: str = "photo"  # photo, note, repotting, ai_diagnosis
    image_url: Optional[str] = None
    title: str
    notes: Optional[str] = None

class PlantLogEntryCreate(PlantLogEntryBase):
    pass

class PlantLogEntryResponse(PlantLogEntryBase):
    id: int
    plant_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class PlantBase(BaseModel):
    name: str
    species_latin: Optional[str] = None
    species_czech: Optional[str] = None
    room: str = "living_room"
    light_requirement: str = "bright_indirect"
    watering_interval_days: int = 7
    winter_watering_interval_days: int = 14
    fertilizing_interval_days: int = 14
    misting_required: bool = False
    pot_diameter_cm: Optional[float] = None
    substrate_type: Optional[str] = None
    pet_toxicity: str = "safe"  # safe, toxic, mildly_toxic
    pet_toxicity_notes: Optional[str] = None
    primary_image_url: Optional[str] = None
    health_status: str = "healthy"  # healthy, needs_attention, sick
    health_notes: Optional[str] = None
    last_watered_date: Optional[str] = None
    next_watering_date: Optional[str] = None
    is_winter_mode: bool = False
    is_favorite: bool = False
    notes: Optional[str] = None

class PlantCreate(PlantBase):
    pass

class PlantUpdate(BaseModel):
    name: Optional[str] = None
    species_latin: Optional[str] = None
    species_czech: Optional[str] = None
    room: Optional[str] = None
    light_requirement: Optional[str] = None
    watering_interval_days: Optional[int] = None
    winter_watering_interval_days: Optional[int] = None
    fertilizing_interval_days: Optional[int] = None
    misting_required: Optional[bool] = None
    pot_diameter_cm: Optional[float] = None
    substrate_type: Optional[str] = None
    pet_toxicity: Optional[str] = None
    pet_toxicity_notes: Optional[str] = None
    primary_image_url: Optional[str] = None
    health_status: Optional[str] = None
    health_notes: Optional[str] = None
    last_watered_date: Optional[str] = None
    next_watering_date: Optional[str] = None
    is_winter_mode: Optional[bool] = None
    is_favorite: Optional[bool] = None
    notes: Optional[str] = None

class PlantResponse(PlantBase):
    id: int
    created_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    # Calculated fields
    days_until_watering: int = 0
    is_thirsty: bool = False
    watering_status: str = "ok"  # ok, due_today, overdue, watered_today
    
    tasks: List[PlantTaskResponse] = []
    log_entries: List[PlantLogEntryResponse] = []

    class Config:
        from_attributes = True


class PlantAiAnalyzeRequest(BaseModel):
    plant_name: Optional[str] = None
    image_base64: Optional[str] = None
    image_url: Optional[str] = None
    target_language: str = "cs"


class PlantAiExtracted(BaseModel):
    common_name: str
    species_latin: str
    species_czech: str
    description: str
    light_requirement: str  # direct_sun, bright_indirect, semi_shade, shade
    watering_interval_days: int
    winter_watering_interval_days: int
    fertilizing_interval_days: int
    misting_required: bool
    substrate_recommendation: str
    pet_toxicity: str  # safe, toxic, mildly_toxic
    pet_toxicity_details: str
    initial_health_assessment: str


class PlantDiagnosisRequest(BaseModel):
    plant_id: Optional[int] = None
    plant_name: Optional[str] = None
    symptoms_description: str
    image_base64: Optional[str] = None
    image_url: Optional[str] = None
    target_language: str = "cs"


class PlantDiagnosisResponse(BaseModel):
    plant_name: str
    diagnosis: str
    cause: str
    severity: str  # low, medium, high
    is_contagious: bool
    action_steps: List[str]
    prevention_tips: str


class PlantSitterScheduleItem(BaseModel):
    plant_id: int
    plant_name: str
    species: str
    room: str
    image_url: Optional[str] = None
    action_required: str  # water, do_not_touch, mist
    recommended_water_amount: str
    instructions: str
