import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class UserSimple(BaseModel):
    id: int
    username: str
    display_name: str
    avatar_color: Optional[str] = "#f97316"

    class Config:
        from_attributes = True


class TransactionBase(BaseModel):
    title: str
    amount: float
    transaction_type: str = "expense"  # expense, income
    category: str = "groceries"
    date: str  # YYYY-MM-DD
    payer_id: int
    is_shared: bool = True
    split_type: str = "equal"  # equal, custom, full
    split_details: Optional[str] = "{}"
    receipt_url: Optional[str] = None
    notes: Optional[str] = None


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    transaction_type: Optional[str] = None
    category: Optional[str] = None
    date: Optional[str] = None
    payer_id: Optional[int] = None
    is_shared: Optional[bool] = None
    split_type: Optional[str] = None
    split_details: Optional[str] = None
    receipt_url: Optional[str] = None
    notes: Optional[str] = None
    is_settled: Optional[bool] = None


class TransactionResponse(TransactionBase):
    id: int
    is_settled: bool = False
    created_at: datetime.datetime
    updated_at: datetime.datetime
    payer: Optional[UserSimple] = None

    class Config:
        from_attributes = True


class CategoryBudgetBase(BaseModel):
    category: str
    monthly_limit: float = 5000.0
    icon: str = "Tag"
    color: str = "#f97316"


class CategoryBudgetCreate(CategoryBudgetBase):
    pass


class CategoryBudgetResponse(CategoryBudgetBase):
    id: int

    class Config:
        from_attributes = True


class SubscriptionBase(BaseModel):
    name: str
    amount: float
    billing_cycle: str = "monthly"  # monthly, yearly, quarterly
    next_billing_date: str  # YYYY-MM-DD
    category: str = "entertainment"
    payer_id: Optional[int] = None
    is_active: bool = True
    service_url: Optional[str] = None
    notes: Optional[str] = None


class SubscriptionCreate(SubscriptionBase):
    pass


class SubscriptionUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[float] = None
    billing_cycle: Optional[str] = None
    next_billing_date: Optional[str] = None
    category: Optional[str] = None
    payer_id: Optional[int] = None
    is_active: Optional[bool] = None
    service_url: Optional[str] = None
    notes: Optional[str] = None


class SubscriptionResponse(SubscriptionBase):
    id: int
    created_at: datetime.datetime
    payer: Optional[UserSimple] = None
    monthly_equivalent: float = 0.0
    days_until_billing: Optional[int] = None

    class Config:
        from_attributes = True


class SavingsGoalBase(BaseModel):
    title: str
    target_amount: float
    current_amount: float = 0.0
    target_date: Optional[str] = None
    icon: str = "PiggyBank"
    color: str = "#10b981"
    is_completed: bool = False
    notes: Optional[str] = None


class SavingsGoalCreate(SavingsGoalBase):
    pass


class SavingsGoalUpdate(BaseModel):
    title: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    target_date: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_completed: Optional[bool] = None
    notes: Optional[str] = None


class SavingsGoalResponse(SavingsGoalBase):
    id: int
    created_at: datetime.datetime
    progress_percentage: float = 0.0

    class Config:
        from_attributes = True


class AddSavingsInput(BaseModel):
    amount: float


class DebtSettlementItem(BaseModel):
    from_user_id: int
    from_user_name: str
    to_user_id: int
    to_user_name: str
    to_user_iban: Optional[str] = None
    to_user_account: Optional[str] = None
    amount: float
    spayd_string: str


class MemberBalance(BaseModel):
    user_id: int
    user_name: str
    avatar_color: str
    paid_total: float
    share_total: float
    net_balance: float  # positive = is owed money, negative = owes money


class DebtSettlementResponse(BaseModel):
    balances: List[MemberBalance]
    settlements: List[DebtSettlementItem]


class CategorySpendSummary(BaseModel):
    category: str
    current_month_amount: float
    historical_monthly_average: float  # průměrná měsíční útrata ze všech evidovaných měsíců
    budget_limit: Optional[float] = None
    percentage_of_budget: Optional[float] = None
    difference_from_average_percent: Optional[float] = None
    icon: str = "Tag"
    color: str = "#f97316"


class FinanceMonthlySummary(BaseModel):
    month: str  # YYYY-MM
    total_income: float
    total_expense: float
    net_balance: float
    total_budget: float
    all_months_average_expense: float  # celková průměrná měsíční útrata napříč všemi měsíci
    distinct_months_count: int
    categories: List[CategorySpendSummary]
    recent_transactions: List[TransactionResponse]


class CsvImportRow(BaseModel):
    date: str
    title: str
    amount: float
    transaction_type: str = "expense"
    category: str = "groceries"


class CsvImportPreview(BaseModel):
    rows: List[CsvImportRow]
    total_count: int
    total_income: float
    total_expense: float


class CsvImportConfirm(BaseModel):
    rows: List[CsvImportRow]
    payer_id: int
    is_shared: bool = True


class ReceiptScanRequest(BaseModel):
    image_base64: Optional[str] = None
    image_url: Optional[str] = None


class ReceiptScanResponse(BaseModel):
    store_name: Optional[str] = None
    date: Optional[str] = None
    total_amount: Optional[float] = None
    category: Optional[str] = "groceries"
    items_summary: Optional[str] = None
    raw_text: Optional[str] = None


class UserFinanceProfileUpdate(BaseModel):
    bank_account: Optional[str] = None
    iban: Optional[str] = None


class UserFinanceProfileResponse(BaseModel):
    user_id: int
    bank_account: Optional[str] = None
    iban: Optional[str] = None
