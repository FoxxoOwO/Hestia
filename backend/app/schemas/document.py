import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class DocumentBase(BaseModel):
    title: str
    category: str = "warranty"
    file_path: str
    file_name: str
    file_size: int = 0
    file_type: str = "application/pdf"
    issuer: Optional[str] = None
    document_date: Optional[str] = None
    expiry_date: Optional[str] = None
    warranty_months: Optional[int] = None
    contract_number: Optional[str] = None
    amount: Optional[float] = None
    physical_location: Optional[str] = None
    is_vault_protected: bool = False
    tags: Optional[str] = None
    summary: Optional[str] = None
    ocr_fulltext: Optional[str] = None
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[int] = None


class DocumentCreate(DocumentBase):
    pass


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    file_path: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    file_type: Optional[str] = None
    issuer: Optional[str] = None
    document_date: Optional[str] = None
    expiry_date: Optional[str] = None
    warranty_months: Optional[int] = None
    contract_number: Optional[str] = None
    amount: Optional[float] = None
    physical_location: Optional[str] = None
    is_vault_protected: Optional[bool] = None
    tags: Optional[str] = None
    summary: Optional[str] = None
    ocr_fulltext: Optional[str] = None
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[int] = None


class DocumentResponse(DocumentBase):
    id: int
    created_by_id: Optional[int] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    days_until_expiry: Optional[int] = None
    status: str = "active"  # active, expiring_soon, expired, permanent

    class Config:
        from_attributes = True


class DocumentStatsResponse(BaseModel):
    total_documents: int
    expiring_soon_count: int
    expired_count: int
    vault_count: int
    categories: Dict[str, int]


class DocumentAiScanResponse(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = "warranty"
    issuer: Optional[str] = None
    document_date: Optional[str] = None
    expiry_date: Optional[str] = None
    warranty_months: Optional[int] = None
    contract_number: Optional[str] = None
    amount: Optional[float] = None
    tags: Optional[str] = None
    summary: Optional[str] = None
    ocr_fulltext: Optional[str] = None


class VaultVerifyRequest(BaseModel):
    pin: str


class VaultSetPinRequest(BaseModel):
    old_pin: Optional[str] = None
    new_pin: str
