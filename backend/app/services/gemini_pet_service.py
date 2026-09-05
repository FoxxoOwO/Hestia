import base64
import json
import logging
from typing import Optional
from google import genai
from google.genai import types

from app.config import settings
from app.schemas.pet import PetFoodSafetyCheckResponse, PetSymptomCheckResponse

logger = logging.getLogger(__name__)

class GeminiPetService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY

    def _get_client(self) -> genai.Client:
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not configured. Please provide an API key in settings or .env.")
        return genai.Client(api_key=self.api_key)

    def _prepare_image_part(self, image_base64: Optional[str]) -> Optional[types.Part]:
        if not image_base64:
            return None
        
        mime_type = "image/jpeg"
        b64_data = image_base64
        if "base64," in image_base64:
            prefix, b64_data = image_base64.split("base64,", 1)
            if "image/png" in prefix:
                mime_type = "image/png"
            elif "image/webp" in prefix:
                mime_type = "image/webp"
        
        try:
            image_bytes = base64.b64decode(b64_data)
            return types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
        except Exception as e:
            logger.error(f"Failed to decode base64 image: {e}")
            return None

    async def check_food_safety(
        self,
        species: str,
        food_name: str,
        target_language: str = "cs"
    ) -> PetFoodSafetyCheckResponse:
        client = self._get_client()

        lang_instruction = (
            "Odpovídej v českém jazyce."
            if target_language == "cs"
            else "Respond in English."
        )

        system_instruction = f"""Jsi špičkový veterinární toxikolog a nutriční poradce pro chytrou domácnost Hestia.
Tvým úkolem je posoudit bezpečnost konkrétní lidské potraviny nebo látky pro zadaný druh zvířete ({species}).

Pravidla klasifikace bezpečnosti (safety_level):
- 'toxic': Jedovaté nebo životu nebezpečné potraviny (např. pro psy/kočky: čokoláda, xylitol, cibule, česnek, hrozny/rozinky, avokádo, vařené kosti, makadamové ořechy, alkohol, kofein).
- 'caution': Nevhodné nebo rizikové ve větším množství (např. laktóza/mléko, mastná jídla, kořeněná jídla, sůl, těstoviny ve větším množství).
- 'safe': Bezpečné potraviny v rozumné míře (např. vařené kuřecí maso bez kůže a koření, mrkev, okurka, dýně, jablko bez jádřinců, borůvky).

{lang_instruction}
Vrať striktní JSON odpovídající schématu."""

        prompt = f"Posuď bezpečnost potraviny '{food_name}' pro druh: '{species}'."

        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=[prompt],
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=PetFoodSafetyCheckResponse,
                temperature=0.2
            )
        )

        return PetFoodSafetyCheckResponse.model_validate_json(response.text)

    async def diagnose_symptoms(
        self,
        symptoms_description: str,
        pet_species: Optional[str] = "dog",
        pet_name: Optional[str] = None,
        pet_age: Optional[str] = None,
        image_base64: Optional[str] = None,
        image_url: Optional[str] = None,
        target_language: str = "cs"
    ) -> PetSymptomCheckResponse:
        client = self._get_client()

        lang_instruction = (
            "Odpovídej v českém jazyce."
            if target_language == "cs"
            else "Respond in English."
        )

        system_instruction = f"""Jsi zkušený veterinární lékař pracující pro systém chytré domácnosti Hestia.
Tvým úkolem je posoudit zdravotní stav zvířete na základě popisu příznaků a případné přiložené fotografie (oko, ucho, kůže, tlapka, rána, chování).

Klasifikace závažnosti (severity):
- 'emergency': Kritický život ohrožující stav vyžadující okamžitou návštěvu 24/7 pohotovosti (např. torze žaludku, dušení, křeče, akutní otrava, bezvědomí, zástava močení u kocoura, tepenné krvácení, silná apatie).
- 'medium': Středně závažný stav, který vyžaduje vyšetření veterinářem do 24-48 hodin (např. přetrvávající zvracení/průjem déle než 24h, kulhání, zánět v uchu/oku, krvavé skvrny, apatie).
- 'low': Mírné potíže zvládnutelné domácím sledováním a šetrným režimem (např. jednorázové zvracení trávy, lehká oděrka, mírný průjem po změně pamlsku).

Upozornění: Vždy zdůrazni, že toto hodnocení má orientační a poradní charakter a nenahrazuje fyzické vyšetření veterinárním lékařem.

{lang_instruction}
Vrať striktní JSON odpovídající schématu."""

        parts = []
        image_part = self._prepare_image_part(image_base64)
        if image_part:
            parts.append(image_part)

        info_str = f"Pacient: {pet_name or 'Mazlíček'}, druh: {pet_species or 'pes'}, věk: {pet_age or 'neuveden'}."
        parts.append(f"{info_str}\nPopis příznaků a chování: {symptoms_description}")

        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=parts,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=PetSymptomCheckResponse,
                temperature=0.2
            )
        )

        return PetSymptomCheckResponse.model_validate_json(response.text)
