import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    category = Column(String, default="warranty", index=True)
    # Categories: warranty, contract, identity, inspection, manual, medical, housing, vehicle, other

    file_path = Column(String, nullable=False)  # Relative path within UPLOAD_DIR
    file_name = Column(String, nullable=False)  # Original uploaded file name
    file_size = Column(Integer, default=0)      # Size in bytes
    file_type = Column(String, default="application/pdf")  # MIME type

    issuer = Column(String, nullable=True, index=True)  # Store, company, authority (e.g. Alza, ČEZ, Allianz)
    document_date = Column(String, nullable=True)       # YYYY-MM-DD (Issue or signature date)
    expiry_date = Column(String, nullable=True, index=True)  # YYYY-MM-DD (Warranty end, policy expiry, inspection due)
    warranty_months = Column(Integer, nullable=True)    # Warranty duration (24, 36, 60 months)
    contract_number = Column(String, nullable=True)     # Contract #, serial number, variable symbol
    amount = Column(Float, nullable=True)               # Price or premium in CZK

    physical_location = Column(String, nullable=True)   # E.g. "Šanon 2 (Modrý) - Finance, horní police v pracovně"
    is_vault_protected = Column(Boolean, default=False) # Requires PIN to view/download

    tags = Column(String, nullable=True)                # Comma-separated or JSON tags
    summary = Column(Text, nullable=True)               # AI generated 1-2 sentence summary
    ocr_fulltext = Column(Text, nullable=True)          # Extracted OCR text for full-text search

    related_entity_type = Column(String, nullable=True) # e.g. "chore_appliance", "pet", "finance_transaction"
    related_entity_id = Column(Integer, nullable=True)

    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    created_by = relationship("User")


class VaultSetting(Base):
    __tablename__ = "vault_settings"

    id = Column(Integer, primary_key=True, index=True)
    pin_hash = Column(String, nullable=False, default="1234") # Default PIN: 1234
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
