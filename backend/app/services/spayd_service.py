import re

def czech_account_to_iban(account_str: str) -> str:
    """
    Converts Czech bank account number (e.g. 123456789/0800 or 12-123456789/0800)
    to standardized international IBAN.
    """
    if not account_str:
        return ""
    clean = account_str.strip().replace(" ", "")
    if clean.upper().startswith("CZ"):
        return clean.upper()

    if "/" not in clean:
        return clean

    try:
        parts = clean.split("/")
        bank_code = parts[1].strip().zfill(4)
        acc_part = parts[0].strip()

        if "-" in acc_part:
            prefix, account = acc_part.split("-")
            prefix = prefix.strip().zfill(6)
            account = account.strip().zfill(10)
        else:
            prefix = "000000"
            account = acc_part.strip().zfill(10)

        bban = f"{bank_code}{prefix}{account}"
        # Country code CZ -> C=12, Z=35, followed by 00
        num_str = f"{bban}123500"
        check_digits = 98 - (int(num_str) % 97)
        return f"CZ{check_digits:02d}{bban}"
    except Exception:
        return clean


def generate_spayd_string(
    iban: str,
    amount: float,
    currency: str = "CZK",
    message: str = "Hestia vyrovnani",
    vs: str = ""
) -> str:
    """
    Generates standard Czech SPAYD (Short Payment Descriptor) string for QR code generation.
    """
    if not iban:
        return ""

    clean_iban = iban.strip().replace(" ", "").upper()
    # Sanitize message (SPAYD allows standard ASCII, replace accents)
    import unicodedata
    clean_msg = "".join(
        c for c in unicodedata.normalize("NFD", message)
        if unicodedata.category(c) != "Mn"
    )
    # Remove characters not permitted in SPAYD
    clean_msg = re.sub(r"[^A-Za-z0-9 .,/+\-]", " ", clean_msg).strip()[:60]

    spayd_parts = [
        "SPD*1.0",
        f"ACC:{clean_iban}",
        f"AM:{amount:.2f}",
        f"CC:{currency.upper()}"
    ]

    if clean_msg:
        spayd_parts.append(f"MSG:{clean_msg}")
    if vs:
        spayd_parts.append(f"X-VS:{vs}")

    return "*".join(spayd_parts) + "*"
