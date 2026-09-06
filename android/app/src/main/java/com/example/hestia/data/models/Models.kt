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
    val username: String,
    val user_display_name: String,
    val user_color: String? = "#F97316",
    val module: String,
    val action_type: String,
    val title: String,
    val description: String? = null,
    val created_at: String
)
