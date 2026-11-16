"""Přihlašování: správné údaje, sjednocená chyba a rate limiting."""
import time

import pytest

from app.utils.rate_limit import _failures, reset_login_attempts
from tests.conftest import ADMIN_PASSWORD, ADMIN_USER, API

LOGIN = f"{API}/auth/login"


@pytest.fixture(autouse=True)
def _clean_attempts():
    _failures.clear()
    yield
    _failures.clear()


def login(client, username, password):
    return client.post(LOGIN, json={"username": username, "password": password})


def test_login_success(client):
    response = login(client, ADMIN_USER, ADMIN_PASSWORD)
    assert response.status_code == 200
    assert response.json()["access_token"]
    assert response.json()["user"]["username"] == ADMIN_USER


def test_login_wrong_password(client):
    response = login(client, ADMIN_USER, "spatne-heslo")
    assert response.status_code == 401


def test_login_unknown_user_same_error(client):
    """Neznámé jméno i špatné heslo musí vrátit stejnou odpověď (bez enumerace účtů)."""
    unknown = login(client, "neexistujici-uzivatel", "whatever")
    wrong = login(client, ADMIN_USER, "whatever")
    assert unknown.status_code == wrong.status_code == 401
    assert unknown.json()["detail"] == wrong.json()["detail"]


def test_login_rate_limit(client):
    codes = [login(client, ADMIN_USER, "spatne").status_code for _ in range(5)]
    assert codes == [401] * 5

    blocked = login(client, ADMIN_USER, "spatne")
    assert blocked.status_code == 429
    assert "Retry-After" in blocked.headers
    assert int(blocked.headers["Retry-After"]) > 0

    # Zablokované je i správné heslo, dokud okno nevyprší.
    assert login(client, ADMIN_USER, ADMIN_PASSWORD).status_code == 429


def test_rate_limit_is_per_user(client):
    for _ in range(5):
        login(client, ADMIN_USER, "spatne")
    # Jiné jméno ze stejné IP zablokované není.
    assert login(client, "jiny-clen", "spatne").status_code == 401


def test_success_resets_counter(client):
    for _ in range(4):
        login(client, ADMIN_USER, "spatne")
    assert login(client, ADMIN_USER, ADMIN_PASSWORD).status_code == 200
    reset_login_attempts(f"testclient|{ADMIN_USER}")
    for _ in range(4):
        assert login(client, ADMIN_USER, "spatne").status_code == 401


def test_password_check_costs_same_for_unknown_user(client):
    """bcrypt musí běžet i pro neexistující účet (jinak jde měřit časem)."""

    def measure(username, runs=4):
        started = time.perf_counter()
        for _ in range(runs):
            login(client, username, "spatne-heslo")
            reset_login_attempts(f"testclient|{username}")
        return (time.perf_counter() - started) / runs

    known = measure(ADMIN_USER)
    unknown = measure("nikdo-takovy")
    assert max(known, unknown) / min(known, unknown) < 3
