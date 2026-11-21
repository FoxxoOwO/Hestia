"""
Hestia Smart Home OS - Initial System Initialization
This module provides first-time system initialization (e.g. creating the default Admin account).
All demo/sample data has been extracted to `app.services.seed_demo_data` to ensure a completely
clean environment for household production use.
"""

from sqlalchemy.orm import Session
from app.config import settings
from app.models.user import User
from app.models.document import VaultSetting
from app.utils.auth import get_password_hash, verify_password


_LEGACY_DEFAULT_PIN = "1234"


def seed_initial_data(db: Session) -> None:
    """
    Inicializuje minimální systémové záznamy:
    - 1 administrátorský účet s heslem z INITIAL_ADMIN_PASSWORD (povinné, žádné výchozí heslo)
    - záznam o PINu trezoru; pokud neexistuje, je trezor do nastavení PINu neaktivní

    Neinicializuje žádná demo data (recepty, spíž, úkoly, rostliny, mazlíčci, vozidla, finance).
    """
    # 1. První administrátor – fail-closed, pokud není heslo zadané v prostředí
    if db.query(User).count() == 0:
        initial_password = settings.INITIAL_ADMIN_PASSWORD
        if not initial_password or len(initial_password) < 12:
            raise RuntimeError(
                "INITIAL_ADMIN_PASSWORD není nastaveno nebo je krátké (min. 12 znaků). "
                "První spuštění bez výchozího hesla odmítá vytvořit administrátorský účet. "
                "Nastavte INITIAL_ADMIN_PASSWORD v .env."
            )
        admin_user = User(
            username="admin",
            display_name="Správce Domácnosti",
            email="admin@hestia.home",
            hashed_password=get_password_hash(initial_password),
            role="admin",
            avatar_color="#f97316",  # Signature Hestia Orange
            preferred_language="cs",
            preferred_theme="system",
            is_active=True,
            must_change_password=True,
        )
        db.add(admin_user)
        db.commit()

    # 1b. Existující instalace s veřejně známým heslem donutíme k jeho změně.
    for user in db.query(User).all():
        if user.must_change_password:
            continue
        try:
            if verify_password("hestia123", user.hashed_password):
                user.must_change_password = True
                db.commit()
        except (ValueError, TypeError):
            continue

    # 2. Trezor – bez nastaveného PINu zůstává zamčený.
    #    Staré instalace s veřejně známým PINem 1234 donutíme nastavit nový PIN.
    setting = db.query(VaultSetting).first()
    if setting is None:
        db.add(VaultSetting(pin_hash="", is_active=False))
        db.commit()
        return
    if not setting.is_active:
        return  # PIN čeká na nastavení administrátorem
    legacy_pin = setting.pin_hash == _LEGACY_DEFAULT_PIN
    if not legacy_pin:
        try:
            legacy_pin = verify_password(_LEGACY_DEFAULT_PIN, setting.pin_hash)
        except (ValueError, TypeError):
            legacy_pin = False
    if legacy_pin:
        setting.pin_hash = ""
        setting.is_active = False
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
