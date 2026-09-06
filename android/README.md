# 📱 Hestia – Nativní Android aplikace (Jetpack Compose & Material 3)

Nativní mobilní aplikace pro operační systém Android vytvořená pro chytrou správu domácnosti **Hestia Smart Home OS**.

Aplikace je napsána v moderním **Kotlinu** s využitím **Jetpack Compose**, **Material 3 Expressive**, reaktivních **Coroutines / StateFlow**, **Retrofit 2** a **Jetpack DataStore**.

---

## 🌟 Klíčové funkce mobilní aplikace

1. **Dashboard & Ranní přehled**:
   - Rychlé souhrnné karty: počet položek k nákupu, dnešní urgentní úkoly, žíznivé pokojovky, léky blížící se expiraci.
   - Bleskové akce: spuštění **Panic Mode** (15minutový úklidový sprint) a tlačítko **Zalít vše** pro žíznivé rostliny.
   - Poslední rodinné aktivity z auditního logu.

2. **Nákupní seznam v supermarketu (`Nákup`)**:
   - Rychlé odškrtávání položek přímo v obchodě.
   - Plovoucí tlačítko (+) pro okamžité přidání položky s množstvím a jednotkou.
   - Příznak „Spěchá / Prioritní“ s červeným odznáčkem.
   - Tlačítko pro rychlé promazání nakoupeného zboží.

3. **Domácí práce a úklid (`Úkoly`)**:
   - Přepínání mezi záložkami **Moje úkoly** a **Všechny úkoly**.
   - Tlačítko **„Splněno mnou“** – okamžitě připíše body do rodinného žebříčku a posune rotaci na dalšího člena.
   - Spuštění **Panic Mode** s bleskovými úkoly po místnostech.

4. **Domácí lékárnička & První pomoc (`Lékárnička`)**:
   - Skladové zásoby léků se semaforem expirace (🟢 V pořádku, 🟡 Expiruje brzy, 🔴 Expirováno).
   - Tlačítko **„Vzít dávku“** pro rychlý záznam a automatický odečet ze skladu.
   - **Dětská kalkulačka antipyretik**: posuvník hmotnosti (4–45 kg) s přesným výpočtem mililitrů pro Paracetamol (Paralen sirup) i Ibuprofen (Nurofen sirup) a bezpečnostním upozorněním na koncentraci Nurofenu 4%.
   - **SOS První pomoc**: rychlé vytáčení linek **155**, **112** a **Toxikologického informačního střediska (224 91 92 93)** s krizovými manuály krok za krokem.

5. **Pokojové květiny (`Květiny`)**:
   - Odpočet dnů do příští zálivky.
   - Tlačítko **„Zalito“** na jedno kliknutí.
   - Indikátory bezpečnosti pro domácí mazlíčky (*Pet friendly*).

6. **Vozový park a rodinná garáž (`Garáž`)**:
   - Přehled rodinných aut s českou SPZ.
   - Semafor platnosti **STK** a **elektronické dálniční známky ČR**.
   - Dialog pro rychlý zápis stavu tachometru a záznam tankování paliva.
   - SOS tlačítko pro přímé volání Linky pomoci řidičům (**1224**).

7. **Přihlašování a Nastavení serveru**:
   - **Rychlý výběr členů rodiny** s barevnými avatary na přihlašovací obrazovce.
   - Možnost přihlášení libovolným uživatelským jménem.
   - Obrazovka **Nastavení serveru** s testem spojení (`/api/health`) a předvolbami pro Android emulátor (`http://10.0.2.2:8000`), místní WiFi síť (`http://192.168.1.xxx:8000`) nebo HTTPS server.

---

## 🛠️ Požadavky a technologie

- **Android SDK**: `minSdk 26` (Android 8.0 Oreo+), `targetSdk 36`, `compileSdk 36`
- **Java / JDK**: JDK 17 nebo vyšší (JDK 21 / 25 plně podporováno)
- **Gradle**: 9.1.0 (součástí je Gradle Wrapper `gradlew`)
- **Jetpack Compose**: Material Design 3 Expressive
- **Retrofit 2 & OkHttp 3**: REST API klient s automatickým JWT Bearer tokenem
- **Kotlinx Serialization**: Typově bezpečný parsing JSON dat
- **Jetpack DataStore Preferences**: Bezpečné ukládání relace a nastavení

---

## 🚀 Sestavení a spuštění

### 1. Sestavení debug APK
V kořenovém adresáři `android/` spusťte:
```bash
# Windows
.\gradlew.bat assembleDebug

# Linux / macOS
./gradlew assembleDebug
```
Výsledný balíček APK naleznete v:
`app/build/outputs/apk/debug/app-debug.apk`

### 2. Instalace do připojeného zařízení nebo emulátoru
Pomocí Gradle:
```bash
.\gradlew.bat installDebug
```
Nebo přímo přes Android Debug Bridge (`adb`):
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### 3. Spuštění v Android Studio
Otevřete složku `d:\repositories\Hestia\android` v Android Studiu a klikněte na zelenou šipku **Run 'app'**.
