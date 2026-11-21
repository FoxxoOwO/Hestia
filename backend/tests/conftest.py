"""Sdílené fixtures pro pytest suite Hestia backendu.

Env proměnné se nastavují PŘED importem aplikace, aby testy nikdy nesáhly
na produkční databázi ani na skutečné .env (load_dotenv nepřepisuje existující
proměnné prostředí).
"""
import os
import pathlib
import secrets
import sys
import tempfile

BACKEND_DIR = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

_TMP = pathlib.Path(tempfile.mkdtemp(prefix="hestia-tests-"))

# Falešný frontend dist, aby se zaregistrovala SPA routa (test path traversal).
_DIST = _TMP / "dist"
(_DIST / "assets").mkdir(parents=True, exist_ok=True)
(_DIST / "index.html").write_text("<html>Hestia</html>", encoding="utf-8")
(_TMP / "secret-outside-dist.txt").write_text("TOP-SECRET", encoding="utf-8")

os.environ["DATABASE_URL"] = f"sqlite:///{(_TMP / 'test.db').as_posix()}"
os.environ["UPLOAD_DIR"] = str(_TMP / "uploads")
os.environ["FRONTEND_DIST_DIR"] = str(_DIST)
os.environ["SECRET_KEY"] = secrets.token_urlsafe(48)
os.environ["GEMINI_API_KEY"] = ""  # testy nikdy nesmí volat Gemini
os.environ["INITIAL_ADMIN_PASSWORD"] = "TestAdminPassw0rd!2026"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.database import SessionLocal  # noqa: E402

API = "/api/v1"
ADMIN_USER = "admin"
ADMIN_PASSWORD = os.environ["INITIAL_ADMIN_PASSWORD"]  # účet ze seed_initial_data


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="session")
def auth(client):
    response = client.post(
        f"{API}/auth/login",
        json={"username": ADMIN_USER, "password": ADMIN_PASSWORD},
    )
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}
