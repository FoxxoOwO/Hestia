"""Bezpečnostní regrese: path traversal, whitelist uploadů, CORS."""
import io

from fastapi import HTTPException, UploadFile
from starlette.datastructures import Headers

from app.utils.uploads import IMAGE_EXT, MAX_UPLOAD_BYTES, read_upload
from tests.conftest import API

UPLOAD = f"{API}/documents/upload"


def test_spa_does_not_serve_files_outside_dist(client):
    """Cesta s .. nesmí vrátit soubor mimo frontend/dist."""
    response = client.get("/%2e%2e%2fsecret-outside-dist.txt")
    assert response.status_code in (200, 404)
    assert "TOP-SECRET" not in response.text


def test_spa_serves_index_for_unknown_path(client):
    response = client.get("/some/deep/client/route")
    assert response.status_code == 200
    assert "Hestia" in response.text


def test_upload_rejects_unknown_extension(client, auth):
    response = client.post(
        UPLOAD,
        files={"file": ("payload.exe", b"MZ...", "application/octet-stream")},
        data={"auto_analyze": "false"},
        headers=auth,
    )
    assert response.status_code == 400
    assert ".exe" in response.json()["detail"]


def test_upload_rejects_empty_file(client, auth):
    response = client.post(
        UPLOAD,
        files={"file": ("prazdny.pdf", b"", "application/pdf")},
        data={"auto_analyze": "false"},
        headers=auth,
    )
    assert response.status_code == 400


def test_upload_accepts_valid_pdf(client, auth):
    response = client.post(
        UPLOAD,
        files={"file": ("dokument.pdf", b"%PDF-1.4 test", "application/pdf")},
        data={"auto_analyze": "false"},
        headers=auth,
    )
    assert response.status_code == 200, response.text


def test_upload_strips_path_from_client_filename(client, auth):
    """Prohlížeč může poslat '..\\..\\evil.pdf' - uložit se smí jen basename."""
    response = client.post(
        UPLOAD,
        files={"file": ("..\\..\\evil.pdf", b"%PDF-1.4 test", "application/pdf")},
        data={"auto_analyze": "false"},
        headers=auth,
    )
    assert response.status_code == 200, response.text
    assert ".." not in response.json()["file_path"]
    assert ".." not in response.json()["file_name"]


def test_read_upload_rejects_oversize():
    """Limit velikosti se ověřuje v read_upload (25 MB je pro test zbytečně velké)."""
    import asyncio

    import pytest

    upload = UploadFile(
        file=io.BytesIO(b"x" * 11),
        filename="velky.pdf",
        headers=Headers({"content-type": "application/pdf"}),
    )
    with pytest.raises(HTTPException) as exc:
        asyncio.run(read_upload(upload, IMAGE_EXT, max_bytes=10))
    assert exc.value.status_code == 413


def test_max_upload_limit_is_25_mb():
    assert MAX_UPLOAD_BYTES == 25 * 1024 * 1024


def test_cors_preflight_does_not_allow_credentials(client):
    response = client.options(
        f"{API}/recipes",
        headers={"Origin": "http://example.com", "Access-Control-Request-Method": "GET"},
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "*"
    assert "access-control-allow-credentials" not in {
        key.lower() for key in response.headers
    }


def test_document_create_rejects_path_traversal(client, auth):
    response = client.post(
        f"{API}/documents",
        json={"title": "Zlý dokument", "file_path": "../../hestia.db", "file_name": "hestia.db"},
        headers=auth,
    )
    assert response.status_code == 400


def test_vault_pin_change_requires_old_pin_and_hashes(client, auth, db):
    from app.models.document import VaultSetting
    from app.utils.rate_limit import _failures

    _failures.clear()
    # Trezor začíná zamčený – správce nastaví první PIN bez starého.
    initial = client.post(
        f"{API}/documents/vault/pin",
        json={"new_pin": "432109"},
        headers=auth,
    )
    assert initial.status_code == 200, initial.text

    # Jakmile je PIN aktivní, změna bez starého PINu musí selhat.
    no_old = client.post(
        f"{API}/documents/vault/pin",
        json={"new_pin": "999999"},
        headers=auth,
    )
    assert no_old.status_code == 400

    ok = client.post(
        f"{API}/documents/vault/pin",
        json={"old_pin": "432109", "new_pin": "123456"},
        headers=auth,
    )
    assert ok.status_code == 200
    setting = db.query(VaultSetting).first()
    assert setting is not None and setting.pin_hash.startswith("$2")

    # Ověření nového PINu projde, starého neprojde.
    assert client.post(f"{API}/documents/vault/verify", json={"pin": "123456"}, headers=auth).status_code == 200
    assert client.post(f"{API}/documents/vault/verify", json={"pin": "432109"}, headers=auth).status_code == 401
    _failures.clear()


def test_system_import_rejects_non_json(client, auth):
    response = client.post(
        f"{API}/system/import",
        files={"file": ("evil.txt", b"hello", "text/plain")},
        data={"mode": "merge"},
        headers=auth,
    )
    assert response.status_code == 400


def test_ai_base64_import_rejects_invalid_payload(client, auth):
    response = client.post(
        f"{API}/ai/import-recipe-base64",
        json={"file_base64": "!!!not-base64!!!", "filename": "recept.txt"},
        headers=auth,
    )
    assert response.status_code == 400


def test_no_hardcoded_default_admin_password(client):
    """Veřejně známé heslo z původního seederu už nesmí fungovat."""
    response = client.post(
        f"{API}/auth/login",
        json={"username": "admin", "password": "hestia123"},
    )
    assert response.status_code == 401


def test_vault_documents_require_server_issued_token(client, auth, db):
    """Trezor nesmí jít otevřít přes query parametr ani přímý souborový odkaz."""
    from app.models.document import VaultSetting
    from app.utils.rate_limit import _failures

    _failures.clear()
    # Nastavení PINu správcem (předchozí test mohl PIN už aktivovat)
    setting = db.query(VaultSetting).first()
    pin_payload = {"new_pin": "135790"}
    if setting and setting.is_active:
        pin_payload["old_pin"] = "123456"
    pin_res = client.post(
        f"{API}/documents/vault/pin", json=pin_payload, headers=auth
    )
    assert pin_res.status_code == 200, pin_res.text
    vault_headers = {**auth, "X-Vault-Token": pin_res.json()["vault_token"]}

    # Vytvoření trezorového dokumentu s reálným souborem
    up = client.post(
        f"{API}/documents/upload?auto_analyze=false",
        files={"file": ("passport.pdf", b"%PDF-1.4 vault secret", "application/pdf")},
        headers=auth,
    )
    assert up.status_code == 200
    created = client.post(
        f"{API}/documents",
        headers=auth,
        json={
            "title": "Občanský průkaz",
            "file_path": up.json()["file_path"],
            "file_name": "passport.pdf",
            "is_vault_protected": True,
        },
    )
    assert created.status_code == 201, created.text
    doc = created.json()
    doc_id, file_path = doc["id"], doc["file_path"]

    # Soubor se přesouvá mimo veřejný /uploads
    assert file_path.startswith("vault/")
    assert client.get(f"/uploads/{file_path}").status_code == 404

    # Bez tokenu: seznam, detail i soubor musí být nedostupné
    assert all(not d["is_vault_protected"] for d in client.get(f"{API}/documents", headers=auth).json())
    assert client.get(f"{API}/documents/{doc_id}", headers=auth).status_code == 403
    assert client.get(f"{API}/documents/{doc_id}/file", headers=auth).status_code == 403
    assert client.get(f"{API}/documents/stats", headers=auth).json()["vault_count"] == 0

    # S tokenem je vše dostupné
    assert any(d["id"] == doc_id for d in client.get(f"{API}/documents", headers=vault_headers).json())
    assert client.get(f"{API}/documents/{doc_id}", headers=vault_headers).status_code == 200
    file_res = client.get(f"{API}/documents/{doc_id}/file", headers=vault_headers)
    assert file_res.status_code == 200
    assert file_res.content == b"%PDF-1.4 vault secret"

    # Přímé `vault_unlocked=true` už nemá žádný efekt
    assert all(
        not d["is_vault_protected"]
        for d in client.get(f"{API}/documents?vault_unlocked=true", headers=auth).json()
    )
    _failures.clear()


def test_ssrf_guard_blocks_private_addresses():
    """AI import nesmí načítat localhost, metadata IP ani jiné privátní sítě."""
    import asyncio
    import pytest
    from app.services.gemini_service import _assert_public_url, _is_public_address

    assert _is_public_address("8.8.8.8") is True
    assert _is_public_address("127.0.0.1") is False
    assert _is_public_address("169.254.169.254") is False
    assert _is_public_address("10.0.0.5") is False
    assert _is_public_address("192.168.1.1") is False
    assert _is_public_address("::ffff:127.0.0.1") is False

    with pytest.raises(ValueError):
        asyncio.run(_assert_public_url("http://127.0.0.1:8000/admin"))
    with pytest.raises(ValueError):
        asyncio.run(_assert_public_url("http://169.254.169.254/latest/meta-data/"))
    with pytest.raises(ValueError):
        asyncio.run(_assert_public_url("file:///etc/passwd"))


def test_cookie_auth_requires_csrf_and_refresh_works():
    """Web autentifikace přes httpOnly cookie + double-submit CSRF."""
    from fastapi.testclient import TestClient
    from app.main import app
    from tests.conftest import ADMIN_USER, ADMIN_PASSWORD

    fresh = TestClient(app)
    res = fresh.post(f"{API}/auth/login", json={"username": ADMIN_USER, "password": ADMIN_PASSWORD})
    assert res.status_code == 200, res.text
    csrf = res.json()["csrf_token"]
    assert csrf and "hestia_access" in fresh.cookies

    # Čtení s cookie funguje
    assert fresh.get(f"{API}/auth/me").status_code == 200

    # Mutace bez CSRF hlavičky musí být odmítnuta
    assert fresh.post(
        f"{API}/auth/verify-password", json={"password": ADMIN_PASSWORD}
    ).status_code == 403

    # Mutace s CSRF hlavičkou projde
    assert fresh.post(
        f"{API}/auth/verify-password",
        json={"password": ADMIN_PASSWORD},
        headers={"X-CSRF-Token": csrf},
    ).status_code == 200

    # Refresh vydá nový access token
    refresh_res = fresh.post(f"{API}/auth/refresh")
    assert refresh_res.status_code == 200, refresh_res.text
    assert refresh_res.json()["access_token"]

    # Odhlášení smaže cookies
    assert fresh.post(f"{API}/auth/logout").status_code == 200
    assert "hestia_access" not in fresh.cookies


def test_password_change_invalidates_existing_tokens(db):
    """Změna hesla musí zneplatnit i dříve vydané Bearer tokeny."""
    from fastapi.testclient import TestClient
    from app.main import app
    from app.models.user import User
    from app.utils.auth import get_password_hash

    username = "token_version_test"
    user = User(
        username=username,
        display_name="Token Test",
        hashed_password=get_password_hash("StrongPassw0rd!2026"),
        role="member",
        is_active=True,
        token_version=0,
    )
    db.add(user)
    db.commit()

    try:
        fresh = TestClient(app)
        login = fresh.post(
            f"{API}/auth/login",
            json={"username": username, "password": "StrongPassw0rd!2026"},
        )
        assert login.status_code == 200, login.text
        old_token = login.json()["access_token"]
        csrf = login.json()["csrf_token"]

        changed = fresh.post(
            f"{API}/auth/change-password",
            json={
                "current_password": "StrongPassw0rd!2026",
                "new_password": "EvenStrongerPass!2026",
            },
            headers={"X-CSRF-Token": csrf},
        )
        assert changed.status_code == 200, changed.text

        old_headers = {"Authorization": f"Bearer {old_token}"}
        assert fresh.get(f"{API}/auth/me", headers=old_headers).status_code == 401
    finally:
        db.query(User).filter(User.username == username).delete()
        db.commit()
