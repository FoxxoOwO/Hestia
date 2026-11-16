"""Jednoduchý in-memory rate limiter pro přihlašování.

shortcut: stav je v paměti procesu, takže s více workery (uvicorn --workers > 1)
platí limit per worker; při potřebě přesunout do Redis.
"""
import time
from typing import Dict, List

from fastapi import HTTPException, status

MAX_LOGIN_ATTEMPTS = 5
LOGIN_WINDOW_SECONDS = 300

_failures: Dict[str, List[float]] = {}


def _prune(now: float) -> None:
    """Smaže klíče bez aktivních záznamů, aby dict nerostl do nekonečna."""
    for key in [k for k, stamps in _failures.items() if not stamps or now - stamps[-1] > LOGIN_WINDOW_SECONDS]:
        _failures.pop(key, None)


def check_login_rate_limit(key: str) -> None:
    now = time.monotonic()
    if len(_failures) > 1000:
        _prune(now)
    stamps = [t for t in _failures.get(key, ()) if now - t < LOGIN_WINDOW_SECONDS]
    if stamps:
        _failures[key] = stamps
    if len(stamps) >= MAX_LOGIN_ATTEMPTS:
        retry_after = int(LOGIN_WINDOW_SECONDS - (now - stamps[0])) + 1
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                f"Příliš mnoho neúspěšných pokusů o přihlášení. "
                f"Zkuste to znovu za {retry_after} s."
            ),
            headers={"Retry-After": str(retry_after)},
        )


def register_failed_login(key: str) -> None:
    _failures.setdefault(key, []).append(time.monotonic())


def reset_login_attempts(key: str) -> None:
    _failures.pop(key, None)
