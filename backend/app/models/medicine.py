import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)  # e.g. "Paralen 500", "Ibalgin 400", "Olynth 0,1%"
    active_substance = Column(String, nullable=True, index=True)  # e.g. "paracetamol", "ibuprofen", "xylometazolin"
    form = Column(String, default="tablets")  # tablets, syrup, drops, ointment, spray, injection, dressing, device, other
    category = Column(String, default="pain_fever")  # pain_fever, cold_cough, digestion, allergy, injury_disinfection, eyes_ears, chronic_rx, vitamins, first_aid_material, other
    location = Column(String, default="bathroom")  # bathroom, kitchen, travel_kit, cottage, car, bedroom, other
    
    # Quantities and packaging
    package_size = Column(String, nullable=True)  # e.g. "24 tablet", "100 ml", "1 ks"
    current_quantity = Column(Float, default=1.0)
    unit = Column(String, default="ks")  # tablety, ml, ks, dávky
    min_quantity_warning = Column(Float, default=0.0)  # alerts when current_quantity <= min_quantity_warning

    # Expiry & Opening
    expiration_date = Column(String, nullable=True, index=True)  # YYYY-MM-DD
    opened_date = Column(String, nullable=True)  # YYYY-MM-DD
    validity_months_after_opening = Column(Integer, nullable=True)  # e.g. 1 month for eye drops, 6 months for syrup

    # Medical & Usage attributes
    is_prescription = Column(Boolean, default=False)
    requires_refrigeration = Column(Boolean, default=False)  # Skladovat v lednici (2-8 °C)
    age_group = Column(String, default="all")  # all, adults_only, kids_from_3yo, infants, seniors
    dosage_instructions = Column(Text, nullable=True)  # e.g. "1 tableta max 4x denně, odstup min. 4 hodiny"
    storage_instructions = Column(String, nullable=True)  # e.g. "Při pokojové teplotě do 25 °C"
    sukl_code_or_url = Column(String, nullable=True)  # kód nebo link na SÚKL / příbalový leták
    notes = Column(Text, nullable=True)

    # Optional assignment to a specific family member
    assigned_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    assigned_user = relationship("User", foreign_keys=[assigned_user_id])
    schedules = relationship("MedicationSchedule", back_populates="medicine", cascade="all, delete-orphan")
    logs = relationship("MedicationLog", back_populates="medicine", cascade="all, delete-orphan")


class MedicationSchedule(Base):
    __tablename__ = "medication_schedules"

    id = Column(Integer, primary_key=True, index=True)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    schedule_type = Column(String, default="chronic")  # chronic, acute_course, as_needed
    start_date = Column(String, nullable=False)  # YYYY-MM-DD
    end_date = Column(String, nullable=True)  # YYYY-MM-DD (e.g. 7 days for antibiotics)
    
    times_per_day = Column(Integer, default=1)
    time_slots = Column(Text, default='["morning"]')  # JSON encoded list, e.g. ["morning", "evening"]
    food_relation = Column(String, default="any")  # before_food, with_food, after_food, empty_stomach, any
    dosage_per_take = Column(String, default="1 tableta")
    
    is_active = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    medicine = relationship("Medicine", back_populates="schedules")
    user = relationship("User")
    logs = relationship("MedicationLog", back_populates="schedule", cascade="all, delete-orphan")


class MedicationLog(Base):
    __tablename__ = "medication_logs"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("medication_schedules.id"), nullable=True)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    taken_at = Column(DateTime, default=datetime.datetime.utcnow)
    time_slot = Column(String, nullable=True)  # morning, noon, evening, night, as_needed, custom
    dose_taken = Column(String, nullable=True)
    status = Column(String, default="taken")  # taken, skipped, postponed
    notes = Column(Text, nullable=True)

    # Relationships
    schedule = relationship("MedicationSchedule", back_populates="logs")
    medicine = relationship("Medicine", back_populates="logs")
    user = relationship("User")
