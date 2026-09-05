import json
import logging
import re
from typing import Optional
import httpx
from bs4 import BeautifulSoup
from google import genai
from google.genai import types

from app.config import settings
from app.schemas.gemini import GeminiExtractedRecipe

logger = logging.getLogger(__name__)

class GeminiRecipeService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY

    def _get_client(self) -> genai.Client:
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not configured. Please provide an API key in settings or .env.")
        return genai.Client(api_key=self.api_key)

    async def fetch_webpage_content(self, url: str) -> str:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "cs,en-US;q=0.9,en;q=0.8",
        }
        async with httpx.AsyncClient(follow_redirects=True, timeout=20.0) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            html = response.text

        soup = BeautifulSoup(html, "html.parser")

        # Remove irrelevant elements
        for element in soup(["script", "style", "nav", "footer", "header", "aside", "noscript", "svg", "form"]):
            element.decompose()

        # Extract meta image if available
        meta_image = ""
        og_img = soup.find("meta", property="og:image") or soup.find("meta", attrs={"name": "og:image"})
        if og_img and og_img.get("content"):
            meta_image = og_img["content"]

        text = soup.get_text(separator="\n", strip=True)
        # Collapse multi-newlines
        cleaned_text = re.sub(r"\n{3,}", "\n\n", text)
        # Truncate if excessively long (recipes are rarely > 25k chars)
        truncated_text = cleaned_text[:25000]

        if meta_image:
            truncated_text = f"[Detected Meta Image URL: {meta_image}]\n\n" + truncated_text

        return truncated_text

    async def parse_recipe(
        self,
        url: Optional[str] = None,
        raw_text: Optional[str] = None,
        target_language: str = "cs"
    ) -> GeminiExtractedRecipe:
        content_to_analyze = ""
        source_url = None

        if url:
            source_url = url
            logger.info(f"Fetching recipe from URL: {url}")
            content_to_analyze = await self.fetch_webpage_content(url)
        elif raw_text:
            content_to_analyze = raw_text
        else:
            raise ValueError("Either URL or raw text must be provided.")

        client = self._get_client()

        lang_instruction = (
            "Všechny texty, názvy, popisky, ingredience a kroky přelož nebo formuluj v ČEŠTINĚ."
            if target_language == "cs"
            else "Translate or formulate all texts, titles, descriptions, ingredients, and steps in ENGLISH."
        )

        system_instruction = f"""Jsi špičkový kuchařský asistent pro chytrou domácnost Hestia.
Tvým úkolem je analyzovat předložený text/obsah receptu a extrahovat z něj kompletní, vysoce strukturovaná data podle zadaného schématu.

Pravidla:
1. {lang_instruction}
2. Identifikuj:
   - title: přesný a lákavý název receptu
   - description: krátký shrnující popis receptu (1-2 věty)
   - image_url: URL fotografie receptu (pokud je v textu uvedena např. v [Detected Meta Image URL: ...], použij ji)
   - prep_time_minutes: odhad času přípravy v minutách (např. 15)
   - cook_time_minutes: odhad času tepelné úpravy/pečení v minutách (např. 30)
   - difficulty: "easy" (snadné), "medium" (střední), nebo "hard" (náročné)
   - price_level: "low" (levné), "medium" (střední), nebo "high" (dražší)
   - default_servings: počet porcí (číslo, např. 4)
   - tags: pole kategorií (např. ["Oběd", "Rychlovka", "Česká kuchyně", "Těstoviny"])
   - utensils: pole potřebného nádobí a nástrojů (např. ["Velký hrnec", "Pánev", "Cedník", "Struhadlo"])
   - ingredients: pole objektů, kde každý obsahuje:
       * name: název suroviny (např. "Špagety", "Česnek", "Olivový olej")
       * amount: číselné množství (float, např. 500, 3, 0.5; pokud není specifikováno, použij 1)
       * unit: jednotka (např. "g", "ml", "ks", "lžíce", "stroužek", "špetka")
       * note: doplňující poznámka (např. "nakrájený nadrobno", "extra panenský")
       * category: jedna z kategorií ("produce", "dairy", "meat", "pantry", "spices", "bakery", "other")
   - instructions: pole kroků, kde každý má:
       * step: číslo kroku (1, 2, 3...)
       * text: jasný, konkrétní popis co dělat
       * timer_minutes: volitelný čas v minutách pro časovač (pokud se např. píše "vařte 8 minut", nastav 8, jinak null)
"""

        prompt = f"""Zde je obsah receptu k analýze:

{content_to_analyze}
"""

        response = client.models.generate_content(
            model="gemini-3.7-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_json_schema=GeminiExtractedRecipe.model_json_schema(),
                temperature=0.2,
            )
        )

        extracted_dict = json.loads(response.text)
        if source_url:
            extracted_dict["source_url"] = source_url

        return GeminiExtractedRecipe(**extracted_dict)
