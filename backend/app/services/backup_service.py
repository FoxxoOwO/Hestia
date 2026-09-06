"""
Hestia Smart Home OS - Backup, Export & Import Service
Provides full household data export, import (merge/replace), and server snapshot management.
"""

import os
import json
import datetime
import glob
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import Date, DateTime

from app.models.user import User
from app.models.recipe import Recipe
from app.models.pantry import PantryItem
from app.models.shopping import ShoppingItem
from app.models.plant import Plant, PlantTask, PlantLogEntry
from app.models.pet import Pet, PetMedicalRecord, PetMedication, PetWeightLog, PetTask, PetLogEntry
from app.models.chore import Chore, ChoreCompletion, ChoreReward, ChoreRewardRedemption
from app.models.finance import FinanceTransaction, CategoryBudget, Subscription, SavingsGoal, UserFinanceProfile
from app.models.document import Document, VaultSetting
from app.models.vehicle import Vehicle, VehicleRefueling, VehicleServiceRecord
from app.models.medicine import Medicine, MedicationSchedule, MedicationLog
from app.models.activity import ActivityLog
from app.services.clean_data import clean_all_sample_data
from app.services.activity_service import log_activity
from app.config import settings

# Default backup storage directory
BACKUP_DIR = os.getenv("BACKUP_DIR", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backups")))


def ensure_backup_dir() -> str:
    """Ensures the backup directory exists and returns its path."""
    os.makedirs(BACKUP_DIR, exist_ok=True)
    return BACKUP_DIR


def _serialize_instance(instance: Any) -> Dict[str, Any]:
    """Serializes a SQLAlchemy model instance to a JSON-compatible dictionary."""
    data = {}
    for col in instance.__table__.columns:
        val = getattr(instance, col.name)
        if val is None:
            data[col.name] = None
        elif isinstance(val, (datetime.date, datetime.datetime)):
            data[col.name] = val.isoformat()
        else:
            data[col.name] = val
    return data


def _deserialize_data(model_cls: Any, data_dict: Dict[str, Any], overrides: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Converts serialized dictionary values back to SQLAlchemy model attributes."""
    res = {}
    overrides = overrides or {}
    for col in model_cls.__table__.columns:
        if col.name == 'id' and 'id' not in overrides:
            continue
        if col.name in overrides:
            res[col.name] = overrides[col.name]
            continue
        if col.name not in data_dict:
            continue
        val = data_dict[col.name]
        if val is None:
            res[col.name] = None
        elif isinstance(col.type, Date):
            if isinstance(val, str) and val.strip():
                try:
                    res[col.name] = datetime.date.fromisoformat(val[:10])
                except Exception:
                    res[col.name] = None
            else:
                res[col.name] = val
        elif isinstance(col.type, DateTime):
            if isinstance(val, str) and val.strip():
                try:
                    res[col.name] = datetime.datetime.fromisoformat(val)
                except Exception:
                    res[col.name] = None
            else:
                res[col.name] = val
        else:
            res[col.name] = val
    return res


def export_all_data(db: Session, user: Optional[User] = None) -> Dict[str, Any]:
    """
    Exports all household data across all modules into a structured dictionary.
    """
    recipes = db.query(Recipe).all()
    pantry = db.query(PantryItem).all()
    shopping = db.query(ShoppingItem).all()
    plants = db.query(Plant).all()
    plant_tasks = db.query(PlantTask).all()
    plant_logs = db.query(PlantLogEntry).all()
    pets = db.query(Pet).all()
    pet_medical = db.query(PetMedicalRecord).all()
    pet_meds = db.query(PetMedication).all()
    pet_weights = db.query(PetWeightLog).all()
    pet_tasks = db.query(PetTask).all()
    pet_logs = db.query(PetLogEntry).all()
    chores = db.query(Chore).all()
    chore_completions = db.query(ChoreCompletion).all()
    chore_rewards = db.query(ChoreReward).all()
    chore_redemptions = db.query(ChoreRewardRedemption).all()
    finance_txs = db.query(FinanceTransaction).all()
    finance_budgets = db.query(CategoryBudget).all()
    finance_subs = db.query(Subscription).all()
    finance_goals = db.query(SavingsGoal).all()
    finance_profiles = db.query(UserFinanceProfile).all()
    documents = db.query(Document).all()
    vault_settings = db.query(VaultSetting).all()
    vehicles = db.query(Vehicle).all()
    vehicle_refuelings = db.query(VehicleRefueling).all()
    vehicle_services = db.query(VehicleServiceRecord).all()
    medicines = db.query(Medicine).all()
    med_schedules = db.query(MedicationSchedule).all()
    med_logs = db.query(MedicationLog).all()
    activities = db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(100).all()
    users = db.query(User).all()

    # Omit sensitive password hashes from export
    serialized_users = []
    for u in users:
        u_dict = _serialize_instance(u)
        u_dict.pop("hashed_password", None)
        serialized_users.append(u_dict)

    data = {
        "recipes": [_serialize_instance(r) for r in recipes],
        "pantry": [_serialize_instance(p) for p in pantry],
        "shopping": [_serialize_instance(s) for s in shopping],
        "plants": [_serialize_instance(p) for p in plants],
        "plant_tasks": [_serialize_instance(t) for t in plant_tasks],
        "plant_logs": [_serialize_instance(l) for l in plant_logs],
        "pets": [_serialize_instance(p) for p in pets],
        "pet_medical": [_serialize_instance(m) for m in pet_medical],
        "pet_meds": [_serialize_instance(m) for m in pet_meds],
        "pet_weights": [_serialize_instance(w) for w in pet_weights],
        "pet_tasks": [_serialize_instance(t) for t in pet_tasks],
        "pet_logs": [_serialize_instance(l) for l in pet_logs],
        "chores": [_serialize_instance(c) for c in chores],
        "chore_completions": [_serialize_instance(c) for c in chore_completions],
        "chore_rewards": [_serialize_instance(r) for r in chore_rewards],
        "chore_redemptions": [_serialize_instance(r) for r in chore_redemptions],
        "finance_transactions": [_serialize_instance(t) for t in finance_txs],
        "finance_budgets": [_serialize_instance(b) for b in finance_budgets],
        "finance_subscriptions": [_serialize_instance(s) for s in finance_subs],
        "finance_goals": [_serialize_instance(g) for g in finance_goals],
        "finance_profiles": [_serialize_instance(p) for p in finance_profiles],
        "documents": [_serialize_instance(d) for d in documents],
        "vault_settings": [_serialize_instance(v) for v in vault_settings],
        "vehicles": [_serialize_instance(v) for v in vehicles],
        "vehicle_refuelings": [_serialize_instance(r) for r in vehicle_refuelings],
        "vehicle_services": [_serialize_instance(s) for s in vehicle_services],
        "medicines": [_serialize_instance(m) for m in medicines],
        "medication_schedules": [_serialize_instance(s) for s in med_schedules],
        "medication_logs": [_serialize_instance(l) for l in med_logs],
        "activities": [_serialize_instance(a) for a in activities],
        "users": serialized_users,
    }

    counts = {k: len(v) for k, v in data.items()}
    total_items = sum(counts.values())

    export_obj = {
        "metadata": {
            "app": "Hestia Smart Home OS",
            "version": "1.1",
            "exported_at": datetime.datetime.utcnow().isoformat(),
            "exported_by": user.username if user else "system",
            "total_items": total_items,
            "counts": counts,
        },
        "data": data,
    }

    return export_obj


def import_data(db: Session, backup_json: Dict[str, Any], mode: str = "merge", current_user: Optional[User] = None) -> Dict[str, Any]:
    """
    Imports household data from a backup JSON object.
    Supports mode='merge' (appends/updates) and mode='replace' (cleans first).
    """
    if "data" not in backup_json:
        raise ValueError("Neplatný formát zálohy: chybí sekce 'data'.")

    data = backup_json["data"]
    imported_counts = {}

    if mode == "replace":
        clean_all_sample_data(db, preserve_user_id=current_user.id if current_user else None)

    # 1. Users Mapping
    user_id_map: Dict[int, int] = {}
    if current_user:
        user_id_map[current_user.id] = current_user.id

    existing_users = {u.username: u for u in db.query(User).all()}
    for u_raw in data.get("users", []):
        old_id = u_raw.get("id")
        uname = u_raw.get("username")
        if not uname:
            continue
        if uname in existing_users:
            if old_id:
                user_id_map[old_id] = existing_users[uname].id
        else:
            # Create user with a safe default password if not provided
            new_u_data = _deserialize_data(User, u_raw)
            new_u = User(**new_u_data)
            if not new_u.hashed_password:
                from app.utils.auth import get_password_hash
                new_u.hashed_password = get_password_hash("hestia123")
            db.add(new_u)
            db.commit()
            db.refresh(new_u)
            existing_users[uname] = new_u
            if old_id:
                user_id_map[old_id] = new_u.id

    # Fallback user ID
    default_uid = current_user.id if current_user else (db.query(User).first().id if db.query(User).first() else 1)

    # 2. Recipes
    rec_count = 0
    for r_raw in data.get("recipes", []):
        rec_data = _deserialize_data(Recipe, r_raw)
        db.add(Recipe(**rec_data))
        rec_count += 1
    imported_counts["recipes"] = rec_count

    # 3. Pantry Items
    pantry_count = 0
    for p_raw in data.get("pantry", []):
        p_data = _deserialize_data(PantryItem, p_raw)
        db.add(PantryItem(**p_data))
        pantry_count += 1
    imported_counts["pantry"] = pantry_count

    # 4. Shopping Items
    shop_count = 0
    for s_raw in data.get("shopping", []):
        s_data = _deserialize_data(ShoppingItem, s_raw)
        db.add(ShoppingItem(**s_data))
        shop_count += 1
    imported_counts["shopping"] = shop_count

    # 5. Plants & Tasks & Logs
    plant_id_map: Dict[int, int] = {}
    plant_count = 0
    for pl_raw in data.get("plants", []):
        old_id = pl_raw.get("id")
        pl_data = _deserialize_data(Plant, pl_raw)
        new_pl = Plant(**pl_data)
        db.add(new_pl)
        db.commit()
        db.refresh(new_pl)
        if old_id:
            plant_id_map[old_id] = new_pl.id
        plant_count += 1
    imported_counts["plants"] = plant_count

    for pt_raw in data.get("plant_tasks", []):
        old_pid = pt_raw.get("plant_id")
        new_pid = plant_id_map.get(old_pid, old_pid)
        if new_pid:
            pt_data = _deserialize_data(PlantTask, pt_raw, overrides={"plant_id": new_pid})
            db.add(PlantTask(**pt_data))

    for pl_log in data.get("plant_logs", []):
        old_pid = pl_log.get("plant_id")
        new_pid = plant_id_map.get(old_pid, old_pid)
        if new_pid:
            pl_log_data = _deserialize_data(PlantLogEntry, pl_log, overrides={"plant_id": new_pid})
            db.add(PlantLogEntry(**pl_log_data))

    # 6. Pets & Records
    pet_id_map: Dict[int, int] = {}
    pet_count = 0
    for p_raw in data.get("pets", []):
        old_id = p_raw.get("id")
        p_data = _deserialize_data(Pet, p_raw)
        new_pet = Pet(**p_data)
        db.add(new_pet)
        db.commit()
        db.refresh(new_pet)
        if old_id:
            pet_id_map[old_id] = new_pet.id
        pet_count += 1
    imported_counts["pets"] = pet_count

    for m_raw in data.get("pet_medical", []):
        old_pid = m_raw.get("pet_id")
        new_pid = pet_id_map.get(old_pid, old_pid)
        if new_pid:
            m_data = _deserialize_data(PetMedicalRecord, m_raw, overrides={"pet_id": new_pid})
            db.add(PetMedicalRecord(**m_data))

    for med_raw in data.get("pet_meds", []):
        old_pid = med_raw.get("pet_id")
        new_pid = pet_id_map.get(old_pid, old_pid)
        if new_pid:
            med_data = _deserialize_data(PetMedication, med_raw, overrides={"pet_id": new_pid})
            db.add(PetMedication(**med_data))

    for w_raw in data.get("pet_weights", []):
        old_pid = w_raw.get("pet_id")
        new_pid = pet_id_map.get(old_pid, old_pid)
        if new_pid:
            w_data = _deserialize_data(PetWeightLog, w_raw, overrides={"pet_id": new_pid})
            db.add(PetWeightLog(**w_data))

    for t_raw in data.get("pet_tasks", []):
        old_pid = t_raw.get("pet_id")
        new_pid = pet_id_map.get(old_pid, old_pid)
        if new_pid:
            t_data = _deserialize_data(PetTask, t_raw, overrides={"pet_id": new_pid})
            db.add(PetTask(**t_data))

    for l_raw in data.get("pet_logs", []):
        old_pid = l_raw.get("pet_id")
        new_pid = pet_id_map.get(old_pid, old_pid)
        if new_pid:
            l_data = _deserialize_data(PetLogEntry, l_raw, overrides={"pet_id": new_pid})
            db.add(PetLogEntry(**l_data))

    # 7. Chores & Rewards
    chore_id_map: Dict[int, int] = {}
    chore_count = 0
    for c_raw in data.get("chores", []):
        old_id = c_raw.get("id")
        old_uid = c_raw.get("assigned_to_user_id")
        new_uid = user_id_map.get(old_uid, default_uid) if old_uid else None
        c_data = _deserialize_data(Chore, c_raw, overrides={"assigned_to_user_id": new_uid})
        new_chore = Chore(**c_data)
        db.add(new_chore)
        db.commit()
        db.refresh(new_chore)
        if old_id:
            chore_id_map[old_id] = new_chore.id
        chore_count += 1
    imported_counts["chores"] = chore_count

    for comp_raw in data.get("chore_completions", []):
        old_cid = comp_raw.get("chore_id")
        new_cid = chore_id_map.get(old_cid, old_cid)
        old_uid = comp_raw.get("user_id")
        new_uid = user_id_map.get(old_uid, default_uid)
        if new_cid:
            comp_data = _deserialize_data(ChoreCompletion, comp_raw, overrides={"chore_id": new_cid, "user_id": new_uid})
            db.add(ChoreCompletion(**comp_data))

    reward_id_map: Dict[int, int] = {}
    for rew_raw in data.get("chore_rewards", []):
        old_id = rew_raw.get("id")
        rew_data = _deserialize_data(ChoreReward, rew_raw)
        new_rew = ChoreReward(**rew_data)
        db.add(new_rew)
        db.commit()
        db.refresh(new_rew)
        if old_id:
            reward_id_map[old_id] = new_rew.id

    for red_raw in data.get("chore_redemptions", []):
        old_rid = red_raw.get("reward_id")
        new_rid = reward_id_map.get(old_rid, old_rid)
        old_uid = red_raw.get("user_id")
        new_uid = user_id_map.get(old_uid, default_uid)
        if new_rid:
            red_data = _deserialize_data(ChoreRewardRedemption, red_raw, overrides={"reward_id": new_rid, "user_id": new_uid})
            db.add(ChoreRewardRedemption(**red_data))

    # 8. Finance
    fin_count = 0
    for tx_raw in data.get("finance_transactions", []):
        old_uid = tx_raw.get("user_id")
        new_uid = user_id_map.get(old_uid, default_uid)
        tx_data = _deserialize_data(FinanceTransaction, tx_raw, overrides={"user_id": new_uid})
        db.add(FinanceTransaction(**tx_data))
        fin_count += 1
    imported_counts["finance_transactions"] = fin_count

    existing_budgets = {b.category: b for b in db.query(CategoryBudget).all()}
    for b_raw in data.get("finance_budgets", []):
        cat = b_raw.get("category")
        if not cat:
            continue
        b_data = _deserialize_data(CategoryBudget, b_raw)
        if cat in existing_budgets:
            for k, v in b_data.items():
                setattr(existing_budgets[cat], k, v)
        else:
            new_b = CategoryBudget(**b_data)
            db.add(new_b)
            existing_budgets[cat] = new_b

    for sub_raw in data.get("finance_subscriptions", []):
        sub_data = _deserialize_data(Subscription, sub_raw)
        db.add(Subscription(**sub_data))

    for goal_raw in data.get("finance_goals", []):
        goal_data = _deserialize_data(SavingsGoal, goal_raw)
        db.add(SavingsGoal(**goal_data))

    existing_profiles = {p.user_id: p for p in db.query(UserFinanceProfile).all()}
    for prof_raw in data.get("finance_profiles", []):
        old_uid = prof_raw.get("user_id")
        new_uid = user_id_map.get(old_uid, default_uid)
        prof_data = _deserialize_data(UserFinanceProfile, prof_raw, overrides={"user_id": new_uid})
        if new_uid in existing_profiles:
            for k, v in prof_data.items():
                setattr(existing_profiles[new_uid], k, v)
        else:
            new_p = UserFinanceProfile(**prof_data)
            db.add(new_p)
            existing_profiles[new_uid] = new_p

    # 9. Documents & Vault
    doc_count = 0
    for d_raw in data.get("documents", []):
        old_uid = d_raw.get("uploaded_by_user_id")
        new_uid = user_id_map.get(old_uid, default_uid) if old_uid else None
        d_data = _deserialize_data(Document, d_raw, overrides={"uploaded_by_user_id": new_uid})
        db.add(Document(**d_data))
        doc_count += 1
    imported_counts["documents"] = doc_count

    existing_vault = db.query(VaultSetting).first()
    for v_raw in data.get("vault_settings", []):
        v_data = _deserialize_data(VaultSetting, v_raw)
        if existing_vault:
            for k, v in v_data.items():
                setattr(existing_vault, k, v)
        else:
            new_v = VaultSetting(**v_data)
            db.add(new_v)
            existing_vault = new_v

    # 10. Vehicles
    vehicle_id_map: Dict[int, int] = {}
    veh_count = 0
    for v_raw in data.get("vehicles", []):
        old_id = v_raw.get("id")
        v_data = _deserialize_data(Vehicle, v_raw)
        new_v = Vehicle(**v_data)
        db.add(new_v)
        db.commit()
        db.refresh(new_v)
        if old_id:
            vehicle_id_map[old_id] = new_v.id
        veh_count += 1
    imported_counts["vehicles"] = veh_count

    for ref_raw in data.get("vehicle_refuelings", []):
        old_vid = ref_raw.get("vehicle_id")
        new_vid = vehicle_id_map.get(old_vid, old_vid)
        old_uid = ref_raw.get("user_id")
        new_uid = user_id_map.get(old_uid, default_uid) if old_uid else None
        if new_vid:
            ref_data = _deserialize_data(VehicleRefueling, ref_raw, overrides={"vehicle_id": new_vid, "user_id": new_uid})
            db.add(VehicleRefueling(**ref_data))

    for s_raw in data.get("vehicle_services", []):
        old_vid = s_raw.get("vehicle_id")
        new_vid = vehicle_id_map.get(old_vid, old_vid)
        old_uid = s_raw.get("user_id")
        new_uid = user_id_map.get(old_uid, default_uid) if old_uid else None
        if new_vid:
            s_data = _deserialize_data(VehicleServiceRecord, s_raw, overrides={"vehicle_id": new_vid, "user_id": new_uid})
            db.add(VehicleServiceRecord(**s_data))

    # 11. Medicines
    med_id_map: Dict[int, int] = {}
    med_count = 0
    for m_raw in data.get("medicines", []):
        old_id = m_raw.get("id")
        m_data = _deserialize_data(Medicine, m_raw)
        new_m = Medicine(**m_data)
        db.add(new_m)
        db.commit()
        db.refresh(new_m)
        if old_id:
            med_id_map[old_id] = new_m.id
        med_count += 1
    imported_counts["medicines"] = med_count

    sched_id_map: Dict[int, int] = {}
    for sched_raw in data.get("medication_schedules", []):
        old_id = sched_raw.get("id")
        old_mid = sched_raw.get("medicine_id")
        new_mid = med_id_map.get(old_mid, old_mid)
        old_uid = sched_raw.get("user_id")
        new_uid = user_id_map.get(old_uid, default_uid) if old_uid else None
        if new_mid:
            sched_data = _deserialize_data(MedicationSchedule, sched_raw, overrides={"medicine_id": new_mid, "user_id": new_uid})
            new_sched = MedicationSchedule(**sched_data)
            db.add(new_sched)
            db.commit()
            db.refresh(new_sched)
            if old_id:
                sched_id_map[old_id] = new_sched.id

    for mlog_raw in data.get("medication_logs", []):
        old_mid = mlog_raw.get("medicine_id")
        new_mid = med_id_map.get(old_mid, old_mid)
        old_sid = mlog_raw.get("schedule_id")
        new_sid = sched_id_map.get(old_sid, old_sid) if old_sid else None
        old_uid = mlog_raw.get("user_id")
        new_uid = user_id_map.get(old_uid, default_uid) if old_uid else None
        if new_mid:
            mlog_data = _deserialize_data(MedicationLog, mlog_raw, overrides={"medicine_id": new_mid, "schedule_id": new_sid, "user_id": new_uid})
            db.add(MedicationLog(**mlog_data))

    # 12. Activity Logs
    act_count = 0
    for act_raw in data.get("activities", []):
        old_uid = act_raw.get("user_id")
        new_uid = user_id_map.get(old_uid, default_uid) if old_uid else None
        act_data = _deserialize_data(ActivityLog, act_raw, overrides={"user_id": new_uid})
        db.add(ActivityLog(**act_data))
        act_count += 1
    imported_counts["activities"] = act_count

    db.commit()

    if current_user:
        log_activity(
            db=db,
            user=current_user,
            module="system",
            action_type="import",
            title="Import databáze ze zálohy",
            description=f"Správce {current_user.display_name} naimportoval data (režim: {mode}). Celkem položek: {sum(imported_counts.values())}.",
            entity_type="System",
            entity_id=0
        )
        db.commit()

    return {
        "status": "success",
        "mode": mode,
        "total_imported": sum(imported_counts.values()),
        "imported_counts": imported_counts,
    }


def create_server_backup(db: Session, user: Optional[User] = None, note: str = "") -> Dict[str, Any]:
    """
    Creates a full JSON snapshot of the database and writes it to the server backup directory.
    """
    backup_dir = ensure_backup_dir()
    now = datetime.datetime.utcnow()
    timestamp_str = now.strftime("%Y%m%d_%H%M%S")
    filename = f"hestia_backup_{timestamp_str}.json"
    filepath = os.path.join(backup_dir, filename)

    backup_data = export_all_data(db, user)
    if note:
        backup_data["metadata"]["note"] = note

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(backup_data, f, ensure_ascii=False, indent=2)

    file_size = os.path.getsize(filepath)

    if user:
        log_activity(
            db=db,
            user=user,
            module="system",
            action_type="backup",
            title="Vytvoření systémové zálohy",
            description=f"Správce vytvořil snapshot {filename} ({file_size // 1024} kB)",
            entity_type="System",
            entity_id=0
        )
        db.commit()

    return {
        "filename": filename,
        "created_at": now.isoformat(),
        "file_size_bytes": file_size,
        "file_size_kb": round(file_size / 1024, 1),
        "total_items": backup_data["metadata"]["total_items"],
        "note": note,
    }


def list_server_backups() -> List[Dict[str, Any]]:
    """
    Lists all available backup files stored in the server backup directory.
    """
    backup_dir = ensure_backup_dir()
    files = glob.glob(os.path.join(backup_dir, "hestia_backup_*.json"))
    backups = []

    for path in sorted(files, reverse=True):
        fname = os.path.basename(path)
        size = os.path.getsize(path)
        mtime = datetime.datetime.fromtimestamp(os.path.getmtime(path)).isoformat()
        total_items = 0
        note = ""

        try:
            with open(path, "r", encoding="utf-8") as f:
                head = json.load(f)
                meta = head.get("metadata", {})
                total_items = meta.get("total_items", 0)
                note = meta.get("note", "")
        except Exception:
            pass

        backups.append({
            "filename": fname,
            "created_at": mtime,
            "file_size_bytes": size,
            "file_size_kb": round(size / 1024, 1),
            "total_items": total_items,
            "note": note,
        })

    return backups


def restore_server_backup(db: Session, filename: str, current_user: Optional[User] = None) -> Dict[str, Any]:
    """
    Restores the database from an existing server snapshot file.
    """
    backup_dir = ensure_backup_dir()
    # Path traversal protection
    clean_fname = os.path.basename(filename)
    filepath = os.path.join(backup_dir, clean_fname)

    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Záložní soubor '{clean_fname}' nebyl nalezen.")

    with open(filepath, "r", encoding="utf-8") as f:
        backup_json = json.load(f)

    result = import_data(db, backup_json, mode="replace", current_user=current_user)

    if current_user:
        log_activity(
            db=db,
            user=current_user,
            module="system",
            action_type="restore",
            title="Obnova systému ze snapshotu",
            description=f"Správce {current_user.display_name} obnovil systém ze zálohy {clean_fname}.",
            entity_type="System",
            entity_id=0
        )
        db.commit()

    return result


def delete_server_backup(filename: str) -> bool:
    """
    Deletes a backup file from the server backup directory.
    """
    backup_dir = ensure_backup_dir()
    clean_fname = os.path.basename(filename)
    filepath = os.path.join(backup_dir, clean_fname)

    if os.path.exists(filepath):
        os.remove(filepath)
        return True
    return False
