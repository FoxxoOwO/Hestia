"""
Hestia Smart Home OS - Initial System Initialization
This module provides first-time system initialization (e.g. creating the default Admin account).
All demo/sample data has been extracted to `app.services.seed_demo_data` to ensure a completely
clean environment for household production use.
"""

from sqlalchemy.orm import Session
from app.models.user import User
from app.models.document import VaultSetting
from app.utils.auth import get_password_hash


def seed_initial_data(db: Session) -> None:
    """
    Initializes the bare minimum system requirements if the database is newly created:
    - 1 default administrator account (admin / hestia123)
    - Default vault security PIN setting
    Does NOT seed any sample recipes, pantry items, chores, plants, pets, vehicles, or finance records.
    """
    # 1. Create Default Admin User only if no users exist at all
    if db.query(User).count() == 0:
        admin_user = User(
            username="admin",
            display_name="Správce Domácnosti",
            email="admin@hestia.home",
            hashed_password=get_password_hash("hestia123"),
            role="admin",
            avatar_color="#f97316",  # Signature Hestia Orange
            preferred_language="cs",
            preferred_theme="system",
            is_active=True
        )
        db.add(admin_user)
        db.commit()

    # 2. Initialize default Vault security setting if none exists
    if db.query(VaultSetting).count() == 0:
        db.add(VaultSetting(pin_hash="1234", is_active=True))
        db.commit()


if __name__ == "__main__":
    from app.database import SessionLocal, Base, engine
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_initial_data(db)
        print("Hestia initial system setup complete (clean production state).")
    finally:
        db.close()
