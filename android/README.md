# 📱 Hestia – nativní Android klient

Plnohodnotný nativní klient domácnosti **Hestia** pro Android. Není to WebView obal – všechny
obrazovky jsou napsané v **Kotlinu** a **Jetpack Compose** (Material 3) a komunikují přímo
s backendem FastAPI přes REST API `/api/v1`.

- `minSdk 24`, `targetSdk 36`, `compileSdk 36`, JVM 17
- Jetpack Compose (BOM 2026.03.01), Material 3, Navigation drawer + bottom bar
- Retrofit 2 + OkHttp + kotlinx.serialization
- Jetpack DataStore (uložení serveru, JWT tokenu, přihlášeného uživatele, motivu)

## Moduly (plná parita s webem)

| Modul | Co umí |
|---|---|
| **Dashboard** | Souhrnné karty (nákup, úkoly, rostliny, mazlíčci, léky, finance, vozidla, dokumenty), moje úkoly, panic mode, žebříček, feed aktivit, AI status |
| **Recepty** | Filtr (hledání, obtížnost, cena, čas, oblíbené), detail s přepočtem porcí (`/scale` + „mám ve spíži“), tvorba/editace s dynamickými surovinami a kroky, AI import z URL / textu / souboru, přidání do nákupu |
| **Jídelníček** | Týdenní přehled, plánování jídel, „uvařeno“, generování nákupního seznamu z týdne |
| **Spíž** | Zásoby s expirací a minimem, filtry, plus „Co uvařit“ (`/pantry/match-recipes`) |
| **Nákup** | Rychlé přidání, odškrtávání, editace, mazání, vyčištění koupeného/všeho, přidání z receptu |
| **Úkoly** | Úkoly s filtry a rotací, dokončení s body, předání, kolo úkolů (náhodné rozdělení), žebříček, odměny a jejich uplatnění, panic mode, přidání potřeb do nákupu |
| **Květiny** | Zálivka, zimní režim, oblíbené, detail s úkoly a logem, AI identifikace rostliny, AI diagnóza potíží, plán pro „plant sittera“ |
| **Mazlíčci** | Krmení, oblíbené, zdravotní záznamy, léky, vážení, úkoly, deník, AI kontrola potravin, AI analýza příznaků, sitter profil, SOS leták |
| **Finance** | Přehled měsíce, rozpočty, transakce, vyrovnání dluhů (SPAYD), předplatná, spořicí cíle, CSV import (náhled + potvrzení), skenování účtenek, profil s IBAN |
| **Dokumenty** | Upload s AI rozpoznáním metadat, filtry a statistiky, trezor s PIN, otevírání souborů ze serveru, ruční zápis |
| **Spotřebiče** | Záruky a jejich stav, servisní kontakty, nahrání faktury/manuálu, statistiky hodnoty |
| **Vozidla** | STK, dálniční známka, pojištění, lékárnička, olej, pneu, tachometr, tankování s výpočtem spotřeby, servisní záznamy, statistiky flotily |
| **Lékárnička** | Zásoby se semaforem expirace, příjem/expirace, plán dávek s „vzato“, log, dětská dávková kalkulačka, SOS první pomoc |
| **Historie** | Auditní log s filtry modulů, statistiky a čištěním |
| **Nastavení** | Účet a přepnutí člena, členové domácnosti (CRUD), motiv (světlý/tmavý/systém), server a health check, AI status, zálohy na serveru (vytvořit/stáhnout/obnovit/smazat), export a import dat, smazání všech dat |

## Architektura

```
data/models/Models.kt          DTO přesně podle backendových Pydantic schémat
data/api/HestiaApiService.kt   163 Retrofit endpointů (1:1 s FastAPI routami)
data/api/ApiClient.kt          Retrofit factory + Authorization: Bearer interceptor
data/repository/HestiaRepository.kt  Result<T> obal nad každým voláním, multipart uploady, soubory
data/local/PreferencesManager.kt     DataStore: server, token, uživatel, motiv
ui/screens/<modul>/…           jedna obrazovka (případně s taby) na modul
ui/components/…                HestiaField, HestiaDropdown, DateField, DialogScaffold, ChipSelector…
Navigation.kt                  drawer + bottom bar + auth gate
util/Format.kt                 Fmt (data, čísla, peníze, relativní čas) a Labels (číselníky)
util/Errors.kt                 překlad HTTP chyb do češtiny
```

## Sestavení

```bash
cd android
./gradlew assembleDebug            # APK: app/build/outputs/apk/debug/app-debug.apk
./gradlew installDebug             # instalace do připojeného zařízení/emulátoru
```

## Připojení k serveru

1. Spusťte backend (`cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000`).
2. V aplikaci na přihlašovací obrazovce otevřete **Nastavení serveru** a zadejte URL:
   - Android emulátor: `http://10.0.2.2:8000`
   - Telefon v domácí WiFi: `http://<IP-počítače>:8000`
   - Produkce: `https://…`
3. Ověřte spojení tlačítkem **Otestovat** (`/api/health`), poté se přihlaste.

Aplikace povoluje cleartext HTTP (`usesCleartextTraffic="true"`), aby fungovala i proti
lokálnímu serveru bez TLS.

## Ověření

- `./gradlew assembleDebug --offline` prochází bez chyb a varování v novém kódu.
- Všech 163 Retrofit cest bylo porovnáno se seznamem rout z `backend/app/routers/*.py`
  (skript v repu není, kontrola proběhla jednorázově) – shoda 100 %, jediná výjimka
  `/api/health` je mimo `/api/v1` prefix záměrně.
