import json
import datetime
import os
from typing import Optional, Dict, List, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.utils.auth import get_current_active_admin, verify_password
from app.services.clean_data import clean_all_sample_data
from app.services.activity_service import log_activity
from app.services.backup_service import (
    export_all_data,
    import_data,
    create_server_backup,
    list_server_backups,
    restore_server_backup,
    delete_server_backup,
    ensure_backup_dir,
)

router = APIRouter(prefix="/system", tags=["System & Maintenance"])


class ResetDataRequest(BaseModel):
    confirmation: str
    password: Optional[str] = None


class CreateBackupRequest(BaseModel):
    note: Optional[str] = None


@router.post("/reset-data")
def reset_all_system_data(
    payload: ResetDataRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Purges all household data across all modules (recipes, pantry, shopping, plants,
    pets, chores, finance, documents, vehicles, medicines, activities).
    Preserves the logged-in administrator account.
    Requires confirmation string 'SMAZAT' and optional admin password check.
    """
    if payload.confirmation.strip().upper() not in ["SMAZAT", "CONFIRM", "DELETE"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pro potvrzení smazání zadejte přesné slovo 'SMAZAT'."
        )

    if payload.password and not verify_password(payload.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Zadané administrátorské heslo je nesprávné."
        )

    # Perform the full wipe preserving the current admin
    counts = clean_all_sample_data(db, preserve_user_id=current_user.id)

    # Log the system reset action in the freshly cleaned activity log
    log_activity(
        db=db,
        user=current_user,
        module="system",
        action_type="reset",
        title="Resetování všech dat",
        description=f"Správce {current_user.display_name} smazal veškerá data domácnosti v systému Hestia.",
        entity_type="System",
        entity_id=0
    )
    db.commit()

    return {
        "status": "success",
        "message": "Veškerá data domácnosti byla úspěšně smazána. Váš administrátorský účet byl zachován.",
        "deleted_counts": counts
    }


# ==========================================
# EXPORT & IMPORT ENDPOINTS
# ==========================================

@router.get("/export")
def export_database_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Exports all household data as a downloadable JSON file.
    """
    data = export_all_data(db, user=current_user)
    json_bytes = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"hestia_export_{timestamp}.json"

    return Response(
        content=json_bytes,
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


@router.post("/import")
async def import_database_data(
    file: UploadFile = File(...),
    mode: str = Form("merge"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Imports household data from an uploaded JSON file.
    Mode can be 'merge' (adds/updates without deleting existing) or 'replace' (resets database first).
    """
    if mode not in ["merge", "replace"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Režim importu musí být 'merge' nebo 'replace'."
        )

    try:
        content = await file.read()
        backup_json = json.loads(content.decode("utf-8"))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Chyba při čtení JSON souboru: {str(e)}"
        )

    try:
        result = import_data(db, backup_json, mode=mode, current_user=current_user)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chyba při importu dat: {str(e)}"
        )


# ==========================================
# SERVER SNAPSHOT BACKUP ENDPOINTS
# ==========================================

@router.get("/backups")
def get_all_server_backups(
    current_user: User = Depends(get_current_active_admin)
):
    """
    Returns the list of all server-side snapshot backups.
    """
    return list_server_backups()


@router.post("/backups")
def create_new_server_backup(
    payload: CreateBackupRequest = CreateBackupRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Creates a new snapshot backup on the server.
    """
    backup = create_server_backup(db, user=current_user, note=payload.note)
    return {
        "status": "success",
        "message": f"Záloha {backup['filename']} byla úspěšně vytvořena.",
        "backup": backup
    }


@router.get("/backups/{filename}/download")
def download_server_backup(
    filename: str,
    current_user: User = Depends(get_current_active_admin)
):
    """
    Downloads a specific server snapshot backup file.
    """
    backup_dir = ensure_backup_dir()
    clean_name = os.path.basename(filename)
    filepath = os.path.join(backup_dir, clean_name)

    if not os.path.exists(filepath):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Záložní soubor '{clean_name}' nebyl na serveru nalezen."
        )

    return FileResponse(
        filepath,
        filename=clean_name,
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="{clean_name}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


@router.post("/backups/{filename}/restore")
def restore_specific_server_backup(
    filename: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Restores the system state from a server snapshot backup.
    """
    try:
        result = restore_server_backup(db, filename, current_user=current_user)
        return {
            "status": "success",
            "message": f"Systém byl úspěšně obnoven ze zálohy {os.path.basename(filename)}.",
            "restored_counts": result.get("imported_counts", {})
        }
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Záložní soubor '{os.path.basename(filename)}' nebyl nalezen."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chyba při obnově ze zálohy: {str(e)}"
        )


@router.delete("/backups/{filename}")
def delete_specific_server_backup(
    filename: str,
    current_user: User = Depends(get_current_active_admin)
):
    """
    Deletes a specific server snapshot backup file.
    """
    clean_name = os.path.basename(filename)
    deleted = delete_server_backup(clean_name)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Záložní soubor '{clean_name}' nebyl nalezen."
        )

    return {
        "status": "success",
        "message": f"Záloha {clean_name} byla úspěšně smazána."
    }

