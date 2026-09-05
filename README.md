# 🔥 Hestia – Komplexní modulární systém pro chytrou domácnost

**Hestia** je moderní, modulární, self-hosted systém navržený pro efektivní a pohodlnou správu rodinné domácnosti. Běží na vlastním serveru v Dockeru, chrání soukromí vašich dat a umožňuje přístup přes web i mobilní rozhraní (PWA).

---

## 🌟 Klíčové vlastnosti

- **Víceuživatelský systém (Multi-user)**: Každý člen domácnosti má svůj profil, roli (správce/člen), barvu avatara a osobní nastavení.
- **Dvojjazyčné rozhraní (i18n)**: Plná podpora **češtiny 🇨🇿** i **angličtiny 🇬🇧**.
- **Světlý i tmavý režim (Dark / Light mode)**: Elegantní vzhled s detekcí preferencí systému i ručním přepínáním.
- **Responsivní PWA pro mobil i počítač**: Optimalizováno pro dotykové telefony (spodní navigační lišta) i velké monitory (postranní panel). Lze nainstalovat na plochu mobilu.
- **Self-hosted & Docker ready**: Jednoduché spuštění pomocí jednoho příkazu `docker compose up -d` s perzistentními volumes.

---

## 🍳 Modul 1: Receptář, Spíž & Nákupní seznam

### 1. Kuchařka a recepty
- Evidence receptů: název, popis, fotografie, čas přípravy a vaření, náročnost (*Snadné*, *Střední*, *Náročné*), cenová kategorie (*$*, *$$*, *$$$*), tagy a potřebné nádobí/nástroje.
- **Dynamický kalkulátor porcí**: Změňte počet porcí (např. 2, 4, 6) a všechny ingredience se okamžitě poměrově přepočítají.
- **Chytrá kontrola spíže u každé suroviny**: Recept automaticky barevně označuje, které ingredience máte doma a které chybí.
- **Krokový postup s minutkou**: Odškrtávání kroků přímo během vaření a vestavěné časovače u kroků s definovaným časem.

### 2. Import receptů z internetu pomocí Gemini AI
- Vložte URL adresu libovolného receptu na webu (např. Apetit, Vareni.cz, Allrecipes, BBC Food atd.) nebo vložte hrubý text receptu.
- Google **Gemini 3.7 Flash** automaticky rozpozná a extrahuje:
  - Název, popis a foto
  - Odhadované časy a náročnost
  - Potřebné nádobí a náčiní
  - Standardizované ingredience (množství, jednotka, název, poznámka)
  - Přehledný očíslovaný postup vaření
- Náhled před uložením s možností okamžitého zařazení do rodinné kuchařky.

### 3. Sledování jídla doma (Spíž & Lednice)
- Evidence trvanlivosti a zásob: Lednice, Mrazák, Spíž, Ovoce a zelenina, Koření, Pečivo.
- Barevné indikátory expirace:
  - 🟢 **Čerstvé**
  - 🟡 **Brzy spotřebovat** (expirace do 3 dnů)
  - 🔴 **Po spotřebě**
- **Funkce "Co mohu uvařit ze zásob"**:
  - Automaticky vyhodnocuje recepty proti stavu zásob.
  - Zobrazuje jídla, která můžete uvařit **ihned (100 % surovin máme)**, i ta, kde chybí pouze 1–2 ingredience.

### 4. Nákupní seznam
- Rychlé přidávání položek z mobilu.
- **Jedním klikem**: Přidání všech chybějících surovin z libovolného receptu.
- Odškrtávání položek v reálném čase při nakupování v obchodě.
- Hromadné vymazání koupených věcí.

---

## 🪴 Modul 2: Sledování kytek (Plant Care Tracker)

Kompletní péče o pokojové i venkovní rostliny v domácnosti podpořená umělou inteligencí.

### 1. Přehled rostlin & Ukazatel vláhy
- Přehled rostlin s vizuálním stavem hydratace (*Zalito dnes, Zalít dnes!, Zpožděno, Odpočet dní*).
- Rychlé tlačítko **„Zalito dnes“** na jedno kliknutí s automatickým záznamem do deníku.
- **Zimní klidový režim**: Prodloužení intervalů zálivky a úprava péče během zimy.
- Filtrování podle místností, žíznivých kytek i bezpečnosti pro domácí zvířata (*Pet Friendly*).

### 2. Gemini AI Botanik & Diagnostika chorob
- **Rozpoznání rostliny z fotky**: Stačí vyfotit kytku a Gemini 3.7 Flash určí název (český i latinský), intervaly zálivky, hnojení, substrát, světlo a toxicitu pro psy a kočky.
- **AI Květinový doktor (Leaf Symptom Checker)**: Diagnóza vadnoucích či skvrnitých listů z fotografie, stanovení závažnosti, varování před infekcí a kroky k záchraně.

### 3. Květinový pas, Deník růstu & Dovolenkový checklist
- Detailní parametry: průměr květináče, složení substrátu, fotodeník růstu v čase.
- **Plant Sitter Checklist**: Tiskový přehled instrukcí na dovolenou pro sousedy (*co zalít, co nechat být, co orosit*).

---

## 🐾 Modul 3: Domácí mazlíčci (Pet Care Tracker)

Zdraví, péče a každodenní rutina pro všechna zvířata v rodině.

### 1. Profil mazlíčka & Identifikace
- Evidence druhů (*psi, kočky, králíci, ptáci, plazi, rybičky, ostatní*), plemene, věku (v přirozeném jazyce např. *3 roky a 3 měsíce*), pohlaví, kastrace, barvy a fotek.
- Správa **čísla mikročipu** a **mezinárodního pasu zvířete**.

### 2. Rodinné krmení („Kdo nakrmil dnes?“) & Diety
- Tlačítko rychlého krmení na 1 klik: Zaznamená přesný čas a jméno člena rodiny (*konec překrmování!*).
- Popis jídelníčku a krmné dávky.
- **Bezpečnostní blok intolerancí („Po čem není dobře“)**: Zvýrazněný varovný blok se zakázanými surovinami a alergeny.
- **Propojení s nákupy**: 1-klikové přidání granulí, konzerv či léků přímo do nákupního seznamu Hestia.

### 3. Zdravotní karta, Očkování & SOS Veterinář
- **Očkovací průkaz**: Evidence vakcín a odčervení s expirací a odpočtem dnů do přeočkování.
- **Aktivní léky**: Dávkování a frekvence medikace.
- **Váhový deník**: Sledování hmotnosti s interaktivním grafem trendu a historie.
- **Veterinární karta**: Přímé volání na lékaře i nonstop pohotovostní kliniku (24/7 emergency).

### 4. Gemini AI Bezpečnost potravin & Veterinární rádce
- 🟢 **AI Food Safety Checker**: Semafor bezpečnosti potravin (*Může to pes/kočka jíst?*) s vysvětlením rizik a alternativami.
- 🩺 **AI Veterinární rádce**: Konzultace příznaků, možnost nahrát foto vyrážky či rány, triage závažnosti a první pomoc.

### 5. Pet Sitter Handover & SOS Plakát
- **Pet Sitter Guide**: Přehledný tiskový předávací protokol pro hlídače mazlíčka během dovolené.
- 🚨 **SOS Plakát ztraceného zvířete**: Formátovaný leták s fotografií, číslem čipu a kontaktem na majitele připravený k tisku při zaběhnutí.

---

## 🗺️ Roadmapa budoucích modulů

Hestia je připravena pro postupné zapínání dalších modulů:
- 🔧 **Asset management**: Evidence spotřebičů, záruk, sériových čísel a PDF návodů.
- 🧹 **Domácí práce a úkoly**: Rotující úkoly mezi členy rodiny, body a harmonogram úklidu.
- 💰 **Rodinné finance**: Rozpočet, pravidelná předplatná a rozdělení nákladů.
- 💊 **Domácí lékárnička**: Expirace léků a dávkování při nemoci.
- ⚡ **Měřiče energií**: Odečty elektřiny, plynu a vody se spotřebními grafy.
- 📦 **QR Sklad a krabice**: Evidence úložných boxů ve sklepě a na půdě s QR kódy.

---

## 🚀 Jak aplikaci spustit

### 1. Spuštění v Dockeru (Doporučeno pro produkci / NAS / Raspberry Pi)

1. Zkopírujte konfigurační soubor:
   ```bash
   cp .env.example .env
   ```
2. V souboru `.env` vyplňte svůj `GEMINI_API_KEY` (získat lze zdarma na [Google AI Studio](https://aistudio.google.com/)).
3. Spusťte kontejnery:
   ```bash
   docker compose up -d
   ```
4. Aplikace je dostupná na:
   - **Frontend**: `http://localhost:3000` (nebo IP vašeho serveru)
   - **Backend API Docs (Swagger)**: `http://localhost:8000/docs`

---

### 2. Lokální vývoj (bez Dockeru)

#### Backend (FastAPI):
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

#### Frontend (React + Vite):
```bash
cd frontend
npm install
npm run dev
```
Frontend poběží na `http://localhost:3000` a automaticky komunikuje s backendem na portu 8000.

---

## 🔑 Výchozí přednastavené účty

Při prvním spuštění se databáze automaticky naplní ukázkovými recepty, zásobami a následujícími účty:

| Uživatel | Heslo | Role | Jazyk |
| :--- | :--- | :--- | :--- |
| **admin** | `hestia123` | Správce (Admin) | Čeština 🇨🇿 |
| **anna** | `hestia123` | Člen rodiny | Čeština 🇨🇿 |
| **petr** | `hestia123` | Člen rodiny | English 🇬🇧 |

---

## 🛡️ Technologie

- **Backend**: Python 3.13, FastAPI, SQLAlchemy, SQLite (WAL mode), Pydantic v2, PyJWT, bcrypt, google-genai SDK
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Custom i18n
- **Deploy**: Docker, Docker Compose, Nginx Alpine
