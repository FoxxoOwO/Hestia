import io
import json
import logging
import re
import zipfile
import csv
from typing import Optional, List, Tuple, Dict, Any
import httpx
from bs4 import BeautifulSoup
from google import genai
from google.genai import types
import pypdf

from app.config import settings
from app.schemas.gemini import GeminiExtractedRecipe, GeminiBatchExtractedRecipes
from app.schemas.recipe import IngredientItem, InstructionStep

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

    def _decode_bytes(self, data: bytes) -> str:
        for enc in ["utf-8-sig", "utf-8", "cp1250", "iso-8859-2", "latin-1"]:
            try:
                return data.decode(enc)
            except UnicodeDecodeError:
                continue
        return data.decode("latin-1", errors="replace")

    def _extract_rtf(self, rtf_bytes: bytes) -> str:
        raw = self._decode_bytes(rtf_bytes)
        if not raw.strip().startswith("{\\rtf"):
            return raw

        text = raw.replace("\\par\n", "\n").replace("\\par ", "\n").replace("\\par", "\n")
        text = text.replace("\\line", "\n").replace("\\tab", "\t")

        def hex_repl(match):
            hex_val = match.group(1)
            try:
                return bytes.fromhex(hex_val).decode("cp1250")
            except Exception:
                return ""
        text = re.sub(r"\\\'([0-9a-fA-F]{2})", hex_repl, text)

        def u_repl(match):
            code = int(match.group(1))
            if code < 0:
                code += 65536
            try:
                return chr(code)
            except Exception:
                return ""
        text = re.sub(r"\\u(-?\d+)\??", u_repl, text)

        text = re.sub(r"\\[a-zA-Z]+-?\d* ?", "", text)
        text = text.replace("{", "").replace("}", "")
        return re.sub(r"\n{3,}", "\n\n", text).strip()

    def _extract_csv(self, csv_bytes: bytes, filename: str) -> str:
        content = self._decode_bytes(csv_bytes)
        lines = [l for l in content.splitlines() if l.strip()]
        if not lines:
            return ""

        header_line = lines[0]
        semis = header_line.count(";")
        commas = header_line.count(",")
        tabs = header_line.count("\t")
        if semis > commas and semis > tabs:
            delimiter = ";"
        elif tabs > commas and tabs > semis:
            delimiter = "\t"
        else:
            delimiter = ","

        reader = csv.reader(io.StringIO(content), delimiter=delimiter)
        rows = list(reader)
        if not rows:
            return ""

        headers = rows[0]
        out = [f"[CSV Soubor: {filename}]", f"Sloupce: {', '.join(headers)}", "Záznamy receptů:"]
        for i, r in enumerate(rows[1:], 1):
            row_str = " | ".join(f"{h}: {v}" for h, v in zip(headers, r) if v.strip())
            out.append(f"Záznam #{i}: {row_str}")
        return "\n".join(out)

    def _extract_json_ld_recipe(self, soup: BeautifulSoup) -> Optional[Dict[str, Any]]:
        for script in soup.find_all("script", type="application/ld+json"):
            try:
                data = json.loads(script.string or "{}")
                candidates = []
                if isinstance(data, dict):
                    if data.get("@type") == "Recipe" or "Recipe" in str(data.get("@type", "")):
                        return data
                    if "@graph" in data and isinstance(data["@graph"], list):
                        candidates = data["@graph"]
                elif isinstance(data, list):
                    candidates = data

                for item in candidates:
                    if isinstance(item, dict) and (item.get("@type") == "Recipe" or "Recipe" in str(item.get("@type", ""))):
                        return item
            except Exception:
                continue
        return None

    def _extract_html(self, html_bytes: bytes) -> Tuple[str, Optional[str], Optional[Dict[str, Any]]]:
        raw_html = self._decode_bytes(html_bytes)
        soup = BeautifulSoup(raw_html, "html.parser")

        json_ld = self._extract_json_ld_recipe(soup)

        meta_image = ""
        og_img = soup.find("meta", property="og:image") or soup.find("meta", attrs={"name": "og:image"})
        if og_img and og_img.get("content"):
            meta_image = og_img["content"]
        elif not meta_image:
            first_img = soup.find("img", src=True)
            if first_img and first_img.get("src") and not first_img["src"].startswith("data:"):
                meta_image = first_img["src"]

        for element in soup(["script", "style", "nav", "footer", "header", "aside", "noscript", "svg", "form"]):
            element.decompose()

        text = soup.get_text(separator="\n", strip=True)
        cleaned_text = re.sub(r"\n{3,}", "\n\n", text)[:25000]

        return cleaned_text, meta_image or None, json_ld

    def _extract_pdf_text(self, pdf_bytes: bytes) -> str:
        try:
            reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
            pages_text = []
            for page in reader.pages:
                t = page.extract_text()
                if t:
                    pages_text.append(t)
            full_text = "\n\n--- Další strana ---\n\n".join(pages_text)
            return full_text.strip()
        except Exception as e:
            logger.warning(f"Failed to extract text from PDF: {e}")
            return ""

    def _fallback_parse_json_ld(self, data: Dict[str, Any], filename: str) -> GeminiExtractedRecipe:
        title = data.get("name") or filename.rsplit(".", 1)[0]
        desc = data.get("description", "")
        img = ""
        if isinstance(data.get("image"), list) and data["image"]:
            img = str(data["image"][0])
        elif isinstance(data.get("image"), str):
            img = data["image"]
        elif isinstance(data.get("image"), dict):
            img = data["image"].get("url", "")

        ingredients: List[IngredientItem] = []
        raw_ings = data.get("recipeIngredient", [])
        if isinstance(raw_ings, list):
            for ing in raw_ings:
                if isinstance(ing, str) and ing.strip():
                    ingredients.append(IngredientItem(name=ing.strip(), amount=1.0, unit="ks"))

        instructions: List[InstructionStep] = []
        raw_steps = data.get("recipeInstructions", [])
        step_num = 1
        if isinstance(raw_steps, list):
            for s in raw_steps:
                text_val = ""
                if isinstance(s, dict):
                    text_val = s.get("text", "")
                elif isinstance(s, str):
                    text_val = s
                if text_val.strip():
                    instructions.append(InstructionStep(step=step_num, text=text_val.strip()))
                    step_num += 1

        return GeminiExtractedRecipe(
            title=title,
            description=desc,
            image_url=img,
            prep_time_minutes=15,
            cook_time_minutes=30,
            difficulty="medium",
            price_level="medium",
            default_servings=4,
            tags=["Import"],
            utensils=[],
            ingredients=ingredients or [IngredientItem(name="Suroviny", amount=1.0, unit="porce")],
            instructions=instructions or [InstructionStep(step=1, text="Postupujte podle receptu.")]
        )

    def _fallback_parse_csv(self, csv_bytes: bytes, filename: str) -> List[GeminiExtractedRecipe]:
        content = self._decode_bytes(csv_bytes)
        lines = [l for l in content.splitlines() if l.strip()]
        if not lines:
            return []

        header_line = lines[0]
        semis = header_line.count(";")
        commas = header_line.count(",")
        tabs = header_line.count("\t")
        if semis > commas and semis > tabs:
            delimiter = ";"
        elif tabs > commas and tabs > semis:
            delimiter = "\t"
        else:
            delimiter = ","
        reader = csv.DictReader(io.StringIO(content), delimiter=delimiter)

        recipes: List[GeminiExtractedRecipe] = []
        for i, row in enumerate(reader, 1):
            lower_keys = {k.lower().strip(): v for k, v in row.items() if k}
            title = None
            for k, v in lower_keys.items():
                if any(t in k for t in ["title", "náz", "naz", "name", "recept"]) and v.strip():
                    title = v.strip()
                    break
            if not title:
                vals = [v.strip() for v in row.values() if v and v.strip()]
                title = vals[0] if vals else f"Recept #{i}"

            desc = ""
            for k, v in lower_keys.items():
                if any(s in k for s in ["desc", "popis", "info"]) and v.strip():
                    desc = v.strip()
                    break

            ings_str = ""
            for k, v in lower_keys.items():
                if any(s in k for s in ["ingred", "surov"]) and v.strip():
                    ings_str = v.strip()
                    break

            insts_str = ""
            for k, v in lower_keys.items():
                if any(s in k for s in ["instruc", "postup", "příprav", "priprav", "direct"]) and v.strip():
                    insts_str = v.strip()
                    break

            ingredients = []
            for ing in re.split(r"[,;\n]", ings_str):
                clean_ing = ing.strip()
                if clean_ing:
                    ingredients.append(IngredientItem(name=clean_ing, amount=1.0, unit="ks"))

            instructions = []
            for s_idx, st in enumerate(re.split(r"[\n|]", insts_str), 1):
                clean_step = st.strip()
                if clean_step:
                    instructions.append(InstructionStep(step=s_idx, text=clean_step))

            recipes.append(
                GeminiExtractedRecipe(
                    title=title,
                    description=desc,
                    prep_time_minutes=15,
                    cook_time_minutes=30,
                    difficulty="medium",
                    price_level="medium",
                    default_servings=4,
                    tags=["Import CSV"],
                    utensils=[],
                    ingredients=ingredients or [IngredientItem(name="Suroviny", amount=1.0, unit="porce")],
                    instructions=instructions or [InstructionStep(step=1, text=insts_str or "Postupujte podle receptu.")]
                )
            )

        return recipes

    def _fallback_parse_text(self, text: str, filename: str) -> GeminiExtractedRecipe:
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        title = lines[0] if lines else filename.rsplit(".", 1)[0]
        ingredients: List[IngredientItem] = []
        instructions: List[InstructionStep] = []

        in_ingredients = False
        in_instructions = False
        step_counter = 1

        for line in lines[1:]:
            lower = line.lower()
            if "surovin" in lower or "ingredienc" in lower:
                in_ingredients = True
                in_instructions = False
                continue
            if "postup" in lower or "instrukc" in lower or "příprava" in lower:
                in_instructions = True
                in_ingredients = False
                continue

            if in_ingredients:
                cleaned = re.sub(r"^[-*•\d.]+\s*", "", line)
                if cleaned:
                    ingredients.append(IngredientItem(name=cleaned, amount=1.0, unit="ks"))
            elif in_instructions:
                cleaned = re.sub(r"^[-*•\d.]+\s*", "", line)
                if cleaned:
                    instructions.append(InstructionStep(step=step_counter, text=cleaned))
                    step_counter += 1
            else:
                if line.startswith(("-", "*", "•")):
                    cleaned = re.sub(r"^[-*•]\s*", "", line)
                    ingredients.append(IngredientItem(name=cleaned, amount=1.0, unit="ks"))

        if not ingredients:
            ingredients = [IngredientItem(name="Suroviny z receptu", amount=1.0, unit="porce")]
        if not instructions:
            instructions = [InstructionStep(step=1, text="Postupujte podle pokynů v receptu.")]

        return GeminiExtractedRecipe(
            title=title,
            description="Importovaný recept ze souboru",
            prep_time_minutes=15,
            cook_time_minutes=30,
            difficulty="medium",
            price_level="medium",
            default_servings=4,
            tags=["Import"],
            utensils=[],
            ingredients=ingredients,
            instructions=instructions
        )

    def _try_local_fallback(self, file_bytes: bytes, filename: str, ext: str) -> Optional[List[GeminiExtractedRecipe]]:
        try:
            if ext in ["html", "htm"]:
                _, _, json_ld = self._extract_html(file_bytes)
                if json_ld:
                    return [self._fallback_parse_json_ld(json_ld, filename)]
                text, _, _ = self._extract_html(file_bytes)
                if text:
                    return [self._fallback_parse_text(text, filename)]
            elif ext == "csv":
                csv_recs = self._fallback_parse_csv(file_bytes, filename)
                if csv_recs:
                    return csv_recs
            elif ext in ["rtf", "rtk"]:
                rtf_text = self._extract_rtf(file_bytes)
                if rtf_text:
                    return [self._fallback_parse_text(rtf_text, filename)]
            elif ext in ["txt", "md"]:
                txt_content = self._decode_bytes(file_bytes)
                if txt_content:
                    return [self._fallback_parse_text(txt_content, filename)]
            elif ext == "pdf":
                pdf_text = self._extract_pdf_text(file_bytes)
                if pdf_text:
                    return [self._fallback_parse_text(pdf_text, filename)]
        except Exception as e:
            logger.warning(f"Local fallback parser error for {filename}: {e}")
        return None

    async def parse_recipe_file(
        self,
        file_bytes: bytes,
        filename: str,
        content_type: Optional[str] = None,
        target_language: str = "cs"
    ) -> List[GeminiExtractedRecipe]:
        ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""

        # 1. ZIP ARCHIVE: Process all inner files
        if ext == "zip":
            all_recipes: List[GeminiExtractedRecipe] = []
            with zipfile.ZipFile(io.BytesIO(file_bytes)) as zf:
                valid_entries = [
                    name for name in zf.namelist()
                    if not name.startswith("__MACOSX")
                    and not name.startswith(".")
                    and not name.endswith("/")
                    and any(name.lower().endswith(f".{e}") for e in ["pdf", "html", "htm", "rtf", "rtk", "txt", "md", "csv", "jpg", "jpeg", "png", "webp"])
                ]
                # Limit to 25 files per zip to prevent abuse
                for entry_name in valid_entries[:25]:
                    try:
                        inner_bytes = zf.read(entry_name)
                        inner_recipes = await self.parse_recipe_file(
                            file_bytes=inner_bytes,
                            filename=entry_name,
                            target_language=target_language
                        )
                        all_recipes.extend(inner_recipes)
                    except Exception as e:
                        logger.warning(f"Error parsing inner zip file {entry_name}: {e}")
                        continue
            if all_recipes:
                return all_recipes
            raise ValueError(f"V archivu {filename} nebyly nalezeny žádné podporované recepty.")

        # If Gemini API key is missing, utilize smart fallback parsers
        if not self.api_key:
            fallback_res = self._try_local_fallback(file_bytes, filename, ext)
            if fallback_res:
                return fallback_res
            raise ValueError("GEMINI_API_KEY není nakonfigurován pro AI analýzu tohoto typu souboru.")

        # 2. PREPARE PROMPT / MULTIMODAL CONTENT FOR GEMINI
        client = self._get_client()

        lang_instruction = (
            "Všechny texty, názvy, popisky, ingredience a kroky přelož nebo formuluj v ČEŠTINĚ."
            if target_language == "cs"
            else "Translate or formulate all texts, titles, descriptions, ingredients, and steps in ENGLISH."
        )

        system_instruction = f"""Jsi špičkový kuchařský asistent pro chytrou domácnost Hestia.
Tvým úkolem je analyzovat předložený soubor (který může být PDF, obrázek kuchařky, HTML web, CSV tabulka, RTF/RTK dokument nebo textový recept) a extrahovat z něj VŠECHNY obsažené recepty do pole 'recipes'.
Pokud soubor obsahuje jeden recept, vrať pole s tímto jedním receptem. Pokud obsahuje více receptů (např. kuchařka v PDF, CSV seznam nebo menu), extrahuj každý recept jako samostatný objekt.

Pravidla pro každý recept:
1. {lang_instruction}
2. Identifikuj:
   - title: přesný a lákavý název receptu
   - description: krátký shrnující popis receptu (1-2 věty)
   - image_url: URL fotografie receptu (pokud je k dispozici, jinak prázdný řetězec)
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

        contents: List[Any] = []

        # A. IMAGE FORMATS
        if ext in ["jpg", "jpeg", "png", "webp", "bmp"]:
            mime_type = "image/jpeg" if ext in ["jpg", "jpeg"] else f"image/{ext}"
            part = types.Part.from_bytes(data=file_bytes, mime_type=mime_type)
            contents.append(part)
            contents.append(f"Zde je fotografie/obrázek receptu ({filename}). Přečti veškerý text a strukturovaně extrahuj recepty.")

        # B. PDF DOCUMENT
        elif ext == "pdf":
            pdf_text = self._extract_pdf_text(file_bytes)
            if len(pdf_text) > 80:
                contents.append(f"Zde je text extrahovaný z PDF dokumentu ({filename}):\n\n{pdf_text[:35000]}")
            else:
                # Scanned or image-based PDF -> send as native multimodal PDF
                part = types.Part.from_bytes(data=file_bytes, mime_type="application/pdf")
                contents.append(part)
                contents.append(f"Zde je PDF dokument kuchařky/receptu ({filename}). Analyzuj jeho obsah a extrahuj recepty.")

        # C. HTML DOCUMENT
        elif ext in ["html", "htm"]:
            text, meta_img, json_ld = self._extract_html(file_bytes)
            prompt_parts = [f"Zde je obsah HTML souboru ({filename}):\n"]
            if meta_img:
                prompt_parts.append(f"[Detekovaný obrázek: {meta_img}]\n")
            if json_ld:
                prompt_parts.append(f"[Detekovaný Schema.org JSON-LD recept:\n{json.dumps(json_ld, ensure_ascii=False)}\n]\n")
            prompt_parts.append(text)
            contents.append("".join(prompt_parts))

        # D. CSV FILE
        elif ext == "csv":
            csv_text = self._extract_csv(file_bytes, filename)
            contents.append(f"Zde je obsah CSV tabulky s recepty:\n\n{csv_text}")

        # E. RTF / RTK
        elif ext in ["rtf", "rtk"]:
            rtf_text = self._extract_rtf(file_bytes)
            contents.append(f"Zde je text z {ext.upper()} dokumentu ({filename}):\n\n{rtf_text}")

        # F. PLAIN TEXT / MARKDOWN / OTHER
        else:
            raw_text = self._decode_bytes(file_bytes)
            contents.append(f"Zde je text receptu ze souboru {filename}:\n\n{raw_text[:35000]}")

        try:
            response = client.models.generate_content(
                model="gemini-3.7-flash",
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_json_schema=GeminiBatchExtractedRecipes.model_json_schema(),
                    temperature=0.2,
                )
            )
            extracted_dict = json.loads(response.text)
            batch = GeminiBatchExtractedRecipes(**extracted_dict)
            if batch.recipes:
                return batch.recipes
        except Exception as gemini_err:
            logger.warning(f"Gemini API call failed for {filename} ({gemini_err}), attempting local fallback...")
            fallback_res = self._try_local_fallback(file_bytes, filename, ext)
            if fallback_res:
                return fallback_res
            raise gemini_err

        raise ValueError(f"Ze souboru {filename} se nepodařilo vyčíst žádný validní recept.")

