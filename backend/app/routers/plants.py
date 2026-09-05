import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.plant import Plant, PlantTask, PlantLogEntry
from app.models.user import User
from app.schemas.plant import (
    PlantCreate, PlantUpdate, PlantResponse,
    PlantTaskCreate, PlantTaskResponse,
    PlantLogEntryCreate, PlantLogEntryResponse,
    PlantSitterScheduleItem
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/plants", tags=["Plant Care & Botanist"])

def calculate_plant_watering(plant: Plant) -> dict:
    today = datetime.date.today()
    
    # Calculate next watering date if missing
    if not plant.next_watering_date:
        interval = (
            plant.winter_watering_interval_days
            if plant.is_winter_mode
            else plant.watering_interval_days
        ) or 7
        
        if plant.last_watered_date:
            last_dt = datetime.date.fromisoformat(plant.last_watered_date)
            next_dt = last_dt + datetime.timedelta(days=interval)
        else:
            next_dt = today
        plant.next_watering_date = next_dt.isoformat()

    try:
        next_dt = datetime.date.fromisoformat(plant.next_watering_date)
        delta_days = (next_dt - today).days
    except Exception:
        delta_days = 0

    is_thirsty = delta_days <= 0
    if plant.last_watered_date == today.isoformat():
        watering_status = "watered_today"
    elif delta_days < 0:
        watering_status = "overdue"
    elif delta_days == 0:
        watering_status = "due_today"
    else:
        watering_status = "ok"

    return {
        "days_until_watering": delta_days,
        "is_thirsty": is_thirsty,
        "watering_status": watering_status
    }

def format_plant_response(plant: Plant) -> dict:
    watering_meta = calculate_plant_watering(plant)
    
    return {
        "id": plant.id,
        "name": plant.name,
        "species_latin": plant.species_latin,
        "species_czech": plant.species_czech,
        "room": plant.room or "living_room",
        "light_requirement": plant.light_requirement or "bright_indirect",
        "watering_interval_days": plant.watering_interval_days or 7,
        "winter_watering_interval_days": plant.winter_watering_interval_days or 14,
        "fertilizing_interval_days": plant.fertilizing_interval_days or 14,
        "misting_required": plant.misting_required or False,
        "pot_diameter_cm": plant.pot_diameter_cm,
        "substrate_type": plant.substrate_type,
        "pet_toxicity": plant.pet_toxicity or "safe",
        "pet_toxicity_notes": plant.pet_toxicity_notes,
        "primary_image_url": plant.primary_image_url,
        "health_status": plant.health_status or "healthy",
        "health_notes": plant.health_notes,
        "last_watered_date": plant.last_watered_date,
        "next_watering_date": plant.next_watering_date,
        "is_winter_mode": plant.is_winter_mode or False,
        "is_favorite": plant.is_favorite or False,
        "notes": plant.notes,
        "created_by_id": plant.created_by_id,
        "created_at": plant.created_at,
        "updated_at": plant.updated_at,
        "days_until_watering": watering_meta["days_until_watering"],
        "is_thirsty": watering_meta["is_thirsty"],
        "watering_status": watering_meta["watering_status"],
        "tasks": plant.tasks or [],
        "log_entries": plant.log_entries or []
    }

@router.get("", response_model=List[PlantResponse])
def get_plants(
    room: Optional[str] = Query(None, description="living_room, bedroom, kitchen, bathroom, balcony, etc."),
    thirsty_only: Optional[bool] = Query(False, description="Pouze rostliny vyžadující zálivku dnes"),
    pet_toxicity: Optional[str] = Query(None, description="safe, toxic, mildly_toxic"),
    health_status: Optional[str] = Query(None, description="healthy, needs_attention, sick"),
    query: Optional[str] = Query(None, description="Search in name or species"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Plant)

    if room and room != "all":
        q = q.filter(Plant.room == room)
    if pet_toxicity:
        q = q.filter(Plant.pet_toxicity == pet_toxicity)
    if health_status:
        q = q.filter(Plant.health_status == health_status)
    if query:
        search = f"%{query.lower()}%"
        q = q.filter(
            or_(
                Plant.name.ilike(search),
                Plant.species_latin.ilike(search),
                Plant.species_czech.ilike(search)
            )
        )

    plants = q.order_by(Plant.name.asc()).all()
    results = [format_plant_response(p) for p in plants]

    if thirsty_only:
        results = [r for r in results if r["is_thirsty"]]

    return results

@router.get("/plant-sitter", response_model=List[PlantSitterScheduleItem])
def get_plant_sitter_checklist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plants = db.query(Plant).all()
    schedule = []

    for plant in plants:
        interval = (
            plant.winter_watering_interval_days if plant.is_winter_mode else plant.watering_interval_days
        ) or 7

        if interval >= 14:
            action = "do_not_touch"
            water_amt = "Nezalévat"
            instructions = "Během týdenní nepřítomnosti není nutné zalévat, rostlina snáší sucho."
        elif interval <= 5:
            action = "water"
            water_amt = "cca 200–300 ml 2x týdně"
            instructions = f"Rostlina je žíznivá, zalijte v úterý a v pátek odstátou vodou."
        else:
            action = "water"
            water_amt = "cca 250 ml v polovině týdne"
            instructions = "Jednou za týden zkontrolujte prstem vlhkost substrátu a mírně zalijte."

        if plant.misting_required:
            instructions += " Má ráda orosení listů rozprašovačem."

        schedule.append(
            PlantSitterScheduleItem(
                plant_id=plant.id,
                plant_name=plant.name,
                species=plant.species_czech or plant.species_latin or plant.name,
                room=plant.room,
                image_url=plant.primary_image_url,
                action_required=action,
                recommended_water_amount=water_amt,
                instructions=instructions
            )
        )

    return schedule

@router.get("/{plant_id}", response_model=PlantResponse)
def get_plant(
    plant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Rostlina nebyla nalezena")
    return format_plant_response(plant)

@router.post("", response_model=PlantResponse, status_code=status.HTTP_201_CREATED)
def create_plant(
    plant_in: PlantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = datetime.date.today()
    interval = plant_in.watering_interval_days or 7

    # Calculate default watering dates if not specified
    last_watered = plant_in.last_watered_date or today.isoformat()
    next_watered = plant_in.next_watering_date or (today + datetime.timedelta(days=interval)).isoformat()

    new_plant = Plant(
        name=plant_in.name,
        species_latin=plant_in.species_latin,
        species_czech=plant_in.species_czech,
        room=plant_in.room,
        light_requirement=plant_in.light_requirement,
        watering_interval_days=plant_in.watering_interval_days,
        winter_watering_interval_days=plant_in.winter_watering_interval_days,
        fertilizing_interval_days=plant_in.fertilizing_interval_days,
        misting_required=plant_in.misting_required,
        pot_diameter_cm=plant_in.pot_diameter_cm,
        substrate_type=plant_in.substrate_type,
        pet_toxicity=plant_in.pet_toxicity,
        pet_toxicity_notes=plant_in.pet_toxicity_notes,
        primary_image_url=plant_in.primary_image_url,
        health_status=plant_in.health_status,
        health_notes=plant_in.health_notes,
        last_watered_date=last_watered,
        next_watering_date=next_watered,
        is_winter_mode=plant_in.is_winter_mode,
        is_favorite=plant_in.is_favorite,
        notes=plant_in.notes,
        created_by_id=current_user.id
    )
    db.add(new_plant)
    db.commit()
    db.refresh(new_plant)

    # Automatically initialize default tasks
    water_task = PlantTask(
        plant_id=new_plant.id,
        task_type="water",
        due_date=next_watered,
        interval_days=interval,
        notes="Běžná zálivka odstátou vodou"
    )
    fert_interval = plant_in.fertilizing_interval_days or 14
    fert_task = PlantTask(
        plant_id=new_plant.id,
        task_type="fertilize",
        due_date=(today + datetime.timedelta(days=fert_interval)).isoformat(),
        interval_days=fert_interval,
        notes="Hnojivo pro pokojové rostliny"
    )
    db.add_all([water_task, fert_task])

    # Initial log entry
    if plant_in.primary_image_url:
        initial_log = PlantLogEntry(
            plant_id=new_plant.id,
            entry_type="photo",
            image_url=plant_in.primary_image_url,
            title="Přidání rostliny do Hestie",
            notes="První záznam v rodinném květináři."
        )
        db.add(initial_log)

    db.commit()
    db.refresh(new_plant)
    return format_plant_response(new_plant)

@router.put("/{plant_id}", response_model=PlantResponse)
def update_plant(
    plant_id: int,
    plant_in: PlantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Rostlina nebyla nalezena")

    update_data = plant_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(plant, key, value)

    db.commit()
    db.refresh(plant)
    return format_plant_response(plant)

@router.delete("/{plant_id}")
def delete_plant(
    plant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Rostlina nebyla nalezena")
    db.delete(plant)
    db.commit()
    return {"status": "success", "message": "Rostlina byla odebrána"}

@router.post("/{plant_id}/water", response_model=PlantResponse)
def water_plant_now(
    plant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Rostlina nebyla nalezena")

    today = datetime.date.today()
    interval = (
        plant.winter_watering_interval_days if plant.is_winter_mode else plant.watering_interval_days
    ) or 7

    plant.last_watered_date = today.isoformat()
    next_date = today + datetime.timedelta(days=interval)
    plant.next_watering_date = next_date.isoformat()

    # Update watering task if exists
    water_task = db.query(PlantTask).filter(
        PlantTask.plant_id == plant.id,
        PlantTask.task_type == "water"
    ).first()

    if water_task:
        water_task.last_completed_at = today.isoformat()
        water_task.due_date = next_date.isoformat()
        water_task.is_completed = False

    # Add log entry
    log_entry = PlantLogEntry(
        plant_id=plant.id,
        entry_type="note",
        title="Zalito",
        notes=f"Rostlina byla zalita dne {today.strftime('%d.%m.%Y')}. Další zálivka za {interval} dní."
    )
    db.add(log_entry)

    db.commit()
    db.refresh(plant)
    return format_plant_response(plant)

@router.post("/{plant_id}/toggle-winter-mode", response_model=PlantResponse)
def toggle_winter_mode(
    plant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Rostlina nebyla nalezena")

    plant.is_winter_mode = not plant.is_winter_mode
    
    # Recalculate next watering date
    today = datetime.date.today()
    interval = (
        plant.winter_watering_interval_days if plant.is_winter_mode else plant.watering_interval_days
    ) or 7

    if plant.last_watered_date:
        last_dt = datetime.date.fromisoformat(plant.last_watered_date)
        plant.next_watering_date = (last_dt + datetime.timedelta(days=interval)).isoformat()
    else:
        plant.next_watering_date = (today + datetime.timedelta(days=interval)).isoformat()

    db.commit()
    db.refresh(plant)
    return format_plant_response(plant)

@router.post("/{plant_id}/toggle-favorite", response_model=PlantResponse)
def toggle_favorite_plant(
    plant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Rostlina nebyla nalezena")

    plant.is_favorite = not plant.is_favorite
    db.commit()
    db.refresh(plant)
    return format_plant_response(plant)

@router.post("/{plant_id}/tasks", response_model=PlantTaskResponse)
def create_plant_task(
    plant_id: int,
    task_in: PlantTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Rostlina nebyla nalezena")

    new_task = PlantTask(
        plant_id=plant.id,
        task_type=task_in.task_type,
        due_date=task_in.due_date,
        interval_days=task_in.interval_days,
        notes=task_in.notes,
        is_completed=False
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@router.post("/{plant_id}/complete-task/{task_id}", response_model=PlantTaskResponse)
def complete_plant_task(
    plant_id: int,
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(PlantTask).filter(PlantTask.id == task_id, PlantTask.plant_id == plant_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Úkol nebyl nalezen")

    today = datetime.date.today()
    task.last_completed_at = today.isoformat()
    # Schedule next date
    if task.interval_days and task.interval_days > 0:
        task.due_date = (today + datetime.timedelta(days=task.interval_days)).isoformat()
        task.is_completed = False
    else:
        task.is_completed = True

    db.commit()
    db.refresh(task)
    return task

@router.post("/{plant_id}/logs", response_model=PlantLogEntryResponse)
def add_plant_log_entry(
    plant_id: int,
    log_in: PlantLogEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Rostlina nebyla nalezena")

    entry = PlantLogEntry(
        plant_id=plant.id,
        entry_type=log_in.entry_type,
        image_url=log_in.image_url,
        title=log_in.title,
        notes=log_in.notes
    )
    db.add(entry)

    # If new photo uploaded, optionally update primary photo
    if log_in.image_url and (log_in.entry_type == "photo" or not plant.primary_image_url):
        plant.primary_image_url = log_in.image_url

    db.commit()
    db.refresh(entry)
    return entry
