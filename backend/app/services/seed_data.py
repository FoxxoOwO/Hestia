from sqlalchemy.orm import Session
from app.models.user import User
from app.models.recipe import Recipe
from app.models.pantry import PantryItem
from app.models.shopping import ShoppingItem
from app.models.plant import Plant, PlantTask, PlantLogEntry
from app.models.pet import Pet, PetMedicalRecord, PetMedication, PetWeightLog, PetTask, PetLogEntry
from app.models.chore import Chore, ChoreCompletion, ChoreReward, ChoreRewardRedemption
from app.models.finance import FinanceTransaction, CategoryBudget, Subscription, SavingsGoal, UserFinanceProfile
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


