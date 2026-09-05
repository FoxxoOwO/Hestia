import datetime
import json
from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.shopping import ShoppingItem
from app.models.medicine import Medicine, MedicationSchedule, MedicationLog
from app.schemas.medicine import (
    MedicineCreate, MedicineUpdate, MedicineResponse,
    MedicationScheduleCreate, MedicationScheduleUpdate, MedicationScheduleResponse,
    MedicationLogCreate, MedicationLogResponse,
    MedicineStatsResponse,
    PediatricDosageResponse, PediatricPreparation,
    FirstAidGuideItem
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/medicines", tags=["Medicines & First Aid"])


def _calculate_days_diff(target_date_str: Optional[str]) -> Optional[int]:
    if not target_date_str:
        return None
    try:
        target_date = datetime.date.fromisoformat(target_date_str)
        today = datetime.date.today()
        return (target_date - today).days
    except Exception:
        return None


def _format_medicine_response(m: Medicine, db: Session) -> MedicineResponse:
    today = datetime.date.today()

    # 1. Check expiration date
    days_until_exp = _calculate_days_diff(m.expiration_date)
    if days_until_exp is None:
        expiration_status = "unknown"
    elif days_until_exp < 0:
        expiration_status = "expired"
    elif days_until_exp <= 60:
        expiration_status = "warning"
    else:
        expiration_status = "ok"

    # 2. Check validity after opening
    after_opening_expired = False
    if m.opened_date and m.validity_months_after_opening:
        try:
            opened = datetime.date.fromisoformat(m.opened_date)
            # Approx 30 days per month
            max_days = m.validity_months_after_opening * 30
            if (today - opened).days > max_days:
                after_opening_expired = True
                expiration_status = "expired"
        except Exception:
            pass

    # 3. Low stock check
    is_low_stock = False
    if m.min_quantity_warning and m.min_quantity_warning > 0:
        if m.current_quantity <= m.min_quantity_warning:
            is_low_stock = True

    # 4. Assigned user name
    assigned_user_name = None
    if m.assigned_user_id:
        u = db.query(User).filter(User.id == m.assigned_user_id).first()
        if u:
            assigned_user_name = u.display_name or u.username

    return MedicineResponse(
        id=m.id,
        name=m.name,
        active_substance=m.active_substance,
        form=m.form,
        category=m.category,
        location=m.location,
        package_size=m.package_size,
        current_quantity=m.current_quantity,
        unit=m.unit,
        min_quantity_warning=m.min_quantity_warning,
        expiration_date=m.expiration_date,
        opened_date=m.opened_date,
        validity_months_after_opening=m.validity_months_after_opening,
        is_prescription=m.is_prescription,
        requires_refrigeration=m.requires_refrigeration,
        age_group=m.age_group,
        dosage_instructions=m.dosage_instructions,
        storage_instructions=m.storage_instructions,
        sukl_code_or_url=m.sukl_code_or_url,
        notes=m.notes,
        assigned_user_id=m.assigned_user_id,
        created_at=m.created_at,
        updated_at=m.updated_at,
        days_until_expiration=days_until_exp,
        expiration_status=expiration_status,
        after_opening_expired=after_opening_expired,
        is_low_stock=is_low_stock,
        assigned_user_name=assigned_user_name
    )


# ==========================================
# 1. STATS
# ==========================================
@router.get("/stats", response_model=MedicineStatsResponse)
def get_medicine_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    medicines = db.query(Medicine).all()
    today = datetime.date.today()

    total_items = len(medicines)
    expired_count = 0
    expiring_soon_count = 0
    low_stock_count = 0
    prescription_count = 0
    requires_fridge_count = 0

    locations_count: Dict[str, int] = {}
    categories_count: Dict[str, int] = {}

    for m in medicines:
        # Category counter
        categories_count[m.category] = categories_count.get(m.category, 0) + 1
        # Location counter
        locations_count[m.location] = locations_count.get(m.location, 0) + 1

        if m.is_prescription:
            prescription_count += 1
        if m.requires_refrigeration:
            requires_fridge_count += 1
        if m.min_quantity_warning > 0 and m.current_quantity <= m.min_quantity_warning:
            low_stock_count += 1

        # Expiry calculation
        is_expired = False
        days = _calculate_days_diff(m.expiration_date)
        if days is not None:
            if days < 0:
                is_expired = True
                expired_count += 1
            elif days <= 60:
                expiring_soon_count += 1

        # Check after-opening expiration
        if not is_expired and m.opened_date and m.validity_months_after_opening:
            try:
                opened = datetime.date.fromisoformat(m.opened_date)
                if (today - opened).days > (m.validity_months_after_opening * 30):
                    expired_count += 1
            except Exception:
                pass

    active_schedules_count = db.query(MedicationSchedule).filter(MedicationSchedule.is_active == True).count()

    return MedicineStatsResponse(
        total_items=total_items,
        expired_count=expired_count,
        expiring_soon_count=expiring_soon_count,
        low_stock_count=low_stock_count,
        prescription_count=prescription_count,
        requires_fridge_count=requires_fridge_count,
        active_schedules_count=active_schedules_count,
        locations_count=locations_count,
        categories_count=categories_count
    )


# ==========================================
# 2. FIRST AID GUIDES & PEDIATRIC DOSAGE
# ==========================================
FIRST_AID_GUIDES = [
    FirstAidGuideItem(
        id="burns",
        title="Popáleniny a opaření",
        category="trauma",
        urgency="high",
        emergency_call="155",
        summary="Okamžité a dostatečně dlouhé chlazení čistou studenou vodou (10-20 minut) je nejdůležitější krok.",
        action_steps=[
            "Okamžitě chlaďte proudem čisté studené (nikoliv ledové!) vody po dobu alespoň 10-20 minut.",
            "Sundejte prstýnky, hodinky a volné oblečení, dokud tkáň neoteče.",
            "Po ochlazení sterilně překryjte nepřilnavým krytím (např. mastný tyl, sterilní čtverec, čistá potravinářská fólie).",
            "Při popálení u dětí, na obličeji, krku, dlaních, genitáliích nebo při ploše větší než dlaň volejte ZZS 155."
        ],
        dont_do_steps=[
            "NIKDY nestrhávejte přiškvařené oděvy z rány.",
            "NIKDY nepropichujte vzniklé puchýře.",
            "NIKDY nemažte čerstvou popáleninu máslem, olejem, sádlem ani mastmi (Framykoin apod.) před lékařským ošetřením.",
            "Nepoužívejte led přímo na kůži – hrozí omrzliny a další poškození tkáně."
        ],
        note="U rozsáhlých popálenin chlaďte pouze lokálně, aby nedošlo k podchlazení organismu!"
    ),
    FirstAidGuideItem(
        id="intoxication",
        title="Otrava léky, saponáty nebo houbami",
        category="intoxication",
        urgency="critical",
        emergency_call="224 91 92 93",
        summary="Toxikologické informační středisko (TIS) Praha poskytuje nepřetržitou pomoc. Mějte po ruce krabičku nebo složení požité látky.",
        action_steps=[
            "Okamžitě volejte Toxikologické informační středisko (TIS): 224 91 92 93 nebo 224 91 54 02.",
            "Zjistěte přesný název požité látky, odhadované množství, čas požití a hmotnost/věk postiženého.",
            "Při poruše vědomí nebo dechu volejte ihned Zdravotnickou záchrannou službu 155.",
            "Schovejte obal od léku, zbytky rostliny/houby nebo saponátu pro záchranáře a lékaře."
        ],
        dont_do_steps=[
            "NIKDY nevyvolávejte zvracení po požití kyselin, louhů, benzínu, leštidel nebo pěnivých saponátů (hrozí poleptání jícnu nebo vdechnutí pěny do plic!).",
            "NIKDY nepodávejte mléko – u řady toxinů urychluje vstřebávání tukem rozpustných jedů.",
            "Nepodávejte živočišné uhlí bez předchozí konzultace s TIS (uhlí je neúčinné např. u alkoholů, solí železa, lithia a kyselin)."
        ],
        note="TIS Praha je k dispozici 24/7 zdarma pro celou ČR."
    ),
    FirstAidGuideItem(
        id="febrile_seizures",
        title="Febrilní křeče a vysoká horečka u dětí",
        category="emergency",
        urgency="critical",
        emergency_call="155",
        summary="Záchvat křečí u dítěte s horečkou bývá šokující pro rodiče, ale klíčové je zachovat klid, zajistit bezpečí a volat 155.",
        action_steps=[
            "Zavolejte okamžitě 155 (při každém prvním záchvatu febrilních křečí v životě dítěte).",
            "Položte dítě na měkkou podložku na bok (zotavovací poloha), aby nezapadl jazyk a odtekly případné sliny nebo zvratky.",
            "Odstraňte z okolí ostré předměty, o které by se dítě mohlo uhodit.",
            "Uvolněte oděv kolem krku a zajistěte přístup čerstvého vzduchu.",
            "Sledujte čas trvání záchvatu (důležitá informace pro lékaře). Pokud má dítě lékařem předepsaný diazepam (např. rektální tubu), aplikujte dle instrukcí."
        ],
        dont_do_steps=[
            "NIKDY nedávejte dítěti nic do úst (žádné lžičky, prsty ani léky) a nepokoušejte se násilím otevírat sevřené čelisti.",
            "NIKDY dítě při křečích nebrzděte ani křečovitě nedržte.",
            "NIKDY nepodávejte během záchvatu kapky, sirupy ani tekutiny – hrozí udušení.",
            "Nedávejte dítě do ledové vody při záchvatu."
        ],
        note="Po odeznění křečí (obvykle 1-3 minuty) zůstává dítě spavé a vyčerpané. Chlaďte vlažnými obklady na třísla/čelo."
    ),
    FirstAidGuideItem(
        id="choking",
        title="Dušení cizím tělesem (vdechnutí předmětu)",
        category="emergency",
        urgency="critical",
        emergency_call="155",
        summary="Rychlý zásah při neprůchodnosti dýchacích cest: údery mezi lopatky a Heimlichův manévr.",
        action_steps=[
            "Pokud postižený kašle, POVZBUZUJTE HO KE KAŠLI – je to nejúčinnější obranný reflex.",
            "Pokud nemůže mluvit, sípá a modrá: Předkloňte jej a aplikujte až 5 rázných úderů dlaní mezi lopatky.",
            "Pokud údery nezaberou: Proveďte Heimlichův manévr (postavte se za postiženého, sevřete pěst, položte nad pupík pod hrudní kost a druhou rukou prudce trhněte k sobě a nahoru) – až 5krát.",
            "Střídejte 5 úderů mezi lopatky a 5 stlačení břicha (Heimlich).",
            "U kojenců: položte dítě na své předloktí obličejem dolů hlavou níže než tělo, 5 úderů do zad; pak otočte na záda a 5 stlačení hrudníku dvěma prsty."
        ],
        dont_do_steps=[
            "NIKDY neprovádějte Heimlichův manévr u kojenců a těhotných žen (u těhotných se stlačuje hrudník, nikoliv břicho!).",
            "NIKDY nelovte cizí těleso v krku naslepo prstem – můžete jej zatlačit ještě hlouběji!"
        ],
        note="Při bezvědomí zahajte neprodleně nepřímou masáž srdce (100-120/min uprostřed hrudníku) a volejte 155."
    ),
    FirstAidGuideItem(
        id="severe_bleeding",
        title="Masivní krvácení a hluboké řezné rány",
        category="trauma",
        urgency="critical",
        emergency_call="155",
        summary="Okamžitý tlak přímo v ráně je prioritou číslo jedna pro záchranu života.",
        action_steps=[
            "Ihned stlačte ránu rukou (ideálně přes čistou tkaninu, obvaz nebo alespoň igelit pro ochranu před infekcí).",
            "Položte postiženého na zem a zvedněte krvácející končetinu nad úroveň srdce.",
            "Vytvořte tlakový obvaz (krycí vrstva na ránu + nerozvinutý smotek obvazu jako tlakové těleso + pevné omotání).",
            "Při masivním tepenném stříkavém krvácení, které nelze zastavit tlakovým obvazem, použijte zaškrcovadlo (turniket) nad ránu směrem k srdci a poznamenejte si čas zaškrcení.",
            "Volejte 155 a udržujte postiženého v teple (protišoková poloha, deka)."
        ],
        dont_do_steps=[
            "NIKDY nevytahujte z rány hluboko zabodnuté předměty (střepy, nůž) – fungují jako zátka, předmět v ráně pouze zafixujte obvazem okolo.",
            "Nesundávejte prosáklou první vrstvu obvazu – pouze přikládejte další vrstvy navrch."
        ],
        note="Ztráta 1,5 litru krve u dospělého nebo 200-300 ml u malého dítěte bezprostředně ohrožuje život."
    ),
    FirstAidGuideItem(
        id="anaphylaxis",
        title="Těžká alergická reakce (Anafylaxe / Bodnutí hmyzem)",
        category="allergic",
        urgency="critical",
        emergency_call="155",
        summary="Otok rtů, jazyka, dušnost nebo kolaps po bodnutí včelou/vosou, požití ořechů či léků vyžaduje okamžitou akci.",
        action_steps=[
            "Okamžitě volejte 155.",
            "Pokud má pacient autoinjektor s adrenalinem (EpiPen / Jext / Emerade), IHNED jej aplikujte do vnější strany stehna (lze i přes kalhoty), držte 5-10 sekund.",
            "Uložte postiženého do polosedu při dušnosti, nebo vleže se zvednutýma nohama při mdlobách.",
            "Po bodnutí hmyzem v ústech nebo krku dejte cucat kostku ledu nebo pít velmi studenou vodu pro zmírnění otoku dýchacích cest.",
            "Podejte antihistaminikum (např. Dithiaden, Fenistil, Zyrtec, Aerius), pokud je pacient při plném vědomí a schopen polykat."
        ],
        dont_do_steps=[
            "Nenechávejte pacienta chodit ani stát.",
            "Nepodávejte léky ani tekutiny ústy při poruše vědomí nebo silném otoku krku."
        ],
        note="Účinek autoinjektoru nastupuje rychle, ale za 10-15 minut může odeznít – lékařské vyšetření ZZS je nezbytné i po zlepšení stavu!"
    )
]


@router.get("/first-aid/guides", response_model=List[FirstAidGuideItem])
def get_first_aid_guides():
    return FIRST_AID_GUIDES


@router.get("/first-aid/pediatric-dosage", response_model=PediatricDosageResponse)
def get_pediatric_dosage(
    weight_kg: float = Query(..., gt=2.0, le=70.0, description="Hmotnost dítěte v kilogramech"),
    drug: str = Query("paracetamol", description="Účinná látka: paracetamol nebo ibuprofen")
):
    drug_lower = drug.lower().strip()
    if drug_lower in ["paracetamol", "paralen", "panadol"]:
        # Paracetamol: 10 - 15 mg / kg per single dose, max 60 mg/kg/day
        min_single = round(weight_kg * 10.0, 1)
        max_single = round(weight_kg * 15.0, 1)
        daily_max = round(weight_kg * 60.0, 1)
        
        # Paralen sirup 24 mg / ml
        # Panadol Baby 24 mg / ml
        ml_min_24 = round(min_single / 24.0, 1)
        ml_max_24 = round(max_single / 24.0, 1)

        preps = [
            PediatricPreparation(
                brand_name="Paralen sirup / Panadol Baby sirup",
                concentration="24 mg/ml (120 mg v 5 ml)",
                amount_per_single_dose=f"{ml_min_24} – {ml_max_24} ml",
                note=f"Odpovídá {min_single:.0f} až {max_single:.0f} mg účinné látky na jednu dávku."
            )
        ]

        if weight_kg >= 7.0:
            preps.append(PediatricPreparation(
                brand_name="Paralen čípky 100 mg",
                concentration="100 mg v 1 čípku",
                amount_per_single_dose="1 čípek" if weight_kg < 14.0 else "1 až 2 čípky",
                note="Vhodné při zvracení nebo odmítání sirupu."
            ))

        if weight_kg >= 15.0:
            preps.append(PediatricPreparation(
                brand_name="Panadol Junior čípky 250 mg",
                concentration="250 mg v 1 čípku",
                amount_per_single_dose="1 čípek",
                note="Pro děti od cca 3 let a 15 kg."
            ))

        if weight_kg >= 25.0:
            preps.append(PediatricPreparation(
                brand_name="Paralen 500 tablety",
                concentration="500 mg v 1 tabletě",
                amount_per_single_dose="1/2 tablety (250 mg)" if weight_kg < 40.0 else "1 tableta (500 mg)",
                note="Pouze pokud je dítě schopné tabletu bezpečně spolknout."
            ))

        return PediatricDosageResponse(
            weight_kg=weight_kg,
            drug="paracetamol",
            drug_name_cs="Paracetamol (Paralen, Panadol)",
            single_dose_mg_min=min_single,
            single_dose_mg_max=max_single,
            daily_max_mg=daily_max,
            interval_hours=6,
            max_doses_per_day=4,
            preparations=preps,
            safety_warnings=[
                "Minimální odstup mezi dvěma dávkami paracetamolu je 6 hodin (výjimečně 4 hodiny při vysoké horečce).",
                f"Maximální denní dávka pro dítě o váze {weight_kg} kg je {daily_max:.0f} mg (nepřekračujte 4 dávky za 24 hodin!).",
                "NIKDY nekombinujte Paralen sirup a Panadol sirup/čípky současně – oba obsahují stejnou látku!",
                "U dětí do 3 měsíců věku konzultujte každou horečku neprodleně s pediatrem nebo pohotovostí."
            ]
        )
    
    elif drug_lower in ["ibuprofen", "nurofen", "ibalgin"]:
        # Ibuprofen: 5 - 10 mg / kg per single dose, typical 7.5 mg/kg, max 30-40 mg/kg/day
        min_single = round(weight_kg * 5.0, 1)
        max_single = round(weight_kg * 10.0, 1)
        typical_single = round(weight_kg * 7.5, 1)
        daily_max = round(weight_kg * 30.0, 1)

        # Nurofen pro děti 2% (20 mg/ml = 100 mg v 5 ml)
        ml_20_min = round(min_single / 20.0, 1)
        ml_20_max = round(max_single / 20.0, 1)

        # Nurofen pro děti 4% (40 mg/ml = 200 mg v 5 ml) -> DVOJNÁSOBNÁ KONCENTRACE!
        ml_40_min = round(min_single / 40.0, 1)
        ml_40_max = round(max_single / 40.0, 1)

        preps = [
            PediatricPreparation(
                brand_name="Nurofen pro děti / Ibalgin Baby sirup (2%)",
                concentration="20 mg/ml (100 mg v 5 ml)",
                amount_per_single_dose=f"{ml_20_min} – {ml_20_max} ml (ideálně {typical_single / 20.0:.1f} ml)",
                note="Standardní 2% koncentrace sirupu."
            ),
            PediatricPreparation(
                brand_name="Nurofen pro děti 4% (Jahoda / Pomeranč)",
                concentration="40 mg/ml (200 mg v 5 ml) – POZOR: 2× silnější!",
                amount_per_single_dose=f"{ml_40_min} – {ml_40_max} ml (ideálně {typical_single / 40.0:.1f} ml)",
                note="POZOR: Poloviční dávka v ml oproti běžnému sirupu!"
            )
        ]

        if weight_kg >= 6.0:
            preps.append(PediatricPreparation(
                brand_name="Nurofen pro děti čípky 60 mg",
                concentration="60 mg v 1 čípku",
                amount_per_single_dose="1 čípek",
                note="Vhodné pro kojence od 3 měsíců a 6 kg."
            ))

        if weight_kg >= 12.5:
            preps.append(PediatricPreparation(
                brand_name="Nurofen pro děti čípky 125 mg",
                concentration="125 mg v 1 čípku",
                amount_per_single_dose="1 čípek",
                note="Pro děti od cca 2 let a 12,5 kg."
            ))

        if weight_kg >= 20.0:
            preps.append(PediatricPreparation(
                brand_name="Ibalgin 200 potahované tablety",
                concentration="200 mg v 1 tabletě",
                amount_per_single_dose="1 tableta (200 mg)",
                note="Pro děti od 6 let a 20 kg váhy."
            ))

        return PediatricDosageResponse(
            weight_kg=weight_kg,
            drug="ibuprofen",
            drug_name_cs="Ibuprofen (Nurofen, Ibalgin)",
            single_dose_mg_min=min_single,
            single_dose_mg_max=max_single,
            daily_max_mg=daily_max,
            interval_hours=8,
            max_doses_per_day=3,
            preparations=preps,
            safety_warnings=[
                "Minimální odstup mezi jednotlivými dávkami ibuprofenu je 8 hodin (při silné horečce min. 6 hodin, max 3-4x za den).",
                f"Maximální denní dávka pro dítě o váze {weight_kg} kg je {daily_max:.0f} mg.",
                "Zkontrolujte koncentraci sirupu na krabičce! Nurofen 4% vyžaduje POLOVIČNÍ dávku v ml oproti Nurofenu 2%.",
                "Ibuprofen se nesmí podávat dětem mladším než 3 měsíce nebo s váhou pod 5 kg.",
                "NEPODÁVEJTE ibuprofen při podezření na plané neštovice (riziko závažných bakteriálních superinfekcí kůže) ani při dehydrataci či zvracení bez příjmu tekutin.",
                "Pokud horečka neklesá, lze po 4 hodinách podat paracetamol (střídání látek po 4 hodinách s dodržením intervalu 8h pro stejnou látku)."
            ]
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Podporované látky pro kalkulačku jsou 'paracetamol' a 'ibuprofen'."
        )


# ==========================================
# 3. MEDICINES CRUD & ACTIONS
# ==========================================
@router.get("", response_model=List[MedicineResponse])
def get_medicines(
    category: Optional[str] = None,
    location: Optional[str] = None,
    search: Optional[str] = None,
    is_low_stock: Optional[bool] = None,
    status_filter: Optional[str] = None,  # expired, warning, ok
    assigned_user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Medicine)

    if category:
        query = query.filter(Medicine.category == category)
    if location:
        query = query.filter(Medicine.location == location)
    if assigned_user_id:
        query = query.filter(Medicine.assigned_user_id == assigned_user_id)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (Medicine.name.ilike(s)) |
            (Medicine.active_substance.ilike(s)) |
            (Medicine.notes.ilike(s))
        )

    medicines = query.order_by(Medicine.name.asc()).all()
    results = [_format_medicine_response(m, db) for m in medicines]

    # Post-filtering for computed fields if requested
    if is_low_stock is not None:
        results = [r for r in results if r.is_low_stock == is_low_stock]

    if status_filter:
        results = [r for r in results if r.expiration_status == status_filter]

    return results


@router.post("", response_model=MedicineResponse, status_code=status.HTTP_201_CREATED)
def create_medicine(
    med_in: MedicineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    med = Medicine(
        name=med_in.name,
        active_substance=med_in.active_substance,
        form=med_in.form,
        category=med_in.category,
        location=med_in.location,
        package_size=med_in.package_size,
        current_quantity=med_in.current_quantity,
        unit=med_in.unit,
        min_quantity_warning=med_in.min_quantity_warning,
        expiration_date=med_in.expiration_date,
        opened_date=med_in.opened_date,
        validity_months_after_opening=med_in.validity_months_after_opening,
        is_prescription=med_in.is_prescription,
        requires_refrigeration=med_in.requires_refrigeration,
        age_group=med_in.age_group,
        dosage_instructions=med_in.dosage_instructions,
        storage_instructions=med_in.storage_instructions,
        sukl_code_or_url=med_in.sukl_code_or_url,
        notes=med_in.notes,
        assigned_user_id=med_in.assigned_user_id
    )
    db.add(med)
    db.commit()
    db.refresh(med)
    return _format_medicine_response(med, db)


@router.get("/schedules", response_model=List[MedicationScheduleResponse])
def get_medication_schedules(
    user_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(MedicationSchedule)
    if user_id:
        query = query.filter(MedicationSchedule.user_id == user_id)
    if is_active is not None:
        query = query.filter(MedicationSchedule.is_active == is_active)

    schedules = query.order_by(MedicationSchedule.id.asc()).all()
    today_date = datetime.date.today()
    start_of_today = datetime.datetime(today_date.year, today_date.month, today_date.day)

    responses = []
    for s in schedules:
        # Check if taken today
        log = db.query(MedicationLog).filter(
            MedicationLog.schedule_id == s.id,
            MedicationLog.taken_at >= start_of_today,
            MedicationLog.status == "taken"
        ).first()

        med_name = s.medicine.name if s.medicine else "Neznámý lék"
        u_name = s.user.display_name if s.user else "Neznámý uživatel"

        # parse time_slots json
        try:
            slots = json.loads(s.time_slots) if s.time_slots else ["morning"]
        except Exception:
            slots = ["morning"]

        responses.append(MedicationScheduleResponse(
            id=s.id,
            medicine_id=s.medicine_id,
            user_id=s.user_id,
            schedule_type=s.schedule_type,
            start_date=s.start_date,
            end_date=s.end_date,
            times_per_day=s.times_per_day,
            time_slots=slots,
            food_relation=s.food_relation,
            dosage_per_take=s.dosage_per_take,
            is_active=s.is_active,
            notes=s.notes,
            created_at=s.created_at,
            medicine_name=med_name,
            user_name=u_name,
            is_taken_today=log is not None
        ))
    return responses


@router.post("/schedules", response_model=MedicationScheduleResponse, status_code=status.HTTP_201_CREATED)
def create_medication_schedule(
    item_in: MedicationScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    medicine = db.query(Medicine).filter(Medicine.id == item_in.medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lék nebyl nalezen.")

    schedule = MedicationSchedule(
        medicine_id=item_in.medicine_id,
        user_id=item_in.user_id,
        schedule_type=item_in.schedule_type,
        start_date=item_in.start_date,
        end_date=item_in.end_date,
        times_per_day=item_in.times_per_day,
        time_slots=json.dumps(item_in.time_slots),
        food_relation=item_in.food_relation,
        dosage_per_take=item_in.dosage_per_take,
        is_active=item_in.is_active,
        notes=item_in.notes
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)

    u = db.query(User).filter(User.id == schedule.user_id).first()
    return MedicationScheduleResponse(
        id=schedule.id,
        medicine_id=schedule.medicine_id,
        user_id=schedule.user_id,
        schedule_type=schedule.schedule_type,
        start_date=schedule.start_date,
        end_date=schedule.end_date,
        times_per_day=schedule.times_per_day,
        time_slots=item_in.time_slots,
        food_relation=schedule.food_relation,
        dosage_per_take=schedule.dosage_per_take,
        is_active=schedule.is_active,
        notes=schedule.notes,
        created_at=schedule.created_at,
        medicine_name=medicine.name,
        user_name=u.display_name if u else None,
        is_taken_today=False
    )


@router.put("/schedules/{id}", response_model=MedicationScheduleResponse)
def update_medication_schedule(
    id: int,
    item_in: MedicationScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    schedule = db.query(MedicationSchedule).filter(MedicationSchedule.id == id).first()
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rozvrh nebyl nalezen.")

    if item_in.schedule_type is not None:
        schedule.schedule_type = item_in.schedule_type
    if item_in.start_date is not None:
        schedule.start_date = item_in.start_date
    if item_in.end_date is not None:
        schedule.end_date = item_in.end_date
    if item_in.times_per_day is not None:
        schedule.times_per_day = item_in.times_per_day
    if item_in.time_slots is not None:
        schedule.time_slots = json.dumps(item_in.time_slots)
    if item_in.food_relation is not None:
        schedule.food_relation = item_in.food_relation
    if item_in.dosage_per_take is not None:
        schedule.dosage_per_take = item_in.dosage_per_take
    if item_in.is_active is not None:
        schedule.is_active = item_in.is_active
    if item_in.notes is not None:
        schedule.notes = item_in.notes

    db.commit()
    db.refresh(schedule)

    try:
        slots = json.loads(schedule.time_slots) if schedule.time_slots else ["morning"]
    except Exception:
        slots = ["morning"]

    return MedicationScheduleResponse(
        id=schedule.id,
        medicine_id=schedule.medicine_id,
        user_id=schedule.user_id,
        schedule_type=schedule.schedule_type,
        start_date=schedule.start_date,
        end_date=schedule.end_date,
        times_per_day=schedule.times_per_day,
        time_slots=slots,
        food_relation=schedule.food_relation,
        dosage_per_take=schedule.dosage_per_take,
        is_active=schedule.is_active,
        notes=schedule.notes,
        created_at=schedule.created_at,
        medicine_name=schedule.medicine.name if schedule.medicine else "",
        user_name=schedule.user.display_name if schedule.user else "",
        is_taken_today=False
    )


@router.delete("/schedules/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medication_schedule(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    schedule = db.query(MedicationSchedule).filter(MedicationSchedule.id == id).first()
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rozvrh nebyl nalezen.")
    db.delete(schedule)
    db.commit()
    return None


@router.get("/logs", response_model=List[MedicationLogResponse])
def get_medication_logs(
    medicine_id: Optional[int] = None,
    user_id: Optional[int] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(MedicationLog)
    if medicine_id:
        query = query.filter(MedicationLog.medicine_id == medicine_id)
    if user_id:
        query = query.filter(MedicationLog.user_id == user_id)

    logs = query.order_by(MedicationLog.taken_at.desc()).limit(limit).all()
    responses = []
    for l in logs:
        responses.append(MedicationLogResponse(
            id=l.id,
            schedule_id=l.schedule_id,
            medicine_id=l.medicine_id,
            user_id=l.user_id,
            taken_at=l.taken_at,
            time_slot=l.time_slot,
            dose_taken=l.dose_taken,
            status=l.status,
            notes=l.notes,
            medicine_name=l.medicine.name if l.medicine else "",
            user_name=l.user.display_name if l.user else ""
        ))
    return responses


@router.post("/logs", response_model=MedicationLogResponse, status_code=status.HTTP_201_CREATED)
def create_medication_log(
    log_in: MedicationLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    medicine = db.query(Medicine).filter(Medicine.id == log_in.medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lék nebyl nalezen.")

    log = MedicationLog(
        schedule_id=log_in.schedule_id,
        medicine_id=log_in.medicine_id,
        user_id=log_in.user_id,
        time_slot=log_in.time_slot,
        dose_taken=log_in.dose_taken or "1 dávka",
        status=log_in.status,
        notes=log_in.notes
    )
    db.add(log)

    # If status is taken and decrement_stock requested, decrease medicine quantity
    if log_in.status == "taken" and log_in.decrement_stock:
        if medicine.current_quantity > 0:
            medicine.current_quantity = max(0.0, medicine.current_quantity - 1.0)

    db.commit()
    db.refresh(log)

    u = db.query(User).filter(User.id == log.user_id).first()
    return MedicationLogResponse(
        id=log.id,
        schedule_id=log.schedule_id,
        medicine_id=log.medicine_id,
        user_id=log.user_id,
        taken_at=log.taken_at,
        time_slot=log.time_slot,
        dose_taken=log.dose_taken,
        status=log.status,
        notes=log.notes,
        medicine_name=medicine.name,
        user_name=u.display_name if u else ""
    )


@router.get("/{id}", response_model=MedicineResponse)
def get_medicine(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    medicine = db.query(Medicine).filter(Medicine.id == id).first()
    if not medicine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lék nebyl nalezen.")
    return _format_medicine_response(medicine, db)


@router.put("/{id}", response_model=MedicineResponse)
def update_medicine(
    id: int,
    med_in: MedicineUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    medicine = db.query(Medicine).filter(Medicine.id == id).first()
    if not medicine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lék nebyl nalezen.")

    update_data = med_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(medicine, field, value)

    medicine.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(medicine)
    return _format_medicine_response(medicine, db)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medicine(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    medicine = db.query(Medicine).filter(Medicine.id == id).first()
    if not medicine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lék nebyl nalezen.")
    db.delete(medicine)
    db.commit()
    return None


@router.post("/{id}/mark-opened", response_model=MedicineResponse)
def mark_medicine_opened(
    id: int,
    opened_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    medicine = db.query(Medicine).filter(Medicine.id == id).first()
    if not medicine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lék nebyl nalezen.")

    date_to_set = opened_date or datetime.date.today().isoformat()
    medicine.opened_date = date_to_set
    medicine.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(medicine)
    return _format_medicine_response(medicine, db)


@router.post("/{id}/adjust-stock", response_model=MedicineResponse)
def adjust_medicine_stock(
    id: int,
    delta: float = Query(..., description="Změna množství (kladná nebo záporná)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    medicine = db.query(Medicine).filter(Medicine.id == id).first()
    if not medicine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lék nebyl nalezen.")

    new_qty = max(0.0, medicine.current_quantity + delta)
    medicine.current_quantity = new_qty
    medicine.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(medicine)
    return _format_medicine_response(medicine, db)


@router.post("/{id}/add-to-shopping")
def add_medicine_to_shopping(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    medicine = db.query(Medicine).filter(Medicine.id == id).first()
    if not medicine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lék nebyl nalezen.")

    item_name = f"{medicine.name}"
    if medicine.package_size:
        item_name += f" ({medicine.package_size})"

    shopping_item = ShoppingItem(
        name=item_name,
        amount=1.0,
        unit=medicine.unit or "balení",
        category="household",  # Lékárna / drogerie
        is_checked=False,
        added_by_id=current_user.id
    )
    db.add(shopping_item)
    db.commit()
    db.refresh(shopping_item)

    return {
        "success": True,
        "shopping_item_id": shopping_item.id,
        "name": shopping_item.name,
        "message": f"Položka '{shopping_item.name}' byla přidána na nákupní seznam."
    }
