import json
import logging
import base64
import re
from typing import Optional, Dict, Any
from google import genai
from google.genai import types

from app.config import settings

logger = logging.getLogger(__name__)

class GeminiDocumentService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY

    def _get_client(self) -> genai.Client:
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY není nastaven.")
        return genai.Client(api_key=self.api_key)

    async def analyze_document(
        self,
        file_bytes: bytes,
        mime_type: str = "application/pdf"
    ) -> Dict[str, Any]:
        client = self._get_client()

        prompt = """
Jsi specializovaný asistent pro digitalizaci a archivaci dokumentů v chytré domácnosti Hestia.
Tvým úkolem je podrobně zanalyzovat přiložený dokument (může jít o záruční list, účtenku, smlouvu, revizní zprávu, manuál, úřední doklad apod.).

Zanalyzuj dokument a extrahuj následující metadata striktně v JSON formátu:
{
  "title": "Stručný a výstižný název dokumentu (např. 'Záruční list - Pračka Bosch Serie 6', 'Pojistná smlouva - Domácnost Kooperativa', 'Zpráva o revizi plynového kotle')",
  "category": "Jedna z kategorií: warranty (záruční list / účtenka), contract (smlouva / pojištění / energie), identity (rodný list, pas, průkaz), inspection (revize kotle, kominík, STK), manual (uživatelský návod spotřebiče), medical (lékařská zpráva / očkování), housing (nemovitost / katastr), vehicle (vozidlo / techničák), other",
  "issuer": "Vystavitel / Instituce / Prodejce (např. 'Alza.cz', 'Kooperativa pojišťovna', 'ČEZ Prodej', 'Městský úřad', 'Datart')",
  "document_date": "Datum vystavení či podpisu ve formátu YYYY-MM-DD (nebo null pokud nelze určit)",
  "expiry_date": "Datum vypršení platnosti, konce záruky, termín příští revize či výročí smlouvy ve formátu YYYY-MM-DD (nebo null)",
  "warranty_months": 24,
  "contract_number": "Číslo smlouvy, sériové číslo spotřebiče, variabilní symbol či číslo jednací (nebo null)",
  "amount": 14990.0,
  "tags": "3-5 klíčových slov oddělených čárkou (např. 'pračka, záruka, bosch, elektro, alza')",
  "summary": "Přehledný souhrn obsahu dokumentu v 1-2 větách",
  "ocr_fulltext": "Kompletní nebo nejdůležitější vytěžený text z dokumentu pro možnost fulltextového prohledávání"
}

DŮLEŽITÉ POKYNY:
1. Pokud je na dokumentu záruka (např. 24 měsíců od data nákupu), automaticky dopočítej 'expiry_date'.
2. 'amount' uváděj jako float číslo v CZK (pokud je na dokumentu cena).
3. 'warranty_months' uveď jako celé číslo (např. 24, 36, 60), nebo null.
4. Odpověz POUZE validním JSON objektem, žádný úvodní ani doplňkový text.
"""

        part = types.Part.from_bytes(data=file_bytes, mime_type=mime_type)
        contents = [part, prompt]

        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=contents,
                config=types.GenerateContentConfig(
                    temperature=0.1,
                    response_mime_type="application/json"
                )
            )

            response_text = response.text or "{}"
            try:
                return json.loads(response_text)
            except json.JSONDecodeError:
                json_match = re.search(r"\{.*\}", response_text, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group(0))
        except Exception as e:
            logger.error(f"Chyba při Gemini analýze dokumentu: {e}")

        # Fallback
        return {
            "title": "Nový naskenovaný dokument",
            "category": "warranty",
            "issuer": None,
            "document_date": None,
            "expiry_date": None,
            "warranty_months": None,
            "contract_number": None,
            "amount": None,
            "tags": "dokument, sken",
            "summary": "Dokument byl nahrán do archivu.",
            "ocr_fulltext": ""
        }
