"""
Hestia Smart Home OS - Sample Data Cleanup Service
Purges all sample/demo data from the database and upload directories,
leaving a clean production environment with only the default Administrator account.
"""

import os
import shutil
from sqlalchemy.orm import Session
from sqlalchemy import text

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
from app.utils.auth import get_password_hash
from app.config import settings


def clean_all_sample_data(db: Session, upload_dirs: list[str] = None) -> dict[str, int]:
    """
    Deletes all sample data across all modules, preserves only the Admin account,
    and removes sample uploaded files.
    """
    deleted_counts = {}

    # 1. Activities
    deleted_counts["activity_logs"] = db.query(ActivityLog).delete()

    # 2. Medicines & First Aid
    deleted_counts["medication_logs"] = db.query(MedicationLog).delete()
    deleted_counts["medication_schedules"] = db.query(MedicationSchedule).delete()
    deleted_counts["medicines"] = db.query(Medicine).delete()

    # 3. Vehicles & Garage
    deleted_counts["vehicle_service_records"] = db.query(VehicleServiceRecord).delete()
    deleted_counts["vehicle_refuelings"] = db.query(VehicleRefueling).delete()
    deleted_counts["vehicles"] = db.query(Vehicle).delete()

    # 4. Documents & Vault
    deleted_counts["documents"] = db.query(Document).delete()
    # Reset vault setting to clean default
    db.query(VaultSetting).delete()
    db.add(VaultSetting(pin_hash="1234", is_active=True))

    # 5. Finance
    deleted_counts["finance_transactions"] = db.query(FinanceTransaction).delete()
    deleted_counts["finance_category_budgets"] = db.query(CategoryBudget).delete()
    deleted_counts["finance_subscriptions"] = db.query(Subscription).delete()
    deleted_counts["finance_savings_goals"] = db.query(SavingsGoal).delete()
    deleted_counts["finance_user_profiles"] = db.query(UserFinanceProfile).delete()

    # 6. Chores & Rewards
    deleted_counts["chore_reward_redemptions"] = db.query(ChoreRewardRedemption).delete()
    deleted_counts["chore_rewards"] = db.query(ChoreReward).delete()
    deleted_counts["chore_completions"] = db.query(ChoreCompletion).delete()
    deleted_counts["chores"] = db.query(Chore).delete()

    # 7. Pets
    deleted_counts["pet_log_entries"] = db.query(PetLogEntry).delete()
    deleted_counts["pet_tasks"] = db.query(PetTask).delete()
    deleted_counts["pet_weight_logs"] = db.query(PetWeightLog).delete()
    deleted_counts["pet_medications"] = db.query(PetMedication).delete()
    deleted_counts["pet_medical_records"] = db.query(PetMedicalRecord).delete()
    deleted_counts["pets"] = db.query(Pet).delete()

    # 8. Plants
    deleted_counts["plant_log_entries"] = db.query(PlantLogEntry).delete()
    deleted_counts["plant_tasks"] = db.query(PlantTask).delete()
    deleted_counts["plants"] = db.query(Plant).delete()

    # 9. Shopping & Pantry & Recipes
    deleted_counts["shopping_items"] = db.query(ShoppingItem).delete()
    deleted_counts["pantry_items"] = db.query(PantryItem).delete()
    deleted_counts["recipes"] = db.query(Recipe).delete()

    # 10. Users: Delete demo users (anna, petr, etc.), keep / ensure admin
    non_admin_users = db.query(User).filter(User.username != "admin").all()
    deleted_counts["demo_users"] = len(non_admin_users)
    for u in non_admin_users:
        db.delete(u)

    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        admin = User(
            username="admin",
            display_name="Správce Domácnosti",
            email="admin@hestia.home",
            hashed_password=get_password_hash("hestia123"),
            role="admin",
            avatar_color="#f97316",
            preferred_language="cs",
            preferred_theme="system",
            is_active=True
        )
        db.add(admin)
    else:
        admin.role = "admin"
        admin.is_active = True

    db.commit()

    # 11. Clean disk uploads if directories provided or default
    if upload_dirs is None:
        upload_dirs = [settings.UPLOAD_DIR]

    for udir in upload_dirs:
        if os.path.exists(udir):
            # Clean sample files in documents
            sample_dir = os.path.join(udir, "documents", "sample")
            if os.path.exists(sample_dir):
                shutil.rmtree(sample_dir, ignore_errors=True)
            # Clean uploaded test files in documents subfolders
            doc_dir = os.path.join(udir, "documents")
            if os.path.exists(doc_dir):
                for root, dirs, files in os.walk(doc_dir):
                    for file in files:
                        if file != ".gitkeep":
                            try:
                                os.remove(os.path.join(root, file))
                            except Exception:
                                pass

    return deleted_counts


if __name__ == "__main__":
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        counts = clean_all_sample_data(db)
        print("=== PROBĚHLO ÚSPĚŠNÉ SMAZÁNÍ UKÁZKOVÝCH DAT ===")
        total_deleted = sum(v for k, v in counts.items() if k != "demo_users")
        print(f"Smazáno celkem {total_deleted} záznamů a {counts.get('demo_users', 0)} ukázkových členů.")
        for k, v in counts.items():
            if v > 0:
                print(f"  - {k}: {v}")
        print("V systému zůstal pouze čistý administrátorský účet 'admin'.")
    finally:
        db.close()
