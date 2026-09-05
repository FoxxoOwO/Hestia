import json
import logging
import base64
import re
from typing import Optional, Dict, Any
from google import genai
from google.genai import types

from app.config import settings

logger = logging.getLogger(__name__)

class GeminiFinanceService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY

    def _get_client(self) -> genai.Client:
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY není nastaven.")
        return genai.Client(api_key=self.api_key)

    async def scan_receipt(
        self,
        image_base64: Optional[str] = None,
        image_url: Optional[str] = None,
        target_language: str = "cs"
    ) -> Dict[str, Any]:
        client = self._get_client()

        prompt = f"""
Jsi inteligentní finanční asistent pro domácnost Hestia.
Tvým úkolem je zanalyzovat přiloženou fotografii nákupní účtenky nebo faktury.

Extrahuj z účtenky následující údaje a vrať je striktně v JSON formátu:
{{
  "store_name": "Název obchodu / prodejce (např. Albert, Kaufland, Shell, Lékárna Dr. Max)",
  "date": "Datum nákupu ve formátu YYYY-MM-DD (pokud není čitelné, odhadni nebo nech prázdné)",
  "total_amount": 1245.50,
  "category": "Jedna z kategorií: groceries (potraviny a drogerie), transport (benzín, MHD), health (lékárna, lékař), pets (chovatelské potřeby, veterina), housing (bydlení, hobby market), entertainment (kino, restaurace), kids (škola, hračky), shopping (oblečení, elektronika), other",
  "items_summary": "Stručný přehled 2-4 hlavních položek nákupu"
}}

DŮLEŽITÉ:
- total_amount musí být číslo (float) reprezentující celkovou zaplacenou částku v CZK / Kč.
- Odpověz POUZE validním JSON objektem bez dalších úvodních či závěrečných textů.
"""

        contents = []
        if image_base64:
            clean_b64 = image_base64
            mime_type = "image/jpeg"
            if "," in image_base64:
                header, clean_b64 = image_base64.split(",", 1)
                if "png" in header:
                    mime_type = "image/png"
                elif "webp" in header:
                    mime_type = "image/webp"

            img_bytes = base64.b64decode(clean_b64)
            part = types.Part.from_bytes(data=img_bytes, mime_type=mime_type)
            contents.append(part)

        contents.append(prompt)

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
            return {
                "store_name": "Neznámý obchod",
                "date": None,
                "total_amount": 0.0,
                "category": "groceries",
                "items_summary": "Nepodařilo se extrahovat položky"
            }
