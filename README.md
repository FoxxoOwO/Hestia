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

## 🧹 Modul 4: Domácí práce a úklid (Household Chores)

Chytré plánování, férová rotace prací v rodině, servisní knížka spotřebičů a gamifikace.

### 1. Férové střídání („Kdo je na řadě?“) & Zóny
- Evidence rutinních úkolů (*kuchyň, koupelna, obývák, ložnice, předsíň, dětský pokoj, zahrada, celý dům*).
- **Automatická rotace (Round-robin)**: Při splnění úkolu se automaticky střídá další člen rodiny v kolečku.
- Možnost ručního předání / výměny úkolu jedním kliknutím.
- Rychlé tlačítko **„Splněno mnou“** s okamžitým připsáním bodů a výpočtem dalšího termínu.

### 2. Servisní knížka spotřebičů & Periodická péče
- Evidence technické údržby domácí techniky (*odvápnění kávovaru, čištění filtrů myčky, filtru pračky, odmaštění filtrů digestoře*).
- Odpočet dnů do příštího servisu a historie provedených údržeb.

### 3. Gamifikace, Chore Points & Rodinná síň slávy
- Bodové ohodnocení úkolů (5–100 b. podle náročnosti a času).
- **Týdenní a celkový žebříček**: Přehled největších dříčů v rodině a ukazatel férovosti.
- **Obchod s rodinnými odměnami**: Možnost směnit nasbírané body za reálné výhody (např. *výběr pátečního filmu, večeře na přání z Receptáře, zmrzlinový pohár, žolík bez úklidu*).

### 4. Akční režimy úklidu
- 🌪️ **Panic Mode („Návštěva zvoní za 15 minut!“)**: Bleskový úklidový sprint s 15minutovým odpočtem a sadou top prioritních zón.
- 🎡 **Kolo štěstí (Fair Wheel of Chores)**: Interaktivní animované kolo osudu pro spravedlivé vylosování neoblíbeného úkolu.
- 🧽 **Generální úklid**: Zónové checklisty s progress bary dokončení jednotlivých místností.
- 🛒 **1-klik do nákupního seznamu**: Přidání tablet do myčky, pytlů do koše nebo čističů přímo do rodinného nákupu.

---

---

## 💰 Modul 5: Rodinné finance a rozpočet (Family Finance & Budget)

Kompletní správa rodinných peněz bezpečně pod vaší střechou.
- **Měsíční rozpočet a obálková metoda**: 10 rodinných kategorií s barevnými semafory čerpání (zelená / žlutá / červená) a rychlou úpravou limitů.
- **Kdo komu dluží? & České SPAYD QR kódy**: Automatické vyrovnání sdílených výdajů s generováním standardních QR kódů pro české bankovní aplikace (Air Bank, ČSOB, KB, Spořitelna, Fio atd.).
- **Dlouhodobý průměr útraty**: Srovnání aktuálního měsíce s historickým průměrem ze všech evidovaných měsíců.
- **Hlídač předplatných**: Evidence Netflixu, Spotify, energií a pojištění s přepočtem na měsíc/rok a odpočtem dnů do platby.
- **Virtuální prasátka (Spořicí cíle)**: Nastavení cílů a 1-klikové přisypávání peněz.
- **Import bankovních výpisů (CSV / XLSX)**: Auto-detekce českých bank a chytrá auto-kategorizace plateb.
- **Gemini Flash AI Skener účtenek**: Vytěžení částky, obchodu, položek a kategorie z fotografie účtenky.

---

## 📑 Modul 6: Digitální archiv a šanony (Documents, Warranty & Vault)

Digitalizace papírových složek s hlídačem záruk a ochranou citlivých smluv.
- **9 virtuálních šanonů**: Záruky, smlouvy, technické revize, manuály, osobní doklady, zdraví, bydlení, vozidla a ostatní.
- **Hlídač expirací & záruk**: Barevné semafory (zelená / žlutá / červená) s odpočtem dnů do konce záruky či platnosti revize.
- **Fyzické umístění originálu („Kde leží papír?“)**: Záznam přesného místa uložení papírového dokumentu v domácnosti.
- **Rodinný digitální trezor (Family Vault)**: Ochrana citlivých dokumentů 4místným PIN kódem.
- **Gemini 2.5 Flash AI OCR**: Automatické rozpoznání parametrů z PDF a fotografií (prodejce, záruční doba, cena, S/N, shrnutí a full-text).

---

## 🚗 Modul 7: Vozový park a rodinná garáž (Fleet & Garage)

Péče o rodinná auta a motocykly s hlídáním české legislativy.
- **Karty vozidel & Tachometr**: Přehled aut s českou SPZ, fotkou a rychlou aktualizací stavu kilometrů.
- **Hlídač legislativy ČR**: Odpočty do STK a měření emisí, elektronická dálniční známka ČR (edalnice.cz), výročí pojištění (POV/HAV) a autolékárnička.
- **Pneu & Sezónní přezouvání**: Sledování dezénu (zákonný limit 4 mm / 1.6 mm) a místa uskladnění druhé sady.
- **Digitální servisní knížka**: Interval výměny oleje (km / měsíce) s odpočtem a propojením do financí.
- **Kniha tankování & Reálná spotřeba**: Výpočet průměrné spotřeby (l/100 km) a nákladů na 1 km.
- **SOS Asistence při nehodě**: Přímé volání asistence, Linky pomoci řidičům (1224), tísňových linek a interaktivní průvodce nehodou.

---

## 💊 Modul 8: Domácí lékárnička a první pomoc (Medicine Cabinet & First Aid)

Bezpečné léky, hlídání expirací a krizový průvodce pro rodinu.
- **Evidence zásob a účinných látek**: Prevence předávkování sledováním účinné látky (Paracetamol, Ibuprofen atd.), evidence umístění (koupelna, lednice, chata, cestovní).
- **Expirace a použitelnost po otevření**: Semafor expirace a hlídač otevřených kapek, sirupů a mastí.
- **Dávkovací plány & Denní tracker**: Rozvrhy pro členy rodiny s tlačítkem „Vzít dávku“ a odečtem ze skladu.
- **Dětská kalkulačka antipyretik**: Bezpečný výpočet dávky Paracetamolu a Ibuprofenu na kg váhy dítěte (včetně varování před koncentrovaným Nurofenem 4%).
- **SOS První pomoc a krizový rádce**: Rychlé volání na ZZS (155) i Toxikologické středisko TIS (224 91 92 93), návody první pomoci krok za krokem.
- **1-klik do nákupního seznamu**: Přidání docházejících léků přímo do nákupů.

---

## 🗺️ Roadmapa budoucích modulů

Hestia je připravena pro postupné zapínání dalších modulů:
- ⚡ **Měřiče energií**: Odečty elektřiny, plynu a vody se spotřebními grafy a výpočtem nákladů.
- 📦 **QR Sklad a krabice**: Evidence úložných boxů ve sklepě a na půdě s tištěnými QR štítky.
- 🏠 **Smart Home integrace**: Obousměrná integrace s Home Assistant a MQTT.

---

## 🚀 Jak aplikaci spustit

Podrobný průvodce se všemi možnostmi nasazení, Synology / Portainer šablonami a zálohováním naleznete v samostatném dokumentu **[DOCKER.md](DOCKER.md)**.

### 1. Spuštění v Dockeru (Doporučeno pro produkci / NAS / Raspberry Pi)

Máte k dispozici tyto možnosti (viz podrobný návod v [DOCKER.md](DOCKER.md)):
- **Hotový obraz z GitHub Container Registry (nejrychlejší)**: Spuštění předpřipraveného obrazu bez nutnosti cokoliv kompilovat přes `docker-compose.ghcr.yml`.
- **Docker Compose (Microservices ze zdrojáků)**: Samostatný backend a Nginx frontend na portu `3000`.
- **All-in-One kontejner**: Jediný kontejner spojující frontend i backend na portu `8000` (ideální pro Synology Container Manager a Portainer).

#### Rychlý start s hotovým obrazem z GitHubu:
```bash
# Stažení docker-compose a spuštění:
curl -fSL https://raw.githubusercontent.com/FoxxoOwO/Hestia/main/docker-compose.ghcr.yml -o docker-compose.yml
docker compose up -d
```
Aplikace ihned běží na `http://localhost:8000`.

#### Nebo sestavení z naklonovaného repozitáře:
1. Zkopírujte konfigurační soubor:
   ```bash
   cp .env.example .env
   ```
2. V souboru `.env` vyplňte svůj `GEMINI_API_KEY` (získat lze zdarma na [Google AI Studio](https://aistudio.google.com/)).
3. Spusťte kontejnery:
   ```bash
   docker compose up -d
   # nebo pro GitHub image:
   docker compose -f docker-compose.ghcr.yml up -d
   ```
4. Aplikace je dostupná na:
   - **Frontend**: `http://localhost:3000` (při sestavení) nebo `http://localhost:8000` (při GHCR)
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
