"""Validace nahraných souborů — přípona a velikost se kontrolují před přečtením do paměti."""
import os
from typing import FrozenSet, Tuple

from fastapi import HTTPException, UploadFile, status

MAX_UPLOAD_BYTES = 25 * 1024 * 1024

IMAGE_EXT = frozenset({".pdf", ".png", ".jpg", ".jpeg", ".webp"})
RECIPE_EXT = frozenset({".pdf", ".txt", ".md", ".csv", ".json", ".html", ".htm", ".rtf", ".png", ".jpg", ".jpeg", ".webp"})
TABLE_EXT = frozenset({".csv", ".xlsx", ".xls"})
JSON_EXT = frozenset({".json"})


def _basename(filename: str | None) -> str:
    return os.path.basename((filename or "").replace("\\", "/"))


def safe_upload_subpath(upload_dir: str, rel_path: str | None) -> str | None:
    """Resolve rel_path inside upload_dir; returns None on traversal or invalid path."""
    if not rel_path:
        return None
    cleaned = rel_path.strip()
    if cleaned.startswith("/uploads/"):
        cleaned = cleaned[len("/uploads/"):]
    elif cleaned.startswith("uploads/"):
        cleaned = cleaned[len("uploads/"):]
    cleaned = cleaned.lstrip("/\\")
    if not cleaned or os.path.isabs(cleaned):
        return None
    root = os.path.realpath(upload_dir)
    target = os.path.realpath(os.path.join(root, cleaned))
    try:
        if os.path.commonpath([root, target]) == root and target != root:
            return target
    except ValueError:
        return None
    return None


async def read_upload(
    file: UploadFile,
    allowed_ext: FrozenSet[str],
    max_bytes: int = MAX_UPLOAD_BYTES,
) -> Tuple[str, str, bytes]:
    """Vrátí (bezpečné jméno, přípona, obsah). Vyhodí HTTPException 400/413 při špatném typu či velikosti."""
    name = _basename(file.filename)
    ext = os.path.splitext(name)[1].lower()
    if ext not in allowed_ext:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Nepodporovaný typ souboru ({ext or 'bez přípony'}). Povoleno: {', '.join(sorted(allowed_ext))}.",
        )

    content = await file.read(max_bytes + 1)
    if len(content) > max_bytes:
        raise HTTPException(
            status.HTTP_413_CONTENT_TOO_LARGE,
            f"Soubor je příliš velký (limit {max_bytes // (1024 * 1024)} MB).",
        )
    if not content:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Nahraný soubor je prázdný.")
    return name, ext, content
