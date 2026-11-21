import hmac
import mimetypes
import os
import uuid
import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.document import Document, VaultSetting
from app.schemas.document import (
    DocumentCreate, DocumentUpdate, DocumentResponse,
    DocumentStatsResponse, DocumentAiScanResponse,
    VaultVerifyRequest, VaultSetPinRequest
)
from app.utils.auth import (
    get_current_user, get_current_active_admin, get_password_hash, verify_password,
    create_vault_unlock_token, decode_vault_unlock_token, VAULT_TOKEN_TTL_SECONDS,
)
from app.utils.rate_limit import (
    check_login_rate_limit, register_failed_login, reset_login_attempts
)
from app.utils.uploads import read_upload, safe_upload_subpath, IMAGE_EXT
from app.services.gemini_document_service import GeminiDocumentService
from app.services.activity_service import log_activity


router = APIRouter(prefix="/documents", tags=["Digital Archive & Documents"])


def _compute_expiry_status(expiry_date: Optional[str]) -> tuple[Optional[int], str]:
    if not expiry_date:
        return None, "permanent"
    try:
        exp = datetime.datetime.strptime(expiry_date[:10], "%Y-%m-%d").date()
        today = datetime.date.today()
        days = (exp - today).days
        if days < 0:
            return days, "expired"
        elif days <= 30:
            return days, "expiring_soon"
        else:
            return days, "active"
    except Exception:
        return None, "permanent"


def _compute_document_status(doc: Document) -> tuple[Optional[int], str]:
    return _compute_expiry_status(doc.expiry_date)


def _format_document_response(doc: Document) -> DocumentResponse:
    days, doc_status = _compute_document_status(doc)
    resp = DocumentResponse.model_validate(doc)
    resp.days_until_expiry = days
    resp.status = doc_status
    return resp


def _relocate_vault_file(rel_path: Optional[str], to_vault: bool) -> Optional[str]:
    """Presune soubor trezorového dokumentu do podadresáře, který veřejný /uploads neobsluhuje."""
    if not rel_path or rel_path == "manual_entry":
        return rel_path
    rel = rel_path.replace("\\", "/")
    in_vault = rel.startswith("vault/")
    if in_vault == to_vault:
        return rel

    src = safe_upload_subpath(settings.UPLOAD_DIR, rel)
    if not src or not os.path.isfile(src):
        return rel
    new_rel = f"vault/{rel}" if to_vault else rel[len("vault/"):]
    dst = safe_upload_subpath(settings.UPLOAD_DIR, new_rel)
    if not dst:
        return rel
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    os.replace(src, dst)
    return new_rel


def _has_vault_access(x_vault_token: Optional[str], current_user: User) -> bool:
    """Přístup k trezoru se odvozuje výhradně z serverem vydaného tokenu."""
    return decode_vault_unlock_token(x_vault_token) == current_user.username


def _require_vault_access(doc: Document, x_vault_token: Optional[str], current_user: User) -> None:
    if doc.is_vault_protected and not _has_vault_access(x_vault_token, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Dokument je v trezoru. Zadejte PIN trezoru."
        )


@router.get("", response_model=List[DocumentResponse])
def get_documents(
    category: Optional[str] = None,
    doc_status: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    x_vault_token: Optional[str] = Header(None, alias="X-Vault-Token"),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Document)

    # Trezorové dokumenty jsou viditelné jedině s platným tokenem z PINu.
    if not _has_vault_access(x_vault_token, current_user):
        query = query.filter(Document.is_vault_protected == False)

    # Category filter
    if category and category != "all":
        query = query.filter(Document.category == category)

    # Fulltext search across title, issuer, contract_number, tags, location and OCR text
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Document.title.ilike(term),
                Document.issuer.ilike(term),
                Document.contract_number.ilike(term),
                Document.tags.ilike(term),
                Document.physical_location.ilike(term),
                Document.ocr_fulltext.ilike(term),
                Document.summary.ilike(term)
            )
        )

    # Sorting
    if sort_by == "expiry_date":
        if sort_order == "asc":
            query = query.order_by(Document.expiry_date.asc().nulls_last())
        else:
            query = query.order_by(Document.expiry_date.desc().nulls_last())
    elif sort_by == "title":
        if sort_order == "asc":
            query = query.order_by(Document.title.asc())
        else:
            query = query.order_by(Document.title.desc())
    else:
        if sort_order == "asc":
            query = query.order_by(Document.created_at.asc())
        else:
            query = query.order_by(Document.created_at.desc())

    docs = query.all()
    results = [_format_document_response(d) for d in docs]

    # In-memory status filter if specified
    if doc_status and doc_status != "all":
        results = [r for r in results if r.status == doc_status]

    return results


@router.get("/stats", response_model=DocumentStatsResponse)
def get_document_stats(
    x_vault_token: Optional[str] = Header(None, alias="X-Vault-Token"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Document.category, Document.is_vault_protected, Document.expiry_date)
    if not _has_vault_access(x_vault_token, current_user):
        query = query.filter(Document.is_vault_protected == False)
    rows = query.all()
    total = len(rows)
    expiring_soon = 0
    expired = 0
    vault_count = 0
    cat_counts: Dict[str, int] = {}

    for category, is_vault, expiry_date in rows:
        if is_vault:
            vault_count += 1
        cat_counts[category] = cat_counts.get(category, 0) + 1
        _, st = _compute_expiry_status(expiry_date)
        if st == "expiring_soon":
            expiring_soon += 1
        elif st == "expired":
            expired += 1

    return {
        "total_documents": total,
        "expiring_soon_count": expiring_soon,
        "expired_count": expired,
        "vault_count": vault_count,
        "categories": cat_counts
    }


@router.get("/{id}/file")
def get_document_file(
    id: int,
    download: bool = Query(False),
    x_vault_token: Optional[str] = Header(None, alias="X-Vault-Token"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Dokument nebyl nalezen")
    _require_vault_access(doc, x_vault_token, current_user)

    if not doc.file_path or doc.file_path == "manual_entry":
        raise HTTPException(status_code=404, detail="Dokument nemá přiložený soubor.")

    full_path = safe_upload_subpath(settings.UPLOAD_DIR, doc.file_path)
    if not full_path or not os.path.isfile(full_path):
        raise HTTPException(status_code=404, detail="Soubor dokumentu nebyl na serveru nalezen.")

    disk_ext = os.path.splitext(full_path)[1].lower()
    guessed_mime, _ = mimetypes.guess_type(full_path)
    if disk_ext == ".txt":
        media_type = "text/plain; charset=utf-8"
    else:
        media_type = guessed_mime or doc.file_type or "application/octet-stream"

    download_name = doc.file_name or os.path.basename(full_path)
    if disk_ext == ".txt" and download_name.lower().endswith(".pdf"):
        download_name = f"{os.path.splitext(download_name)[0]}.txt"

    return FileResponse(
        path=full_path,
        media_type=media_type,
        filename=download_name,
        content_disposition_type="attachment" if download else "inline",
        headers={"Access-Control-Expose-Headers": "Content-Disposition"},
    )


@router.get("/{id}", response_model=DocumentResponse)
def get_document(
    id: int,
    x_vault_token: Optional[str] = Header(None, alias="X-Vault-Token"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Dokument nebyl nalezen")
    _require_vault_access(doc, x_vault_token, current_user)
    return _format_document_response(doc)


@router.post("/upload")
async def upload_document_file(
    file: UploadFile = File(...),
    auto_analyze: bool = Form(True),
    current_user: User = Depends(get_current_user)
):
    # Prepare storage directory
    now = datetime.datetime.now()
    rel_dir = os.path.join("documents", str(now.year), f"{now.month:02d}")
    abs_dir = os.path.join(settings.UPLOAD_DIR, rel_dir)
    os.makedirs(abs_dir, exist_ok=True)

    # Unique file name; read_upload keeps only the last path segment of the client name
    orig_name, _, content = await read_upload(file, IMAGE_EXT)
    unique_name = f"{uuid.uuid4().hex[:12]}_{orig_name}"
    rel_path = os.path.join(rel_dir, unique_name).replace("\\", "/")
    abs_path = os.path.join(abs_dir, unique_name)

    with open(abs_path, "wb") as f:
        f.write(content)

    file_size = len(content)
    mime_type = file.content_type or "application/pdf"
    if mime_type not in ("application/pdf", "image/png", "image/jpeg", "image/webp"):
        mime_type = "application/pdf" if orig_name.lower().endswith(".pdf") else "image/jpeg"

    # AI Analysis with Gemini Flash if requested
    ai_metadata = None
    if auto_analyze:
        try:
            service = GeminiDocumentService()
            ai_metadata = await service.analyze_document(
                file_bytes=content,
                mime_type=mime_type
            )
        except Exception as e:
            ai_metadata = {
                "title": os.path.splitext(orig_name)[0],
                "category": "warranty",
                "summary": "AI analýza nebyla dostupná.",
                "ocr_fulltext": ""
            }

    return {
        "file_path": rel_path,
        "file_name": orig_name,
        "file_size": file_size,
        "file_type": mime_type,
        "ai_metadata": ai_metadata
    }


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def create_document(
    payload: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if payload.file_path and not safe_upload_subpath(settings.UPLOAD_DIR, payload.file_path):
        raise HTTPException(status_code=400, detail="Neplatná cesta k souboru dokumentu.")

    doc = Document(
        title=payload.title,
        category=payload.category,
        file_path=_relocate_vault_file(payload.file_path, bool(payload.is_vault_protected)),
        file_name=payload.file_name,
        file_size=payload.file_size,
        file_type=payload.file_type,
        issuer=payload.issuer,
        document_date=payload.document_date,
        expiry_date=payload.expiry_date,
        warranty_months=payload.warranty_months,
        contract_number=payload.contract_number,
        amount=payload.amount,
        physical_location=payload.physical_location,
        is_vault_protected=payload.is_vault_protected,
        tags=payload.tags,
        summary=payload.summary,
        ocr_fulltext=payload.ocr_fulltext,
        related_entity_type=payload.related_entity_type,
        related_entity_id=payload.related_entity_id,
        created_by_id=current_user.id
    )
    db.add(doc)
    db.flush()

    log_activity(
        db=db,
        user=current_user,
        module="documents",
        action_type="create",
        title="Nový doklad v archivu",
        description=f"{current_user.display_name} nahrál(a) dokument: {doc.title} (kategorie: {doc.category})",
        entity_type="Document",
        entity_id=doc.id
    )

    db.commit()
    db.refresh(doc)
    return _format_document_response(doc)


@router.put("/{id}", response_model=DocumentResponse)
def update_document(
    id: int,
    payload: DocumentUpdate,
    x_vault_token: Optional[str] = Header(None, alias="X-Vault-Token"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Dokument nebyl nalezen")
    _require_vault_access(doc, x_vault_token, current_user)

    old_loc = doc.physical_location
    changed = payload.model_dump(exclude_unset=True)
    for k, v in changed.items():
        setattr(doc, k, v)
    if "is_vault_protected" in changed:
        doc.file_path = _relocate_vault_file(doc.file_path, bool(doc.is_vault_protected))
    db.flush()

    desc = f"{current_user.display_name} upravil(a) dokument: {doc.title}"
    if payload.physical_location and payload.physical_location != old_loc:
        desc += f" (nové umístění: {payload.physical_location})"

    log_activity(
        db=db,
        user=current_user,
        module="documents",
        action_type="update",
        title="Úprava dokumentu",
        description=desc,
        entity_type="Document",
        entity_id=doc.id
    )

    db.commit()
    db.refresh(doc)
    return _format_document_response(doc)



@router.delete("/{id}")
def delete_document(
    id: int,
    x_vault_token: Optional[str] = Header(None, alias="X-Vault-Token"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Dokument nebyl nalezen")
    _require_vault_access(doc, x_vault_token, current_user)

    # Attempt to remove disk file safely inside UPLOAD_DIR
    if doc.file_path:
        full_path = safe_upload_subpath(settings.UPLOAD_DIR, doc.file_path)
        if full_path and os.path.isfile(full_path):
            try:
                os.remove(full_path)
            except Exception:
                pass

    db.delete(doc)
    db.commit()
    return {"status": "success", "message": "Dokument byl smazán"}


def _verify_vault_pin_value(pin: str, stored_hash: str) -> bool:
    if stored_hash.startswith("$2"):
        try:
            return verify_password(pin, stored_hash)
        except ValueError:
            return False
    return hmac.compare_digest(pin, stored_hash)


# Vault security endpoints
@router.post("/vault/verify")
def verify_vault_pin(
    payload: VaultVerifyRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    client_ip = request.client.host if request.client else "unknown"
    rate_key = f"vault|{client_ip}"
    check_login_rate_limit(rate_key)

    setting = db.query(VaultSetting).first()
    if not setting or not setting.is_active or not setting.pin_hash:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="PIN trezoru není nastaven. Nejprve ho nastavte v nastavení (pouze správce)."
        )

    if _verify_vault_pin_value(payload.pin, setting.pin_hash):
        reset_login_attempts(rate_key)
        # Upgrade legacy plaintext PIN to bcrypt hash on successful verification
        if not setting.pin_hash.startswith("$2"):
            setting.pin_hash = get_password_hash(payload.pin)
            db.commit()
        return {
            "status": "success",
            "message": "PIN je správný. Trezor byl odemčen.",
            "vault_token": create_vault_unlock_token(current_user.username),
            "expires_in": VAULT_TOKEN_TTL_SECONDS,
        }

    register_failed_login(rate_key)
    raise HTTPException(status_code=401, detail="Nesprávný PIN kód trezoru.")


@router.post("/vault/pin")
def change_vault_pin(
    payload: VaultSetPinRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Nastavení / změna PINu – pouze správce, s rate limitem a auditním záznamem."""
    client_ip = request.client.host if request.client else "unknown"
    rate_key = f"vault-pin|{client_ip}|{current_user.id}"
    check_login_rate_limit(rate_key)

    setting = db.query(VaultSetting).first()
    if setting is None:
        setting = VaultSetting(pin_hash="", is_active=False)
        db.add(setting)
        db.flush()

    # Při prvním nastavení (nebo po zrušení známého výchozího PINu) se starý PIN nevyžaduje.
    if setting.is_active:
        if not payload.old_pin or not _verify_vault_pin_value(payload.old_pin, setting.pin_hash):
            register_failed_login(rate_key)
            raise HTTPException(status_code=400, detail="Původní PIN není správný.")

    new_pin = (payload.new_pin or "").strip()
    if len(new_pin) < 6 or not new_pin.isdigit():
        raise HTTPException(status_code=400, detail="PIN musí mít alespoň 6 číslic.")

    if setting.is_active and _verify_vault_pin_value(new_pin, setting.pin_hash):
        raise HTTPException(status_code=400, detail="Nový PIN se musí lišit od původního.")

    reset_login_attempts(rate_key)
    setting.pin_hash = get_password_hash(new_pin)
    setting.is_active = True

    log_activity(
        db=db,
        user=current_user,
        module="documents",
        action_type="update",
        title="Změna PINu trezoru",
        description=f"Správce {current_user.display_name} nastavil(a) nový PIN digitálního trezoru.",
        entity_type="VaultSetting",
        entity_id=setting.id,
    )
    db.commit()
    return {
        "status": "success",
        "message": "PIN kód trezoru byl úspěšně změněn.",
        "vault_token": create_vault_unlock_token(current_user.username),
        "expires_in": VAULT_TOKEN_TTL_SECONDS,
    }
