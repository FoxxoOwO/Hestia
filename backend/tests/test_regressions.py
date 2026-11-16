"""Regrese na konkrétní opravené chyby (data + výpočty)."""
import datetime

from app.models.meal_plan import MealPlanItem
from app.models.pantry import PantryItem
from app.models.recipe import Recipe
from app.models.vehicle import Vehicle, VehicleRefueling
from app.routers.finance import _month_prefix
from app.routers.vehicles import _format_vehicle_response
from tests.conftest import API


def _make_recipe(db, title, ingredients, default_servings=4):
    recipe = Recipe(
        title=title,
        ingredients=ingredients,
        instructions=[{"step": 1, "text": "Smíchat"}],
        default_servings=default_servings,
    )
    db.add(recipe)
    db.commit()
    db.refresh(recipe)
    return recipe


def test_cost_per_km_uses_real_kilometres(db):
    """Dřív se dělilo boolem (`km_tracked > 0`), takže cena/km byla celková suma."""
    vehicle = Vehicle(name="Test", make="Škoda", model="Fabia", license_plate="1AB 2345")
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    db.add_all([
        VehicleRefueling(vehicle_id=vehicle.id, date="2026-01-01", mileage=100_000,
                         fuel_amount_l=40, total_price=1000),
        VehicleRefueling(vehicle_id=vehicle.id, date="2026-02-01", mileage=100_500,
                         fuel_amount_l=40, total_price=2000),
    ])
    db.commit()
    db.refresh(vehicle)

    data = _format_vehicle_response(vehicle)
    assert data.total_spent_fuel == 3000
    assert data.cost_per_km == 6.0  # 3000 Kč / 500 km


def test_generate_shopping_handles_null_servings(client, auth, db):
    """MealPlanItem.servings == None dřív shodilo /generate-shopping na 500."""
    recipe = _make_recipe(db, f"Test polévka {datetime.datetime.now().timestamp()}",
                          [{"name": "Cibule", "amount": 2, "unit": "ks"}])
    today = datetime.date.today().isoformat()
    item = MealPlanItem(date=today, meal_type="dinner", recipe_id=recipe.id, servings=None)
    db.add(item)
    db.commit()

    response = client.post(
        f"{API}/meal-plans/generate-shopping",
        json={"start_date": today, "end_date": today, "check_pantry": False},
        headers=auth,
    )
    assert response.status_code == 200, response.text
    assert response.json()["added_items_count"] >= 1


def test_pantry_match_survives_broken_ingredients(client, auth, db):
    """Chybějící/nečíselné amount ani ne-dict položka nesmí shodit matchování."""
    _make_recipe(
        db,
        f"Test recept {datetime.datetime.now().timestamp()}",
        [
            {"name": "Mouka"},
            {"name": "Sůl", "amount": None},
            {"name": "Cukr", "amount": "hodně"},
            "nesmysl",
        ],
    )
    db.add(PantryItem(name="Mouka", quantity=1.0, unit="kg"))
    db.commit()

    response = client.get(f"{API}/pantry/match-recipes", headers=auth)
    assert response.status_code == 200, response.text
    assert isinstance(response.json(), list)


def test_month_prefix_rejects_wildcards_and_garbage():
    assert _month_prefix("2026-03") == "2026-03"
    assert _month_prefix("%") == datetime.date.today().strftime("%Y-%m")
    assert _month_prefix("2026-13") == datetime.date.today().strftime("%Y-%m")
    assert _month_prefix("") == datetime.date.today().strftime("%Y-%m")
    assert _month_prefix("2026-03%") == datetime.date.today().strftime("%Y-%m")


def test_finance_summary_ignores_malformed_month(client, auth):
    response = client.get(f"{API}/finance/summary", params={"month": "%"}, headers=auth)
    assert response.status_code == 200, response.text


def test_assets_and_meal_plans_record_activity_logs(client, auth, db):
    """Assets a meal plans dřív tiše selhávaly kvůli špatným argumentům log_activity."""
    from app.models.activity import ActivityLog

    asset_res = client.post(
        f"{API}/assets",
        json={"name": "Testovací myčka", "category": "large_appliance", "room": "kitchen"},
        headers=auth,
    )
    assert asset_res.status_code == 201, asset_res.text
    asset_id = asset_res.json()["id"]

    logs = db.query(ActivityLog).filter(
        ActivityLog.module == "assets", ActivityLog.entity_id == asset_id
    ).all()
    assert len(logs) == 1

    today = datetime.date.today().isoformat()
    mp_res = client.post(
        f"{API}/meal-plans",
        json={"date": today, "meal_type": "lunch", "custom_title": "Bramborový salát", "servings": 2},
        headers=auth,
    )
    assert mp_res.status_code == 201, mp_res.text
    mp_id = mp_res.json()["id"]

    mp_logs = db.query(ActivityLog).filter(
        ActivityLog.module == "meal_plans", ActivityLog.entity_id == mp_id
    ).all()
    assert len(mp_logs) == 1


def test_backup_export_and_import_preserves_assets_and_meal_plans(db):
    """Export/import musí zachovat spotřebiče, jídelníček i vazby uživatel/recept."""
    from app.models.asset import Asset
    from app.models.user import User
    from app.services.backup_service import export_all_data, import_data

    user = db.query(User).first()
    recipe = _make_recipe(db, "Backup Recept", [{"name": "Brambory", "amount": 500, "unit": "g"}])
    asset = Asset(name="Backup Sušička", category="large_appliance", room="bathroom")
    db.add(asset)
    db.flush()

    today = datetime.date.today().isoformat()
    mp = MealPlanItem(date=today, meal_type="dinner", recipe_id=recipe.id, custom_title="Večeře", created_by_id=user.id)
    db.add(mp)
    db.commit()

    exported = export_all_data(db, user=user)
    assert any(a["name"] == "Backup Sušička" for a in exported["data"]["assets"])
    assert any(m["custom_title"] == "Večeře" for m in exported["data"]["meal_plans"])

    result = import_data(db, exported, mode="replace", current_user=user)
    assert result["imported_counts"]["assets"] >= 1
    assert result["imported_counts"]["meal_plans"] >= 1
    restored_mp = db.query(MealPlanItem).filter(MealPlanItem.custom_title == "Večeře").first()
    assert restored_mp is not None
    assert restored_mp.recipe is not None and restored_mp.recipe.title == "Backup Recept"


def test_subscription_quarterly_monthly_equivalent(client, auth):
    """POST/PUT /finance/subscriptions musí dělit čtvrtletní platbu 3, ne 12."""
    res = client.post(
        f"{API}/finance/subscriptions",
        json={
            "name": "Čtvrtletní voda",
            "amount": 900.0,
            "billing_cycle": "quarterly",
            "next_billing_date": datetime.date.today().isoformat(),
            "category": "utilities",
        },
        headers=auth,
    )
    assert res.status_code == 201, res.text
    assert res.json()["monthly_equivalent"] == 300.0

    sub_id = res.json()["id"]
    upd = client.put(
        f"{API}/finance/subscriptions/{sub_id}",
        json={"amount": 1200.0, "billing_cycle": "quarterly"},
        headers=auth,
    )
    assert upd.status_code == 200, upd.text
    assert upd.json()["monthly_equivalent"] == 400.0


def test_pantry_match_ignores_zero_quantity_and_empty_names(client, auth, db):
    """Položka spíže s quantity == 0 se nesmí počítat jako dostupná."""
    recipe = _make_recipe(
        db,
        f"Test nulová zásoba {datetime.datetime.now().timestamp()}",
        [{"name": "Avokádo", "amount": 1, "unit": "ks"}],
    )
    db.add(PantryItem(name="Avokádo", quantity=0.0, unit="ks"))
    db.commit()

    res = client.get(f"{API}/pantry/match-recipes", headers=auth)
    assert res.status_code == 200, res.text
    match = next((m for m in res.json() if m["recipe_id"] == recipe.id), None)
    assert match is not None
    assert match["matched_ingredients_count"] == 0
    assert match["can_cook_now"] is False


def test_deleting_recipe_unlinks_meal_plans(client, auth, db):
    """Smazání receptu musí odpojit recipe_id v jídelníčku místo sirotka/FK chyby."""
    recipe = _make_recipe(db, "Recept ke smazání", [{"name": "Rýže", "amount": 200, "unit": "g"}])
    today = datetime.date.today().isoformat()
    mp = MealPlanItem(date=today, meal_type="lunch", recipe_id=recipe.id, custom_title="Rizoto")
    db.add(mp)
    db.commit()
    mp_id = mp.id

    del_res = client.delete(f"{API}/recipes/{recipe.id}", headers=auth)
    assert del_res.status_code == 200, del_res.text

    db.expire_all()
    updated_mp = db.query(MealPlanItem).filter(MealPlanItem.id == mp_id).first()
    assert updated_mp is not None
    assert updated_mp.recipe_id is None
