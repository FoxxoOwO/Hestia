import base64
import json
import logging
from typing import Optional
from google import genai
from google.genai import types

from app.config import settings
from app.schemas.plant import PlantAiExtracted, PlantDiagnosisResponse

logger = logging.getLogger(__name__)

class GeminiPlantService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY

    def _get_client(self) -> genai.Client:
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not configured. Please provide an API key in settings or .env.")
        return genai.Client(api_key=self.api_key)

    def _prepare_image_part(self, image_base64: Optional[str]) -> Optional[types.Part]:
        if not image_base64:
            return None
        
        # Handle data URI prefix e.g. "data:image/jpeg;base64,..."
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

    async def analyze_plant(
        self,
        plant_name: Optional[str] = None,
        image_base64: Optional[str] = None,
        image_url: Optional[str] = None,
        target_language: str = "cs"
    ) -> PlantAiExtracted:
        client = self._get_client()

        lang_instruction = (
            "Všechny texty, doporučení, názvy a popisy formuluj v ČEŠTINĚ."
            if target_language == "cs"
            else "Formulate all texts, care instructions and descriptions in ENGLISH."
        )

        system_instruction = f"""Jsi špičkový botanik a zahradní expert pro chytrou domácnost Hestia.
Tvým úkolem je analyzovat předloženou rostlinu (z fotografie nebo jejího názvu) a vrátit vysoce přesná strukturovaná data podle zadaného schématu.

Pravidla a priority:
1. {lang_instruction}
2. Identifikuj:
   - common_name: běžný český název (např. 'Monstera skvostná', 'Fíkus břízovitý', 'Zelenec chocholatý')
   - species_latin: mezinárodní latinský botanický název (např. 'Monstera deliciosa')
   - species_czech: český rod a druh
   - description: 1-2 věty o původu, vzhledu a charakteru rostliny
   - light_requirement: vyber přesně jedno z: 'direct_sun', 'bright_indirect', 'semi_shade', 'shade'
   - watering_interval_days: doporučený počet dní mezi zálivkami v hlavní vegetační sezóně / v létě (celé číslo, např. 7)
   - winter_watering_interval_days: doporučený počet dní mezi zálivkami v zimním klidovém období (celé číslo, např. 14)
   - fertilizing_interval_days: doporučený počet dní mezi hnojením v létě (např. 14)
   - misting_required: boolean zda má rostlina ráda rosení listů pro vyšší vzdušnou vlhkost (true/false)
   - substrate_recommendation: doporučené složení půdy/substrátu (např. 'Vzdušný aroidní mix s piniovou kůrou a perlitem')
   - pet_toxicity: vyber přesně jedno z: 'safe', 'toxic', 'mildly_toxic'
   - pet_toxicity_details: detailní vysvětlení bezpečnosti pro psy a kočky (jaké látky obsahuje, zda dráždí sliznice, doporučení kam kytku umístit)
   - initial_health_assessment: zhodnocení vitality z fotky (např. 'Rostlina je vitální a zdravá' nebo 'Viditelné hnědnutí špiček - suchý vzduch')
"""

        contents = []
        img_part = self._prepare_image_part(image_base64)
        if img_part:
            contents.append(img_part)

        prompt_text = "Analyzuj tuto rostlinu:"
        if plant_name:
            prompt_text += f" Název / indicie: {plant_name}."
        if image_url:
            prompt_text += f" URL obrázku: {image_url}."
        contents.append(prompt_text)

        response = client.models.generate_content(
            model="gemini-3.7-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_json_schema=PlantAiExtracted.model_json_schema(),
                temperature=0.2,
            )
        )

        extracted_dict = json.loads(response.text)
        return PlantAiExtracted(**extracted_dict)

    async def diagnose_health(
        self,
        symptoms_description: str,
        plant_name: Optional[str] = None,
        image_base64: Optional[str] = None,
        image_url: Optional[str] = None,
        target_language: str = "cs"
    ) -> PlantDiagnosisResponse:
        client = self._get_client()

        lang_instruction = (
            "Všechny diagnózy, příčiny, kroky nápravy a tipy formuluj v ČEŠTINĚ."
            if target_language == "cs"
            else "Formulate all diagnosis, causes, action steps and prevention tips in ENGLISH."
        )

        system_instruction = f"""Jsi zkušený rostlinný lékař (AI Plant Doctor) v systému chytré domácnosti Hestia.
Tvojí specializací je diagnostika chorob, škůdců, plísní, nutričních deficitů a pěstitelských chyb pokojových rostlin z fotografií listů/stonků a popisu příznaků.

Pravidla:
1. {lang_instruction}
2. Identifikuj:
   - plant_name: název posuzované rostliny
   - diagnosis: jasný a srozumitelný název problému (např. 'Přelití a počínající hniloba kořenů', 'Napadení sviluškami (Spider Mites)', 'Spálení přímým sluncem', 'Chloróza z nedostatku železa')
   - cause: detailní vysvětlení, proč k problému došlo
   - severity: 'low' (mírné), 'medium' (střední), 'high' (kritické)
   - is_contagious: boolean zda může nakazit okolní kytky (např. škůdci/plíseň = true)
   - action_steps: seznam 3-5 konkrétních, praktických kroků k záchraně (např. 1. Omezit zálivku na 12 dní, 2. Odstřihnout poškozené listy čistými nůžkami, 3. Omýt listy mýdlovou vodou)
   - prevention_tips: jak předejít opakování problému v budoucnu
"""

        contents = []
        img_part = self._prepare_image_part(image_base64)
        if img_part:
            contents.append(img_part)

        prompt_text = f"Diagnostikuj problém této rostliny.\n"
        if plant_name:
            prompt_text += f"Rostlina: {plant_name}\n"
        prompt_text += f"Popis příznaků od pěstitele: {symptoms_description}"
        if image_url:
            prompt_text += f"\nURL obrázku: {image_url}"

        contents.append(prompt_text)

        response = client.models.generate_content(
            model="gemini-3.7-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_json_schema=PlantDiagnosisResponse.model_json_schema(),
                temperature=0.2,
            )
        )

        extracted_dict = json.loads(response.text)
        return PlantDiagnosisResponse(**extracted_dict)
