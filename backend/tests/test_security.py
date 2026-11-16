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
    # Změna PINu bez starého PINu musí selhat
    no_old = client.post(
        f"{API}/documents/vault/pin",
        json={"new_pin": "9999"},
        headers=auth,
    )
    assert no_old.status_code == 400

    # S výchozím PINem 1234 projde a uloží se hash
    ok = client.post(
        f"{API}/documents/vault/pin",
        json={"old_pin": "1234", "new_pin": "4321"},
        headers=auth,
    )
    assert ok.status_code == 200
    setting = db.query(VaultSetting).first()
    assert setting is not None and setting.pin_hash.startswith("$2")

    # Ověření nového PINu projde, starého neprojde
    assert client.post(f"{API}/documents/vault/verify", json={"pin": "4321"}, headers=auth).status_code == 200
    assert client.post(f"{API}/documents/vault/verify", json={"pin": "1234"}, headers=auth).status_code == 401
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
