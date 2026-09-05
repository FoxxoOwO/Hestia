import io
import csv
import json
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct

from app.database import get_db
from app.models.user import User
from app.models.finance import (
    FinanceTransaction, CategoryBudget, Subscription, SavingsGoal, UserFinanceProfile
)
from app.schemas.finance import (
    TransactionCreate, TransactionUpdate, TransactionResponse,
    CategoryBudgetCreate, CategoryBudgetResponse,
    SubscriptionCreate, SubscriptionUpdate, SubscriptionResponse,
    SavingsGoalCreate, SavingsGoalUpdate, SavingsGoalResponse, AddSavingsInput,
    DebtSettlementResponse, DebtSettlementItem, MemberBalance,
    FinanceMonthlySummary, CategorySpendSummary,
    CsvImportRow, CsvImportPreview, CsvImportConfirm,
    ReceiptScanRequest, ReceiptScanResponse,
    UserFinanceProfileUpdate, UserFinanceProfileResponse, UserSimple
)
from app.utils.auth import get_current_user
from app.services.spayd_service import generate_spayd_string, czech_account_to_iban
from app.services.gemini_finance_service import GeminiFinanceService
from app.services.activity_service import log_activity

router = APIRouter(prefix="/finance", tags=["Family Finance & Budget"])

DEFAULT_CATEGORIES = [
    {"category": "groceries", "monthly_limit": 12000.0, "icon": "ShoppingCart", "color": "#f97316"},
    {"category": "housing", "monthly_limit": 18000.0, "icon": "Home", "color": "#3b82f6"},
    {"category": "utilities", "monthly_limit": 5000.0, "icon": "Zap", "color": "#eab308"},
    {"category": "transport", "monthly_limit": 4500.0, "icon": "Car", "color": "#06b6d4"},
    {"category": "pets", "monthly_limit": 3000.0, "icon": "Dog", "color": "#8b5cf6"},
    {"category": "health", "monthly_limit": 2000.0, "icon": "HeartPulse", "color": "#ef4444"},
    {"category": "entertainment", "monthly_limit": 3500.0, "icon": "Film", "color": "#ec4899"},
    {"category": "kids", "monthly_limit": 4000.0, "icon": "Baby", "color": "#10b981"},
    {"category": "shopping", "monthly_limit": 4000.0, "icon": "ShoppingBag", "color": "#6366f1"},
    {"category": "other", "monthly_limit": 3000.0, "icon": "Tag", "color": "#64748b"},
]

def _categorize_text(text: str) -> str:
    t = text.lower()
    if any(k in t for k in ["albert", "billa", "lidl", "kaufland", "penny", "tesco", "rohlík", "kosik", "potravin", "pekař", "řezník", "drogerie", "dm drogerie", "rossmann", "teta", "supermarket"]):
        return "groceries"
    if any(k in t for k in ["benzina", "orlen", "shell", "omv", "mol", "moll", "čerpací", "dopravní", "dpp", "jízdenka", "cd.cz", "leo express", "parking", "parkov", "naft", "benzin"]):
        return "transport"
    if any(k in t for k in ["lékárna", "dr. max", "benu", "nemocnice", "lékař", "zubař", "optik"]):
        return "health"
    if any(k in t for k in ["veterina", "zvěrokruh", "super zoo", "pet center", "krmivo", "zoohit"]):
        return "pets"
    if any(k in t for k in ["netflix", "spotify", "hbo", "disney", "youtube", "kino", "divadlo", "restaurace", "kavárna", "hospoda", "fast food", "mcdonald", "kfc"]):
        return "entertainment"
    if any(k in t for k in ["čez", "pre", "innogy", "e.on", "vodovody", "plyn", "internet", "o2", "vodafone", "t-mobile"]):
        return "utilities"
    if any(k in t for k in ["nájem", "hypotéka", "ikea", "hornbach", "obi", "bauhaus", "baumax", "jysk", "siko"]):
        return "housing"
    if any(k in t for k in ["hračky", "škola", "školka", "kroužek", "pomůcky"]):
        return "kids"
    if any(k in t for k in ["výplata", "mzda", "příjem", "odměna", "důchod", "stipendium", "zaměstnavatel"]):
        return "income"
    return "other"


@router.get("/summary", response_model=FinanceMonthlySummary)
def get_monthly_summary(
    month: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_month = month or datetime.date.today().strftime("%Y-%m")
    
    # 1. Transactions for current month
    month_txs = db.query(FinanceTransaction).filter(
        FinanceTransaction.date.like(f"{current_month}%")
    ).order_by(FinanceTransaction.date.desc(), FinanceTransaction.id.desc()).all()

    total_income = sum(t.amount for t in month_txs if t.transaction_type == "income")
    total_expense = sum(t.amount for t in month_txs if t.transaction_type == "expense")
    net_balance = total_income - total_expense

    # 2. Distinct months across entire database (where expenses exist)
    distinct_months = db.query(
        distinct(func.substr(FinanceTransaction.date, 1, 7))
    ).filter(FinanceTransaction.transaction_type == "expense").all()

    distinct_count = max(1, len(distinct_months))

    # 3. Overall all-months average expense
    all_time_expenses_sum = db.query(
        func.coalesce(func.sum(FinanceTransaction.amount), 0.0)
    ).filter(FinanceTransaction.transaction_type == "expense").scalar() or 0.0

    all_months_average_expense = round(float(all_time_expenses_sum) / distinct_count, 2)

    # 4. Category budgets and historical averages
    db_budgets = {b.category: b for b in db.query(CategoryBudget).all()}
    
    # Pre-calculate category sums for current month and all time
    current_cat_sums = {}
    for t in month_txs:
        if t.transaction_type == "expense":
            current_cat_sums[t.category] = current_cat_sums.get(t.category, 0.0) + t.amount

    all_cat_sums = dict(
        db.query(
            FinanceTransaction.category,
            func.sum(FinanceTransaction.amount)
        ).filter(FinanceTransaction.transaction_type == "expense")
        .group_by(FinanceTransaction.category).all()
    )

    categories_summary = []
    total_budget = 0.0

    # Build response for standard and used categories
    categories_to_process = list(dict.fromkeys(
        [d["category"] for d in DEFAULT_CATEGORIES] + list(current_cat_sums.keys()) + list(all_cat_sums.keys())
    ))

    for cat in categories_to_process:
        if cat == "income":
            continue
        
        default_meta = next((d for d in DEFAULT_CATEGORIES if d["category"] == cat), None)
        budget_obj = db_budgets.get(cat)

        limit = budget_obj.monthly_limit if budget_obj else (default_meta["monthly_limit"] if default_meta else 4000.0)
        icon = budget_obj.icon if budget_obj else (default_meta["icon"] if default_meta else "Tag")
        color = budget_obj.color if budget_obj else (default_meta["color"] if default_meta else "#f97316")

        total_budget += limit

        current_amount = round(current_cat_sums.get(cat, 0.0), 2)
        cat_all_time = all_cat_sums.get(cat, 0.0)
        historical_avg = round(float(cat_all_time) / distinct_count, 2)

        pct_budget = round((current_amount / limit) * 100, 1) if limit > 0 else None
        
        diff_avg_pct = None
        if historical_avg > 0:
            diff_avg_pct = round(((current_amount - historical_avg) / historical_avg) * 100, 1)

        categories_summary.append({
            "category": cat,
            "current_month_amount": current_amount,
            "historical_monthly_average": historical_avg,
            "budget_limit": limit,
            "percentage_of_budget": pct_budget,
            "difference_from_average_percent": diff_avg_pct,
            "icon": icon,
            "color": color
        })

    # Sort categories by current month amount descending
    categories_summary.sort(key=lambda c: c["current_month_amount"], reverse=True)

    # Format recent transactions
    recent_formatted = []
    for t in month_txs[:15]:
        recent_formatted.append(TransactionResponse.model_validate(t))

    return {
        "month": current_month,
        "total_income": round(total_income, 2),
        "total_expense": round(total_expense, 2),
        "net_balance": round(net_balance, 2),
        "total_budget": round(total_budget, 2),
        "all_months_average_expense": all_months_average_expense,
        "distinct_months_count": distinct_count,
        "categories": categories_summary,
        "recent_transactions": recent_formatted
    }


@router.get("/budgets", response_model=List[CategoryBudgetResponse])
def get_category_budgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(CategoryBudget).all()


@router.post("/budgets", response_model=CategoryBudgetResponse)
def set_category_budget(
    payload: CategoryBudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    b = db.query(CategoryBudget).filter(CategoryBudget.category == payload.category).first()
    if not b:
        b = CategoryBudget(
            category=payload.category,
            monthly_limit=payload.monthly_limit,
            icon=payload.icon or "Tag",
            color=payload.color or "#f97316"
        )
        db.add(b)
    else:
        b.monthly_limit = payload.monthly_limit
        if payload.icon:
            b.icon = payload.icon
        if payload.color:
            b.color = payload.color
    db.flush()

    log_activity(
        db=db,
        user=current_user,
        module="finance",
        action_type="budget",
        title="Úprava limitu rozpočtu",
        description=f"{current_user.display_name} nastavil(a) měsíční limit kategorie {b.category} na {b.monthly_limit:,.0f} Kč",
        entity_type="CategoryBudget",
        entity_id=b.id
    )

    db.commit()
    db.refresh(b)
    return b


@router.get("/transactions", response_model=List[TransactionResponse])
def get_transactions(
    month: Optional[str] = None,
    category: Optional[str] = None,
    payer_id: Optional[int] = None,
    transaction_type: Optional[str] = None,
    is_shared: Optional[bool] = None,
    search: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(FinanceTransaction)

    if month and month != "all":
        query = query.filter(FinanceTransaction.date.like(f"{month}%"))
    if category and category != "all":
        query = query.filter(FinanceTransaction.category == category)
    if payer_id is not None:
        query = query.filter(FinanceTransaction.payer_id == payer_id)
    if transaction_type and transaction_type != "all":
        query = query.filter(FinanceTransaction.transaction_type == transaction_type)
    if is_shared is not None:
        query = query.filter(FinanceTransaction.is_shared == is_shared)
    if search:
        query = query.filter(
            (FinanceTransaction.title.ilike(f"%{search}%")) |
            (FinanceTransaction.notes.ilike(f"%{search}%"))
        )

    txs = query.order_by(FinanceTransaction.date.desc(), FinanceTransaction.id.desc()).limit(limit).all()
    return txs


@router.post("/transactions", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tx = FinanceTransaction(
        title=payload.title,
        amount=payload.amount,
        transaction_type=payload.transaction_type,
        category=payload.category,
        date=payload.date,
        payer_id=payload.payer_id or current_user.id,
        is_shared=payload.is_shared,
        split_type=payload.split_type,
        split_details=payload.split_details or "{}",
        receipt_url=payload.receipt_url,
        notes=payload.notes
    )
    db.add(tx)
    db.flush()

    log_activity(
        db=db,
        user=current_user,
        module="finance",
        action_type="create",
        title="Nová platba",
        description=f"{current_user.display_name} zaevidoval(a) {tx.amount:,.0f} Kč ({tx.title}) v kategorii {tx.category}",
        entity_type="FinanceTransaction",
        entity_id=tx.id
    )

    db.commit()
    db.refresh(tx)
    return tx



@router.put("/transactions/{id}", response_model=TransactionResponse)
def update_transaction(
    id: int,
    payload: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tx = db.query(FinanceTransaction).filter(FinanceTransaction.id == id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Platba nebyla nalezena")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(tx, k, v)

    db.commit()
    db.refresh(tx)
    return tx


@router.delete("/transactions/{id}")
def delete_transaction(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tx = db.query(FinanceTransaction).filter(FinanceTransaction.id == id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Platba nebyla nalezena")
    db.delete(tx)
    db.commit()
    return {"status": "success", "message": "Platba byla smazána"}


@router.get("/settlement", response_model=DebtSettlementResponse)
def get_debt_settlement(
    month: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Query unsettled shared expense transactions (or for specific month)
    query = db.query(FinanceTransaction).filter(
        FinanceTransaction.is_shared == True,
        FinanceTransaction.transaction_type == "expense",
        FinanceTransaction.is_settled == False
    )
    if month and month != "all":
        query = query.filter(FinanceTransaction.date.like(f"{month}%"))

    txs = query.all()
    users = db.query(User).filter(User.is_active == True).all()
    user_dict = {u.id: u for u in users}
    n_users = max(1, len(users))

    paid_map = {u.id: 0.0 for u in users}
    share_map = {u.id: 0.0 for u in users}

    for t in txs:
        if t.payer_id in paid_map:
            paid_map[t.payer_id] += t.amount

        # Split calculation
        if t.split_type == "custom" and t.split_details:
            try:
                custom_shares = json.loads(t.split_details)
                for u_id_str, share_val in custom_shares.items():
                    u_id = int(u_id_str)
                    if u_id in share_map:
                        # If fraction <= 1, it's ratio; else exact amount
                        share_map[u_id] += t.amount * share_val if share_val <= 1.0 else share_val
            except Exception:
                for u in users:
                    share_map[u.id] += t.amount / n_users
        else:
            # Default equal split
            for u in users:
                share_map[u.id] += t.amount / n_users

    balances = []
    for u in users:
        paid = round(paid_map[u.id], 2)
        share = round(share_map[u.id], 2)
        net = round(paid - share, 2)
        balances.append({
            "user_id": u.id,
            "user_name": u.display_name or u.username,
            "avatar_color": u.avatar_color or "#f97316",
            "paid_total": paid,
            "share_total": share,
            "net_balance": net
        })

    # Calculate optimal settlement transfers (who pays whom)
    debtors = []  # net < 0 (owes money)
    creditors = []  # net > 0 (is owed money)

    for b in balances:
        if b["net_balance"] < -0.01:
            debtors.append({"user_id": b["user_id"], "user_name": b["user_name"], "amount": -b["net_balance"]})
        elif b["net_balance"] > 0.01:
            creditors.append({"user_id": b["user_id"], "user_name": b["user_name"], "amount": b["net_balance"]})

    debtors.sort(key=lambda x: x["amount"], reverse=True)
    creditors.sort(key=lambda x: x["amount"], reverse=True)

    settlements = []
    d_idx = 0
    c_idx = 0

    # Get profiles with bank accounts
    profiles = {p.user_id: p for p in db.query(UserFinanceProfile).all()}

    while d_idx < len(debtors) and c_idx < len(creditors):
        debtor = debtors[d_idx]
        creditor = creditors[c_idx]

        transfer_amount = round(min(debtor["amount"], creditor["amount"]), 2)
        if transfer_amount > 0.01:
            creditor_profile = profiles.get(creditor["user_id"])
            iban = creditor_profile.iban if creditor_profile and creditor_profile.iban else ""
            acc = creditor_profile.bank_account if creditor_profile and creditor_profile.bank_account else ""
            if not iban and acc:
                iban = czech_account_to_iban(acc)

            # Generate SPAYD QR string
            spayd_str = generate_spayd_string(
                iban=iban or "CZ0000000000000000000000",
                amount=transfer_amount,
                message=f"Hestia: {debtor['user_name']} pro {creditor['user_name']}"
            )

            settlements.append({
                "from_user_id": debtor["user_id"],
                "from_user_name": debtor["user_name"],
                "to_user_id": creditor["user_id"],
                "to_user_name": creditor["user_name"],
                "to_user_iban": iban,
                "to_user_account": acc,
                "amount": transfer_amount,
                "spayd_string": spayd_str
            })

            debtor["amount"] -= transfer_amount
            creditor["amount"] -= transfer_amount

        if debtor["amount"] <= 0.01:
            d_idx += 1
        if creditor["amount"] <= 0.01:
            c_idx += 1

    return {
        "balances": balances,
        "settlements": settlements
    }


@router.post("/settle")
def mark_all_settled(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    count = db.query(FinanceTransaction).filter(
        FinanceTransaction.is_shared == True,
        FinanceTransaction.is_settled == False
    ).update({"is_settled": True})

    log_activity(
        db=db,
        user=current_user,
        module="finance",
        action_type="settle",
        title="Vyrovnání sdílených nákladů",
        description=f"{current_user.display_name} označil(a) {count} sdílených rodinných plateb jako vyrovnané",
        entity_type="FinanceTransaction",
        entity_id=None
    )

    db.commit()
    return {"status": "success", "message": "Všechny sdílené platby byly označeny jako vyrovnané."}


@router.get("/subscriptions", response_model=List[SubscriptionResponse])
def get_subscriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subs = db.query(Subscription).order_by(Subscription.next_billing_date.asc()).all()
    res = []
    today = datetime.date.today()

    for s in subs:
        resp = SubscriptionResponse.model_validate(s)
        # Monthly equivalent
        if s.billing_cycle == "yearly":
            resp.monthly_equivalent = round(s.amount / 12.0, 2)
        elif s.billing_cycle == "quarterly":
            resp.monthly_equivalent = round(s.amount / 3.0, 2)
        else:
            resp.monthly_equivalent = s.amount

        # Days until billing
        try:
            b_date = datetime.datetime.strptime(s.next_billing_date, "%Y-%m-%d").date()
            resp.days_until_billing = (b_date - today).days
        except Exception:
            resp.days_until_billing = None

        res.append(resp)
    return res


@router.post("/subscriptions", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
def create_subscription(
    payload: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sub = Subscription(
        name=payload.name,
        amount=payload.amount,
        billing_cycle=payload.billing_cycle,
        next_billing_date=payload.next_billing_date,
        category=payload.category,
        payer_id=payload.payer_id or current_user.id,
        is_active=payload.is_active,
        service_url=payload.service_url,
        notes=payload.notes
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    resp = SubscriptionResponse.model_validate(sub)
    resp.monthly_equivalent = sub.amount if sub.billing_cycle == "monthly" else round(sub.amount / 12, 2)
    return resp


@router.put("/subscriptions/{id}", response_model=SubscriptionResponse)
def update_subscription(
    id: int,
    payload: SubscriptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sub = db.query(Subscription).filter(Subscription.id == id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Předplatné nebylo nalezeno")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(sub, k, v)

    db.commit()
    db.refresh(sub)
    resp = SubscriptionResponse.model_validate(sub)
    resp.monthly_equivalent = sub.amount if sub.billing_cycle == "monthly" else round(sub.amount / 12, 2)
    return resp


@router.delete("/subscriptions/{id}")
def delete_subscription(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sub = db.query(Subscription).filter(Subscription.id == id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Předplatné nebylo nalezeno")
    db.delete(sub)
    db.commit()
    return {"status": "success", "message": "Předplatné bylo smazáno"}


@router.get("/goals", response_model=List[SavingsGoalResponse])
def get_savings_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goals = db.query(SavingsGoal).order_by(SavingsGoal.is_completed.asc(), SavingsGoal.id.asc()).all()
    res = []
    for g in goals:
        resp = SavingsGoalResponse.model_validate(g)
        resp.progress_percentage = min(100.0, round((g.current_amount / max(1.0, g.target_amount)) * 100.0, 1))
        res.append(resp)
    return res


@router.post("/goals", response_model=SavingsGoalResponse, status_code=status.HTTP_201_CREATED)
def create_savings_goal(
    payload: SavingsGoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = SavingsGoal(
        title=payload.title,
        target_amount=payload.target_amount,
        current_amount=payload.current_amount,
        target_date=payload.target_date,
        icon=payload.icon,
        color=payload.color,
        is_completed=payload.is_completed,
        notes=payload.notes
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    resp = SavingsGoalResponse.model_validate(goal)
    resp.progress_percentage = min(100.0, round((goal.current_amount / max(1.0, goal.target_amount)) * 100.0, 1))
    return resp


@router.post("/goals/{id}/add-savings", response_model=SavingsGoalResponse)
def add_savings_to_goal(
    id: int,
    payload: AddSavingsInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Cíl spoření nebyl nalezen")

    goal.current_amount += payload.amount
    if goal.current_amount >= goal.target_amount:
        goal.is_completed = True

    log_activity(
        db=db,
        user=current_user,
        module="finance",
        action_type="savings",
        title="Příspěvek na cíl spoření",
        description=f"{current_user.display_name} přidal(a) {payload.amount:,.0f} Kč do spořicího cíle: {goal.title} ({goal.current_amount:,.0f} / {goal.target_amount:,.0f} Kč)",
        entity_type="SavingsGoal",
        entity_id=goal.id
    )

    db.commit()
    db.refresh(goal)
    resp = SavingsGoalResponse.model_validate(goal)
    resp.progress_percentage = min(100.0, round((goal.current_amount / max(1.0, goal.target_amount)) * 100.0, 1))
    return resp


@router.delete("/goals/{id}")
def delete_savings_goal(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Cíl spoření nebyl nalezen")
    db.delete(goal)
    db.commit()
    return {"status": "success", "message": "Cíl spoření byl smazán"}


@router.post("/import/preview", response_model=CsvImportPreview)
async def preview_import_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    content = await file.read()
    filename = (file.filename or "").lower()

    rows: List[CsvImportRow] = []

    if filename.endswith(".xlsx") or filename.endswith(".xls"):
        import openpyxl
        wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
        sheet = wb.active

        header = []
        for row_idx, row in enumerate(sheet.iter_rows(values_only=True)):
            if not any(row):
                continue
            if row_idx == 0:
                header = [str(cell).lower().strip() if cell else "" for cell in row]
                continue

            row_dict = {header[i]: row[i] for i in range(min(len(header), len(row)))}
            
            # Find date, amount, title
            date_val = None
            amount_val = None
            title_val = None

            for k, v in row_dict.items():
                if not v: continue
                if any(x in k for x in ["datum", "date"]):
                    if isinstance(v, (datetime.date, datetime.datetime)):
                        date_val = v.strftime("%Y-%m-%d")
                    else:
                        date_val = str(v).strip()
                elif any(x in k for x in ["částka", "castka", "amount", "objem"]):
                    try:
                        amount_val = float(str(v).replace(" ", "").replace(",", "."))
                    except Exception:
                        pass
                elif any(x in k for x in ["název", "popis", "description", "zpráva", "protistrana", "obchod", "title"]):
                    title_val = str(v).strip()

            if not title_val and len(row) > 1:
                title_val = str(row[1])
            if not date_val:
                date_val = datetime.date.today().isoformat()
            if amount_val is None:
                continue

            tx_type = "expense" if amount_val < 0 else "income"
            category = _categorize_text(title_val or "")
            if tx_type == "income":
                category = "income"

            rows.append(CsvImportRow(
                date=date_val[:10],
                title=title_val or "Platba z výpisu",
                amount=abs(amount_val),
                transaction_type=tx_type,
                category=category
            ))
    else:
        # CSV parsing
        text = ""
        for encoding in ["utf-8", "windows-1250", "cp1250", "iso-8859-2"]:
            try:
                text = content.decode(encoding)
                break
            except Exception:
                continue

        lines = [line for line in text.splitlines() if line.strip()]
        if lines:
            delimiter = ";" if ";" in lines[0] else ","
            reader = csv.reader(lines, delimiter=delimiter)
            header = []
            for row_idx, row in enumerate(reader):
                if not row: continue
                if row_idx == 0:
                    header = [c.lower().strip() for c in row]
                    continue

                row_dict = {header[i]: row[i] for i in range(min(len(header), len(row)))}
                date_val = None
                amount_val = None
                title_val = None
                text_pieces = []

                for k, v in row_dict.items():
                    if not v: continue
                    str_v = str(v).strip()
                    if any(x in k for x in ["datum", "date"]):
                        date_val = str_v
                    elif any(x in k for x in ["částka", "castka", "amount", "objem"]):
                        try:
                            amount_val = float(str_v.replace(" ", "").replace(",", ".").replace("CZK", "").replace("Kč", ""))
                        except Exception:
                            pass
                    elif any(x in k for x in ["název", "popis", "description", "zpráva", "protistrana", "obchod", "poznámka"]):
                        text_pieces.append(str_v)
                        if not title_val or any(x in k for x in ["protistrana", "název", "obchod"]):
                            title_val = str_v

                if not title_val and text_pieces:
                    title_val = text_pieces[0]
                elif not title_val and len(row) > 1:
                    title_val = row[1]

                if not date_val:
                    date_val = datetime.date.today().isoformat()
                elif "." in date_val and len(date_val.split(".")) == 3:
                    p = date_val.split(".")
                    try:
                        date_val = f"{int(p[2]):04d}-{int(p[1]):02d}-{int(p[0]):02d}"
                    except Exception:
                        date_val = datetime.date.today().isoformat()

                if amount_val is None:
                    continue

                tx_type = "expense" if amount_val < 0 else "income"
                search_text = " ".join(text_pieces) if text_pieces else (title_val or "")
                category = _categorize_text(search_text)
                if tx_type == "income":
                    category = "income"

                rows.append(CsvImportRow(
                    date=date_val[:10],
                    title=title_val or "Platba z výpisu",
                    amount=abs(amount_val),
                    transaction_type=tx_type,
                    category=category
                ))

    tot_inc = sum(r.amount for r in rows if r.transaction_type == "income")
    tot_exp = sum(r.amount for r in rows if r.transaction_type == "expense")

    return {
        "rows": rows[:100],  # Limit preview to 100 rows
        "total_count": len(rows),
        "total_income": round(tot_inc, 2),
        "total_expense": round(tot_exp, 2)
    }


@router.post("/import/confirm")
def confirm_import_transactions(
    payload: CsvImportConfirm,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    created_count = 0
    for r in payload.rows:
        tx = FinanceTransaction(
            title=r.title,
            amount=r.amount,
            transaction_type=r.transaction_type,
            category=r.category,
            date=r.date,
            payer_id=payload.payer_id,
            is_shared=payload.is_shared,
            split_type="equal"
        )
        db.add(tx)
        created_count += 1

    db.commit()
    return {"status": "success", "imported_count": created_count, "message": f"Úspěšně importováno {created_count} plateb."}


@router.post("/scan-receipt", response_model=ReceiptScanResponse)
async def scan_receipt(
    payload: ReceiptScanRequest,
    current_user: User = Depends(get_current_user)
):
    service = GeminiFinanceService()
    res = await service.scan_receipt(
        image_base64=payload.image_base64,
        image_url=payload.image_url
    )
    return res


@router.get("/profile", response_model=UserFinanceProfileResponse)
def get_user_finance_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prof = db.query(UserFinanceProfile).filter(UserFinanceProfile.user_id == current_user.id).first()
    if not prof:
        return {"user_id": current_user.id, "bank_account": None, "iban": None}
    return prof


@router.put("/profile", response_model=UserFinanceProfileResponse)
def update_user_finance_profile(
    payload: UserFinanceProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prof = db.query(UserFinanceProfile).filter(UserFinanceProfile.user_id == current_user.id).first()
    if not prof:
        prof = UserFinanceProfile(user_id=current_user.id)
        db.add(prof)

    if payload.bank_account is not None:
        prof.bank_account = payload.bank_account
        if not payload.iban and payload.bank_account:
            prof.iban = czech_account_to_iban(payload.bank_account)
    if payload.iban is not None:
        prof.iban = payload.iban

    db.commit()
    db.refresh(prof)
    return prof
