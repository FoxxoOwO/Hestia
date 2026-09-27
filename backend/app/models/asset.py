import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from app.database import Base

class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    category = Column(String, default="large_appliance", index=True)  
    # large_appliance, small_appliance, electronics, tools_garden, furniture, plumbing_hvac, other
    room = Column(String, default="kitchen", index=True)
    # kitchen, bathroom, living_room, bedroom, hallway, garage, garden, workshop, attic_cellar, general
    
    brand = Column(String, nullable=True)
    model_number = Column(String, nullable=True)
    serial_number = Column(String, nullable=True)
    
    purchase_date = Column(String, nullable=True)  # YYYY-MM-DD
    warranty_months = Column(Integer, default=24)  # 0 = no warranty, 24 = standard 2 yrs, 60 = 5 yrs
    purchase_price = Column(Float, nullable=True)
    store_or_vendor = Column(String, nullable=True)  # e.g., "Alza.cz", "Datart", "IKEA"
    
    invoice_url = Column(String, nullable=True)  # URL / path to invoice file
    manual_url = Column(String, nullable=True)   # URL / path to manual PDF or external link
    
    status = Column(String, default="active")  # active, in_repair, disposed, sold
    notes = Column(Text, nullable=True)  # consumables, replacement filters, care instructions
    contact_service = Column(String, nullable=True)  # phone/web of authorized repair shop
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
