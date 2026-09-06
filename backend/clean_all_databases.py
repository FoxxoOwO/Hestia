"""
Hestia Smart Home OS - Standalone Database Cleaner
Finds all SQLite database instances (backend/hestia.db, data/db/hestia.db, hestia.db)
and purges all sample data, leaving only the admin account.
"""

import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend to python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import app.models  # Register all models
from app.database import Base
from app.services.clean_data import clean_all_sample_data


def clean_database_at_path(db_path: str):
    if not os.path.exists(db_path):
        print(f"Skipping {db_path} (does not exist)")
        return

    print(f"\n==========================================")
    print(f"Čištění databáze: {db_path}")
    print(f"==========================================")
    engine = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()
    try:
        counts = clean_all_sample_data(db)
        total_deleted = sum(v for k, v in counts.items() if k != "demo_users")
        print(f"Odstraněno {total_deleted} ukázkových záznamů a {counts.get('demo_users', 0)} ukázkových členů:")
        for k, v in counts.items():
            if v > 0:
                print(f"  - {k}: {v}")
    finally:
        db.close()


def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    db_paths = [
        os.path.join(root_dir, "backend", "hestia.db"),
        os.path.join(root_dir, "data", "db", "hestia.db"),
        os.path.join(root_dir, "hestia.db")
    ]

    upload_dirs = [
        os.path.join(root_dir, "backend", "uploads"),
        os.path.join(root_dir, "uploads"),
        os.path.join(root_dir, "data", "uploads")
    ]

    for db_p in db_paths:
        clean_database_at_path(db_p)

    # Clean upload dirs
    print(f"\nČištění ukázkových souborů v uploads...")
    for udir in upload_dirs:
        if os.path.exists(udir):
            for root, dirs, files in os.walk(udir):
                for file in files:
                    if file != ".gitkeep":
                        try:
                            fpath = os.path.join(root, file)
                            os.remove(fpath)
                            print(f"  Smazán soubor: {fpath}")
                        except Exception as e:
                            print(f"  Chyba při mazání {file}: {e}")

    print("\n[HOTOVO] Všechna ukázková data byla úspěšně odstraněna ze všech databází.")


if __name__ == "__main__":
    main()
