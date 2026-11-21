package com.example.hestia.data.models

import kotlinx.serialization.Serializable

// ==========================================================
// FINANCE
// ==========================================================

@Serializable
data class TransactionItem(
    val id: Int = 0,
    val title: String = "",
    val amount: Double = 0.0,
    val transaction_type: String = "expense",
    val category: String = "groceries",
    val date: String = "",
    val payer_id: Int = 0,
    val is_shared: Boolean = true,
    val split_type: String = "equal",
    val split_details: String? = "{}",
    val receipt_url: String? = null,
    val notes: String? = null,
    val is_settled: Boolean = false,
    val created_at: String? = null,
    val updated_at: String? = null,
    val payer: UserSimple? = null
)

@Serializable
data class TransactionCreate(
    val title: String,
    val amount: Double,
    val transaction_type: String = "expense",
    val category: String = "groceries",
    val date: String,
    val payer_id: Int,
    val is_shared: Boolean = true,
    val split_type: String = "equal",
    val split_details: String? = "{}",
    val receipt_url: String? = null,
    val notes: String? = null
)

@Serializable
data class TransactionUpdate(
    val title: String? = null,
    val amount: Double? = null,
    val transaction_type: String? = null,
    val category: String? = null,
    val date: String? = null,
    val payer_id: Int? = null,
    val is_shared: Boolean? = null,
    val split_type: String? = null,
    val split_details: String? = null,
    val receipt_url: String? = null,
    val notes: String? = null,
    val is_settled: Boolean? = null
)

@Serializable
data class CategorySpendSummary(
    val category: String = "",
    val current_month_amount: Double = 0.0,
    val historical_monthly_average: Double = 0.0,
    val budget_limit: Double? = null,
    val percentage_of_budget: Double? = null,
    val difference_from_average_percent: Double? = null,
    val icon: String = "Tag",
    val color: String = "#f97316"
)

@Serializable
data class FinanceSummary(
    val month: String = "",
    val total_income: Double = 0.0,
    val total_expense: Double = 0.0,
    val net_balance: Double = 0.0,
    val total_budget: Double = 0.0,
    val all_months_average_expense: Double = 0.0,
    val distinct_months_count: Int = 0,
    val categories: List<CategorySpendSummary> = emptyList(),
    val recent_transactions: List<TransactionItem> = emptyList()
)

@Serializable
data class CategoryBudget(
    val id: Int = 0,
    val category: String = "",
    val monthly_limit: Double = 5000.0,
    val icon: String = "Tag",
    val color: String = "#f97316"
)

@Serializable
data class CategoryBudgetCreate(
    val category: String,
    val monthly_limit: Double = 5000.0,
    val icon: String = "Tag",
    val color: String = "#f97316"
)

@Serializable
data class Subscription(
    val id: Int = 0,
    val name: String = "",
    val amount: Double = 0.0,
    val billing_cycle: String = "monthly",
    val next_billing_date: String = "",
    val category: String = "entertainment",
    val payer_id: Int? = null,
    val is_active: Boolean = true,
    val service_url: String? = null,
    val notes: String? = null,
    val created_at: String? = null,
    val payer: UserSimple? = null,
    val monthly_equivalent: Double = 0.0,
    val days_until_billing: Int? = null
)

@Serializable
data class SubscriptionCreate(
    val name: String,
    val amount: Double,
    val billing_cycle: String = "monthly",
    val next_billing_date: String,
    val category: String = "entertainment",
    val payer_id: Int? = null,
    val is_active: Boolean = true,
    val service_url: String? = null,
    val notes: String? = null
)

@Serializable
data class SubscriptionUpdate(
    val name: String? = null,
    val amount: Double? = null,
    val billing_cycle: String? = null,
    val next_billing_date: String? = null,
    val category: String? = null,
    val payer_id: Int? = null,
    val is_active: Boolean? = null,
    val service_url: String? = null,
    val notes: String? = null
)

@Serializable
data class SavingsGoal(
    val id: Int = 0,
    val title: String = "",
    val target_amount: Double = 0.0,
    val current_amount: Double = 0.0,
    val target_date: String? = null,
    val icon: String = "PiggyBank",
    val color: String = "#10b981",
    val is_completed: Boolean = false,
    val notes: String? = null,
    val created_at: String? = null,
    val progress_percentage: Double = 0.0
)

@Serializable
data class SavingsGoalCreate(
    val title: String,
    val target_amount: Double,
    val current_amount: Double = 0.0,
    val target_date: String? = null,
    val icon: String = "PiggyBank",
    val color: String = "#10b981",
    val is_completed: Boolean = false,
    val notes: String? = null
)

@Serializable
data class SavingsGoalUpdate(
    val title: String? = null,
    val target_amount: Double? = null,
    val current_amount: Double? = null,
    val target_date: String? = null,
    val icon: String? = null,
    val color: String? = null,
    val is_completed: Boolean? = null,
    val notes: String? = null
)

@Serializable
data class SavingsGoalDeposit(val amount: Double)

@Serializable
data class DebtSettlementItem(
    val from_user_id: Int = 0,
    val from_user_name: String = "",
    val to_user_id: Int = 0,
    val to_user_name: String = "",
    val to_user_iban: String? = null,
    val to_user_account: String? = null,
    val amount: Double = 0.0,
    val spayd_string: String = ""
)

@Serializable
data class MemberBalance(
    val user_id: Int = 0,
    val user_name: String = "",
    val avatar_color: String = "#F97316",
    val paid_total: Double = 0.0,
    val share_total: Double = 0.0,
    val net_balance: Double = 0.0
)

@Serializable
data class DebtSettlementResponse(
    val balances: List<MemberBalance> = emptyList(),
    val settlements: List<DebtSettlementItem> = emptyList()
)

@Serializable
data class SettleRequest(
    val from_user_id: Int,
    val to_user_id: Int,
    val amount: Double,
    val note: String? = null
)

@Serializable
data class CsvImportRow(
    val date: String = "",
    val title: String = "",
    val amount: Double = 0.0,
    val transaction_type: String = "expense",
    val category: String = "groceries"
)

@Serializable
data class CsvImportPreview(
    val rows: List<CsvImportRow> = emptyList(),
    val total_count: Int = 0,
    val total_income: Double = 0.0,
    val total_expense: Double = 0.0
)

@Serializable
data class CsvImportConfirm(
    val rows: List<CsvImportRow>,
    val payer_id: Int,
    val is_shared: Boolean = true
)

@Serializable
data class ReceiptScanRequest(val image_base64: String? = null, val image_url: String? = null)

@Serializable
data class ReceiptScanResponse(
    val store_name: String? = null,
    val date: String? = null,
    val total_amount: Double? = null,
    val category: String? = "groceries",
    val items_summary: String? = null,
    val raw_text: String? = null
)

@Serializable
data class UserFinanceProfile(
    val user_id: Int = 0,
    val bank_account: String? = null,
    val iban: String? = null
)

@Serializable
data class UserFinanceProfileUpdate(val bank_account: String? = null, val iban: String? = null)
