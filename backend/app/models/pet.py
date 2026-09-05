import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Pet(Base):
    __tablename__ = "pets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    species = Column(String, default="dog")  # dog, cat, rabbit, bird, rodent, reptile, other
    breed = Column(String, nullable=True)
    birth_date = Column(String, nullable=True)  # YYYY-MM-DD
    gender = Column(String, default="unknown")  # male, female, unknown
    is_neutered = Column(Boolean, default=False)
    color = Column(String, nullable=True)
    microchip_number = Column(String, nullable=True, index=True)
    passport_number = Column(String, nullable=True)
    primary_image_url = Column(String, nullable=True)

    # Food & Dietary info
    dietary_needs = Column(Text, nullable=True)  # Krmná dávka, oblíbené granule / konzerva
    allergies_and_intolerances = Column(Text, nullable=True)  # Po čem není dobře, zakázané potraviny

    # Vet contacts
    vet_name = Column(String, nullable=True)
    vet_clinic = Column(String, nullable=True)
    vet_phone = Column(String, nullable=True)
    vet_address = Column(String, nullable=True)
    emergency_vet_phone = Column(String, nullable=True)
    emergency_vet_clinic = Column(String, nullable=True)

    # Feeding status
    last_fed_at = Column(String, nullable=True)  # ISO or YYYY-MM-DD HH:MM
    last_fed_by_name = Column(String, nullable=True)

    is_favorite = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)

    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    medical_records = relationship("PetMedicalRecord", back_populates="pet", cascade="all, delete-orphan", order_by="desc(PetMedicalRecord.performed_date)")
    medications = relationship("PetMedication", back_populates="pet", cascade="all, delete-orphan")
    weight_logs = relationship("PetWeightLog", back_populates="pet", cascade="all, delete-orphan", order_by="desc(PetWeightLog.recorded_date)")
    tasks = relationship("PetTask", back_populates="pet", cascade="all, delete-orphan")
    log_entries = relationship("PetLogEntry", back_populates="pet", cascade="all, delete-orphan", order_by="desc(PetLogEntry.created_at)")
    created_by = relationship("User")


class PetMedicalRecord(Base):
    __tablename__ = "pet_medical_records"

    id = Column(Integer, primary_key=True, index=True)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False)
    record_type = Column(String, nullable=False)  # vaccination, deworming, antiparasitic, checkup, surgery, medication, other
    title = Column(String, nullable=False)
    performed_date = Column(String, nullable=False)  # YYYY-MM-DD
    valid_until = Column(String, nullable=True)  # YYYY-MM-DD
    batch_number = Column(String, nullable=True)
    veterinarian = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    document_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    pet = relationship("Pet", back_populates="medical_records")


class PetMedication(Base):
    __tablename__ = "pet_medications"

    id = Column(Integer, primary_key=True, index=True)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False)
    name = Column(String, nullable=False)
    dosage = Column(String, nullable=False)  # např. "1 tableta"
    frequency = Column(String, nullable=False)  # např. "2x denně po jídle"
    start_date = Column(String, nullable=True)  # YYYY-MM-DD
    end_date = Column(String, nullable=True)  # YYYY-MM-DD
    is_active = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    pet = relationship("Pet", back_populates="medications")


class PetWeightLog(Base):
    __tablename__ = "pet_weight_logs"

    id = Column(Integer, primary_key=True, index=True)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False)
    weight_kg = Column(Float, nullable=False)
    recorded_date = Column(String, nullable=False)  # YYYY-MM-DD
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    pet = relationship("Pet", back_populates="weight_logs")


class PetTask(Base):
    __tablename__ = "pet_tasks"

    id = Column(Integer, primary_key=True, index=True)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False)
    task_type = Column(String, nullable=False)  # vaccination, deworming, antiparasitic, vet_visit, grooming, medication, feeding, custom
    title = Column(String, nullable=False)
    due_date = Column(String, nullable=False)  # YYYY-MM-DD
    interval_days = Column(Integer, default=0)
    is_completed = Column(Boolean, default=False)
    last_completed_at = Column(String, nullable=True)  # YYYY-MM-DD
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    pet = relationship("Pet", back_populates="tasks")


class PetLogEntry(Base):
    __tablename__ = "pet_log_entries"

    id = Column(Integer, primary_key=True, index=True)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False)
    entry_type = Column(String, nullable=False)  # photo, note, milestone, symptom_check, vet_visit
    title = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    pet = relationship("Pet", back_populates="log_entries")
