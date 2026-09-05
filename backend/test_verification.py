import os
from fastapi.testclient import TestClient
from app.main import app
from app.database import engine, Base, SessionLocal
from app.services.seed_data import seed_initial_data

def run_tests():
    print("=== SPUŠTĚNÍ TESTŮ HESTIA ===")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()

    client = TestClient(app)

    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.status_code}"
    health_data = res.json()
    print("1. Health check:", health_data["app"], "- OK")

    # 2. Login
    login_res = client.post("/api/v1/auth/login", json={"username": "admin", "password": "hestia123"})
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("2. Login (JWT token získán) - OK")

    # 3. Get Recipes
    rec_res = client.get("/api/v1/recipes", headers=headers)
    assert rec_res.status_code == 200
    recipes = rec_res.json()
    assert len(recipes) >= 3
    print(f"3. Recepty načteny (nalezeno {len(recipes)} receptů) - OK")

    # 4. Test portion scaling
    first_rec_id = recipes[0]["id"]
    scale_res = client.get(f"/api/v1/recipes/{first_rec_id}/scale?servings=6", headers=headers)
    assert scale_res.status_code == 200
    scale_data = scale_res.json()
    assert scale_data["target_servings"] == 6
    assert scale_data["scale_factor"] == 1.5
    print(f"4. Dynamický přepočet porcí (4 -> 6 porcí, faktor 1.5): {scale_data['scaled_ingredients'][0]['name']} = {scale_data['scaled_ingredients'][0]['scaled_amount']} {scale_data['scaled_ingredients'][0]['unit']} - OK")

    # 5. Pantry and Recipe matching
    pantry_res = client.get("/api/v1/pantry", headers=headers)
    assert pantry_res.status_code == 200
    pantry_items = pantry_res.json()
    assert len(pantry_items) >= 10
    print(f"5. Zásoby spíže a lednice (nalezeno {len(pantry_items)} položek s expiracemi) - OK")

    match_res = client.get("/api/v1/pantry/match-recipes", headers=headers)
    assert match_res.status_code == 200
    matches = match_res.json()
    assert len(matches) > 0
    can_cook = [m for m in matches if m["can_cook_now"]]
    print(f"6. Chytré párování receptů se spíží ('Co mohu uvařit'): {len(can_cook)} receptů lze uvařit ihned - OK")

    # 7. Shopping list operations
    shop_res = client.get("/api/v1/shopping", headers=headers)
    assert shop_res.status_code == 200

    # Add item to shopping list
    add_shop_res = client.post("/api/v1/shopping", json={"name": "Testovací káva", "amount": 1, "unit": "balení"}, headers=headers)
    assert add_shop_res.status_code == 201
    created_shop_id = add_shop_res.json()["id"]

    # Toggle check
    check_shop_res = client.put(f"/api/v1/shopping/{created_shop_id}", json={"is_checked": True}, headers=headers)
    assert check_shop_res.status_code == 200
    assert check_shop_res.json()["is_checked"] is True

    # Clear completed
    clear_res = client.post("/api/v1/shopping/clear-completed", headers=headers)
    assert clear_res.status_code == 200

    # Delete test item if remaining
    client.delete(f"/api/v1/shopping/{created_shop_id}", headers=headers)
    print("7. Operace s nákupním seznamem (přidání, odškrtnutí, vyčištění) - OK")

    # === 8. TESTY MODULU: SLEDOVÁNÍ KYTEK (PLANT TRACKER) ===
    print("\n=== TESTY MODULU: SLEDOVÁNÍ KYTEK ===")
    
    # 8.1 Seznam rostlin
    plants_res = client.get("/api/v1/plants", headers=headers)
    assert plants_res.status_code == 200, f"Plants list failed: {plants_res.text}"
    plants = plants_res.json()
    assert len(plants) >= 4, f"Expected at least 4 seeded plants, got {len(plants)}"
    print(f"8.1 Výpis pokojovek (načteno {len(plants)} rostlin s výpočtem vláhy) - OK")

    # 8.2 Filtrování kytek (pet friendly, místnosti)
    safe_res = client.get("/api/v1/plants?pet_toxicity=safe", headers=headers)
    assert safe_res.status_code == 200
    safe_plants = safe_res.json()
    assert all(p["pet_toxicity"] == "safe" for p in safe_plants)
    print(f"8.2 Filtrování podle bezpečnosti pro mazlíčky (nalezeno {len(safe_plants)} pet friendly kytek) - OK")

    # 8.3 Vytvoření nové testovací rostliny
    new_plant_payload = {
        "name": "Potos zlatý (Scindapsus)",
        "species_latin": "Epipremnum aureum",
        "species_czech": "Šplhavnice zlatá",
        "room": "office",
        "light_requirement": "bright_indirect",
        "watering_interval_days": 7,
        "winter_watering_interval_days": 12,
        "fertilizing_interval_days": 14,
        "misting_required": True,
        "pot_diameter_cm": 15,
        "substrate_type": "Propustný aroidní mix",
        "pet_toxicity": "mildly_toxic",
        "pet_toxicity_notes": "Obsahuje krystalky šťavelanu vápenatého.",
        "health_status": "healthy"
    }
    create_plant_res = client.post("/api/v1/plants", json=new_plant_payload, headers=headers)
    assert create_plant_res.status_code == 201, f"Create plant failed: {create_plant_res.text}"
    created_plant = create_plant_res.json()
    test_plant_id = created_plant["id"]
    print(f"8.3 Vytvoření nové kytky: '{created_plant['name']}' (ID: {test_plant_id}) - OK")

    # 8.4 Zálivka ("Zalito dnes")
    water_res = client.post(f"/api/v1/plants/{test_plant_id}/water", headers=headers)
    assert water_res.status_code == 200
    watered_data = water_res.json()
    assert watered_data["watering_status"] == "watered_today"
    assert watered_data["days_until_watering"] == 7
    print(f"8.4 Akce zálivky ('Zalito dnes') - status: {watered_data['watering_status']}, příští za {watered_data['days_until_watering']} dní - OK")

    # 8.5 Přepnutí zimního klidového režimu
    winter_res = client.post(f"/api/v1/plants/{test_plant_id}/toggle-winter-mode", headers=headers)
    assert winter_res.status_code == 200
    winter_data = winter_res.json()
    assert winter_data["is_winter_mode"] is True
    assert winter_data["days_until_watering"] == 12
    print(f"8.5 Zimní klidový režim (interval přepnut na {winter_data['winter_watering_interval_days']} dní) - OK")

    # 8.6 Plánování a splnění úkolu péče
    task_payload = {
        "task_type": "fertilize",
        "due_date": "2026-09-20",
        "interval_days": 14,
        "notes": "Hnojivo na nekvetoucí rostliny"
    }
    task_res = client.post(f"/api/v1/plants/{test_plant_id}/tasks", json=task_payload, headers=headers)
    assert task_res.status_code == 200
    created_task = task_res.json()
    task_id = created_task["id"]

    complete_task_res = client.post(f"/api/v1/plants/{test_plant_id}/complete-task/{task_id}", headers=headers)
    assert complete_task_res.status_code == 200
    assert complete_task_res.json()["last_completed_at"] is not None
    print(f"8.6 Péče a úkoly: Naplánování úkolu '{created_task['task_type']}' a úspěšné odškrtnutí - OK")

    # 8.7 Přidání zápisu do fotodeníku růstu
    log_payload = {
        "entry_type": "note",
        "title": "První jarní přírůstek",
        "notes": "Rostlina vyhnala 2 nové svěže zelené listy."
    }
    log_res = client.post(f"/api/v1/plants/{test_plant_id}/logs", json=log_payload, headers=headers)
    assert log_res.status_code == 200
    print(f"8.7 Fotodeník růstu: Zápis události '{log_payload['title']}' - OK")

    # 8.8 Dovolenkový režim (Plant Sitter Checklist)
    sitter_res = client.get("/api/v1/plants/plant-sitter", headers=headers)
    assert sitter_res.status_code == 200
    sitter_checklist = sitter_res.json()
    assert len(sitter_checklist) >= 5
    print(f"8.8 Dovolenkový režim (Plant Sitter checklist vygenerován pro {len(sitter_checklist)} rostlin) - OK")

    # 8.9 Smazání testovací rostliny
    del_plant_res = client.delete(f"/api/v1/plants/{test_plant_id}", headers=headers)
    assert del_plant_res.status_code == 200
    print("8.9 Vyčištění testovací rostliny - OK")

    # === 9. TESTY MODULU: DOMÁCÍ MAZLÍČCI (PET TRACKER) ===
    print("\n=== TESTY MODULU: DOMÁCÍ MAZLÍČCI ===")

    # 9.1 Seznam mazlíčků
    pets_res = client.get("/api/v1/pets", headers=headers)
    assert pets_res.status_code == 200, f"Pets list failed: {pets_res.text}"
    pets = pets_res.json()
    assert len(pets) >= 2, f"Expected at least 2 seeded pets, got {len(pets)}"
    print(f"9.1 Výpis mazlíčků (načteno {len(pets)} zvířat s věkem a váhou) - OK")

    # 9.2 Filtrování podle druhu
    dog_res = client.get("/api/v1/pets?species=dog", headers=headers)
    assert dog_res.status_code == 200
    dogs = dog_res.json()
    assert all(d["species"] == "dog" for d in dogs)
    print(f"9.2 Filtrování podle druhu (nalezeno {len(dogs)} psů) - OK")

    # 9.3 Vytvoření nového testovacího mazlíčka
    new_pet_payload = {
        "name": "Barnabáš",
        "species": "rabbit",
        "breed": "Beraní králík",
        "birth_date": "2023-05-10",
        "gender": "male",
        "is_neutered": True,
        "color": "Hnědo-bílá",
        "microchip_number": "203098100999999",
        "passport_number": "CZ 999999",
        "dietary_needs": "Luční seno neomezeně, ráno miska čerstvé zeleniny, granule pro králíky.",
        "allergies_and_intolerances": "Zákaz ledového salátu (nadýmá) a sladkostí!",
        "vet_name": "MVDr. Králíková",
        "vet_clinic": "Exotická klinika Hůrka",
        "vet_phone": "+420 777 999 111",
        "emergency_vet_phone": "+420 222 333 444",
        "emergency_vet_clinic": "VET24 Nonstop",
        "initial_weight_kg": 2.1
    }
    create_pet_res = client.post("/api/v1/pets", json=new_pet_payload, headers=headers)
    assert create_pet_res.status_code == 201, f"Create pet failed: {create_pet_res.text}"
    created_pet = create_pet_res.json()
    test_pet_id = created_pet["id"]
    assert created_pet["name"] == "Barnabáš"
    assert created_pet["latest_weight_kg"] == 2.1
    print(f"9.3 Založení profilu mazlíčka: '{created_pet['name']}' ({created_pet['age_formatted']}) - OK")

    # 9.4 Záznam krmení ("Nakrmeno dnes")
    feed_res = client.post(f"/api/v1/pets/{test_pet_id}/feed", headers=headers)
    assert feed_res.status_code == 200
    fed_data = feed_res.json()
    assert fed_data["last_fed_at"] is not None
    assert fed_data["last_fed_by_name"] is not None
    print(f"9.4 Rodinné krmení: '{fed_data['name']}' nakrmen(a) uživatelem '{fed_data['last_fed_by_name']}' - OK")

    # 9.5 Lékařský záznam & Očkování
    med_record_payload = {
        "record_type": "vaccination",
        "title": "Očkování proti moru a myxomatóze králíků (Pestorin Mormyx)",
        "performed_date": "2026-03-01",
        "valid_until": "2027-03-01",
        "veterinarian": "MVDr. Králíková"
    }
    med_res = client.post(f"/api/v1/pets/{test_pet_id}/medical", json=med_record_payload, headers=headers)
    assert med_res.status_code == 200
    print(f"9.5 Lékařský záznam a očkování ({med_record_payload['title']}) - OK")

    # 9.6 Předepsání léku
    medication_payload = {
        "name": "RodentiCare vitamíny",
        "dosage": "5 kapek do vody",
        "frequency": "1x denně",
        "is_active": True
    }
    med_post_res = client.post(f"/api/v1/pets/{test_pet_id}/medications", json=medication_payload, headers=headers)
    assert med_post_res.status_code == 200
    print("9.6 Předepsání léků / vitamínů - OK")

    # 9.7 Záznam váhy
    weight_res = client.post(f"/api/v1/pets/{test_pet_id}/weight", json={"weight_kg": 2.25, "recorded_date": "2026-09-05", "notes": "Kontrolní vážení"}, headers=headers)
    assert weight_res.status_code == 200
    print("9.7 Záznam váhy a historie růstu - OK")

    # 9.8 Plánování a splnění úkolu
    pet_task_res = client.post(f"/api/v1/pets/{test_pet_id}/tasks", json={"task_type": "grooming", "title": "Vyčesání línající srsti", "due_date": "2026-09-10", "interval_days": 14}, headers=headers)
    assert pet_task_res.status_code == 200
    pet_task_id = pet_task_res.json()["id"]

    comp_task_res = client.post(f"/api/v1/pets/{test_pet_id}/complete-task/{pet_task_id}", headers=headers)
    assert comp_task_res.status_code == 200
    print("9.8 Plán péče: Vytvoření a splnění úkolu - OK")

    # 9.9 Deník zážitků
    pet_log_res = client.post(f"/api/v1/pets/{test_pet_id}/logs", json={"entry_type": "milestone", "title": "Běhání ve výběhu na zahradě", "notes": "Poprvé na čerstvé trávě."}, headers=headers)
    assert pet_log_res.status_code == 200
    print("9.9 Deník a fotodokumentace mazlíčka - OK")

    # 9.10 Předávací protokol pro hlídání (Pet Sitter)
    sitter_res = client.get(f"/api/v1/pets/{test_pet_id}/sitter-profile", headers=headers)
    assert sitter_res.status_code == 200
    sitter_profile = sitter_res.json()
    assert sitter_profile["name"] == "Barnabáš"
    print("9.10 Předávací protokol Pet Sitter (režim dovolená) - OK")

    # 9.11 SOS Leták ztraceného mazlíčka
    sos_res = client.get(f"/api/v1/pets/{test_pet_id}/sos-flyer", headers=headers)
    assert sos_res.status_code == 200
    sos_data = sos_res.json()
    assert sos_data["microchip_number"] == "203098100999999"
    print("9.11 SOS Leták při ztrátě mazlíčka - OK")

    # 9.12 Propojení s nákupním seznamem
    shop_supply_res = client.post(f"/api/v1/pets/{test_pet_id}/add-supply-to-shopping?item_name=Luční seno 2kg&amount=1&unit=balení", headers=headers)
    assert shop_supply_res.status_code == 200
    created_supply_shop_id = shop_supply_res.json()["shopping_item_id"]
    client.delete(f"/api/v1/shopping/{created_supply_shop_id}", headers=headers)
    print("9.12 Propojení mazlíčka s rodinným Nákupním seznamem - OK")

    # 9.13 Smazání testovacího mazlíčka
    del_pet_res = client.delete(f"/api/v1/pets/{test_pet_id}", headers=headers)
    assert del_pet_res.status_code == 200
    print("9.13 Úklid testovacího mazlíčka - OK")

    # === 10. TESTY MODULU: DOMÁCÍ PRÁCE A ÚKLID (CHORES TRACKER) ===
    print("\n=== TESTY MODULU: DOMÁCÍ PRÁCE A ÚKLID ===")

    # 10.1 Seznam úkolů
    chores_res = client.get("/api/v1/chores", headers=headers)
    assert chores_res.status_code == 200, f"Chores list failed: {chores_res.text}"
    chores_list = chores_res.json()
    assert len(chores_list) >= 8, f"Expected at least 8 seeded chores, got {len(chores_list)}"
    print(f"10.1 Výpis domácích prací (načteno {len(chores_list)} úkolů s rotací a termíny) - OK")

    # 10.2 Vytvoření nového rotujícího úkolu
    new_chore_payload = {
        "title": "Vytřít terasu a vyčistit zahradní gril",
        "description": "Omýt rošt grilu a zamést dlažbu na terase.",
        "room": "garden",
        "category": "routine",
        "frequency": "weekly",
        "interval_days": 7,
        "points": 25,
        "estimated_minutes": 20,
        "is_rotation_enabled": True,
        "rotation_member_ids": [1, 2, 3],
        "current_assignee_id": 1,
        "cleaning_supplies_needed": "Čistič grilu a kartáč Weber"
    }
    create_chore_res = client.post("/api/v1/chores", json=new_chore_payload, headers=headers)
    assert create_chore_res.status_code == 201, f"Create chore failed: {create_chore_res.text}"
    created_chore = create_chore_res.json()
    test_chore_id = created_chore["id"]
    assert created_chore["points"] == 25
    assert created_chore["current_assignee_id"] == 1
    print(f"10.2 Vytvoření nového rotujícího úkolu: '{created_chore['title']}' (+{created_chore['points']} b.) - OK")

    # 10.3 Splnění úkolu, ověření bodů a posunu rotace
    comp_res = client.post(f"/api/v1/chores/{test_chore_id}/complete", json={"notes": "Gril je nablýskaný"}, headers=headers)
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert comp_data["last_completed_at"] is not None
    # Rotation: [1, 2, 3] -> was 1, should now be 2
    assert comp_data["current_assignee_id"] == 2, f"Expected next assignee 2, got {comp_data['current_assignee_id']}"
    print(f"10.3 Splnění úkolu ('Splněno mnou'): Posun rotace na člena ID {comp_data['current_assignee_id']} - OK")

    # 10.4 Ruční předání úkolu (Reassign)
    reassign_res = client.post(f"/api/v1/chores/{test_chore_id}/reassign", json={"new_assignee_id": 3}, headers=headers)
    assert reassign_res.status_code == 200
    assert reassign_res.json()["current_assignee_id"] == 3
    print("10.4 Ruční předání úkolu jinému členovi (Reassign na člena ID 3) - OK")

    # 10.5 Rodinný žebříček a body
    lb_res = client.get("/api/v1/chores/leaderboard", headers=headers)
    assert lb_res.status_code == 200
    leaderboard = lb_res.json()
    assert len(leaderboard) >= 2
    top_user = leaderboard[0]
    print(f"10.5 Rodinný žebříček (Síň slávy): 1. místo '{top_user['display_name']}' se {top_user['weekly_points']} b. tento týden - OK")

    # 10.6 Bleskový úklid (Panic Mode Tasks)
    panic_res = client.get("/api/v1/chores/panic-mode-tasks", headers=headers)
    assert panic_res.status_code == 200
    panic_tasks = panic_res.json()
    assert len(panic_tasks) >= 4
    print(f"10.6 Panic Mode (vygenerováno {len(panic_tasks)} bleskových úkolů pro 15min sprint) - OK")

    # 10.7 Obchod s odměnami a uplatnění za body
    rewards_res = client.get("/api/v1/chores/rewards", headers=headers)
    assert rewards_res.status_code == 200
    rewards_list = rewards_res.json()
    assert len(rewards_list) >= 4

    # Find a reward affordable with current points, or create a 0-pt test reward
    test_reward_id = rewards_list[0]["id"]
    redeem_res = client.post(f"/api/v1/chores/rewards/{test_reward_id}/redeem", headers=headers)
    if redeem_res.status_code == 400:
        cheap_res = client.post("/api/v1/chores/rewards", json={"title": "Test miniodměna", "cost_points": 0}, headers=headers)
        test_reward_id = cheap_res.json()["id"]
        redeem_res = client.post(f"/api/v1/chores/rewards/{test_reward_id}/redeem", headers=headers)

    assert redeem_res.status_code == 200
    redeem_data = redeem_res.json()
    print(f"10.7 Obchod s odměnami (úspěšně uplatněna odměna za {redeem_data['points_spent']} b.) - OK")

    # 10.8 Propojení s nákupním seznamem
    supply_res = client.post(f"/api/v1/chores/{test_chore_id}/add-supply-to-shopping", headers=headers)
    assert supply_res.status_code == 200
    supply_shop_id = supply_res.json()["shopping_item_id"]
    client.delete(f"/api/v1/shopping/{supply_shop_id}", headers=headers)
    print("10.8 Propojení s rodinným nákupem ('Čisticí prostředky do nákupu') - OK")

    # 10.9 Úklid testovacího úkolu
    del_chore_res = client.delete(f"/api/v1/chores/{test_chore_id}", headers=headers)
    assert del_chore_res.status_code == 200
    print("10.9 Úklid testovacího úkolu - OK")

    # === 11. KONTROLA FRONTEND PRODUKČNÍHO SESTAVENÍ ===
    frontend_dist_index = os.path.join("..", "frontend", "dist", "index.html")
    assert os.path.exists(frontend_dist_index), f"Frontend build dist not found at {frontend_dist_index}"
    print("\n11. Frontend produkční sestavení (Vite dist index.html) - OK")

    # === 12. MODUL RODINNÉ FINANCE A ROZPOČET ===
    print("\n--- TESTOVÁNÍ MODULU RODINNÉ FINANCE ---")

    current_user_data = client.get("/api/v1/auth/me", headers=headers).json()
    user_id = current_user_data["id"]

    # 12.1 Měsíční přehled rozpočtu, obálková metoda a dlouhodobý průměr
    summary_res = client.get("/api/v1/finance/summary", headers=headers)
    assert summary_res.status_code == 200
    summary_data = summary_res.json()
    assert "total_income" in summary_data
    assert "total_expense" in summary_data
    assert "all_months_average_expense" in summary_data
    assert summary_data["distinct_months_count"] >= 3, f"Expected >= 3 seeded months, got {summary_data['distinct_months_count']}"
    assert summary_data["all_months_average_expense"] > 0
    assert len(summary_data["categories"]) >= 5
    print(f"12.1 Měsíční souhrn a dlouhodobý průměr ({summary_data['all_months_average_expense']} Kč / měsíc z {summary_data['distinct_months_count']} měsíců) - OK")

    # 12.2 Vytvoření, aktualizace a smazání transakce
    new_tx = {
        "title": "Testovací nákup ovoce",
        "amount": 420.50,
        "transaction_type": "expense",
        "category": "groceries",
        "date": "2026-03-05",
        "payer_id": user_id,
        "is_shared": True,
        "split_type": "equal",
        "notes": "Jablka, banány a pomeranče"
    }
    create_tx_res = client.post("/api/v1/finance/transactions", json=new_tx, headers=headers)
    assert create_tx_res.status_code == 201
    created_tx = create_tx_res.json()
    test_tx_id = created_tx["id"]
    assert created_tx["title"] == "Testovací nákup ovoce"
    assert created_tx["amount"] == 420.50
    print("12.2 Vytvoření transakce - OK")

    # 12.3 Vyrovnání dluhů ("Kdo komu dluží?") a české SPAYD QR kódy
    settle_res = client.get("/api/v1/finance/settlement", headers=headers)
    assert settle_res.status_code == 200
    settle_data = settle_res.json()
    assert "balances" in settle_data
    assert "settlements" in settle_data
    if len(settle_data["settlements"]) > 0:
        first_transfer = settle_data["settlements"][0]
        assert "spayd_string" in first_transfer
        assert first_transfer["spayd_string"].startswith("SPD*1.0*ACC:")
        assert "*AM:" in first_transfer["spayd_string"]
        assert "*CC:CZK" in first_transfer["spayd_string"]
        print(f"12.3 Výpočet vyrovnání dluhů a validace SPAYD QR stringu ({first_transfer['from_user_name']} -> {first_transfer['to_user_name']} {first_transfer['amount']} Kč) - OK")
    else:
        print("12.3 Výpočet vyrovnání dluhů (aktuálně vše vyrovnáno) - OK")

    # 12.4 Správa fixních plateb a předplatných
    new_sub = {
        "name": "Testovací předplatné Cloud",
        "amount": 299.0,
        "billing_cycle": "monthly",
        "next_billing_date": "2026-03-25",
        "category": "utilities",
        "payer_id": user_id
    }
    create_sub_res = client.post("/api/v1/finance/subscriptions", json=new_sub, headers=headers)
    assert create_sub_res.status_code == 201
    created_sub = create_sub_res.json()
    test_sub_id = created_sub["id"]
    assert created_sub["monthly_equivalent"] == 299.0
    print("12.4 Sledování předplatných a fixních plateb - OK")

    # 12.5 Spořicí cíle a vklad úspor (prasátko)
    new_goal = {
        "title": "Nový 4K Monitor",
        "target_amount": 10000.0,
        "current_amount": 2000.0,
        "icon": "Laptop",
        "color": "#3b82f6"
    }
    create_goal_res = client.post("/api/v1/finance/goals", json=new_goal, headers=headers)
    assert create_goal_res.status_code == 201
    created_goal = create_goal_res.json()
    test_goal_id = created_goal["id"]
    assert created_goal["progress_percentage"] == 20.0

    # Přidat úsporu do cíle
    add_sav_res = client.post(f"/api/v1/finance/goals/{test_goal_id}/add-savings", json={"amount": 3000.0}, headers=headers)
    assert add_sav_res.status_code == 200
    updated_goal = add_sav_res.json()
    assert updated_goal["current_amount"] == 5000.0
    assert updated_goal["progress_percentage"] == 50.0
    print("12.5 Spořicí cíle, prasátka a vklad úspor - OK")

    # 12.6 Import bankovního výpisu (CSV)
    csv_content = (
        "Datum;Objem;Měna;Název protiúčtu;Zpráva pro příjemce\n"
        "01.03.2026;-850,50;CZK;Albert Supermarket;Nákup potravin\n"
        "02.03.2026;-1200,00;CZK;Benzina Orlen;Tankování nafty\n"
        "03.03.2026;35000,00;CZK;Zaměstnavatel a.s.;Výplata únor\n"
    )
    import_preview_res = client.post(
        "/api/v1/finance/import/preview",
        files={"file": ("vypis.csv", csv_content.encode("utf-8"), "text/csv")},
        headers=headers
    )
    assert import_preview_res.status_code == 200
    preview_data = import_preview_res.json()
    assert preview_data["total_count"] == 3
    assert preview_data["total_income"] == 35000.0
    assert preview_data["total_expense"] == 2050.50
    assert preview_data["rows"][0]["category"] == "groceries"
    assert preview_data["rows"][1]["category"] == "transport"

    confirm_import_res = client.post(
        "/api/v1/finance/import/confirm",
        json={"rows": preview_data["rows"], "payer_id": user_id, "is_shared": True},
        headers=headers
    )
    assert confirm_import_res.status_code == 200
    assert confirm_import_res.json()["imported_count"] == 3
    print("12.6 Import bankovního výpisu (CSV) s auto-kategorizací - OK")

    # 12.7 Bankovní profil uživatele (Číslo účtu a IBAN)
    profile_update = {
        "bank_account": "123456789/0800"
    }
    update_prof_res = client.put("/api/v1/finance/profile", json=profile_update, headers=headers)
    assert update_prof_res.status_code == 200
    prof_data = update_prof_res.json()
    assert prof_data["bank_account"] == "123456789/0800"
    assert prof_data["iban"] is not None and prof_data["iban"].startswith("CZ")
    print(f"12.7 Bankovní profil uživatele a generování IBAN ({prof_data['iban']}) - OK")

    # 12.8 Úklid testovacích záznamů
    client.delete(f"/api/v1/finance/transactions/{test_tx_id}", headers=headers)
    client.delete(f"/api/v1/finance/subscriptions/{test_sub_id}", headers=headers)
    client.delete(f"/api/v1/finance/goals/{test_goal_id}", headers=headers)
    print("12.8 Úklid testovacích dat financí - OK")

    # ==========================================
    # 13. DIGITÁLNÍ ARCHIV, ŠANONY A TREZOR (DOCUMENTS & VAULT)
    # ==========================================
    print("\n--- TESTOVÁNÍ MODULU DIGITÁLNÍ ARCHIV A ŠANON ---")

    # 13.1 Statistiky dokumentů a načtení seznamu
    doc_stats_res = client.get("/api/v1/documents/stats", headers=headers)
    assert doc_stats_res.status_code == 200
    doc_stats = doc_stats_res.json()
    assert doc_stats["total_documents"] >= 10
    assert "warranty" in doc_stats["categories"]
    assert doc_stats["vault_count"] >= 2
    print(f"13.1 Statistiky archivu ({doc_stats['total_documents']} dokumentů, {doc_stats['vault_count']} v trezoru) - OK")

    # 13.2 Filtrování zamčeného trezoru a ověření PIN kódu
    locked_docs_res = client.get("/api/v1/documents?vault_unlocked=false", headers=headers)
    assert locked_docs_res.status_code == 200
    locked_docs = locked_docs_res.json()
    assert all(not d["is_vault_protected"] for d in locked_docs), "V zamčeném trezoru nesmí být citlivé dokumenty"

    # Chybný PIN
    bad_pin_res = client.post("/api/v1/documents/vault/verify", json={"pin": "9999"}, headers=headers)
    assert bad_pin_res.status_code == 401

    # Správný PIN (výchozí 1234)
    good_pin_res = client.post("/api/v1/documents/vault/verify", json={"pin": "1234"}, headers=headers)
    assert good_pin_res.status_code == 200
    assert good_pin_res.json()["status"] == "success"

    # Odemčený trezor
    unlocked_docs_res = client.get("/api/v1/documents?vault_unlocked=true", headers=headers)
    assert unlocked_docs_res.status_code == 200
    unlocked_docs = unlocked_docs_res.json()
    assert any(d["is_vault_protected"] for d in unlocked_docs), "V odemčeném trezoru musí být i citlivé dokumenty"
    print("13.2 Zabezpečení digitálního trezoru a PIN ověření (1234) - OK")

    # 13.3 Nahrání souboru (Upload)
    sample_file_bytes = b"%PDF-1.4 Testovaci PDF faktura Hestia\n"
    upload_res = client.post(
        "/api/v1/documents/upload?auto_analyze=false",
        files={"file": ("faktura_test.pdf", sample_file_bytes, "application/pdf")},
        headers=headers
    )
    assert upload_res.status_code == 200
    upload_data = upload_res.json()
    assert "file_path" in upload_data
    assert upload_data["file_name"] == "faktura_test.pdf"
    print("13.3 Nahrání souboru do archivu (upload) - OK")

    # 13.4 Vytvoření nového dokumentu v archivu
    new_doc_payload = {
        "title": "Faktura a záruka Alza Robotický vysavač",
        "category": "warranty",
        "file_path": upload_data["file_path"],
        "file_name": upload_data["file_name"],
        "file_size": upload_data["file_size"],
        "file_type": upload_data["file_type"],
        "issuer": "Alza.cz a.s.",
        "document_date": "2026-03-01",
        "expiry_date": "2028-03-01",
        "warranty_months": 24,
        "contract_number": "ALZ-998877",
        "amount": 12990.0,
        "physical_location": "Šanon 1 (Zelený) - horní police",
        "is_vault_protected": False,
        "tags": "spotřebič, elektronika, alza",
        "summary": "Záruční list k vysavači s 2letou zárukou."
    }
    create_doc_res = client.post("/api/v1/documents", json=new_doc_payload, headers=headers)
    assert create_doc_res.status_code in [200, 201]
    created_doc = create_doc_res.json()
    test_doc_id = created_doc["id"]
    assert created_doc["title"] == new_doc_payload["title"]
    assert created_doc["status"] == "active"
    assert created_doc["days_until_expiry"] is not None and created_doc["days_until_expiry"] > 0
    print(f"13.4 Vytvoření záznamu s hlídačem záruky (zbývá {created_doc['days_until_expiry']} dní) - OK")

    # 13.5 Vyhledávání a filtrace
    search_res = client.get("/api/v1/documents?search=vysavač", headers=headers)
    assert search_res.status_code == 200
    assert any(d["id"] == test_doc_id for d in search_res.json())

    cat_res = client.get("/api/v1/documents?category=warranty", headers=headers)
    assert cat_res.status_code == 200
    assert any(d["id"] == test_doc_id for d in cat_res.json())
    print("13.5 Vyhledávání full-textem a filtrace podle šanonu - OK")

    # 13.6 Úprava dokumentu
    update_res = client.put(
        f"/api/v1/documents/{test_doc_id}",
        json={"physical_location": "Šanon 2 (Modrý) - nová přihrádka"},
        headers=headers
    )
    assert update_res.status_code == 200
    assert update_res.json()["physical_location"] == "Šanon 2 (Modrý) - nová přihrádka"
    print("13.6 Aktualizace umístění originálu v domácnosti - OK")

    # 13.7 Smazání testovacího dokumentu
    del_res = client.delete(f"/api/v1/documents/{test_doc_id}", headers=headers)
    assert del_res.status_code == 200
    print("13.7 Smazání testovacího dokumentu - OK")

    print("\n[SUCCESS] VŠECHNY TESTY ÚSPĚŠNĚ PROŠLY! HESTIA JE PLNĚ PŘIPRAVENA VČETNĚ VŠECH MODULŮ (RECEPTY, KVĚTINY, MAZLÍČCI, DOMÁCÍ PRÁCE, FINANCE, DOKUMENTY & ŠANONY).")

if __name__ == "__main__":
    run_tests()

