import re
from typing import Optional, List, Dict, Any, Union
from app.schemas.recipe import IngredientItem

VULGAR_FRACTIONS: Dict[str, float] = {
    '½': 0.5, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 0.25, '¾': 0.75,
    '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8, '⅙': 1 / 6,
    '⅚': 5 / 6, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
}

UNIT_MAPPING: Dict[str, str] = {
    # Weight
    'g': 'g', 'gram': 'g', 'gramu': 'g', 'gramů': 'g', 'gramy': 'g', 'gr': 'g',
    'kg': 'kg', 'kilo': 'kg', 'kilogram': 'kg', 'kilogramu': 'kg', 'kilogramů': 'kg', 'kilogramy': 'kg',
    'dkg': 'dkg', 'dag': 'dkg', 'mg': 'mg', 'miligram': 'mg', 'miligramů': 'mg',
    'libra': 'lb', 'libry': 'lb', 'liber': 'lb', 'lb': 'lb', 'lbs': 'lb',

    # Volume
    'ml': 'ml', 'mililitr': 'ml', 'mililitru': 'ml', 'mililitrů': 'ml', 'mililitry': 'ml',
    'l': 'l', 'litr': 'l', 'litru': 'l', 'litrů': 'l', 'litry': 'l',
    'dl': 'dl', 'dcl': 'dl', 'decilitr': 'dl', 'decilitru': 'dl', 'decilitrů': 'dl', 'decilitry': 'dl',
    'cl': 'cl', 'centilitr': 'cl', 'centilitrů': 'cl',

    # Spoons
    'polévková lžíce': 'lžíce', 'polévkové lžíce': 'lžíce', 'polévkových lžic': 'lžíce',
    'lžíce': 'lžíce', 'lžic': 'lžíce', 'lžíci': 'lžíce', 'lžících': 'lžíce', 'pl': 'lžíce', 'lž': 'lžíce', 'tbsp': 'lžíce',
    'čajová lžička': 'lžička', 'čajové lžičky': 'lžička', 'čajových lžiček': 'lžička',
    'kávová lžička': 'lžička', 'kávové lžičky': 'lžička', 'kávových lžiček': 'lžička',
    'lžička': 'lžička', 'lžičky': 'lžička', 'lžiček': 'lžička', 'lžičku': 'lžička', 'čl': 'lžička', 'tsp': 'lžička',

    # Spices & pinch
    'špetka': 'špetka', 'špetku': 'špetka', 'špetky': 'špetka', 'špetek': 'špetka',
    'stroužek': 'stroužek', 'stroužku': 'stroužek', 'stroužky': 'stroužek', 'stroužků': 'stroužek',

    # Packaging
    'balení': 'balení', 'balíček': 'balení', 'balíčky': 'balení', 'balíčků': 'balení',
    'sáček': 'balení', 'sáčků': 'balení', 'sáčky': 'balení', 'pytlík': 'balení', 'pytlíku': 'balení',
    'plechovka': 'plechovka', 'plechovky': 'plechovka', 'plechovek': 'plechovka',
    'konzerva': 'konzerva', 'konzervy': 'konzerva', 'konzerv': 'konzerva',
    'sklenice': 'sklenice', 'sklenička': 'sklenice', 'skleničky': 'sklenice', 'sklenic': 'sklenice',
    'vanička': 'vanička', 'vaničky': 'vanička', 'vaniček': 'vanička',
    'kelímek': 'kelímek', 'kelímku': 'kelímek', 'kelímky': 'kelímek', 'kelímků': 'kelímek',
    'krabička': 'krabička', 'krabičky': 'krabička',

    # Pieces & portions
    'ks': 'ks', 'kus': 'ks', 'kusy': 'ks', 'kusů': 'ks', 'kusu': 'ks',
    'plátek': 'plátek', 'plátky': 'plátek', 'plátků': 'plátek',
    'kostka': 'kostka', 'kostky': 'kostka', 'kostek': 'kostka',
    'hrnek': 'hrnek', 'hrnku': 'hrnek', 'hrnky': 'hrnek', 'hrnků': 'hrnek', 'cup': 'hrnek', 'cups': 'hrnek',
    'kapka': 'kapka', 'kapek': 'kapka', 'kapky': 'kapka',
    'snítka': 'snítka', 'snítky': 'snítka', 'snítek': 'snítka',
    'větvička': 'větvička', 'větvičky': 'větvička', 'větviček': 'větvička',
    'svazek': 'svazek', 'svazky': 'svazek', 'svazků': 'svazek',
    'hrst': 'hrst', 'hrsti': 'hrst',
    'porce': 'porce',
}

SORTED_UNIT_KEYS = sorted(UNIT_MAPPING.keys(), key=len, reverse=True)
UNIT_REGEX_PART = '|'.join(re.escape(k) for k in SORTED_UNIT_KEYS)

SECTION_HEADERS = {
    'na těsto', 'na testo', 'těsto', 'testo',
    'na náplň', 'na napln', 'na pudinkovou náplň', 'na pudinkovou napln', 'náplň', 'napln', 'pudinková náplň',
    'na krém', 'na krem', 'krém', 'krem',
    'na polevu', 'poleva', 'na dochucení', 'na dochuceni', 'dochucení', 'dochuceni',
    'na ozdobu', 'na posypání', 'na servírování', 'k podávání', 'příloha', 'dresink',
    'omáčka', 'marináda', 'korpus', 'drobenka', 'posypka', 'přeliv', 'glazura'
}

def is_section_header(text: str) -> bool:
    if not text:
        return False
    clean = text.strip().rstrip(':').strip().lower()
    if clean in SECTION_HEADERS:
        return True
    # If starts with na / pro / k and has 1 to 4 words
    if clean.startswith(('na ', 'pro ', 'k ', 'do ')) and (len(clean.split()) <= 4 or text.strip().endswith(':')):
        return True
    # Trailing colon on short headings e.g. "Těsto:"
    if text.strip().endswith(':') and len(clean.split()) <= 3:
        return True
    return False

def parse_fraction(val: str) -> Optional[float]:
    val = val.strip()
    if not val:
        return None
    for vf, num in VULGAR_FRACTIONS.items():
        if vf in val:
            val = val.replace(vf, str(num))
    if '/' in val:
        if val.startswith('/'):
            val = '1' + val
        parts = val.split()
        if len(parts) == 2:
            try:
                whole = float(parts[0])
                n, d = parts[1].split('/')
                return whole + float(n) / float(d)
            except Exception:
                pass
        elif len(parts) == 1:
            try:
                n, d = val.split('/')
                return float(n) / float(d)
            except Exception:
                pass
    try:
        return float(val.replace(',', '.'))
    except Exception:
        return None

def parse_ingredient_line(raw_line: str) -> Optional[IngredientItem]:
    line = raw_line.strip()
    # Strip list bullets (1. , 1) , -, *, •) safely without stripping decimal numbers like 1.5
    line = re.sub(r'^\d+[)\]]\s+', '', line).strip()
    line = re.sub(r'^\d+\.\s+', '', line).strip()
    line = re.sub(r'^[-*•]\s*', '', line).strip()
    if not line or is_section_header(line):
        return None

    # Replace vulgar fractions
    for vf, num in VULGAR_FRACTIONS.items():
        if vf in line:
            line = line.replace(vf, f'{num} ')

    amount = None
    unit = 'ks'
    rest = line

    # 1. Check for starting fraction: e.g. 1/2, /2, 1 1/2
    m_frac = re.match(r'^((?:\d+\s+)?/?\d+/\d+)\s*(.*)$', line)
    if m_frac:
        frac_str = m_frac.group(1)
        rest = m_frac.group(2).strip()
        amount = parse_fraction(frac_str)
    else:
        # Check for number with unit attached or spaced: e.g. 250g, 500 ml, 1.5kg, 1,5 kg
        m_num_unit = re.match(r'^(\d+(?:[.,]\d+)?)\s*(' + UNIT_REGEX_PART + r')(?:\s+(.*)|$)', line, re.IGNORECASE)
        if m_num_unit:
            amount = float(m_num_unit.group(1).replace(',', '.'))
            unit_raw = m_num_unit.group(2).lower()
            unit = UNIT_MAPPING.get(unit_raw, unit_raw)
            rest = (m_num_unit.group(3) or '').strip()
        else:
            # Check for range: e.g. 2-3
            m_range = re.match(r'^(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)\s*(.*)$', line)
            if m_range:
                n1 = float(m_range.group(1).replace(',', '.'))
                n2 = float(m_range.group(2).replace(',', '.'))
                amount = round((n1 + n2) / 2.0, 2)
                rest = m_range.group(3).strip()
            else:
                # Normal number: e.g. 2, 2.5, 2,5
                m_num = re.match(r'^(\d+(?:[.,]\d+)?)\s*(.*)$', line)
                if m_num:
                    amount = float(m_num.group(1).replace(',', '.'))
                    rest = m_num.group(2).strip()

    # If unit is still 'ks', inspect 'rest' for unit at its beginning
    if unit == 'ks' and rest:
        m_unit = re.match(r'^(' + UNIT_REGEX_PART + r')(?:\s+(.*)|$)', rest, re.IGNORECASE)
        if m_unit:
            unit_raw = m_unit.group(1).lower()
            unit = UNIT_MAPPING.get(unit_raw, unit_raw)
            rest = (m_unit.group(2) or '').strip()

    # If amount was not found at the beginning, check if line starts with a unit word:
    # e.g. 'lžíce Cukr moučkový', 'gramů Tvaroh jemný', 'špetka soli', 'g moučkového cukru'
    if amount is None:
        m_unit_start = re.match(r'^(' + UNIT_REGEX_PART + r')(?:\s+(.*)|$)', line, re.IGNORECASE)
        if m_unit_start:
            unit_raw = m_unit_start.group(1).lower()
            unit = UNIT_MAPPING.get(unit_raw, unit_raw)
            amount = 1.0
            rest = (m_unit_start.group(2) or '').strip()
        else:
            amount = 1.0
            rest = line

    # Handle stray fraction like /2 in rest: e.g. '/2 balení kypřícího prášku'
    if rest.startswith('/'):
        m_stray_frac = re.match(r'^/(\d+)\s*(.*)$', rest)
        if m_stray_frac:
            denom = float(m_stray_frac.group(1))
            amount = round(1.0 / denom, 2)
            rest = m_stray_frac.group(2).strip()
            m_unit2 = re.match(r'^(' + UNIT_REGEX_PART + r')(?:\s+(.*)|$)', rest, re.IGNORECASE)
            if m_unit2:
                unit = UNIT_MAPPING.get(m_unit2.group(1).lower(), m_unit2.group(1).lower())
                rest = (m_unit2.group(2) or '').strip()

    clean_name = rest.strip(' :-•*')
    if not clean_name:
        return None

    final_amount = round(amount or 1.0, 2)

    return IngredientItem(
        name=clean_name,
        amount=final_amount,
        unit=unit,
        category="other"
    )

def sanitize_ingredient(item: Union[IngredientItem, Dict[str, Any]]) -> Optional[IngredientItem]:
    if isinstance(item, IngredientItem):
        data = item.model_dump()
    elif isinstance(item, dict):
        data = dict(item)
    else:
        return None

    name = str(data.get('name', '')).strip()
    if not name or is_section_header(name):
        return None

    unit = str(data.get('unit', 'ks')).strip().lower()
    amount = data.get('amount', 1.0)
    try:
        amount = float(amount)
    except Exception:
        amount = 1.0

    # 1. Stray leading fraction in name: '/2 balení' or '1/2 balení'
    if name.startswith('/'):
        m = re.match(r'^/(\d+)\s*(.*)$', name)
        if m:
            denom = float(m.group(1))
            amount = round(amount / denom, 2)
            name = m.group(2).strip()
    elif re.match(r'^\d+/\d+', name):
        m_f = re.match(r'^(\d+/\d+)\s*(.*)$', name)
        if m_f:
            frac = parse_fraction(m_f.group(1)) or 1.0
            amount = round(amount * frac if amount != 1.0 else frac, 2)
            name = m_f.group(2).strip()

    # 2. Leading number in name: e.g. '200 g mouky' or '2 vejce'
    m_num = re.match(r'^(\d+(?:[.,]\d+)?)\s*(.*)$', name)
    if m_num:
        extracted_num = float(m_num.group(1).replace(',', '.'))
        name_after_num = m_num.group(2).strip()
        if amount == 1.0:
            amount = extracted_num
        name = name_after_num

    # 3. Leading unit word in name: e.g. 'g moučkového cukru', 'lžíce cukru', 'gramů tvarohu'
    m_unit = re.match(r'^(' + UNIT_REGEX_PART + r')(?:\s+(.*)|$)', name, re.IGNORECASE)
    if m_unit:
        extracted_unit = m_unit.group(1).lower()
        std_unit = UNIT_MAPPING.get(extracted_unit, extracted_unit)
        rest = (m_unit.group(2) or '').strip()
        if rest:
            name = rest
            unit = std_unit

    # 4. Standardize unit
    unit = UNIT_MAPPING.get(unit, unit)

    clean_name = name.strip(' :-•*')
    if not clean_name or is_section_header(clean_name):
        return None

    return IngredientItem(
        name=clean_name,
        amount=round(amount, 2),
        unit=unit,
        note=data.get('note'),
        category=data.get('category') or "other"
    )

def sanitize_ingredients(items: Optional[List[Any]]) -> List[IngredientItem]:
    if not items:
        return []
    result: List[IngredientItem] = []
    for item in items:
        cleaned = sanitize_ingredient(item)
        if cleaned:
            result.append(cleaned)
    return result
