import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.user import User
from app.models.pet import Pet, PetMedicalRecord, PetMedication, PetWeightLog, PetTask, PetLogEntry
from app.models.shopping import ShoppingItem
from app.schemas.pet import (
    PetCreate, PetUpdate, PetResponse,
    PetMedicalRecordCreate, PetMedicalRecordResponse,
    PetMedicationCreate, PetMedicationResponse,
    PetWeightLogCreate, PetWeightLogResponse,
    PetTaskCreate, PetTaskResponse,
    PetLogEntryCreate, PetLogEntryResponse,
    PetSitterProfileResponse, PetSosFlyerResponse
)
from app.routers.auth import get_current_user

router = APIRouter(prefix="/pets", tags=["pets"])


def calculate_age_formatted(birth_date_str: Optional[str]) -> str:
    if not birth_date_str:
        return "Neznámý věk"
    try:
        birth_date = datetime.date.fromisoformat(birth_date_str)
        today = datetime.date.today()
        
        years = today.year - birth_date.year
        months = today.month - birth_date.month
        if today.day < birth_date.day:
            months -= 1
        if months < 0:
            years -= 1
            months += 12

        if years <= 0:
            if months <= 0:
                days = (today - birth_date).days
                return f"{days} dní"
            elif months == 1:
                return "1 měsíc"
            elif 2 <= months <= 4:
                return f"{months} měsíce"
            else:
                return f"{months} měsíců"
        else:
            year_word = "rok" if years == 1 else ("roky" if 2 <= years <= 4 else "let")
            if months == 0:
                return f"{years} {year_word}"
            month_word = "měsíc" if months == 1 else ("měsíce" if 2 <= months <= 4 else "měsíců")
            return f"{years} {year_word} a {months} {month_word}"
    except Exception:
        return "Neznámý věk"


def format_pet_response(pet: Pet) -> dict:
    latest_weight = None
    if pet.weight_logs:
        sorted_weights = sorted(pet.weight_logs, key=lambda w: w.recorded_date, reverse=True)
        if sorted_weights:
            latest_weight = sorted_weights[0].weight_kg

    has_upcoming_vet = any(
        not t.is_completed and t.task_type in ["vaccination", "deworming", "vet_visit"]
        for t in (pet.tasks or [])
    )

    return {
        "id": pet.id,
        "name": pet.name,
        "species": pet.species or "dog",
        "breed": pet.breed,
        "birth_date": pet.birth_date,
        "gender": pet.gender or "unknown",
        "is_neutered": pet.is_neutered or False,
        "color": pet.color,
        "microchip_number": pet.microchip_number,
        "passport_number": pet.passport_number,
        "primary_image_url": pet.primary_image_url,
        "dietary_needs": pet.dietary_needs,
        "allergies_and_intolerances": pet.allergies_and_intolerances,
        "vet_name": pet.vet_name,
        "vet_clinic": pet.vet_clinic,
        "vet_phone": pet.vet_phone,
        "vet_address": pet.vet_address,
        "emergency_vet_phone": pet.emergency_vet_phone,
        "emergency_vet_clinic": pet.emergency_vet_clinic,
        "last_fed_at": pet.last_fed_at,
        "last_fed_by_name": pet.last_fed_by_name,
        "is_favorite": pet.is_favorite or False,
        "notes": pet.notes,
        "created_by_id": pet.created_by_id,
        "created_at": pet.created_at,
        "updated_at": pet.updated_at,
        "age_formatted": calculate_age_formatted(pet.birth_date),
        "latest_weight_kg": latest_weight,
        "has_upcoming_vet_task": has_upcoming_vet,
        "medical_records": pet.medical_records or [],
        "medications": pet.medications or [],
        "weight_logs": pet.weight_logs or [],
        "tasks": pet.tasks or [],
        "log_entries": pet.log_entries or []
    }


@router.get("", response_model=List[PetResponse])
def get_pets(
    species: Optional[str] = Query(None, description="dog, cat, rabbit, bird, etc."),
    favorite_only: Optional[bool] = Query(False),
    query: Optional[str] = Query(None, description="Search in name or breed"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Pet)

    if species and species != "all":
        q = q.filter(Pet.species == species)
    if favorite_only:
        q = q.filter(Pet.is_favorite == True)
    if query:
        search = f"%{query.lower()}%"
        q = q.filter(
            or_(
                Pet.name.ilike(search),
                Pet.breed.ilike(search)
            )
        )

    pets = q.order_by(Pet.name.asc()).all()
    return [format_pet_response(p) for p in pets]


@router.get("/{pet_id}", response_model=PetResponse)
def get_pet(
    pet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Mazlíček nebyl nalezen")
    return format_pet_response(pet)


@router.post("", response_model=PetResponse, status_code=status.HTTP_201_CREATED)
def create_pet(
    pet_in: PetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_pet = Pet(
        name=pet_in.name,
        species=pet_in.species,
        breed=pet_in.breed,
        birth_date=pet_in.birth_date,
        gender=pet_in.gender,
        is_neutered=pet_in.is_neutered,
        color=pet_in.color,
        microchip_number=pet_in.microchip_number,
        passport_number=pet_in.passport_number,
        primary_image_url=pet_in.primary_image_url,
        dietary_needs=pet_in.dietary_needs,
        allergies_and_intolerances=pet_in.allergies_and_intolerances,
        vet_name=pet_in.vet_name,
        vet_clinic=pet_in.vet_clinic,
        vet_phone=pet_in.vet_phone,
        vet_address=pet_in.vet_address,
        emergency_vet_phone=pet_in.emergency_vet_phone,
        emergency_vet_clinic=pet_in.emergency_vet_clinic,
        last_fed_at=pet_in.last_fed_at,
        last_fed_by_name=pet_in.last_fed_by_name,
        is_favorite=pet_in.is_favorite,
        notes=pet_in.notes,
        created_by_id=current_user.id
    )
    db.add(new_pet)
    db.flush()

    # If initial weight is provided, create first weight record
    if pet_in.initial_weight_kg and pet_in.initial_weight_kg > 0:
        weight_entry = PetWeightLog(
            pet_id=new_pet.id,
            weight_kg=pet_in.initial_weight_kg,
            recorded_date=datetime.date.today().isoformat(),
            notes="Úvodní vážení při založení profilu"
        )
        db.add(weight_entry)

    # Initial diary log entry
    init_log = PetLogEntry(
        pet_id=new_pet.id,
        entry_type="milestone",
        title=f"Vítej v rodině, {new_pet.name}!",
        notes=f"Profil mazlíčka založen v rodinném systému Hestia."
    )
    db.add(init_log)

    db.commit()
    db.refresh(new_pet)
    return format_pet_response(new_pet)


@router.put("/{pet_id}", response_model=PetResponse)
def update_pet(
    pet_id: int,
    pet_in: PetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Mazlíček nebyl nalezen")

    update_data = pet_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(pet, key, value)

    db.commit()
    db.refresh(pet)
    return format_pet_response(pet)


@router.delete("/{pet_id}")
def delete_pet(
    pet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Mazlíček nebyl nalezen")
    db.delete(pet)
    db.commit()
    return {"status": "success", "message": "Profil mazlíčka byl smazán"}


@router.post("/{pet_id}/feed", response_model=PetResponse)
def record_feeding(
    pet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Mazlíček nebyl nalezen")

    now = datetime.datetime.now()
    now_formatted = now.strftime("%d.%m. %H:%M")
    user_name = current_user.display_name or current_user.username

    pet.last_fed_at = now.isoformat()
    pet.last_fed_by_name = user_name

    # Add quick entry into diary
    log = PetLogEntry(
        pet_id=pet.id,
        entry_type="note",
        title="Nakrmeno",
        notes=f"Mazlíčka nakrmil(a) {user_name} v {now.strftime('%H:%M')}."
    )
    db.add(log)

    db.commit()
    db.refresh(pet)
    return format_pet_response(pet)


@router.post("/{pet_id}/toggle-favorite", response_model=PetResponse)
def toggle_favorite(
    pet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Mazlíček nebyl nalezen")
    pet.is_favorite = not pet.is_favorite
    db.commit()
    db.refresh(pet)
    return format_pet_response(pet)


@router.post("/{pet_id}/medical", response_model=PetMedicalRecordResponse)
def add_medical_record(
    pet_id: int,
    record_in: PetMedicalRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Mazlíček nebyl nalezen")

    record = PetMedicalRecord(
        pet_id=pet.id,
        record_type=record_in.record_type,
        title=record_in.title,
        performed_date=record_in.performed_date,
        valid_until=record_in.valid_until,
        batch_number=record_in.batch_number,
        veterinarian=record_in.veterinarian,
        notes=record_in.notes,
        document_url=record_in.document_url
    )
    db.add(record)

    # If valid_until is set, automatically create a task for revaccination
    if record_in.valid_until and record_in.record_type in ["vaccination", "deworming", "antiparasitic"]:
        revax_task = PetTask(
            pet_id=pet.id,
            task_type=record_in.record_type,
            title=f"Přeočkování / kontrola: {record_in.title}",
            due_date=record_in.valid_until,
            notes=f"Navazuje na záznam ze dne {record_in.performed_date}"
        )
        db.add(revax_task)

    db.commit()
    db.refresh(record)
    return record


@router.post("/{pet_id}/medications", response_model=PetMedicationResponse)
def add_medication(
    pet_id: int,
    med_in: PetMedicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Mazlíček nebyl nalezen")

    med = PetMedication(
        pet_id=pet.id,
        name=med_in.name,
        dosage=med_in.dosage,
        frequency=med_in.frequency,
        start_date=med_in.start_date,
        end_date=med_in.end_date,
        is_active=med_in.is_active,
        notes=med_in.notes
    )
    db.add(med)
    db.commit()
    db.refresh(med)
    return med


@router.delete("/{pet_id}/medications/{med_id}")
def delete_medication(
    pet_id: int,
    med_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    med = db.query(PetMedication).filter(PetMedication.id == med_id, PetMedication.pet_id == pet_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Lék nebyl nalezen")
    db.delete(med)
    db.commit()
    return {"status": "success", "message": "Lék byl odebrán"}


@router.post("/{pet_id}/weight", response_model=PetWeightLogResponse)
def add_weight_log(
    pet_id: int,
    weight_in: PetWeightLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Mazlíček nebyl nalezen")

    weight_log = PetWeightLog(
        pet_id=pet.id,
        weight_kg=weight_in.weight_kg,
        recorded_date=weight_in.recorded_date,
        notes=weight_in.notes
    )
    db.add(weight_log)
    db.commit()
    db.refresh(weight_log)
    return weight_log


@router.post("/{pet_id}/tasks", response_model=PetTaskResponse)
def create_pet_task(
    pet_id: int,
    task_in: PetTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Mazlíček nebyl nalezen")

    task = PetTask(
        pet_id=pet.id,
        task_type=task_in.task_type,
        title=task_in.title,
        due_date=task_in.due_date,
        interval_days=task_in.interval_days,
        notes=task_in.notes,
        is_completed=False
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.post("/{pet_id}/complete-task/{task_id}", response_model=PetTaskResponse)
def complete_pet_task(
    pet_id: int,
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(PetTask).filter(PetTask.id == task_id, PetTask.pet_id == pet_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Úkol nebyl nalezen")

    today = datetime.date.today()
    task.last_completed_at = today.isoformat()

    if task.interval_days and task.interval_days > 0:
        task.due_date = (today + datetime.timedelta(days=task.interval_days)).isoformat()
        task.is_completed = False
    else:
        task.is_completed = True

    db.commit()
    db.refresh(task)
    return task


@router.post("/{pet_id}/logs", response_model=PetLogEntryResponse)
def add_pet_log(
    pet_id: int,
    log_in: PetLogEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Mazlíček nebyl nalezen")

    entry = PetLogEntry(
        pet_id=pet.id,
        entry_type=log_in.entry_type,
        title=log_in.title,
        notes=log_in.notes,
        image_url=log_in.image_url
    )
    db.add(entry)

    # If photo provided and pet has no avatar, set avatar
    if log_in.image_url and not pet.primary_image_url:
        pet.primary_image_url = log_in.image_url

    db.commit()
    db.refresh(entry)
    return entry


@router.get("/{pet_id}/sitter-profile", response_model=PetSitterProfileResponse)
def get_pet_sitter_profile(
    pet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Mazlíček nebyl nalezen")

    active_meds = [
        {
            "name": m.name,
            "dosage": m.dosage,
            "frequency": m.frequency,
            "notes": m.notes
        }
        for m in (pet.medications or []) if m.is_active
    ]

    vet_contacts = {
        "vet_name": pet.vet_name,
        "vet_clinic": pet.vet_clinic,
        "vet_phone": pet.vet_phone,
        "vet_address": pet.vet_address,
        "emergency_vet_phone": pet.emergency_vet_phone,
        "emergency_vet_clinic": pet.emergency_vet_clinic
    }

    return {
        "pet_id": pet.id,
        "name": pet.name,
        "species": pet.species or "pes",
        "breed": pet.breed,
        "age": calculate_age_formatted(pet.birth_date),
        "gender": pet.gender or "unknown",
        "color": pet.color,
        "microchip_number": pet.microchip_number,
        "primary_image_url": pet.primary_image_url,
        "feeding_routine": pet.dietary_needs or "Standardní krmení 2x denně (ráno a večer).",
        "allergies_warning": pet.allergies_and_intolerances or "Žádné známé potravinové alergie.",
        "active_medications": active_meds,
        "vet_contacts": vet_contacts,
        "daily_routine_notes": pet.notes or "Pravidelné venčení a čerstvá voda v misce."
    }


@router.get("/{pet_id}/sos-flyer", response_model=PetSosFlyerResponse)
def get_sos_flyer(
    pet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Mazlíček nebyl nalezen")

    owner_phone = current_user.phone if hasattr(current_user, "phone") and current_user.phone else "+420 777 000 000"
    owner_name = current_user.display_name or current_user.username

    return {
        "pet_id": pet.id,
        "name": pet.name,
        "species": pet.species,
        "breed": pet.breed,
        "color": pet.color,
        "microchip_number": pet.microchip_number,
        "image_url": pet.primary_image_url,
        "owner_contact_name": owner_name,
        "owner_contact_phone": owner_phone,
        "last_seen_date": datetime.date.today().isoformat(),
        "distinctive_features": pet.notes or "Přátelský, reaguje na své jméno.",
        "reward_note": "Finanční odměna nálezci garantována!"
    }


@router.post("/{pet_id}/add-supply-to-shopping")
def add_supply_to_shopping_list(
    pet_id: int,
    item_name: str = Query(..., description="Název potřeby (granule, konzervy, odčervení)"),
    amount: float = Query(1.0),
    unit: str = Query("balení"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Mazlíček nebyl nalezen")

    full_name = f"{item_name} ({pet.name})"
    shop_item = ShoppingItem(
        name=full_name,
        amount=amount,
        unit=unit,
        category="household",
        is_checked=False,
        added_by_id=current_user.id
    )
    db.add(shop_item)
    db.commit()
    db.refresh(shop_item)

    return {
        "status": "success",
        "message": f"Položka '{full_name}' byla přidána do rodinného nákupního seznamu.",
        "shopping_item_id": shop_item.id
    }
