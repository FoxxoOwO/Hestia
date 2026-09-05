# 🐳 Hestia Smart Home OS – Docker Průvodce & Nasazení

Tento průvodce popisuje možnosti spuštění a provozu systému **Hestia** v prostředí Docker a Docker Compose na domácích serverech, NAS úložištích (Synology, QNAP, Unraid, TrueNAS), v Portaineru i na Raspberry Pi.

---

## 🚀 1. Rychlé spuštění (Dvě možnosti)

Máte na výběr ze dvou oficiálních způsobů nasazení podle vašich preferencí:

### Možnost A: Docker Compose (Doporučeno pro většinu uživatelů)
Oddělený backend (FastAPI) a frontend (Nginx reverse proxy) propojené interní sítí.

1. Naklonujte repozitář:
   ```bash
   git clone https://github.com/FoxxoOwO/Hestia.git
   cd Hestia
   ```

2. Zkopírujte a upravte konfigurační soubor `.env`:
   ```bash
   cp .env.example .env
   ```
   *(V souboru `.env` můžete nastavit svůj `GEMINI_API_KEY` a vlastní silný `SECRET_KEY`)*

3. Spusťte kontejnery:
   ```bash
   docker compose up -d
   ```

4. Otevřete webový prohlížeč na:
   ```
   http://localhost:3000
   ```
   *(nebo na IP adrese vašeho serveru, např. `http://192.168.1.50:3000`)*

---

### Možnost B: All-in-One samostatný kontejner (Vhodné pro NAS & Portainer)
Jeden jediný kontejner spojující zkompilovaný frontend i backend na jediném portu s jedním svazkem pro data.

```bash
# Sestavení All-in-One obrazu
docker build -t hestia:latest .

# Spuštění kontejneru s perzistentními daty
docker run -d \
  --name hestia \
  --restart unless-stopped \
  -p 8080:8000 \
  -v $(pwd)/data/db:/app/data \
  -v $(pwd)/data/uploads:/app/uploads \
  -e SECRET_KEY="vase-tajne-heslo-pro-jwt-tokeny" \
  -e GEMINI_API_KEY="AIzaSy..." \
  hestia:latest
```

Aplikace bude okamžitě dostupná na `http://localhost:8080`.

---

## 🔑 2. Výchozí přihlašovací údaje

Při prvním spuštění systém automaticky vytvoří výchozí rodinné účty:

| Uživatel | Uživatelské jméno | Heslo | Role |
|---|---|---|---|
| **Správce Domácnosti** | `admin` | `hestia123` | Administrátor |
| **Anna** | `anna` | `hestia123` | Člen rodiny |
| **Petr** | `petr` | `hestia123` | Člen rodiny |

> [!WARNING]
> Po prvním přihlášení doporučujeme změnit hesla v sekci **Nastavení** (`/settings`).

---

## 💾 3. Perzistence dat a zálohování

Veškerá data aplikace jsou uložena na hostitelském disku ve složce `./data`:
- `./data/db/hestia.db` – kompletní SQLite databáze (recepty, spíž, nákupy, květiny, mazlíčci, finance, servisní knížky vozidel, lékárnička atd.).
- `./data/uploads/` – nahrané soubory (skeny účtenek, záruční listy a faktury v digitálním trezoru, fotky zvířat a rostlin).

### Snadné zálohování:
Pro kompletní zálohu celého systému stačí zazálohovat složku `data/`:
```bash
# Vytvoření komprimované zálohy:
tar -czvf hestia-backup-$(date +%F).tar.gz data/
```
Na zařízeních **Synology** stačí složku namapovat do sdílené složky a zahrnout ji do **Hyper Backup** či **Snapshot Replication**.

---

## ⚙️ 4. Přehled proměnných prostředí (.env)

| Proměnná | Popis | Výchozí hodnota |
|---|---|---|
| `SECRET_KEY` | Šifrovací klíč pro generování bezpečných JWT tokenů | *(náhodný řetězec)* |
| `GEMINI_API_KEY` | API klíč Google Gemini pro AI asistenta, OCR účtenek a analýzu | *(volitelné)* |
| `DATABASE_URL` | Připojení k SQLite databázi | `sqlite:////app/data/hestia.db` |
| `UPLOAD_DIR` | Složka pro nahrávané soubory | `/app/uploads` |
| `FRONTEND_DIST_DIR` | Cesta k sestavenému frontendu (pro All-in-One režim) | `/app/frontend/dist` |

---

## 🖥️ 5. Návod pro Synology NAS (Container Manager)

1. Otevřete aplikaci **Container Manager** (dříve Docker) na vašem Synology DSM.
2. Přejděte do sekce **Projekt** ➔ klikněte na **Vytvořit**.
3. Zadejte název projektu `hestia` a cestu ke složce (např. `/docker/hestia`).
4. Jako zdroj vyberte **Vytvořit soubor docker-compose.yaml** a vložte obsah z tohoto repozitáře.
5. Klikněte na **Další** a projekt spusťte.
6. Hestia poběží na portu vašeho NASu (např. `http://192.168.1.100:3000`).

---

## 📦 6. Šablona pro Portainer (Stack)

V Portaineru přejděte na **Stacks** ➔ **Add stack** ➔ **Web editor**:

```yaml
version: '3.8'

services:
  hestia:
    image: ghcr.io/foxxoowo/hestia:latest
    container_name: hestia
    restart: unless-stopped
    ports:
      - "8080:8000"
    environment:
      - SECRET_KEY=zmente-tento-tajny-klic-pro-bezpecnost
      - GEMINI_API_KEY=
      - DATABASE_URL=sqlite:////app/data/hestia.db
      - UPLOAD_DIR=/app/uploads
    volumes:
      - /opt/hestia/data:/app/data
      - /opt/hestia/uploads:/app/uploads
```

---

## 🔄 7. Aktualizace na novou verzi

Aktualizace systému Hestia v Docker Compose je otázkou dvou příkazů:

```bash
git pull
docker compose build --no-cache
docker compose up -d
```

Nebo při použití publikovaných image z GitHub Container Registry:
```bash
docker compose pull
docker compose up -d
```
