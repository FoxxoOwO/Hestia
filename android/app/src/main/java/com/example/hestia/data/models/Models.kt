package com.example.hestia.data.models

import kotlinx.serialization.Serializable

// --- AUTH & USERS ---
@Serializable
data class LoginRequest(
    val username: String,
    val password: String
)

@Serializable
data class User(
    val id: Int,
    val username: String,
    val display_name: String,
    val email: String? = null,
    val role: String = "member",
    val avatar_color: String? = "#F97316",
    val is_active: Boolean = true
)

@Serializable
data class PublicMember(
    val id: Int,
    val username: String,
    val display_name: String,
    val avatar_color: String? = "#F97316",
    val role: String = "member"
)

@Serializable
data class TokenResponse(
    val access_token: String,
    val token_type: String = "bearer",
    val user: User
)

@Serializable
data class HealthResponse(
    val status: String,
    val app: String,
    val version: String,
    val modules: List<String> = emptyList()
)

// --- SHOPPING LIST ---
@Serializable
data class ShoppingItem(
    val id: Int,
    val name: String,
    val amount: Double = 1.0,
    val unit: String = "ks",
    val category: String = "ostatní",
    val is_checked: Boolean = false,
    val urgent: Boolean = false,
    val notes: String? = null
)

@Serializable
data class ShoppingItemCreate(
    val name: String,
    val amount: Double = 1.0,
    val unit: String = "ks",
    val category: String = "ostatní",
    val urgent: Boolean = false,
    val notes: String? = null
)

@Serializable
data class ShoppingItemUpdate(
    val is_checked: Boolean? = null,
    val amount: Double? = null,
    val unit: String? = null,
    val urgent: Boolean? = null
)

// --- CHORES & HOUSEWORK ---
@Serializable
data class Chore(
    val id: Int,
    val title: String,
    val description: String? = null,
    val points: Int = 10,
    val frequency: String = "weekly",
    val estimated_minutes: Int = 15,
    val is_rotation_enabled: Boolean = true,
    val is_appliance_maintenance: Boolean = false,
    val appliance_name: String? = null,
    val current_assignee_id: Int? = null,
    val last_completed_at: String? = null,
    val next_due_date: String? = null,
    val is_active: Boolean = true
)

@Serializable
data class ChoreCompleteResult(
    val success: Boolean,
    val points_awarded: Int,
    val next_assignee_id: Int? = null,
    val message: String
)

@Serializable
data class PanicTask(
    val title: String,
    val room: String = "Společné prostory",
    val estimated_minutes: Int = 5,
    val points: Int = 10,
    val tip: String = ""
)

@Serializable
data class PanicModeResponse(
    val panic_tasks: List<PanicTask> = emptyList(),
    val message: String = ""
)

// --- MEDICINES & FIRST AID ---
@Serializable
data class Medicine(
    val id: Int,
    val name: String,
    val active_ingredient: String? = null,
    val category: String = "fever",
    val form: String = "tablet",
    val strength: String? = null,
    val current_quantity: Double = 0.0,
    val unit: String = "ks",
    val expiry_date: String? = null,
    val status: String = "ok",
    val opened_at: String? = null,
    val expiry_after_opening_days: Int? = null,
    val is_prescription_required: Boolean = false,
    val is_fridge_required: Boolean = false
)

@Serializable
data class MedicineStats(
    val total_medicines: Int = 0,
    val expiring_soon: Int = 0,
    val expired: Int = 0,
    val low_stock: Int = 0
)

@Serializable
data class FirstAidGuide(
    val id: String,
    val title: String,
    val category: String,
    val severity: String = "high",
    val icon: String = "alert",
    val immediate_actions: List<String> = emptyList(),
    val do_nots: List<String> = emptyList(),
    val when_to_call_155: String = "",
    val notes: String? = null
)

// --- PLANTS ---
@Serializable
data class Plant(
    val id: Int,
    val name: String,
    val species: String? = null,
    val room: String = "Obývací pokoj",
    val watering_interval_days: Int = 7,
    val last_watered: String? = null,
    val next_watering: String? = null,
    val days_until_watering: Int = 0,
    val is_pet_friendly: Boolean = true,
    val notes: String? = null
)

@Serializable
data class WaterActionResult(
    val success: Boolean,
    val status: String = "watered_today",
    val days_until_watering: Int = 7,
    val message: String = ""
)

// --- VEHICLES & GARAGE ---
@Serializable
data class Vehicle(
    val id: Int,
    val name: String,
    val brand: String,
    val model: String,
    val plate_number: String,
    val current_mileage: Int = 0,
    val stk_expiry: String? = null,
    val days_until_stk: Int? = null,
    val stk_status: String = "ok",
    val vignette_expiry: String? = null,
    val days_until_vignette: Int? = null,
    val vignette_status: String = "none",
    val fuel_type: String = "diesel",
    val average_consumption: Double? = null
)

@Serializable
data class RefuelingCreate(
    val current_mileage: Int,
    val liters: Double,
    val total_price: Double,
    val gas_station: String? = null
)

@Serializable
data class MileageUpdate(
    val mileage: Int
)

// --- ACTIVITIES (AUDIT TRAIL) ---
@Serializable
data class ActivityLog(
    val id: Int,
    val user_id: Int? = null,
    val user_name: String = "Systém",
    val username: String? = null,
    val user_display_name: String? = null,
    val user_avatar_color: String? = "#F97316",
    val user_color: String? = "#F97316",
    val module: String = "system",
    val action_type: String = "info",
    val title: String = "",
    val description: String? = null,
    val created_at: String = ""
) {
    val displayName: String
        get() = user_display_name ?: user_name.ifBlank { username ?: "Uživatel" }

    val effectiveColor: String
        get() = user_color ?: user_avatar_color ?: "#F97316"
}

@Serializable
data class ActivityListResponse(
    val items: List<ActivityLog> = emptyList(),
    val total: Int = 0,
    val limit: Int = 50,
    val offset: Int = 0
)

// --- RECIPES & COOKBOOK ---
@Serializable
data class RecipeIngredient(
    val name: String,
    val amount: Double = 1.0,
    val unit: String = "ks",
    val note: String? = null,
    val category: String? = "other"
)

@Serializable
data class RecipeStep(
    val step: Int = 1,
    val text: String,
    val timer_minutes: Int? = null
)

@Serializable
data class Recipe(
    val id: Int,
    val title: String,
    val description: String? = null,
    val image_url: String? = null,
    val prep_time_minutes: Int = 15,
    val cook_time_minutes: Int = 30,
    val total_time_minutes: Int = 45,
    val difficulty: String = "medium",
    val price_level: String = "medium",
    val default_servings: Int = 4,
    val tags: List<String> = emptyList(),
    val ingredients: List<RecipeIngredient> = emptyList(),
    val instructions: List<RecipeStep> = emptyList(),
    val is_favorite: Boolean = false
)

// --- PANTRY & INVENTORY ---
@Serializable
data class PantryItem(
    val id: Int,
    val name: String,
    val category: String = "pantry",
    val quantity: Double = 1.0,
    val unit: String = "ks",
    val expiration_date: String? = null,
    val min_quantity: Double? = null,
    val note: String? = null,
    val status: String = "fresh"
)

@Serializable
data class PantryItemCreate(
    val name: String,
    val category: String = "pantry",
    val quantity: Double = 1.0,
    val unit: String = "ks",
    val expiration_date: String? = null,
    val note: String? = null
)

// --- PETS ---
@Serializable
data class PetMedicalRecord(
    val id: Int = 0,
    val record_type: String = "checkup",
    val title: String,
    val performed_date: String,
    val valid_until: String? = null,
    val veterinarian: String? = null,
    val notes: String? = null
)

@Serializable
data class Pet(
    val id: Int,
    val name: String,
    val species: String = "dog",
    val breed: String? = null,
    val birth_date: String? = null,
    val gender: String = "unknown",
    val color: String? = null,
    val primary_image_url: String? = null,
    val age_formatted: String = "",
    val latest_weight_kg: Double? = null,
    val last_fed_at: String? = null,
    val last_fed_by_name: String? = null,
    val vet_name: String? = null,
    val vet_phone: String? = null,
    val medical_records: List<PetMedicalRecord> = emptyList(),
    val is_favorite: Boolean = false
)

// --- FINANCE ---
@Serializable
data class TransactionItem(
    val id: Int,
    val title: String,
    val amount: Double,
    val transaction_type: String = "expense",
    val category: String = "groceries",
    val date: String,
    val payer_id: Int,
    val is_shared: Boolean = true,
    val is_settled: Boolean = false,
    val notes: String? = null,
    val payer: UserSimple? = null
)

@Serializable
data class UserSimple(
    val id: Int,
    val username: String,
    val display_name: String,
    val avatar_color: String? = "#F97316"
)

@Serializable
data class DebtSettlementItem(
    val from_user_id: Int,
    val from_user_name: String,
    val to_user_id: Int,
    val to_user_name: String,
    val amount: Double,
    val spayd_string: String = ""
)

@Serializable
data class MemberBalance(
    val user_id: Int,
    val user_name: String,
    val avatar_color: String = "#F97316",
    val paid_total: Double,
    val share_total: Double,
    val net_balance: Double
)

@Serializable
data class DebtSettlementResponse(
    val balances: List<MemberBalance> = emptyList(),
    val settlements: List<DebtSettlementItem> = emptyList()
)

@Serializable
data class FinanceSummary(
    val current_month_expenses: Double = 0.0,
    val current_month_income: Double = 0.0,
    val current_month_net: Double = 0.0,
    val historical_average_monthly_expense: Double = 0.0
)

// --- DOCUMENTS & ARCHIVE ---
@Serializable
data class DocumentItem(
    val id: Int,
    val title: String,
    val category: String = "warranty",
    val file_name: String = "",
    val file_size: Int = 0,
    val file_type: String = "application/pdf",
    val issuer: String? = null,
    val document_date: String? = null,
    val expiry_date: String? = null,
    val warranty_months: Int? = null,
    val amount: Double? = null,
    val physical_location: String? = null,
    val is_vault_protected: Boolean = false,
    val days_until_expiry: Int? = null,
    val status: String = "active"
)

@Serializable
data class DocumentStats(
    val total_documents: Int = 0,
    val vault_protected: Int = 0,
    val expiring_soon: Int = 0,
    val expired: Int = 0
)

// --- SYSTEM BACKUPS ---
@Serializable
data class BackupItem(
    val filename: String,
    val created_at: String,
    val size_kb: Double = 0.0,
    val items_count: Int = 0,
    val note: String? = null
)
