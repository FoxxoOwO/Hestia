"""Spouštění Alembic migrací při startu aplikace."""
from pathlib import Path
from typing import Optional

from alembic import command
from alembic.config import Config
from sqlalchemy import inspect

from app.config import settings
from app.database import engine

BASE_DIR = Path(__file__).resolve().parent.parent


def _alembic_config() -> Config:
    config = Config(str(BASE_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(BASE_DIR / "alembic"))
    config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
    config.attributes["configure_logger"] = False
    return config


def run_migrations() -> Optional[str]:
    """Aplikuje všechny migrace; vrací popis toho, co se stalo (pro logování).

    Starší databáze vzniklé přes `Base.metadata.create_all` nemají tabulku
    `alembic_version` - ty se nejdřív orazítkují na aktuální hlavu, aby se
    migrace nepokoušely znovu vytvářet existující tabulky.
    """
    config = _alembic_config()
    tables = set(inspect(engine).get_table_names())
    stamped = False
    if tables and "alembic_version" not in tables:
        command.stamp(config, "head")
        stamped = True
    command.upgrade(config, "head")
    return "stamped-legacy-db" if stamped else "upgraded"
