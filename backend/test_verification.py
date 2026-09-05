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

    # 10. Check Frontend Build
    frontend_dist_index = os.path.join("..", "frontend", "dist", "index.html")
    assert os.path.exists(frontend_dist_index), f"Frontend build dist not found at {frontend_dist_index}"
    print("10. Frontend produkční sestavení (Vite dist index.html) - OK")

    print("\n[SUCCESS] VŠECHNY TESTY ÚSPĚŠNĚ PROŠLY! HESTIA JE PLNĚ PŘIPRAVENA VČETNĚ MODULŮ RECEPTŮ, KVĚTIN I MAZLÍČKŮ.")

if __name__ == "__main__":
    run_tests()

