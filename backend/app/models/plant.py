import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Plant(Base):
    __tablename__ = "plants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    species_latin = Column(String, nullable=True)
    species_czech = Column(String, nullable=True)
    room = Column(String, default="living_room")  # living_room, bedroom, kitchen, bathroom, balcony, hallway, office
    
    light_requirement = Column(String, default="bright_indirect")  # direct_sun, bright_indirect, semi_shade, shade
    watering_interval_days = Column(Integer, default=7)
    winter_watering_interval_days = Column(Integer, default=14)
    fertilizing_interval_days = Column(Integer, default=14)
    misting_required = Column(Boolean, default=False)
    
    pot_diameter_cm = Column(Float, nullable=True)
    substrate_type = Column(String, nullable=True)
    
    pet_toxicity = Column(String, default="safe")  # safe, toxic, mildly_toxic
    pet_toxicity_notes = Column(Text, nullable=True)
    
    primary_image_url = Column(String, nullable=True)
    health_status = Column(String, default="healthy")  # healthy, needs_attention, sick
    health_notes = Column(Text, nullable=True)
    
    last_watered_date = Column(String, nullable=True)  # YYYY-MM-DD
    next_watering_date = Column(String, nullable=True)  # YYYY-MM-DD
    is_winter_mode = Column(Boolean, default=False)
    is_favorite = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)

    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    tasks = relationship("PlantTask", back_populates="plant", cascade="all, delete-orphan")
    log_entries = relationship("PlantLogEntry", back_populates="plant", cascade="all, delete-orphan", order_by="desc(PlantLogEntry.created_at)")
    created_by = relationship("User")


class PlantTask(Base):
    __tablename__ = "plant_tasks"

    id = Column(Integer, primary_key=True, index=True)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False)
    task_type = Column(String, nullable=False)  # water, fertilize, repot, mist, clean_leaves, custom
    due_date = Column(String, nullable=False)  # YYYY-MM-DD
    last_completed_at = Column(String, nullable=True)  # YYYY-MM-DD
    interval_days = Column(Integer, default=7)
    notes = Column(String, nullable=True)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    plant = relationship("Plant", back_populates="tasks")


class PlantLogEntry(Base):
    __tablename__ = "plant_log_entries"

    id = Column(Integer, primary_key=True, index=True)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False)
    entry_type = Column(String, default="photo")  # photo, note, repotting, ai_diagnosis
    image_url = Column(String, nullable=True)
    title = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    plant = relationship("Plant", back_populates="log_entries")
