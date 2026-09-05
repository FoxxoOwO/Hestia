from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class PetMedicalRecordBase(BaseModel):
    record_type: str  # vaccination, deworming, antiparasitic, checkup, surgery, medication, other
    title: str
    performed_date: str  # YYYY-MM-DD
    valid_until: Optional[str] = None  # YYYY-MM-DD
    batch_number: Optional[str] = None
    veterinarian: Optional[str] = None
    notes: Optional[str] = None
    document_url: Optional[str] = None

class PetMedicalRecordCreate(PetMedicalRecordBase):
    pass

class PetMedicalRecordResponse(PetMedicalRecordBase):
    id: int
    pet_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class PetMedicationBase(BaseModel):
    name: str
    dosage: str
    frequency: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_active: bool = True
    notes: Optional[str] = None

class PetMedicationCreate(PetMedicationBase):
    pass

class PetMedicationResponse(PetMedicationBase):
    id: int
    pet_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class PetWeightLogBase(BaseModel):
    weight_kg: float
    recorded_date: str  # YYYY-MM-DD
    notes: Optional[str] = None

class PetWeightLogCreate(PetWeightLogBase):
    pass

class PetWeightLogResponse(PetWeightLogBase):
    id: int
    pet_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class PetTaskBase(BaseModel):
    task_type: str  # vaccination, deworming, antiparasitic, vet_visit, grooming, medication, feeding, custom
    title: str
    due_date: str  # YYYY-MM-DD
    interval_days: int = 0
    notes: Optional[str] = None

class PetTaskCreate(PetTaskBase):
    pass

class PetTaskResponse(PetTaskBase):
    id: int
    pet_id: int
    is_completed: bool = False
    last_completed_at: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PetLogEntryBase(BaseModel):
    entry_type: str  # photo, note, milestone, symptom_check, vet_visit
    title: str
    notes: Optional[str] = None
    image_url: Optional[str] = None

class PetLogEntryCreate(PetLogEntryBase):
    pass

class PetLogEntryResponse(PetLogEntryBase):
    id: int
    pet_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class PetBase(BaseModel):
    name: str
    species: str = "dog"  # dog, cat, rabbit, bird, rodent, reptile, other
    breed: Optional[str] = None
    birth_date: Optional[str] = None  # YYYY-MM-DD
    gender: str = "unknown"  # male, female, unknown
    is_neutered: bool = False
    color: Optional[str] = None
    microchip_number: Optional[str] = None
    passport_number: Optional[str] = None
    primary_image_url: Optional[str] = None
    
    dietary_needs: Optional[str] = None
    allergies_and_intolerances: Optional[str] = None

    vet_name: Optional[str] = None
    vet_clinic: Optional[str] = None
    vet_phone: Optional[str] = None
    vet_address: Optional[str] = None
    emergency_vet_phone: Optional[str] = None
    emergency_vet_clinic: Optional[str] = None

    last_fed_at: Optional[str] = None
    last_fed_by_name: Optional[str] = None
    is_favorite: bool = False
    notes: Optional[str] = None


class PetCreate(PetBase):
    initial_weight_kg: Optional[float] = None


class PetUpdate(BaseModel):
    name: Optional[str] = None
    species: Optional[str] = None
    breed: Optional[str] = None
    birth_date: Optional[str] = None
    gender: Optional[str] = None
    is_neutered: Optional[bool] = None
    color: Optional[str] = None
    microchip_number: Optional[str] = None
    passport_number: Optional[str] = None
    primary_image_url: Optional[str] = None
    dietary_needs: Optional[str] = None
    allergies_and_intolerances: Optional[str] = None
    vet_name: Optional[str] = None
    vet_clinic: Optional[str] = None
    vet_phone: Optional[str] = None
    vet_address: Optional[str] = None
    emergency_vet_phone: Optional[str] = None
    emergency_vet_clinic: Optional[str] = None
    last_fed_at: Optional[str] = None
    last_fed_by_name: Optional[str] = None
    is_favorite: Optional[bool] = None
    notes: Optional[str] = None


class PetResponse(PetBase):
    id: int
    created_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    # Calculated helpers
    age_formatted: str = ""
    latest_weight_kg: Optional[float] = None
    has_upcoming_vet_task: bool = False

    medical_records: List[PetMedicalRecordResponse] = []
    medications: List[PetMedicationResponse] = []
    weight_logs: List[PetWeightLogResponse] = []
    tasks: List[PetTaskResponse] = []
    log_entries: List[PetLogEntryResponse] = []

    class Config:
        from_attributes = True


# AI Schemas
class PetFoodSafetyCheckRequest(BaseModel):
    species: str = "dog"  # dog, cat
    food_name: str
    target_language: str = "cs"


class PetFoodSafetyCheckResponse(BaseModel):
    food_name: str
    species: str
    safety_level: str  # safe, caution, toxic
    headline: str
    risk_description: str
    toxic_dose_info: Optional[str] = None
    symptoms_of_poisoning: List[str] = []
    first_aid_action: str


class PetSymptomCheckRequest(BaseModel):
    pet_id: Optional[int] = None
    pet_name: Optional[str] = None
    pet_species: Optional[str] = "dog"
    pet_age: Optional[str] = None
    symptoms_description: str
    image_base64: Optional[str] = None
    image_url: Optional[str] = None
    target_language: str = "cs"


class PetSymptomCheckResponse(BaseModel):
    pet_name: Optional[str] = None
    severity: str  # low, medium, emergency
    assessment_headline: str
    possible_causes: List[str] = []
    urgency_message: str
    action_steps: List[str] = []
    red_flag_symptoms: List[str] = []
    home_care_advice: str


# Sitter & SOS Schemas
class PetSitterProfileResponse(BaseModel):
    pet_id: int
    name: str
    species: str
    breed: Optional[str] = None
    age: str
    gender: str
    color: Optional[str] = None
    microchip_number: Optional[str] = None
    primary_image_url: Optional[str] = None
    feeding_routine: str
    allergies_warning: str
    active_medications: List[Dict[str, Any]] = []
    vet_contacts: Dict[str, Any] = {}
    daily_routine_notes: str


class PetSosFlyerResponse(BaseModel):
    pet_id: int
    name: str
    species: str
    breed: Optional[str] = None
    color: Optional[str] = None
    microchip_number: Optional[str] = None
    image_url: Optional[str] = None
    owner_contact_name: str
    owner_contact_phone: str
    last_seen_date: str
    distinctive_features: Optional[str] = None
    reward_note: Optional[str] = None
