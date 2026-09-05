import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.vehicle import Vehicle, VehicleRefueling, VehicleServiceRecord
from app.models.finance import FinanceTransaction
from app.schemas.vehicle import (
    VehicleCreate, VehicleUpdate, VehicleMileageUpdate, VehicleResponse,
    VehicleRefuelingCreate, VehicleRefuelingResponse,
    VehicleServiceRecordCreate, VehicleServiceRecordResponse,
    VehicleFleetStatsResponse
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/vehicles", tags=["Vehicles & Fleet"])


def _calculate_days_diff(target_date_str: Optional[str]) -> Optional[int]:
    if not target_date_str:
        return None
    try:
        target_date = datetime.date.fromisoformat(target_date_str)
        today = datetime.date.today()
        return (target_date - today).days
    except Exception:
        return None


def _format_vehicle_response(vehicle: Vehicle) -> VehicleResponse:
    today = datetime.date.today()

    # 1. MOT / STK
    mot_days = _calculate_days_diff(vehicle.mot_expiry_date)
    if mot_days is None:
        mot_status = "ok"
    elif mot_days < 0:
        mot_status = "expired"
    elif mot_days <= 30:
        mot_status = "warning"
    else:
        mot_status = "ok"

    # 2. Vignette (Dálniční známka)
    vignette_days = _calculate_days_diff(vehicle.vignette_expiry_date)
    if not vehicle.vignette_expiry_date or vehicle.vignette_type == "none":
        vignette_status = "none"
    elif vignette_days is not None and vignette_days < 0:
        vignette_status = "expired"
    elif vignette_days is not None and vignette_days <= 30:
        vignette_status = "warning"
    else:
        vignette_status = "ok"

    # 3. Insurance (Pojištění POV / HAV)
    ins_days = _calculate_days_diff(vehicle.insurance_expiry_date)
    if ins_days is None:
        ins_status = "ok"
    elif ins_days < 0:
        ins_status = "expired"
    elif ins_days <= 30:
        ins_status = "warning"
    else:
        ins_status = "ok"

    # 4. First Aid Kit
    first_aid_days = _calculate_days_diff(vehicle.first_aid_kit_expiry_date)

    # 5. Oil Change
    oil_km_remaining = None
    if vehicle.last_oil_change_mileage is not None and vehicle.oil_change_interval_km:
        target_mileage = vehicle.last_oil_change_mileage + vehicle.oil_change_interval_km
        oil_km_remaining = target_mileage - (vehicle.current_mileage or 0)

    oil_days_remaining = None
    if vehicle.last_oil_change_date and vehicle.oil_change_interval_months:
        try:
            last_date = datetime.date.fromisoformat(vehicle.last_oil_change_date)
            # Add months approximately
            approx_days = int(vehicle.oil_change_interval_months * 30.4375)
            target_date = last_date + datetime.timedelta(days=approx_days)
            oil_days_remaining = (target_date - today).days
        except Exception:
            oil_days_remaining = None

    if (oil_km_remaining is not None and oil_km_remaining < 0) or (oil_days_remaining is not None and oil_days_remaining < 0):
        oil_status = "expired"
    elif (oil_km_remaining is not None and oil_km_remaining <= 1000) or (oil_days_remaining is not None and oil_days_remaining <= 30):
        oil_status = "warning"
    else:
        oil_status = "ok"

    # 6. Overall Status
    critical_conditions = [mot_status == "expired", vignette_status == "expired", ins_status == "expired", oil_status == "expired"]
    warning_conditions = [mot_status == "warning", vignette_status == "warning", ins_status == "warning", oil_status == "warning"]

    if any(critical_conditions):
        overall_status = "critical"
    elif any(warning_conditions):
        overall_status = "warning"
    else:
        overall_status = "ok"

    # 7. Consumption & Costs
    refuelings = vehicle.refuelings or []
    total_spent_fuel = round(sum(r.total_price for r in refuelings), 2)

    valid_consumptions = [r.calculated_consumption for r in refuelings if r.calculated_consumption is not None]
    avg_consumption = round(sum(valid_consumptions) / len(valid_consumptions), 2) if valid_consumptions else None

    service_records = vehicle.service_records or []
    total_spent_service = round(sum(s.cost for s in service_records), 2)

    # Cost per km calculation
    cost_per_km = None
    if refuelings and len(refuelings) >= 2:
        mileages = [r.mileage for r in refuelings]
        km_tracked = max(mileages) - min(mileages)
        if km_diff := km_tracked > 0:
            cost_per_km = round((total_spent_fuel + total_spent_service) / km_tracked, 2)
    elif vehicle.current_mileage and vehicle.current_mileage > 0 and (total_spent_fuel > 0 or total_spent_service > 0):
        cost_per_km = round((total_spent_fuel + total_spent_service) / vehicle.current_mileage, 2)

    data = VehicleResponse.model_validate(vehicle)
    data.mot_days_remaining = mot_days
    data.mot_status = mot_status
    data.vignette_days_remaining = vignette_days
    data.vignette_status = vignette_status
    data.insurance_days_remaining = ins_days
    data.insurance_status = ins_status
    data.first_aid_days_remaining = first_aid_days
    data.oil_change_km_remaining = oil_km_remaining
    data.oil_change_days_remaining = oil_days_remaining
    data.oil_status = oil_status
    data.overall_status = overall_status
    data.average_consumption = avg_consumption
    data.total_spent_fuel = total_spent_fuel
    data.total_spent_service = total_spent_service
    data.cost_per_km = cost_per_km

    return data


# ==========================================
# FLEET STATS
# ==========================================
@router.get("/stats", response_model=VehicleFleetStatsResponse)
def get_fleet_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vehicles = db.query(Vehicle).all()
    total_vehicles = len(vehicles)

    warning_count = 0
    expired_count = 0
    total_spent_fuel_all = 0.0
    total_spent_service_all = 0.0
    all_consumptions = []

    for v in vehicles:
        res = _format_vehicle_response(v)
        if res.overall_status == "critical":
            expired_count += 1
        elif res.overall_status == "warning":
            warning_count += 1

        total_spent_fuel_all += res.total_spent_fuel
        total_spent_service_all += res.total_spent_service
        if res.average_consumption:
            all_consumptions.append(res.average_consumption)

    fleet_avg = round(sum(all_consumptions) / len(all_consumptions), 2) if all_consumptions else None

    return VehicleFleetStatsResponse(
        total_vehicles=total_vehicles,
        warning_deadlines_count=warning_count,
        expired_deadlines_count=expired_count,
        total_spent_fuel_all=round(total_spent_fuel_all, 2),
        total_spent_service_all=round(total_spent_service_all, 2),
        fleet_average_consumption=fleet_avg
    )


# ==========================================
# VEHICLE CRUD
# ==========================================
@router.get("", response_model=List[VehicleResponse])
def get_vehicles(
    query: Optional[str] = Query(None),
    favorite_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Vehicle)
    if favorite_only:
        q = q.filter(Vehicle.is_favorite == True)
    if query:
        term = f"%{query.strip()}%"
        q = q.filter(
            (Vehicle.name.ilike(term)) |
            (Vehicle.make.ilike(term)) |
            (Vehicle.model.ilike(term)) |
            (Vehicle.license_plate.ilike(term)) |
            (Vehicle.vin.ilike(term))
        )

    vehicles = q.order_by(Vehicle.is_favorite.desc(), Vehicle.name.asc()).all()
    return [_format_vehicle_response(v) for v in vehicles]


@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    payload: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vehicle_data = payload.model_dump()
    vehicle = Vehicle(**vehicle_data, created_by_id=current_user.id)
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return _format_vehicle_response(vehicle)


@router.get("/{id}", response_model=VehicleResponse)
def get_vehicle(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vozidlo nebylo nalezeno")
    return _format_vehicle_response(vehicle)


@router.put("/{id}", response_model=VehicleResponse)
def update_vehicle(
    id: int,
    payload: VehicleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vozidlo nebylo nalezeno")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(vehicle, k, v)

    db.commit()
    db.refresh(vehicle)
    return _format_vehicle_response(vehicle)


@router.delete("/{id}")
def delete_vehicle(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vozidlo nebylo nalezeno")

    db.delete(vehicle)
    db.commit()
    return {"status": "success", "message": "Vozidlo bylo úspěšně odstraněno"}


@router.post("/{id}/mileage", response_model=VehicleResponse)
def update_vehicle_mileage(
    id: int,
    payload: VehicleMileageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vozidlo nebylo nalezeno")

    if payload.mileage < (vehicle.current_mileage or 0):
        raise HTTPException(status_code=400, detail="Nový stav tachometru nemůže být nižší než stávající")

    vehicle.current_mileage = payload.mileage
    db.commit()
    db.refresh(vehicle)
    return _format_vehicle_response(vehicle)


# ==========================================
# REFUELING ENDPOINTS
# ==========================================
@router.post("/{id}/refuelings", response_model=VehicleRefuelingResponse, status_code=status.HTTP_201_CREATED)
def add_refueling(
    id: int,
    payload: VehicleRefuelingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vozidlo nebylo nalezeno")

    # Automatic consumption calculation:
    # Find the most recent previous refueling with is_full_tank == True and mileage < payload.mileage
    calculated_consumption = None
    prev_refueling = (
        db.query(VehicleRefueling)
        .filter(VehicleRefueling.vehicle_id == id, VehicleRefueling.mileage < payload.mileage, VehicleRefueling.is_full_tank == True)
        .order_by(VehicleRefueling.mileage.desc())
        .first()
    )

    if prev_refueling and payload.is_full_tank:
        distance = payload.mileage - prev_refueling.mileage
        if distance > 0:
            calculated_consumption = round((payload.fuel_amount_l / distance) * 100, 2)

    # Automatically derive price_per_l if not set
    price_per_l = payload.price_per_l
    if not price_per_l and payload.fuel_amount_l > 0:
        price_per_l = round(payload.total_price / payload.fuel_amount_l, 2)

    refueling = VehicleRefueling(
        vehicle_id=id,
        date=payload.date,
        mileage=payload.mileage,
        fuel_amount_l=payload.fuel_amount_l,
        price_per_l=price_per_l,
        total_price=payload.total_price,
        is_full_tank=payload.is_full_tank,
        fuel_brand=payload.fuel_brand,
        calculated_consumption=calculated_consumption,
        notes=payload.notes,
        created_by_id=current_user.id
    )
    db.add(refueling)

    # Update vehicle mileage if this refueling has a higher mileage
    if payload.mileage > (vehicle.current_mileage or 0):
        vehicle.current_mileage = payload.mileage

    # Optional finance integration:
    if payload.record_to_finance:
        finance_tx = FinanceTransaction(
            title=f"Tankování {vehicle.name} ({payload.fuel_amount_l} l)",
            amount=payload.total_price,
            transaction_type="expense",
            category="transport",
            date=payload.date,
            payer_id=current_user.id,
            is_shared=True,
            notes=f"Stav km: {payload.mileage} | Čerpací stanice: {payload.fuel_brand or 'Nezadáno'}"
        )
        db.add(finance_tx)

    db.commit()
    db.refresh(refueling)
    return refueling


@router.get("/{id}/refuelings", response_model=List[VehicleRefuelingResponse])
def get_vehicle_refuelings(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vozidlo nebylo nalezeno")

    return (
        db.query(VehicleRefueling)
        .filter(VehicleRefueling.vehicle_id == id)
        .order_by(VehicleRefueling.mileage.desc(), VehicleRefueling.date.desc())
        .all()
    )


@router.delete("/{id}/refuelings/{refueling_id}")
def delete_refueling(
    id: int,
    refueling_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    refueling = db.query(VehicleRefueling).filter(VehicleRefueling.id == refueling_id, VehicleRefueling.vehicle_id == id).first()
    if not refueling:
        raise HTTPException(status_code=404, detail="Záznam o tankování nebyl nalezen")

    db.delete(refueling)
    db.commit()
    return {"status": "success", "message": "Záznam o tankování byl smazán"}


# ==========================================
# SERVICE RECORD ENDPOINTS
# ==========================================
@router.post("/{id}/services", response_model=VehicleServiceRecordResponse, status_code=status.HTTP_201_CREATED)
def add_service_record(
    id: int,
    payload: VehicleServiceRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vozidlo nebylo nalezeno")

    service = VehicleServiceRecord(
        vehicle_id=id,
        service_type=payload.service_type,
        title=payload.title,
        date=payload.date,
        mileage=payload.mileage,
        cost=payload.cost,
        service_shop=payload.service_shop,
        performed_operations=payload.performed_operations,
        invoice_file_path=payload.invoice_file_path,
        created_by_id=current_user.id
    )
    db.add(service)

    # If this was an oil change or regular service, update vehicle's last oil change markers
    if payload.service_type in ["oil_change", "regular_service"]:
        vehicle.last_oil_change_mileage = payload.mileage
        vehicle.last_oil_change_date = payload.date

    # Update current mileage if service has higher mileage
    if payload.mileage > (vehicle.current_mileage or 0):
        vehicle.current_mileage = payload.mileage

    # Optional finance integration:
    if payload.record_to_finance and payload.cost > 0:
        finance_tx = FinanceTransaction(
            title=f"Servis {vehicle.name}: {payload.title}",
            amount=payload.cost,
            transaction_type="expense",
            category="transport",
            date=payload.date,
            payer_id=current_user.id,
            is_shared=True,
            notes=f"Servis: {payload.service_shop or 'Nezadáno'} | Stav km: {payload.mileage}"
        )
        db.add(finance_tx)

    db.commit()
    db.refresh(service)
    return service


@router.get("/{id}/services", response_model=List[VehicleServiceRecordResponse])
def get_vehicle_service_records(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vozidlo nebylo nalezeno")

    return (
        db.query(VehicleServiceRecord)
        .filter(VehicleServiceRecord.vehicle_id == id)
        .order_by(VehicleServiceRecord.date.desc(), VehicleServiceRecord.mileage.desc())
        .all()
    )


@router.delete("/{id}/services/{service_id}")
def delete_service_record(
    id: int,
    service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = db.query(VehicleServiceRecord).filter(VehicleServiceRecord.id == service_id, VehicleServiceRecord.vehicle_id == id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Servisní záznam nebyl nalezen")

    db.delete(service)
    db.commit()
    return {"status": "success", "message": "Servisní záznam byl smazán"}
