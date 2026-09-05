import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)  # e.g. "Škoda Octavia Combi", "Rodinná Fabie"
    make = Column(String, nullable=False, index=True)  # e.g. "Škoda"
    model = Column(String, nullable=False)             # e.g. "Octavia III"
    year = Column(Integer, nullable=True)              # e.g. 2019
    color = Column(String, nullable=True)              # e.g. "Šedá metalíza"
    license_plate = Column(String, nullable=False, index=True)  # e.g. "1AB 2345"
    vin = Column(String, nullable=True, index=True)    # e.g. "TMBJJ7NE8K0194820"
    fuel_type = Column(String, default="diesel")       # petrol, diesel, lpg, cng, hybrid, electric, other
    tank_capacity_l = Column(Float, nullable=True, default=50.0)
    engine_power_kw = Column(Integer, nullable=True)   # e.g. 110 kW
    engine_displacement_cc = Column(Integer, nullable=True)  # e.g. 1968 ccm
    transmission = Column(String, default="manual")    # manual, automatic
    current_mileage = Column(Integer, default=0)       # Tachometr v km
    primary_image_url = Column(String, nullable=True)

    # Deadlines & Czech Regulations
    mot_expiry_date = Column(String, nullable=True, index=True)  # YYYY-MM-DD (STK & Emise)
    vignette_expiry_date = Column(String, nullable=True, index=True)  # YYYY-MM-DD (Česká dálniční známka)
    vignette_type = Column(String, default="1_year")  # 1_year, 30_days, 10_days, 1_day, none
    insurance_company = Column(String, nullable=True)  # e.g. "Kooperativa", "Generali", "ČPP", "Allianz"
    insurance_policy_number = Column(String, nullable=True)
    insurance_expiry_date = Column(String, nullable=True, index=True)  # Výročí / platnost smlouvy
    insurance_assistance_phone = Column(String, nullable=True)  # e.g. "+420 1224" / "+420 841 105 105"
    first_aid_kit_expiry_date = Column(String, nullable=True)  # Expirace autolékárničky

    # Tires (Pneumatiky)
    tire_type = Column(String, default="winter")  # summer, winter, all_season
    tire_dimension = Column(String, nullable=True)  # e.g. "205/55 R16 91V"
    tire_tread_depth_mm = Column(Float, nullable=True, default=5.0)  # naměřený vzorek
    tire_storage_location = Column(String, nullable=True)  # e.g. "Pneuservis Barum – regál 4B", "Garáž - závěsný stojan"
    tire_last_swapped_date = Column(String, nullable=True)  # YYYY-MM-DD

    # Maintenance & Service Intervals
    oil_change_interval_km = Column(Integer, default=15000)
    oil_change_interval_months = Column(Integer, default=12)
    last_oil_change_mileage = Column(Integer, nullable=True)
    last_oil_change_date = Column(String, nullable=True)

    # General
    notes = Column(Text, nullable=True)
    is_favorite = Column(Boolean, default=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    refuelings = relationship("VehicleRefueling", back_populates="vehicle", cascade="all, delete-orphan", order_by="desc(VehicleRefueling.mileage)")
    service_records = relationship("VehicleServiceRecord", back_populates="vehicle", cascade="all, delete-orphan", order_by="desc(VehicleServiceRecord.date)")
    created_by = relationship("User")


class VehicleRefueling(Base):
    __tablename__ = "vehicle_refuelings"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False, index=True)
    date = Column(String, nullable=False, index=True)  # YYYY-MM-DD
    mileage = Column(Integer, nullable=False)          # Stav tachometru při tankování
    fuel_amount_l = Column(Float, nullable=False)      # Natankované litry
    price_per_l = Column(Float, nullable=True)         # Cena za litr v Kč
    total_price = Column(Float, nullable=False)        # Celková částka v Kč
    is_full_tank = Column(Boolean, default=True)       # Plná nádrž pro výpočet spotřeby
    fuel_brand = Column(String, nullable=True)         # e.g. "Orlen Benzina", "Shell", "MOL"
    calculated_consumption = Column(Float, nullable=True)  # Spotřeba v l/100 km
    notes = Column(String, nullable=True)

    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="refuelings")
    created_by = relationship("User")


class VehicleServiceRecord(Base):
    __tablename__ = "vehicle_service_records"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False, index=True)
    service_type = Column(String, nullable=False)  # regular_service, oil_change, brakes, tires, inspection, repair, other
    title = Column(String, nullable=False)         # e.g. "Výměna oleje a filtrů + revize brzd"
    date = Column(String, nullable=False, index=True)  # YYYY-MM-DD
    mileage = Column(Integer, nullable=False)      # Stav tachometru při servisu
    cost = Column(Float, default=0.0)              # Cena v Kč
    service_shop = Column(String, nullable=True)   # Název servisu / mechanik
    performed_operations = Column(Text, nullable=True)  # Popis úkonů
    invoice_file_path = Column(String, nullable=True)  # Případný soubor faktury

    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="service_records")
    created_by = relationship("User")
