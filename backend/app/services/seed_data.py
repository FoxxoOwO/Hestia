from sqlalchemy.orm import Session
from app.models.user import User
from app.models.recipe import Recipe
from app.models.pantry import PantryItem
from app.models.shopping import ShoppingItem
from app.models.plant import Plant, PlantTask, PlantLogEntry
from app.models.pet import Pet, PetMedicalRecord, PetMedication, PetWeightLog, PetTask, PetLogEntry
from app.models.chore import Chore, ChoreCompletion, ChoreReward, ChoreRewardRedemption
from app.models.finance import FinanceTransaction, CategoryBudget, Subscription, SavingsGoal, UserFinanceProfile
from app.models.document import Document, VaultSetting
from app.models.vehicle import Vehicle, VehicleRefueling, VehicleServiceRecord
from app.models.medicine import Medicine, MedicationSchedule, MedicationLog
from app.config import settings
import os
from app.utils.auth import get_password_hash
import datetime
import json

def seed_initial_data(db: Session):
    today = datetime.date.today()
    admin_user = None

    # 1. Create Default Users if none exist
    if db.query(User).count() == 0:
        admin_user = User(
            username="admin",
            display_name="Správce Domácnosti",
            email="admin@hestia.home",
            hashed_password=get_password_hash("hestia123"),
            role="admin",
            avatar_color="#f97316", # Orange
            preferred_language="cs",
            preferred_theme="system",
            is_active=True
        )
        user_anna = User(
            username="anna",
            display_name="Anna",
            email="anna@hestia.home",
            hashed_password=get_password_hash("hestia123"),
            role="member",
            avatar_color="#ec4899", # Pink
            preferred_language="cs",
            preferred_theme="dark",
            is_active=True
        )
        user_petr = User(
            username="petr",
            display_name="Petr",
            email="petr@hestia.home",
            hashed_password=get_password_hash("hestia123"),
            role="member",
            avatar_color="#3b82f6", # Blue
            preferred_language="en",
            preferred_theme="light",
            is_active=True
        )
        db.add_all([admin_user, user_anna, user_petr])
        db.commit()

    admin_user = db.query(User).filter(User.role == "admin").first() or db.query(User).first()
    user_anna = db.query(User).filter(User.username == "anna").first() or admin_user
    user_petr = db.query(User).filter(User.username == "petr").first() or admin_user

    # 2. Create Pantry Items (Some fresh, some expiring soon)
    today = datetime.date.today()
    pantry_items = [
        PantryItem(
            name="Mléko plnotučné",
            category="fridge",
            quantity=2.0,
            unit="l",
            expiration_date=(today + datetime.timedelta(days=2)).isoformat(),
            min_quantity=1.0,
            note="Čerstvé z farmy"
        ),
        PantryItem(
            name="Vejce",
            category="fridge",
            quantity=10.0,
            unit="ks",
            expiration_date=(today + datetime.timedelta(days=12)).isoformat(),
            min_quantity=6.0,
            note="Velikost M"
        ),
        PantryItem(
            name="Máslo",
            category="fridge",
            quantity=250.0,
            unit="g",
            expiration_date=(today + datetime.timedelta(days=14)).isoformat(),
            min_quantity=125.0
        ),
        PantryItem(
            name="Smetana ke šlehání 33%",
            category="fridge",
            quantity=200.0,
            unit="ml",
            expiration_date=(today + datetime.timedelta(days=1)).isoformat(),
            min_quantity=200.0,
            note="Brzy spotřebovat!"
        ),
        PantryItem(
            name="Špagety",
            category="pantry",
            quantity=1000.0,
            unit="g",
            expiration_date=(today + datetime.timedelta(days=365)).isoformat(),
            min_quantity=500.0
        ),
        PantryItem(
            name="Hladká mouka",
            category="pantry",
            quantity=2000.0,
            unit="g",
            expiration_date=(today + datetime.timedelta(days=200)).isoformat(),
            min_quantity=1000.0
        ),
        PantryItem(
            name="Cibule",
            category="produce",
            quantity=5.0,
            unit="ks",
            expiration_date=(today + datetime.timedelta(days=20)).isoformat(),
            min_quantity=3.0
        ),
        PantryItem(
            name="Česnek",
            category="produce",
            quantity=1.0,
            unit="palička",
            expiration_date=(today + datetime.timedelta(days=25)).isoformat(),
            min_quantity=1.0
        ),
        PantryItem(
            name="Olivový olej",
            category="pantry",
            quantity=750.0,
            unit="ml",
            expiration_date=(today + datetime.timedelta(days=300)).isoformat(),
            min_quantity=200.0,
            note="Extra panenský"
        ),
        PantryItem(
            name="Parmazán (Parmigiano Reggiano)",
            category="fridge",
            quantity=150.0,
            unit="g",
            expiration_date=(today + datetime.timedelta(days=30)).isoformat(),
            min_quantity=50.0
        ),
        PantryItem(
            name="Pancetta / Anglická slanina",
            category="fridge",
            quantity=200.0,
            unit="g",
            expiration_date=(today + datetime.timedelta(days=5)).isoformat(),
            min_quantity=100.0
        ),
        PantryItem(
            name="Kuřecí prsa",
            category="fridge",
            quantity=600.0,
            unit="g",
            expiration_date=(today + datetime.timedelta(days=2)).isoformat(),
            min_quantity=500.0
        ),
        PantryItem(
            name="Jasmínová rýže",
            category="pantry",
            quantity=1000.0,
            unit="g",
            expiration_date=(today + datetime.timedelta(days=400)).isoformat(),
            min_quantity=500.0
        ),
        PantryItem(
            name="Kokosové mléko",
            category="pantry",
            quantity=400.0,
            unit="ml",
            expiration_date=(today + datetime.timedelta(days=180)).isoformat(),
            min_quantity=1.0
        ),
        PantryItem(
            name="Žlutá kari pasta",
            category="fridge",
            quantity=100.0,
            unit="g",
            expiration_date=(today + datetime.timedelta(days=90)).isoformat(),
            min_quantity=50.0
        )
    ]
    db.add_all(pantry_items)
    db.commit()

    # 3. Create Rich Recipes
    recipes = [
        Recipe(
            title="Tradiční italské Spaghetti Carbonara",
            description="Autentické římské těstoviny se žloutky, křupavou slaninou a sýrem Pecorino nebo Parmazánem bez kapky smetany.",
            image_url="https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=1000&q=80",
            prep_time_minutes=10,
            cook_time_minutes=15,
            difficulty="easy",
            price_level="medium",
            default_servings=4,
            tags=["Těstoviny", "Rychlovka", "Italská kuchyně", "Oběd", "Večeře"],
            utensils=["Velký hrnec na těstoviny", "Hluboká pánev", "Miska na promíchání žloutků", "Struhadlo na sýr", "Kleště na těstoviny"],
            ingredients=[
                {"name": "Špagety", "amount": 400.0, "unit": "g", "note": "kvalitní semolinové", "category": "pantry"},
                {"name": "Pancetta / Anglická slanina", "amount": 150.0, "unit": "g", "note": "nakrájená na nudličky", "category": "meat"},
                {"name": "Vejce", "amount": 4.0, "unit": "ks", "note": "3 žloutky a 1 celé vejce", "category": "dairy"},
                {"name": "Parmazán (Parmigiano Reggiano)", "amount": 80.0, "unit": "g", "note": "najemno nastrouhaný", "category": "dairy"},
                {"name": "Černý pepř", "amount": 1.0, "unit": "lžička", "note": "čerstvě namletý", "category": "spices"},
                {"name": "Sůl", "amount": 1.0, "unit": "lžíce", "note": "do vody na těstoviny", "category": "spices"}
            ],
            instructions=[
                {"step": 1, "text": "Ve velkém hrnci přiveďte k varu dostatek osolené vody a dejte vařit špagety na skus (al dente).", "timer_minutes": 8},
                {"step": 2, "text": "Na studenou pánev dejte nakrájenou pancettu a pomalu ji opečte dokřupava, aby pustila tuk. Pánev stáhněte z ohně.", "timer_minutes": 6},
                {"step": 3, "text": "V misce prošlehejte 3 žloutky a 1 celé vejce se strouhaným parmazánem a štědrou dávkou čerstvě namletého pepře.", "timer_minutes": 2},
                {"step": 4, "text": "Uvařené špagety kleštěmi přendejte přímo do pánve se slaninou. Přilijte cca 1 sběračku horké škrobové vody z těstovin a promíchejte.", "timer_minutes": 1},
                {"step": 5, "text": "Když pánev mírně zchladne (nesmí se vařit, aby se vejce nesrazila na míchaná), vlijte vaječnou směs a intenzivně míchejte, dokud nevznikne hedvábná krémová omáčka.", "timer_minutes": 2},
                {"step": 6, "text": "Ihned podávejte posypané extra parmazánem a čerstvým pepřem.", "timer_minutes": None}
            ],
            is_favorite=True,
            created_by_id=admin_user.id
        ),
        Recipe(
            title="Rychlé kuřecí kari s kokosovým mlékem a rýží",
            description="Voňavé, krémové a lehce pikantní kari hotové za půl hodiny. Skvělé rodinné jídlo pro všední dny.",
            image_url="https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=1000&q=80",
            prep_time_minutes=15,
            cook_time_minutes=20,
            difficulty="easy",
            price_level="medium",
            default_servings=4,
            tags=["Drůbež", "Kari", "Asijská kuchyně", "Bezlepkové", "Hlavní chod"],
            utensils=["Hluboká pánev wok", "Prkénko a nůž", "Hrnec na rýži", "Vařečka"],
            ingredients=[
                {"name": "Kuřecí prsa", "amount": 500.0, "unit": "g", "note": "nakrájená na sousta", "category": "meat"},
                {"name": "Kokosové mléko", "amount": 400.0, "unit": "ml", "note": "1 plechovka", "category": "pantry"},
                {"name": "Žlutá kari pasta", "amount": 2.0, "unit": "lžíce", "note": "podle chuti", "category": "pantry"},
                {"name": "Cibule", "amount": 1.0, "unit": "ks", "note": "nakrájená na půlměsíčky", "category": "produce"},
                {"name": "Česnek", "amount": 2.0, "unit": "stroužek", "note": "nasekaný", "category": "produce"},
                {"name": "Jasmínová rýže", "amount": 300.0, "unit": "g", "note": "jako příloha", "category": "pantry"},
                {"name": "Olivový olej", "amount": 2.0, "unit": "lžíce", "note": "na smažení", "category": "pantry"}
            ],
            instructions=[
                {"step": 1, "text": "V hrnci propláchněte rýži a dejte ji vařit v 1.5 násobku osolené vody doměkka.", "timer_minutes": 15},
                {"step": 2, "text": "Ve woku rozehřejte olej, přidejte nasekanou cibuli a opékejte 3 minuty dozlatova.", "timer_minutes": 3},
                {"step": 3, "text": "Přidejte nasekaný česnek a kari pastu, míchejte cca 1 minutu, až se krásně rozvoní.", "timer_minutes": 1},
                {"step": 4, "text": "Přidejte kuřecí maso a zprudka opečte ze všech stran, aby se zatáhlo.", "timer_minutes": 5},
                {"step": 5, "text": "Zalijte kokosovým mlékem, promíchejte a nechte na mírném ohni probublávat 10 minut, dokud není kuře propečené a omáčka hustá.", "timer_minutes": 10},
                {"step": 6, "text": "Ochutnejte, případně dosolte a podávejte s horkou jasmínovou rýží.", "timer_minutes": None}
            ],
            is_favorite=True,
            created_by_id=user_anna.id
        ),
        Recipe(
            title="Nadýchané ranní lívance s ovocem",
            description="Zlatavé, jemné a nadýchané lívance pro dokonalou víkendovou rodinnou snídani.",
            image_url="https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=1000&q=80",
            prep_time_minutes=10,
            cook_time_minutes=15,
            difficulty="easy",
            price_level="low",
            default_servings=4,
            tags=["Snídaně", "Sladké", "Dezerty", "Vegetariánské", "Pro děti"],
            utensils=["Pánev na lívance / nepřilnavá pánev", "Mísa", "Metlička na šlehání", "Obracečka"],
            ingredients=[
                {"name": "Hladká mouka", "amount": 200.0, "unit": "g", "note": "prosátá", "category": "pantry"},
                {"name": "Mléko plnotučné", "amount": 250.0, "unit": "ml", "note": "vlažné", "category": "dairy"},
                {"name": "Vejce", "amount": 2.0, "unit": "ks", "note": "pokojové teploty", "category": "dairy"},
                {"name": "Máslo", "amount": 30.0, "unit": "g", "note": "rozpuštěné", "category": "dairy"},
                {"name": "Cukr krystal", "amount": 2.0, "unit": "lžíce", "note": "nebo třtinový", "category": "pantry"},
                {"name": "Kypřicí prášek", "amount": 1.0, "unit": "balení", "note": "12 g", "category": "pantry"},
                {"name": "Špetka soli", "amount": 1.0, "unit": "špetka", "note": "pro zvýraznění chuti", "category": "spices"}
            ],
            instructions=[
                {"step": 1, "text": "V míse smíchejte prosátou mouku s kypřicím práškem, cukrem a špetkou soli.", "timer_minutes": 2},
                {"step": 2, "text": "V jiné nádobě prošlehejte mléko, vejce a rozpuštěné vlažné máslo.", "timer_minutes": 2},
                {"step": 3, "text": "Tekuté suroviny vlijte do suchých a metličkou vymíchejte hladké hustší těsto.", "timer_minutes": 2},
                {"step": 4, "text": "Pánev lehce potřete máslem a na středním ohni smažte lívanečky z obou stran dozlatova (cca 2 minuty z každé strany).", "timer_minutes": 4},
                {"step": 5, "text": "Podávejte s tvarohem, javorovým sirupem a čerstvým ovocem.", "timer_minutes": None}
            ],
            is_favorite=False,
            created_by_id=user_petr.id
        )
    ]
    db.add_all(recipes)
    db.commit()

    # 4. Create Initial Shopping List Items
    shopping_items = [
        ShoppingItem(name="Sýr Pecorino Romano", amount=100.0, unit="g", category="dairy", is_checked=False),
        ShoppingItem(name="Čerstvá bazalka", amount=1.0, unit="květináč", category="produce", is_checked=False),
        ShoppingItem(name="Kvalitní káva v zrnu", amount=500.0, unit="g", category="beverages", is_checked=True)
    ]
    db.add_all(shopping_items)
    db.commit()

    # 5. Create Sample Plants if none exist
    if db.query(Plant).count() == 0:
        first_user = db.query(User).first()
        admin_id = first_user.id if first_user else None

        plant_monstera = Plant(
            name="Monstera v obýváku",
            species_latin="Monstera deliciosa",
            species_czech="Monstera skvostná",
            room="living_room",
            light_requirement="bright_indirect",
            watering_interval_days=7,
            winter_watering_interval_days=14,
            fertilizing_interval_days=14,
            misting_required=True,
            pot_diameter_cm=24.0,
            substrate_type="Vzdušný aroidní mix (perlit, piniová kůra, rašelina)",
            pet_toxicity="toxic",
            pet_toxicity_notes="Obsahuje nerozpustné šťavelany vápenaté. Pro kočky a psy může způsobit podráždění tlamy a slinění. Umístěte mimo dosah zvířat!",
            primary_image_url="https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=1000&q=80",
            health_status="healthy",
            health_notes="Krásný nový perforovaný list, vitální kořenový systém.",
            last_watered_date=(today - datetime.timedelta(days=5)).isoformat(),
            next_watering_date=(today + datetime.timedelta(days=2)).isoformat(),
            is_winter_mode=False,
            is_favorite=True,
            notes="Dárek k nastěhování do bytu.",
            created_by_id=admin_id
        )
        plant_spider = Plant(
            name="Zelenec na poličce",
            species_latin="Chlorophytum comosum",
            species_czech="Zelenec chocholatý",
            room="bedroom",
            light_requirement="semi_shade",
            watering_interval_days=5,
            winter_watering_interval_days=10,
            fertilizing_interval_days=21,
            misting_required=False,
            pot_diameter_cm=14.0,
            substrate_type="Klasický substrát pro pokojovky s perlitem",
            pet_toxicity="safe",
            pet_toxicity_notes="100% bezpečný pro kočky i psy (Pet Friendly). Skvěle filtruje vzduch v ložnici.",
            primary_image_url="https://images.unsplash.com/photo-1572688484438-313a6e50c333?auto=format&fit=crop&w=1000&q=80",
            health_status="healthy",
            last_watered_date=(today - datetime.timedelta(days=5)).isoformat(),
            next_watering_date=today.isoformat(),
            is_winter_mode=False,
            is_favorite=True
        )
        plant_anthurium = Plant(
            name="Červená toulitka",
            species_latin="Anthurium andreanum",
            species_czech="Toulitka Andréova",
            room="kitchen",
            light_requirement="bright_indirect",
            watering_interval_days=6,
            winter_watering_interval_days=12,
            fertilizing_interval_days=14,
            misting_required=True,
            pot_diameter_cm=16.0,
            substrate_type="Substrát pro orchideje a aroidy",
            pet_toxicity="toxic",
            pet_toxicity_notes="Toxická pro zvířata. Květy a listy dráždí sliznice.",
            primary_image_url="https://images.unsplash.com/photo-1598880940371-c756e015fea1?auto=format&fit=crop&w=1000&q=80",
            health_status="needs_attention",
            health_notes="Hnědnutí špiček – potřeba vyšší vzdušné vlhkosti a rosení.",
            last_watered_date=(today - datetime.timedelta(days=7)).isoformat(),
            next_watering_date=(today - datetime.timedelta(days=1)).isoformat(),
            is_winter_mode=False
        )
        plant_ficus = Plant(
            name="Fíkus Benjamín",
            species_latin="Ficus benjamina",
            species_czech="Fíkus drobnolistý",
            room="hallway",
            light_requirement="bright_indirect",
            watering_interval_days=7,
            winter_watering_interval_days=14,
            fertilizing_interval_days=14,
            misting_required=False,
            pot_diameter_cm=28.0,
            substrate_type="Výživný propustný substrát",
            pet_toxicity="mildly_toxic",
            pet_toxicity_notes="Mléčná míza může podráždit tlapky nebo žaludek zvířat.",
            primary_image_url="https://images.unsplash.com/photo-1597055181300-e3633a207518?auto=format&fit=crop&w=1000&q=80",
            health_status="healthy",
            last_watered_date=(today - datetime.timedelta(days=2)).isoformat(),
            next_watering_date=(today + datetime.timedelta(days=5)).isoformat(),
            is_winter_mode=False
        )

        db.add_all([plant_monstera, plant_spider, plant_anthurium, plant_ficus])
        db.commit()

        tasks = [
            PlantTask(plant_id=plant_monstera.id, task_type="water", due_date=(today + datetime.timedelta(days=2)).isoformat(), interval_days=7, notes="Zalít cca 400 ml odstáté vody"),
            PlantTask(plant_id=plant_monstera.id, task_type="mist", due_date=today.isoformat(), interval_days=2, notes="Orosit velké listy"),
            PlantTask(plant_id=plant_spider.id, task_type="water", due_date=today.isoformat(), interval_days=5, notes="Zkontrolovat vlhkost a zalít"),
            PlantTask(plant_id=plant_anthurium.id, task_type="water", due_date=(today - datetime.timedelta(days=1)).isoformat(), interval_days=6, notes="Zalít dešťovou nebo převařenou vodou"),
            PlantTask(plant_id=plant_ficus.id, task_type="fertilize", due_date=(today + datetime.timedelta(days=4)).isoformat(), interval_days=14, notes="Tekuté hnojivo na zelené rostliny")
        ]
        logs = [
            PlantLogEntry(plant_id=plant_monstera.id, entry_type="photo", image_url=plant_monstera.primary_image_url, title="První jarní list", notes="Rozvinul se nádherný nový list s 5 otvory."),
            PlantLogEntry(plant_id=plant_monstera.id, entry_type="repotting", title="Přesazení do terakotového květináče", notes="Přesazeno do směsi s piniovou kůrou a perlitem. Průměr 24 cm."),
            PlantLogEntry(plant_id=plant_anthurium.id, entry_type="ai_diagnosis", title="AI Diagnostika listů", notes="Zjištěna nízká vzdušná vlhkost. Doporučeno umístit zvlhčovač nebo pravidelně rosit.")
        ]
        db.add_all(tasks + logs)
        db.commit()

    # 5. Seed Pets if none exist
    if db.query(Pet).count() == 0:
        admin_id = admin_user.id if admin_user else 1

        pet_dog = Pet(
            name="Baddy",
            species="dog",
            breed="Zlatý retrívr (Golden Retriever)",
            birth_date="2021-04-12",
            gender="male",
            is_neutered=True,
            color="Zlatavá krémová",
            microchip_number="203098100123456",
            passport_number="CZ 123456",
            primary_image_url="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1000&q=80",
            dietary_needs="Superprémiové granule s jehněčím masem a rýží. Dávka 2x denně 180 g (v 7:30 a 18:00). Miluje sušené plíce a mrkev.",
            allergies_and_intolerances="Alergie na kuřecí bílkovinu (svědí uši). Zákaz čokolády, hroznů a vařených kostí!",
            vet_name="MVDr. Jan Novák",
            vet_clinic="Veterinární klinika U Lesa",
            vet_phone="+420 608 111 222",
            vet_address="Květinová 12, Praha",
            emergency_vet_phone="+420 222 333 444",
            emergency_vet_clinic="Veterinární pohotovost VET24 Nonstop",
            last_fed_at=(datetime.datetime.now() - datetime.timedelta(hours=3)).isoformat(),
            last_fed_by_name="Anna",
            is_favorite=True,
            notes="Velmi přátelský, miluje vodu a aportování tenisáku. Bojí se bouřky a ohňostrojů.",
            created_by_id=admin_id
        )

        pet_cat = Pet(
            name="Mia",
            species="cat",
            breed="Britská krátkosrstá kočka",
            birth_date="2022-09-01",
            gender="female",
            is_neutered=True,
            color="Modrá (stříbrno-šedá)",
            microchip_number="203098100654321",
            passport_number="CZ 654321",
            primary_image_url="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1000&q=80",
            dietary_needs="Bezobilné granule s lososem (ráno 40 g) + večer 1 kapsička s krůtím masem. Vždy čerstvá voda z fontánky.",
            allergies_and_intolerances="Nesnáší laktózu (běžné kravské mléko způsobuje průjem). Zákaz lilií – lilie jsou pro kočky smrtelně jedovaté!",
            vet_name="MVDr. Petra Černá",
            vet_clinic="Kočičí klinika KočkaVET",
            vet_phone="+420 777 888 999",
            vet_address="Purkyňova 8, Praha",
            emergency_vet_phone="+420 222 333 444",
            emergency_vet_clinic="Veterinární pohotovost VET24 Nonstop",
            last_fed_at=(datetime.datetime.now() - datetime.timedelta(hours=4)).isoformat(),
            last_fed_by_name="Správce Domácnosti",
            is_favorite=True,
            notes="Klidná společnice, ráda spí na škrabadle u okna. Pravidelně vyčesávat podsadu.",
            created_by_id=admin_id
        )

        db.add_all([pet_dog, pet_cat])
        db.commit()

        # Medical records
        medical = [
            PetMedicalRecord(
                pet_id=pet_dog.id,
                record_type="vaccination",
                title="Kombinovaná vakcína DHPPi + L4 (Vzteklina, Psinka, Parvoviróza)",
                performed_date=(today - datetime.timedelta(days=180)).isoformat(),
                valid_until=(today + datetime.timedelta(days=185)).isoformat(),
                batch_number="NOBIVAC-A49281",
                veterinarian="MVDr. Jan Novák",
                notes="Bez nežádoucích reakcí, teplota 38.3 °C."
            ),
            PetMedicalRecord(
                pet_id=pet_dog.id,
                record_type="deworming",
                title="Odčervení tabletou Dehinel Plus",
                performed_date=(today - datetime.timedelta(days=60)).isoformat(),
                valid_until=(today + datetime.timedelta(days=30)).isoformat(),
                notes="Podána 1 celá tableta zabalená v sýru."
            ),
            PetMedicalRecord(
                pet_id=pet_cat.id,
                record_type="vaccination",
                title="Trojkombinace Purevax RCP (Panleukopenie, Kaliciviróza, Herpesviróza)",
                performed_date=(today - datetime.timedelta(days=240)).isoformat(),
                valid_until=(today + datetime.timedelta(days=125)).isoformat(),
                veterinarian="MVDr. Petra Černá",
                notes="Kočka byla klidná, stav výborný."
            )
        ]

        # Weights
        weights = [
            PetWeightLog(pet_id=pet_dog.id, weight_kg=31.2, recorded_date=(today - datetime.timedelta(days=180)).isoformat(), notes="Pravidelná roční prohlídka"),
            PetWeightLog(pet_id=pet_dog.id, weight_kg=31.5, recorded_date=(today - datetime.timedelta(days=90)).isoformat()),
            PetWeightLog(pet_id=pet_dog.id, weight_kg=31.8, recorded_date=(today - datetime.timedelta(days=14)).isoformat(), notes="Optimální kondice"),
            PetWeightLog(pet_id=pet_cat.id, weight_kg=4.2, recorded_date=(today - datetime.timedelta(days=120)).isoformat()),
            PetWeightLog(pet_id=pet_cat.id, weight_kg=4.3, recorded_date=(today - datetime.timedelta(days=20)).isoformat(), notes="Stabilní váha")
        ]

        # Medications
        meds = [
            PetMedication(
                pet_id=pet_dog.id,
                name="Apoquel 16mg",
                dosage="0.5 tablety",
                frequency="1x denně ráno",
                start_date=(today - datetime.timedelta(days=10)).isoformat(),
                is_active=True,
                notes="Při sezónní svědivosti na jaře/v létě."
            )
        ]

        # Tasks
        pet_tasks = [
            PetTask(
                pet_id=pet_dog.id,
                task_type="deworming",
                title="Pravidelné odčervení",
                due_date=(today + datetime.timedelta(days=30)).isoformat(),
                interval_days=90,
                notes="Tableta Dehinel Plus dle váhy (32 kg = 3 tablety)"
            ),
            PetTask(
                pet_id=pet_dog.id,
                task_type="antiparasitic",
                title="Aplikace pipety proti klíšťatům (Bravecto)",
                due_date=(today + datetime.timedelta(days=15)).isoformat(),
                interval_days=90,
                notes="Zkontrolovat srst po vycházce v lese"
            ),
            PetTask(
                pet_id=pet_cat.id,
                task_type="vaccination",
                title="Přeočkování Purevax RCP",
                due_date=(today + datetime.timedelta(days=125)).isoformat(),
                interval_days=365,
                notes="Objednat se ke klinice KočkaVET"
            )
        ]

        # Diary entries
        pet_logs = [
            PetLogEntry(
                pet_id=pet_dog.id,
                entry_type="photo",
                title="Výlet do Šumavských lesů",
                image_url=pet_dog.primary_image_url,
                notes="Baddy byl nadšený z potoka a nachodil s námi 14 km."
            ),
            PetLogEntry(
                pet_id=pet_cat.id,
                entry_type="milestone",
                title="Nové velké škrabadlo",
                image_url=pet_cat.primary_image_url,
                notes="Mia okamžitě obsadila nejvyšší patro s výhledem na zahradu."
            )
        ]

        db.add_all(medical + weights + meds + pet_tasks + pet_logs)
        db.commit()

    # 6. Seed Chores & Household Tasks if none exist
    if db.query(Chore).count() == 0:
        all_users = db.query(User).all()
        user_ids = [u.id for u in all_users] if all_users else [1]
        rotation_json = json.dumps(user_ids)

        u1 = user_ids[0] if len(user_ids) > 0 else 1
        u2 = user_ids[1] if len(user_ids) > 1 else u1
        u3 = user_ids[2] if len(user_ids) > 2 else u1

        # Routine chores
        c1 = Chore(
            title="Vyklidit myčku a roztřídit nádobí",
            description="Vyskládat čisté nádobí z myčky a uložit talíře, sklenice a příbory na svá místa.",
            room="kitchen",
            category="routine",
            frequency="daily",
            interval_days=1,
            points=10,
            estimated_minutes=5,
            is_rotation_enabled=True,
            rotation_member_ids=rotation_json,
            current_assignee_id=u1,
            due_date=today.isoformat(),
            cleaning_supplies_needed="Tablety do myčky Jar Platinum, leštidlo Somat",
            is_appliance_maintenance=False,
            is_active=True
        )
        c2 = Chore(
            title="Vynést tříděný odpad (plast, papír, bio)",
            description="Zkontrolovat koše pod dřezem a odnést plné pytle do venkovních popelnic.",
            room="kitchen",
            category="routine",
            frequency="daily",
            interval_days=2,
            points=15,
            estimated_minutes=8,
            is_rotation_enabled=True,
            rotation_member_ids=rotation_json,
            current_assignee_id=u2,
            due_date=today.isoformat(),
            cleaning_supplies_needed="Pytle do koše 60 l se zatahovací páskou",
            is_appliance_maintenance=False,
            is_active=True
        )
        c3 = Chore(
            title="Vyluxovat a vytřít obývací pokoj a chodbu",
            description="Vysát drobky a zvířecí chlupy a setřít podlahu mopem s kapkou vonného čističe.",
            room="living_room",
            category="routine",
            frequency="weekly",
            interval_days=7,
            points=25,
            estimated_minutes=20,
            is_rotation_enabled=True,
            rotation_member_ids=rotation_json,
            current_assignee_id=u3,
            due_date=(today + datetime.timedelta(days=1)).isoformat(),
            cleaning_supplies_needed="Univerzální vonný čistič na podlahy Sanytol",
            is_appliance_maintenance=False,
            is_active=True
        )
        c4 = Chore(
            title="Důkladně vyčistit koupelnu, zrcadlo a toaletu",
            description="Vydezinfikovat mísu, setřít umyvadlo a baterie a vyleštit zrcadlo.",
            room="bathroom",
            category="routine",
            frequency="weekly",
            interval_days=7,
            points=35,
            estimated_minutes=25,
            is_rotation_enabled=True,
            rotation_member_ids=rotation_json,
            current_assignee_id=u1,
            due_date=(today + datetime.timedelta(days=2)).isoformat(),
            cleaning_supplies_needed="WC gel Bref, čistič koupelny Cillit Bang, utěrka z mikrovlákna",
            is_appliance_maintenance=False,
            is_active=True
        )
        c5 = Chore(
            title="Převléknout ložní prádlo a vyvětrat matrace",
            description="Svléknout povlečení, dát prát na 60°C a navléknout čerstvé voňavé povlečení.",
            room="bedroom",
            category="routine",
            frequency="biweekly",
            interval_days=14,
            points=30,
            estimated_minutes=15,
            is_rotation_enabled=True,
            rotation_member_ids=rotation_json,
            current_assignee_id=u2,
            due_date=(today + datetime.timedelta(days=4)).isoformat(),
            cleaning_supplies_needed="Prací gel na bílé a barevné prádlo Ariel",
            is_appliance_maintenance=False,
            is_active=True
        )

        # Appliance Maintenance (Servisní knížka spotřebičů)
        m1 = Chore(
            title="Odvápnit kávovar a vyčistit trysku na mléko",
            description="Spustit odvápňovací cyklus s originálním roztokem a propláchnout napěňovač mléka.",
            room="kitchen",
            category="maintenance",
            frequency="monthly",
            interval_days=30,
            points=20,
            estimated_minutes=20,
            is_rotation_enabled=False,
            rotation_member_ids=rotation_json,
            current_assignee_id=u1,
            due_date=(today + datetime.timedelta(days=6)).isoformat(),
            cleaning_supplies_needed="Odvápňovací roztok DeLonghi EcoDecalk",
            is_appliance_maintenance=True,
            appliance_name="Kávovar DeLonghi Magnifica S",
            is_active=True
        )
        m2 = Chore(
            title="Vyčistit filtr a ostřikovací ramena myčky",
            description="Vyšroubovat spodní sítko, opláchnout mastnotu teplou vodou a spustit mycí cyklus naprázdno.",
            room="kitchen",
            category="maintenance",
            frequency="monthly",
            interval_days=30,
            points=25,
            estimated_minutes=15,
            is_rotation_enabled=False,
            rotation_member_ids=rotation_json,
            current_assignee_id=u3,
            due_date=(today + datetime.timedelta(days=12)).isoformat(),
            cleaning_supplies_needed="Čistič myčky nádobí Somat Duo",
            is_appliance_maintenance=True,
            appliance_name="Myčka nádobí Bosch Série 6",
            is_active=True
        )
        m3 = Chore(
            title="Vyčistit filtr pračky a gumové těsnění bubnu",
            description="Otevřít spodní kryt, vypustit zbytkem hadičky vodu, vyčistit zachycené nečistoty a otřít gumu octem.",
            room="bathroom",
            category="maintenance",
            frequency="monthly",
            interval_days=60,
            points=30,
            estimated_minutes=15,
            is_rotation_enabled=False,
            rotation_member_ids=rotation_json,
            current_assignee_id=u1,
            due_date=(today + datetime.timedelta(days=20)).isoformat(),
            is_appliance_maintenance=True,
            appliance_name="Automatická pračka LG AI DD",
            is_active=True
        )

        # Panic mode quick sprint tasks
        p1 = Chore(
            title="Sklidit boty, bundy a tašky v předsíni",
            description="Všechny rozházené boty do botníku, bundy na věšáky, ať je chodba vzdušná.",
            room="hallway",
            category="panic_mode",
            frequency="as_needed",
            interval_days=1,
            points=10,
            estimated_minutes=4,
            is_rotation_enabled=False,
            rotation_member_ids=rotation_json,
            current_assignee_id=u2,
            due_date=today.isoformat(),
            is_active=True
        )
        p2 = Chore(
            title="Vyklidit kuchyňský dřez a setřít linku",
            description="Schovat špinavé nádobí do myčky a otřít drobečky a skvrny z pracovní plochy.",
            room="kitchen",
            category="panic_mode",
            frequency="as_needed",
            interval_days=1,
            points=10,
            estimated_minutes=5,
            is_rotation_enabled=False,
            rotation_member_ids=rotation_json,
            current_assignee_id=u1,
            due_date=today.isoformat(),
            is_active=True
        )
        p3 = Chore(
            title="Zkontrolovat toaletu, čistý ručník a vůni",
            description="Rychle přejet WC štětkou, pověsit čistý ručník na ruce a stříknout osvěžovač.",
            room="bathroom",
            category="panic_mode",
            frequency="as_needed",
            interval_days=1,
            points=10,
            estimated_minutes=4,
            is_rotation_enabled=False,
            rotation_member_ids=rotation_json,
            current_assignee_id=u3,
            due_date=today.isoformat(),
            is_active=True
        )
        p4 = Chore(
            title="Srovnat polštáře a deky na pohovce v obýváku",
            description="Naklepat polštáře, složit deku a odnést prázdné hrnky z konferenčního stolku.",
            room="living_room",
            category="panic_mode",
            frequency="as_needed",
            interval_days=1,
            points=10,
            estimated_minutes=3,
            is_rotation_enabled=False,
            rotation_member_ids=rotation_json,
            current_assignee_id=u2,
            due_date=today.isoformat(),
            is_active=True
        )

        # Deep cleaning (Generální úklid)
        d1 = Chore(
            title="Umýt a vyleštit okna a parapety v bytě",
            description="Omýt rámy teplou vodou, skla vyleštit stěrkou a otřít parapety.",
            room="general",
            category="deep_clean",
            frequency="seasonal",
            interval_days=120,
            points=80,
            estimated_minutes=90,
            is_rotation_enabled=True,
            rotation_member_ids=rotation_json,
            current_assignee_id=u1,
            due_date=(today + datetime.timedelta(days=25)).isoformat(),
            cleaning_supplies_needed="Clin na okna se stěrkou, utěrky z mikrovlákna",
            is_active=True
        )
        d2 = Chore(
            title="Hloubkově odmastit troubu a plechy na pečení",
            description="Nastříkat pěnu do trouby, nechat působit 30 minut a setřít napečenou mastnotu.",
            room="kitchen",
            category="deep_clean",
            frequency="monthly",
            interval_days=45,
            points=50,
            estimated_minutes=45,
            is_rotation_enabled=True,
            rotation_member_ids=rotation_json,
            current_assignee_id=u3,
            due_date=(today + datetime.timedelta(days=15)).isoformat(),
            cleaning_supplies_needed="Aktivní pěna na trouby Dr. Beckmann",
            is_active=True
        )

        all_chores = [c1, c2, c3, c4, c5, m1, m2, m3, p1, p2, p3, p4, d1, d2]
        db.add_all(all_chores)
        db.commit()

        # Seed Rewards
        r1 = ChoreReward(
            title="Výběr rodinného filmu na páteční večer",
            description="Získáš plné právo vybrat film na společný filmový večer + velkou mísu popcornu.",
            cost_points=50,
            icon="Film",
            is_active=True
        )
        r2 = ChoreReward(
            title="Výběr sobotního oběda z rodinné kuchařky",
            description="Uvaříme tvé nejoblíbenější jídlo z Hestia receptáře přesně podle tvého přání.",
            cost_points=75,
            icon="Utensils",
            is_active=True
        )
        r3 = ChoreReward(
            title="Velký zmrzlinový pohár se šlehačkou",
            description="Poctivá sladká odměna za vzornou pomoc a aktivitu v domácnosti.",
            cost_points=100,
            icon="IceCream",
            is_active=True
        )
        r4 = ChoreReward(
            title="Žolík: Den bez domácích prací",
            description="Celých 24 hodin máš imunitu před jakýmkoliv úklidem a povinnostmi.",
            cost_points=150,
            icon="Shield",
            is_active=True
        )
        db.add_all([r1, r2, r3, r4])
        db.commit()

        # Seed sample completions for leaderboard
        now = datetime.datetime.utcnow()
        comp1 = ChoreCompletion(chore_id=c1.id, user_id=u1, points_awarded=10, completed_at=now - datetime.timedelta(days=1), notes="Rychlé vyklizení ráno")
        comp2 = ChoreCompletion(chore_id=c2.id, user_id=u2, points_awarded=15, completed_at=now - datetime.timedelta(days=2), notes="Odnesen i starý karton")
        comp3 = ChoreCompletion(chore_id=c3.id, user_id=u3, points_awarded=25, completed_at=now - datetime.timedelta(days=3), notes="Vytřeno s novou vůní")
        comp4 = ChoreCompletion(chore_id=c4.id, user_id=u1, points_awarded=35, completed_at=now - datetime.timedelta(days=4), notes="Kompletní očista")
        comp5 = ChoreCompletion(chore_id=c5.id, user_id=u2, points_awarded=30, completed_at=now - datetime.timedelta(days=5), notes="Nové damaškové povlečení")
        comp6 = ChoreCompletion(chore_id=m1.id, user_id=u1, points_awarded=20, completed_at=now - datetime.timedelta(days=6), notes="Kávovar hlásil odvápnění")
        db.add_all([comp1, comp2, comp3, comp4, comp5, comp6])
        db.commit()

    # 7. Seed Finance Data if none exists
    if db.query(FinanceTransaction).count() == 0:
        all_users = db.query(User).all()
        u1 = all_users[0].id if len(all_users) > 0 else 1
        u2 = all_users[1].id if len(all_users) > 1 else u1
        u3 = all_users[2].id if len(all_users) > 2 else u1

        # Finance Profiles with bank accounts & IBANs for QR payments
        p1 = UserFinanceProfile(user_id=u1, bank_account="123456789/0800", iban="CZ7508000000000123456789")
        p2 = UserFinanceProfile(user_id=u2, bank_account="987654321/2010", iban="CZ2420100000000987654321")
        p3 = UserFinanceProfile(user_id=u3, bank_account="555444333/0300", iban="CZ6803000000000555444333")
        db.add_all([p1, p2, p3])

        # Category Budgets
        budgets = [
            CategoryBudget(category="groceries", monthly_limit=12000.0, icon="ShoppingCart", color="#f97316"),
            CategoryBudget(category="housing", monthly_limit=18000.0, icon="Home", color="#3b82f6"),
            CategoryBudget(category="utilities", monthly_limit=5000.0, icon="Zap", color="#eab308"),
            CategoryBudget(category="transport", monthly_limit=4500.0, icon="Car", color="#06b6d4"),
            CategoryBudget(category="pets", monthly_limit=3000.0, icon="Dog", color="#8b5cf6"),
            CategoryBudget(category="health", monthly_limit=2000.0, icon="HeartPulse", color="#ef4444"),
            CategoryBudget(category="entertainment", monthly_limit=3500.0, icon="Film", color="#ec4899"),
            CategoryBudget(category="kids", monthly_limit=4000.0, icon="Baby", color="#10b981"),
            CategoryBudget(category="shopping", monthly_limit=4000.0, icon="ShoppingBag", color="#6366f1"),
            CategoryBudget(category="other", monthly_limit=3000.0, icon="Tag", color="#64748b"),
        ]
        db.add_all(budgets)

        # Multi-month history for accurate average monthly spending calculations
        # Month -2 (e.g. July)
        m2_date = today - datetime.timedelta(days=60)
        m2_str = m2_date.strftime("%Y-%m")
        # Month -1 (e.g. August)
        m1_date = today - datetime.timedelta(days=30)
        m1_str = m1_date.strftime("%Y-%m")
        # Current month
        m0_str = today.strftime("%Y-%m")

        txs = [
            # Incomes
            FinanceTransaction(title="Výplata - Hlavní příjem", amount=48000.0, transaction_type="income", category="income", date=f"{m2_str}-10", payer_id=u1, is_shared=True),
            FinanceTransaction(title="Výplata - Příjem Anna", amount=42000.0, transaction_type="income", category="income", date=f"{m2_str}-12", payer_id=u2, is_shared=True),
            FinanceTransaction(title="Výplata - Hlavní příjem", amount=48000.0, transaction_type="income", category="income", date=f"{m1_str}-10", payer_id=u1, is_shared=True),
            FinanceTransaction(title="Výplata - Příjem Anna", amount=42000.0, transaction_type="income", category="income", date=f"{m1_str}-12", payer_id=u2, is_shared=True),
            FinanceTransaction(title="Výplata - Hlavní příjem", amount=48000.0, transaction_type="income", category="income", date=f"{m0_str}-01", payer_id=u1, is_shared=True),
            FinanceTransaction(title="Výplata - Příjem Anna", amount=42000.0, transaction_type="income", category="income", date=f"{m0_str}-02", payer_id=u2, is_shared=True),

            # Month -2 Expenses
            FinanceTransaction(title="Nájem a poplatky za byt", amount=16500.0, transaction_type="expense", category="housing", date=f"{m2_str}-05", payer_id=u1, is_shared=True),
            FinanceTransaction(title="Zálohy ČEZ elektřina a plyn", amount=4200.0, transaction_type="expense", category="utilities", date=f"{m2_str}-08", payer_id=u1, is_shared=True),
            FinanceTransaction(title="Velký nákup Albert", amount=3650.0, transaction_type="expense", category="groceries", date=f"{m2_str}-06", payer_id=u2, is_shared=True),
            FinanceTransaction(title="Týdenní nákup Kaufland", amount=2850.0, transaction_type="expense", category="groceries", date=f"{m2_str}-14", payer_id=u1, is_shared=True),
            FinanceTransaction(title="Nákup Rohlík.cz", amount=3120.0, transaction_type="expense", category="groceries", date=f"{m2_str}-22", payer_id=u2, is_shared=True),
            FinanceTransaction(title="Plná nádrž Benzina Orlen", amount=2150.0, transaction_type="expense", category="transport", date=f"{m2_str}-11", payer_id=u3, is_shared=True),
            FinanceTransaction(title="Granule a pamlsky Zoohit (Baddy & Mia)", amount=2450.0, transaction_type="expense", category="pets", date=f"{m2_str}-15", payer_id=u1, is_shared=True),
            FinanceTransaction(title="Rodinná večeře v pizzerii", amount=1680.0, transaction_type="expense", category="entertainment", date=f"{m2_str}-18", payer_id=u2, is_shared=True),

            # Month -1 Expenses
            FinanceTransaction(title="Nájem a poplatky za byt", amount=16500.0, transaction_type="expense", category="housing", date=f"{m1_str}-05", payer_id=u1, is_shared=True),
            FinanceTransaction(title="Zálohy ČEZ elektřina a plyn", amount=4200.0, transaction_type="expense", category="utilities", date=f"{m1_str}-08", payer_id=u1, is_shared=True),
            FinanceTransaction(title="Velký nákup Lidl", amount=3420.0, transaction_type="expense", category="groceries", date=f"{m1_str}-04", payer_id=u1, is_shared=True),
            FinanceTransaction(title="Týdenní nákup Albert", amount=2950.0, transaction_type="expense", category="groceries", date=f"{m1_str}-12", payer_id=u2, is_shared=True),
            FinanceTransaction(title="Drogerie dm nákup", amount=1540.0, transaction_type="expense", category="groceries", date=f"{m1_str}-19", payer_id=u2, is_shared=True),
            FinanceTransaction(title="Tankování Shell V-Power", amount=1980.0, transaction_type="expense", category="transport", date=f"{m1_str}-09", payer_id=u1, is_shared=True),
            FinanceTransaction(title="Veterinární klinika U Lesa (očkování Baddy)", amount=1850.0, transaction_type="expense", category="pets", date=f"{m1_str}-16", payer_id=u2, is_shared=True),
            FinanceTransaction(title="Lékárna Dr. Max vitamíny", amount=980.0, transaction_type="expense", category="health", date=f"{m1_str}-20", payer_id=u1, is_shared=True),
            FinanceTransaction(title="Lístky do kina IMAX a občerstvení", amount=1150.0, transaction_type="expense", category="entertainment", date=f"{m1_str}-23", payer_id=u3, is_shared=True),

            # Current Month Expenses
            FinanceTransaction(title="Nájem a poplatky za byt", amount=16500.0, transaction_type="expense", category="housing", date=f"{m0_str}-01", payer_id=u1, is_shared=True),
            FinanceTransaction(title="Zálohy ČEZ elektřina a plyn", amount=4200.0, transaction_type="expense", category="utilities", date=f"{m0_str}-02", payer_id=u1, is_shared=True),
            FinanceTransaction(title="Velký víkendový nákup Kaufland", amount=3750.0, transaction_type="expense", category="groceries", date=f"{m0_str}-03", payer_id=u2, is_shared=True),
            FinanceTransaction(title="Pohonné hmoty OMV", amount=2240.0, transaction_type="expense", category="transport", date=f"{m0_str}-04", payer_id=u3, is_shared=True),
            FinanceTransaction(title="Krmivo a stelivo KočkaVET", amount=1620.0, transaction_type="expense", category="pets", date=f"{m0_str}-04", payer_id=u1, is_shared=True),
            FinanceTransaction(title="Předplatné Netflix Premium", amount=379.0, transaction_type="expense", category="entertainment", date=f"{m0_str}-05", payer_id=u1, is_shared=True)
        ]
        db.add_all(txs)

        # Subscriptions
        subs = [
            Subscription(name="Netflix Premium 4K", amount=379.0, billing_cycle="monthly", next_billing_date=(today + datetime.timedelta(days=12)).isoformat(), category="entertainment", payer_id=u1),
            Subscription(name="Spotify Family", amount=269.0, billing_cycle="monthly", next_billing_date=(today + datetime.timedelta(days=18)).isoformat(), category="entertainment", payer_id=u2),
            Subscription(name="Vysokorychlostní internet Vodafone", amount=590.0, billing_cycle="monthly", next_billing_date=(today + datetime.timedelta(days=7)).isoformat(), category="utilities", payer_id=u1),
            Subscription(name="Pojištění domácnosti a odpovědnosti Kooperativa", amount=3400.0, billing_cycle="yearly", next_billing_date=(today + datetime.timedelta(days=95)).isoformat(), category="housing", payer_id=u1),
            Subscription(name="Poplatek za svoz komunálního odpadu", amount=1200.0, billing_cycle="yearly", next_billing_date=(today + datetime.timedelta(days=140)).isoformat(), category="utilities", payer_id=u2)
        ]
        db.add_all(subs)

        # Savings Goals
        goals = [
            SavingsGoal(title="Letní dovolená u moře v Řecku", target_amount=45000.0, current_amount=28500.0, target_date=(today + datetime.timedelta(days=180)).isoformat(), icon="Palmtree", color="#06b6d4"),
            SavingsGoal(title="Nová sedací souprava do obývacího pokoje", target_amount=30000.0, current_amount=14200.0, target_date=(today + datetime.timedelta(days=90)).isoformat(), icon="Sofa", color="#f97316"),
            SavingsGoal(title="Železná finanční rezerva domácnosti (3 měsíce)", target_amount=100000.0, current_amount=65000.0, target_date=None, icon="Shield", color="#10b981")
        ]
        db.add_all(goals)
        db.commit()

    # 9. Seed Documents & Vault Settings
    if db.query(VaultSetting).count() == 0:
        db.add(VaultSetting(pin_hash="1234", is_active=True))
        db.commit()

    if db.query(Document).count() == 0:
        # Create a sample text/pdf file in uploads/documents/sample/
        sample_dir = os.path.join(settings.UPLOAD_DIR, "documents", "sample")
        os.makedirs(sample_dir, exist_ok=True)
        sample_file_path = os.path.join(sample_dir, "vzorovy_dokument.txt")
        if not os.path.exists(sample_file_path):
            with open(sample_file_path, "w", encoding="utf-8") as f:
                f.write("Hestia OS - Vzorový dokument pro digitální archiv a šanon domácnosti.\nTento soubor slouží jako ukázka digitalizovaného dokumentu.\n")

        rel_sample = "documents/sample/vzorovy_dokument.txt"
        u1 = admin_user.id if admin_user else 1

        docs = [
            Document(
                title="Záruční list a faktura – Pračka Bosch Série 6 (WAN28262BY)",
                category="warranty",
                file_path=rel_sample,
                file_name="zarucni_list_pracka_bosch.pdf",
                file_size=245800,
                file_type="application/pdf",
                issuer="Alza.cz",
                document_date="2025-04-10",
                expiry_date=(today + datetime.timedelta(days=400)).isoformat(),
                warranty_months=24,
                contract_number="ALZ-948201948",
                amount=13990.0,
                physical_location="Krabice Spotřebiče – šatna v chodbě",
                is_vault_protected=False,
                tags="pračka, bosch, záruka, alza, elektro",
                summary="Záruční list a daňový doklad k automatické pračce Bosch Série 6 zakoupené na Alza.cz se standardní 2letou zárukou.",
                ocr_fulltext="FAKTURA - DAŇOVÝ DOKLAD č. 2025041019. Alza.cz a.s. Kupující: Rodina Novákova. Položka: Bosch WAN28262BY pračka předem plněná, S/N: BSH9482019482. Záruka 24 měsíců. Celkem k úhradě: 13 990 Kč.",
                created_by_id=u1
            ),
            Document(
                title="Účtenka a záruka – Kávovar DeLonghi Magnifica S",
                category="warranty",
                file_path=rel_sample,
                file_name="uctenka_delonghi_magnifica.pdf",
                file_size=184200,
                file_type="application/pdf",
                issuer="Datart",
                document_date="2024-03-20",
                expiry_date=(today + datetime.timedelta(days=14)).isoformat(),  # Expiring soon! (<= 30 days)
                warranty_months=24,
                contract_number="DAT-892019",
                amount=8490.0,
                physical_location="Šanon 1 (Zelený) – Spotřebiče, 1. police",
                is_vault_protected=False,
                tags="kávovar, delonghi, záruka, datart, kuchyně",
                summary="Dvouletá záruka na automatický kávovar DeLonghi Magnifica S. Záruka končí za méně než měsíc – zkontrolujte funkčnost!",
                ocr_fulltext="DATART s.r.o. Prodejka č. 89201. Kávovar DeLonghi Magnifica S ECAM 22.110.B. Sériové číslo DL22110-94812. Cena: 8 490 Kč. Záruční doba: 24 měsíců ode dne prodeje.",
                created_by_id=u1
            ),
            Document(
                title="Záruční list – Mikrovlnná trouba Samsung",
                category="warranty",
                file_path=rel_sample,
                file_name="zaruka_mikrovlnka_samsung.pdf",
                file_size=120000,
                file_type="application/pdf",
                issuer="Mall.cz",
                document_date="2023-01-15",
                expiry_date=(today - datetime.timedelta(days=180)).isoformat(),  # Expired
                warranty_months=24,
                contract_number="MAL-4920194",
                amount=3200.0,
                physical_location="Krabice Staré účtenky – sklep",
                is_vault_protected=False,
                tags="mikrovlnka, samsung, mall, kuchyně",
                summary="Původní záruční list k mikrovlnné troubě Samsung. Záruka již před 6 měsíci vypršela.",
                ocr_fulltext="MALL.cz nákupní faktura 4920194. Mikrovlnná trouba Samsung MS23F301TAS. Záruční doba 24 měsíců.",
                created_by_id=u1
            ),
            Document(
                title="Smlouva o dodávce elektřiny – ČEZ Prodej",
                category="contract",
                file_path=rel_sample,
                file_name="smlouva_cez_elektrina.pdf",
                file_size=520000,
                file_type="application/pdf",
                issuer="ČEZ Prodej, a.s.",
                document_date="2024-09-01",
                expiry_date=(today + datetime.timedelta(days=365)).isoformat(),
                warranty_months=None,
                contract_number="CEZ-94820194",
                amount=None,
                physical_location="Šanon 2 (Modrý) – Energie a Smlouvy",
                is_vault_protected=False,
                tags="cez, elektrina, energie, smlouva, fixace",
                summary="Smlouva o sdružených službách dodávky elektřiny s fixací ceny na 2 roky. Odběrné místo EAN 859182400019284.",
                ocr_fulltext="ČEZ Prodej a.s. Smlouva o sdružených službách dodávky elektřiny č. CEZ-94820194. Zákazník: Správce Domácnosti. EAN: 859182400019284. Produkt: Elektřina na 2 roky v akci.",
                created_by_id=u1
            ),
            Document(
                title="Pojistná smlouva – Pojištění majetku a odpovědnosti Bezpečný domov",
                category="contract",
                file_path=rel_sample,
                file_name="pojisteni_domacnosti_kooperativa.pdf",
                file_size=780000,
                file_type="application/pdf",
                issuer="Kooperativa pojišťovna, a.s.",
                document_date="2025-01-01",
                expiry_date=(today + datetime.timedelta(days=115)).isoformat(),
                warranty_months=None,
                contract_number="KOOP-77492019",
                amount=3400.0,
                physical_location="Šanon 2 (Modrý) – Finance a Pojištění",
                is_vault_protected=False,
                tags="pojisteni, kooperativa, odpovednost, byt, domacnost",
                summary="Komplexní pojištění trvale obývaného bytu, vybavení domácnosti a občanské odpovědnosti pro celou rodinu.",
                ocr_fulltext="Kooperativa pojišťovna a.s., Vienna Insurance Group. Pojistná smlouva č. KOOP-77492019. Pojištění trvale obývaného bytu a domácnosti na částku 2 500 000 Kč. Roční pojistné: 3 400 Kč.",
                created_by_id=u1
            ),
            Document(
                title="Zpráva o odborné kontrole a čištění spalinové cesty (Kominík)",
                category="inspection",
                file_path=rel_sample,
                file_name="revize_spalinove_cesty_kominik.pdf",
                file_size=310000,
                file_type="application/pdf",
                issuer="Kominictví Jan Dvořák",
                document_date="2025-10-15",
                expiry_date=(today + datetime.timedelta(days=22)).isoformat(),  # Expiring soon! (<= 30 days)
                warranty_months=None,
                contract_number="KOM-2025-104",
                amount=850.0,
                physical_location="Šanon 3 (Žlutý) – Revize a technická správa",
                is_vault_protected=False,
                tags="kominik, revize, spalinova cesta, krb, bezpecnost",
                summary="Pravidelná roční revize komína a kouřovodu dle vyhlášky č. 34/2016 Sb. Blíží se termín další revize!",
                ocr_fulltext="ZPRÁVA O PROVEDENÍ KONTROLY A ČIŠTĚNÍ SPALINOVÉ CESTY č. 2025/104. Kominictví Jan Dvořák. Spalinová cesta bezpečná a provozuschopná.",
                created_by_id=u1
            ),
            Document(
                title="Protokol o pravidelném servisu a revizi plynového kotle",
                category="inspection",
                file_path=rel_sample,
                file_name="servisni_protokol_plynovy_kotel.pdf",
                file_size=420000,
                file_type="application/pdf",
                issuer="Vaillant Servis Centrum",
                document_date="2025-05-12",
                expiry_date=(today + datetime.timedelta(days=240)).isoformat(),
                warranty_months=None,
                contract_number="VAI-89201",
                amount=2100.0,
                physical_location="Šanon 3 (Žlutý) – Nástěnka v technické místnosti",
                is_vault_protected=False,
                tags="kotel, plyn, revize, vaillant, topeni",
                summary="Garanční prohlídka kondenzačního kotle Vaillant ecoTEC plus, vyčištění hořáku a měření emisí.",
                ocr_fulltext="SERVISNÍ PROTOKOL - KONDENZAČNÍ PLYNOVÝ KOTEL. Model: Vaillant ecoTEC plus VUW 246. Vyčištění výměníku, kontrola expanzní nádoby, emise CO2 v normě.",
                created_by_id=u1
            ),
            Document(
                title="Uživatelská příručka – Myčka nádobí Bosch Série 6 (PDF)",
                category="manual",
                file_path=rel_sample,
                file_name="navod_mycka_bosch_serie6.pdf",
                file_size=1840000,
                file_type="application/pdf",
                issuer="Bosch Home Appliances",
                document_date="2025-01-01",
                expiry_date=None,  # Permanent manual
                warranty_months=None,
                contract_number="SMS6ZCI00E",
                amount=None,
                physical_location="Online PDF v Hestii (papírový recyklován)",
                is_vault_protected=False,
                tags="manual, navod, mycka, bosch, udrzba",
                summary="Kompletní návod k obsluze myčky nádobí, tabulka chybových kódů (E09, E15, E18, E24) a schéma čištění filtrů.",
                ocr_fulltext="Bosch Návod k použití. Myčka nádobí Serie 6 SMS6ZCI00E. Programy: Eco 50°, Auto 45-65°, Intenzivní 70°. Čištění sítka a sprchovacích ramen každé 2 měsíce. Chybový kód E15: aktivován systém AquaStop.",
                created_by_id=u1
            ),
            Document(
                title="Kopie cestovního pasu – Petr",
                category="identity",
                file_path=rel_sample,
                file_name="pas_petr_kopie.pdf",
                file_size=650000,
                file_type="application/pdf",
                issuer="Ministerstvo vnitra ČR",
                document_date="2020-08-10",
                expiry_date=(today + datetime.timedelta(days=160)).isoformat(),
                warranty_months=None,
                contract_number="PAS-89201948",
                amount=None,
                physical_location="Ohnivzdorný domácí trezor – ložnice",
                is_vault_protected=True,  # Locked in vault!
                tags="pas, doklady, cestovani, trezor, petr",
                summary="Cestovní pas s biometrickými údaji. Uloženo v zabezpečeném rodinném trezoru (chráněno PINem).",
                ocr_fulltext="ČESKÁ REPUBLIKA - PAS / PASSPORT. P<CZENOVAK<<PETR<<<<<<<<<<<<<<<<<<<<<<<<<<<.",
                created_by_id=u1
            ),
            Document(
                title="Očkovací průkaz – Očkování proti klíšťové encefalitidě",
                category="medical",
                file_path=rel_sample,
                file_name="ockovaci_prukaz_kliste.pdf",
                file_size=290000,
                file_type="application/pdf",
                issuer="Centrum očkování Avenier",
                document_date="2025-06-15",
                expiry_date=(today + datetime.timedelta(days=720)).isoformat(),
                warranty_months=None,
                contract_number="FSME-94820",
                amount=1250.0,
                physical_location="Šanon 4 (Červený) – Zdravotní karta rodiny",
                is_vault_protected=False,
                tags="ockovani, lekar, zdravi, kliste, fsme",
                summary="Záznam o přeočkování vakcínou FSME-Immun. Další posilovací dávka (booster) doporučena za 3 roky.",
                ocr_fulltext="ZÁZNAM O OČKOVÁNÍ. Avenier a.s. Očkovací látka FSME-IMMUN 0.5ml. Aplikováno do m. deltoideus. Šarže: VNR19482. Další revakcinace za 3 roky.",
                created_by_id=u1
            ),
            Document(
                title="Smlouva o hypotečním úvěru – Komerční banka",
                category="housing",
                file_path=rel_sample,
                file_name="hypotecni_smlouva_kb.pdf",
                file_size=1420000,
                file_type="application/pdf",
                issuer="Komerční banka, a.s.",
                document_date="2022-04-01",
                expiry_date=(today + datetime.timedelta(days=1200)).isoformat(),
                warranty_months=None,
                contract_number="KB-HYPO-2022-8491",
                amount=3850000.0,
                physical_location="Ohnivzdorný domácí trezor – ložnice",
                is_vault_protected=True,  # Locked in vault!
                tags="hypoteka, komercni banka, uver, nemovitost, trezor",
                summary="Smlouva o poskytnutí hypotečního úvěru na nákup rodinného bytu. Fixace úrokové sazby na 5 let.",
                ocr_fulltext="KOMERČNÍ BANKA a.s. Smlouva o hypotečním úvěru č. KB-HYPO-2022-8491. Úvěrovaná částka: 3 850 000 CZK. Fixace úrokové sazby do 31.03.2027.",
                created_by_id=u1
            ),
            Document(
                title="Technický průkaz a protokol STK – Škoda Octavia Combi",
                category="vehicle",
                file_path=rel_sample,
                file_name="velky_technicak_stk_octavia.pdf",
                file_size=890000,
                file_type="application/pdf",
                issuer="Ministerstvo dopravy ČR / DEKRA",
                document_date="2024-06-10",
                expiry_date=(today + datetime.timedelta(days=280)).isoformat(),
                warranty_months=None,
                contract_number="VIN-TMBJJ7NE8K0194820",
                amount=None,
                physical_location="Šanon 5 (Černý) – Auto a Garáž",
                is_vault_protected=False,
                tags="auto, octavia, skoda, stk, technicak, dekra",
                summary="Osvědčení o registraci vozidla (Technický průkaz) a protokol o technické prohlídce STK + ME s platností do roku 2026.",
                ocr_fulltext="OSVĚDČENÍ O REGISTRACI VOZIDLA ČÁST II. Škoda Octavia Combi 2.0 TDI. VIN: TMBJJ7NE8K0194820. STK platná do 06/2026.",
                created_by_id=u1
            )
        ]
        db.add_all(docs)
        db.commit()

    # 10. Seed Vehicles, Refuelings and Service Records
    if db.query(Vehicle).count() == 0:
        all_users = db.query(User).all()
        u1 = all_users[0].id if len(all_users) > 0 else 1

        # Vehicle 1: Škoda Octavia Combi III
        v1 = Vehicle(
            name="Škoda Octavia Combi",
            make="Škoda",
            model="Octavia Combi III 2.0 TDI",
            year=2019,
            color="Šedá Quartz metalíza",
            license_plate="1AB 2345",
            vin="TMBJJ7NE8K0194820",
            fuel_type="diesel",
            tank_capacity_l=50.0,
            engine_power_kw=110,
            engine_displacement_cc=1968,
            transmission="automatic",
            current_mileage=164200,
            mot_expiry_date=(today + datetime.timedelta(days=180)).isoformat(),
            vignette_expiry_date=(today + datetime.timedelta(days=95)).isoformat(),
            vignette_type="1_year",
            insurance_company="Kooperativa",
            insurance_policy_number="KOOP-POV-849201",
            insurance_expiry_date=(today + datetime.timedelta(days=115)).isoformat(),
            insurance_assistance_phone="+420 1224",
            first_aid_kit_expiry_date=(today + datetime.timedelta(days=400)).isoformat(),
            tire_type="winter",
            tire_dimension="205/55 R16 91H",
            tire_tread_depth_mm=5.5,
            tire_storage_location="Pneuservis Barum – regál 4B (letní sada)",
            tire_last_swapped_date="2025-11-05",
            oil_change_interval_km=15000,
            oil_change_interval_months=12,
            last_oil_change_mileage=155000,
            last_oil_change_date="2025-08-15",
            notes="Hlavní rodinné auto na dlouhé trasy a dovolené. Spolehlivý dvoulitr s nízkou spotřebou.",
            is_favorite=True,
            created_by_id=u1
        )

        # Vehicle 2: Škoda Fabia III (Expiring STK in 22 days!)
        v2 = Vehicle(
            name="Fabie do města",
            make="Škoda",
            model="Fabia III 1.0 TSI",
            year=2020,
            color="Modrá Race",
            license_plate="8A6 7890",
            vin="TMBAB6NJ3KZ048291",
            fuel_type="petrol",
            tank_capacity_l=45.0,
            engine_power_kw=70,
            engine_displacement_cc=999,
            transmission="manual",
            current_mileage=58400,
            mot_expiry_date=(today + datetime.timedelta(days=22)).isoformat(),  # Warning! <= 30 days
            vignette_expiry_date=(today + datetime.timedelta(days=210)).isoformat(),
            vignette_type="1_year",
            insurance_company="Generali Česká pojišťovna",
            insurance_policy_number="GEN-77401928",
            insurance_expiry_date=(today + datetime.timedelta(days=320)).isoformat(),
            insurance_assistance_phone="+420 241 114 114",
            first_aid_kit_expiry_date=(today + datetime.timedelta(days=18)).isoformat(),  # Warning!
            tire_type="summer",
            tire_dimension="185/60 R15 84H",
            tire_tread_depth_mm=4.8,
            tire_storage_location="Domácí garáž – závěsný držák na zdi (zimní sada)",
            tire_last_swapped_date="2025-04-10",
            oil_change_interval_km=15000,
            oil_change_interval_months=12,
            last_oil_change_mileage=45000,
            last_oil_change_date="2024-11-20",
            notes="Městské vozidlo, nákupy a kroužky dětí. Pozor na blížící se termín STK!",
            is_favorite=False,
            created_by_id=u1
        )
        db.add_all([v1, v2])
        db.commit()
        db.refresh(v1)
        db.refresh(v2)

        # Seed Refuelings for Octavia (calculating realistic 5.2 - 5.6 l/100 km)
        r1 = VehicleRefueling(
            vehicle_id=v1.id,
            date=(today - datetime.timedelta(days=45)).isoformat(),
            mileage=162350,
            fuel_amount_l=46.5,
            price_per_l=36.90,
            total_price=1715.85,
            is_full_tank=True,
            fuel_brand="Orlen Benzina",
            calculated_consumption=None,
            notes="Plná nádrž před cestou na Moravu",
            created_by_id=u1
        )
        r2 = VehicleRefueling(
            vehicle_id=v1.id,
            date=(today - datetime.timedelta(days=30)).isoformat(),
            mileage=163210,
            fuel_amount_l=45.2,
            price_per_l=37.20,
            total_price=1681.44,
            is_full_tank=True,
            fuel_brand="MOL",
            calculated_consumption=5.26,  # 45.2 l / 860 km * 100
            notes="Dálniční jízda",
            created_by_id=u1
        )
        r3 = VehicleRefueling(
            vehicle_id=v1.id,
            date=(today - datetime.timedelta(days=12)).isoformat(),
            mileage=164050,
            fuel_amount_l=44.8,
            price_per_l=36.50,
            total_price=1635.20,
            is_full_tank=True,
            fuel_brand="EuroOil",
            calculated_consumption=5.33,  # 44.8 l / 840 km * 100
            notes="Bez biosložky",
            created_by_id=u1
        )

        # Refuelings for Fabia (calculating realistic 6.1 l/100 km)
        r4 = VehicleRefueling(
            vehicle_id=v2.id,
            date=(today - datetime.timedelta(days=40)).isoformat(),
            mileage=57800,
            fuel_amount_l=38.0,
            price_per_l=37.90,
            total_price=1440.20,
            is_full_tank=True,
            fuel_brand="Shell",
            calculated_consumption=None,
            notes="Plná nádrž V-Power 95",
            created_by_id=u1
        )
        r5 = VehicleRefueling(
            vehicle_id=v2.id,
            date=(today - datetime.timedelta(days=15)).isoformat(),
            mileage=58400,
            fuel_amount_l=36.6,
            price_per_l=37.50,
            total_price=1372.50,
            is_full_tank=True,
            fuel_brand="Orlen Benzina",
            calculated_consumption=6.10,  # 36.6 l / 600 km * 100
            notes="Městský provoz",
            created_by_id=u1
        )
        db.add_all([r1, r2, r3, r4, r5])

        # Seed Service Records
        s1 = VehicleServiceRecord(
            vehicle_id=v1.id,
            service_type="oil_change",
            title="Pravidelná výměna oleje a všech filtrů",
            date="2025-08-15",
            mileage=155000,
            cost=4200.0,
            service_shop="Autoservis Novák & Syn",
            performed_operations="Olej Castrol Edge 5W-30 LL (4.7 l), olejový filtr Mann, vzduchový filtr, kabinový filtr s aktivním uhlím, kontrola podvozku.",
            invoice_file_path=None,
            created_by_id=u1
        )
        s2 = VehicleServiceRecord(
            vehicle_id=v1.id,
            service_type="brakes",
            title="Výměna předních brzdových kotoučů a destiček",
            date="2025-03-10",
            mileage=148500,
            cost=6800.0,
            service_shop="Autoservis Novák & Syn",
            performed_operations="Nové přední kotouče Brembo 288 mm + brzdové destičky ATE, vyčištění a promazání vodítek, zkouška na brzdové stolici.",
            invoice_file_path=None,
            created_by_id=u1
        )
        s3 = VehicleServiceRecord(
            vehicle_id=v2.id,
            service_type="tires",
            title="Sezónní přezutí a vyvážení kol",
            date="2025-11-05",
            mileage=56200,
            cost=850.0,
            service_shop="Pneuservis Barum",
            performed_operations="Přezutí na zimní sadu, nové ventilky, dynamické vyvážení všech 4 kol, kontrola hloubky dezénu (5.5 mm).",
            invoice_file_path=None,
            created_by_id=u1
        )
        db.add_all([s1, s2, s3])
        db.commit()

    # 12. Seed Medicines, First Aid items and Schedules if none exist
    if db.query(Medicine).count() == 0:
        u1 = admin_user.id if admin_user else 1
        u_anna = user_anna.id if user_anna else u1

        exp_ok_future = (today + datetime.timedelta(days=450)).isoformat()
        exp_soon = (today + datetime.timedelta(days=22)).isoformat()  # Warning: expires in 22 days!
        exp_past = (today - datetime.timedelta(days=40)).isoformat()  # Expired!

        meds = [
            Medicine(
                name="Paralen 500",
                active_substance="Paracetamolum (500 mg)",
                form="tablets",
                category="pain_fever",
                location="bathroom",
                package_size="24 tablet",
                current_quantity=18.0,
                unit="tablety",
                min_quantity_warning=6.0,
                expiration_date=exp_ok_future,
                is_prescription=False,
                requires_refrigeration=False,
                age_group="adults_only",
                dosage_instructions="Dospělí 1-2 tablety dle potřeby, odstup min. 4 hodiny, max. 8 tablet denně. Nepřekračovat dávkování!",
                storage_instructions="Uchovávejte při teplotě do 25 °C v původním obalu.",
                sukl_code_or_url="https://www.sukl.cz/leciva/paralen-500",
                notes="Základní analgetikum a antipyretikum pro dospělé."
            ),
            Medicine(
                name="Ibalgin 400",
                active_substance="Ibuprofenum (400 mg)",
                form="tablets",
                category="pain_fever",
                location="bathroom",
                package_size="24 potahovaných tablet",
                current_quantity=12.0,
                unit="tablety",
                min_quantity_warning=4.0,
                expiration_date=exp_ok_future,
                is_prescription=False,
                requires_refrigeration=False,
                age_group="kids_from_12yo",
                dosage_instructions="1 tableta 3x denně po jídle, zapít dostatečným množstvím vody.",
                storage_instructions="Uchovávejte při teplotě do 25 °C v suchu.",
                sukl_code_or_url="https://www.sukl.cz/leciva/ibalgin-400",
                notes="Protizánětlivý lék, tlumí bolest kloubů, zubů a hlavy. Vždy užívat po jídle."
            ),
            Medicine(
                name="Olynth 0,1% nosní sprej",
                active_substance="Xylometazolini hydrochloridum (1 mg/ml)",
                form="spray",
                category="cold_cough",
                location="bedroom",
                package_size="10 ml",
                current_quantity=1.0,
                unit="ks",
                min_quantity_warning=1.0,
                expiration_date=exp_ok_future,
                opened_date=(today - datetime.timedelta(days=15)).isoformat(),
                validity_months_after_opening=12,
                is_prescription=False,
                requires_refrigeration=False,
                age_group="kids_from_6yo",
                dosage_instructions="1 vstřik do každé nosní dírky max 3x denně. Neužívat déle než 7 po sobě jdoucích dní!",
                notes="Uvolňuje ucpaný nos při rýmě. Pozor na vznik návyku (medikamentózní rýma)."
            ),
            Medicine(
                name="Nurofen pro děti Jahoda 4%",
                active_substance="Ibuprofenum (40 mg/ml – 200 mg v 5 ml)",
                form="syrup",
                category="pain_fever",
                location="kitchen",
                package_size="100 ml",
                current_quantity=60.0,
                unit="ml",
                min_quantity_warning=30.0,
                expiration_date=exp_ok_future,
                opened_date=(today - datetime.timedelta(days=45)).isoformat(),
                validity_months_after_opening=6,
                is_prescription=False,
                requires_refrigeration=False,
                age_group="infants",
                dosage_instructions="Dávkování dle váhy: cca 5-10 mg/kg na dávku. Pozor na 4% sílu – poloviční dávka v ml oproti 2% sirupu!",
                notes="Dětský sirup na horečku s dávkovací stříkačkou."
            ),
            Medicine(
                name="Fenistil gel",
                active_substance="Dimetindeni maleas (1 mg/g)",
                form="ointment",
                category="allergy",
                location="travel_kit",
                package_size="30 g",
                current_quantity=1.0,
                unit="tuba",
                min_quantity_warning=1.0,
                expiration_date=exp_ok_future,
                is_prescription=False,
                requires_refrigeration=False,
                age_group="all",
                dosage_instructions="Nanášet tenkou vrstvu 2-4x denně na postižené svědící místo.",
                notes="Vhodné na poštípání hmyzem, kopřivku a mírné spáleniny od slunce. V cestovní lékárničce."
            ),
            Medicine(
                name="Smecta",
                active_substance="Diosmectitum (3 g)",
                form="other",
                category="digestion",
                location="kitchen",
                package_size="10 sáčků",
                current_quantity=2.0,  # LOW STOCK!
                unit="sáčky",
                min_quantity_warning=4.0,
                expiration_date=exp_ok_future,
                is_prescription=False,
                requires_refrigeration=False,
                age_group="all",
                dosage_instructions="Obsah sáčku rozpustit v 50 ml vody nebo rozmíchat v přesnídávce. 1 sáček 3x denně.",
                notes="Přírodní jíl na akutní průjem a zažívací potíže. Zásoba dochází – koupit nové balení!"
            ),
            Medicine(
                name="Framykoin mast",
                active_substance="Bacitracinum zincum, Neomycini sulfas",
                form="ointment",
                category="injury_disinfection",
                location="bathroom",
                package_size="10 g",
                current_quantity=1.0,
                unit="tuba",
                min_quantity_warning=1.0,
                expiration_date=exp_soon,  # Expirace za 22 dní!
                is_prescription=True,
                requires_refrigeration=False,
                age_group="all",
                dosage_instructions="Nanést v tenké vrstvě na infikovanou ránu 1-3x denně.",
                notes="Antibiotická mast na hnisající oděrky a infikované ranky. Pozor – brzy expiruje!"
            ),
            Medicine(
                name="Visine Classic oční kapky",
                active_substance="Tetryzolini hydrochloridum (0,5 mg/ml)",
                form="drops",
                category="eyes_ears",
                location="bathroom",
                package_size="15 ml",
                current_quantity=1.0,
                unit="lahvička",
                min_quantity_warning=1.0,
                expiration_date=exp_ok_future,
                opened_date=(today - datetime.timedelta(days=45)).isoformat(),
                validity_months_after_opening=1,  # Expired after opening!
                is_prescription=False,
                requires_refrigeration=False,
                age_group="adults_only",
                dosage_instructions="1-2 kapky do postiženého oka 2-3x denně.",
                notes="Otevřeno před 45 dny, použitelnost po otevření je jen 1 měsíc – vyhodit/odevzdat v lékárně!"
            ),
            Medicine(
                name="Prenessa 4 mg",
                active_substance="Perindoprilum erbumenum (4 mg)",
                form="tablets",
                category="chronic_rx",
                location="bedroom",
                package_size="30 tablet",
                current_quantity=22.0,
                unit="tablety",
                min_quantity_warning=7.0,
                expiration_date=exp_ok_future,
                is_prescription=True,
                requires_refrigeration=False,
                age_group="adults_only",
                dosage_instructions="1 tableta ráno nalačno, zapít sklenicí vody.",
                notes="Pravidelný lék na snížení vysokého krevního tlaku. Užívat nepřetržitě.",
                assigned_user_id=u1
            ),
            Medicine(
                name="Sterilní obvaz č. 3 s jedním polštářkem",
                active_substance=None,
                form="dressing",
                category="first_aid_material",
                location="car",
                package_size="1 ks",
                current_quantity=2.0,
                unit="ks",
                min_quantity_warning=2.0,
                expiration_date=exp_ok_future,
                is_prescription=False,
                requires_refrigeration=False,
                age_group="all",
                notes="Součást povinné výbavy autolékárničky. Šířka polštářku 8 cm."
            )
        ]
        db.add_all(meds)
        db.commit()

        # Seed Medication Schedule for chronic blood pressure medication
        prenessa = db.query(Medicine).filter(Medicine.name == "Prenessa 4 mg").first()
        if prenessa:
            sched = MedicationSchedule(
                medicine_id=prenessa.id,
                user_id=u1,
                schedule_type="chronic",
                start_date=(today - datetime.timedelta(days=60)).isoformat(),
                times_per_day=1,
                time_slots=json.dumps(["morning"]),
                food_relation="before_food",
                dosage_per_take="1 tableta (4 mg)",
                is_active=True,
                notes="Užívat každé ráno ihned po probuzení před snídaní."
            )
            db.add(sched)
            db.commit()
            db.refresh(sched)

            # Log today's morning dose as taken
            log_today = MedicationLog(
                schedule_id=sched.id,
                medicine_id=prenessa.id,
                user_id=u1,
                taken_at=datetime.datetime.utcnow().replace(hour=7, minute=30),
                time_slot="morning",
                dose_taken="1 tableta (4 mg)",
                status="taken",
                notes="Užito včas se sklenicí vody."
            )
            db.add(log_today)
            db.commit()



