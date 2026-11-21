package com.example.hestia.data.models

import kotlinx.serialization.Serializable

// ==========================================================
// MEDICINES
// ==========================================================

@Serializable
data class Medicine(
    val id: Int = 0,
    val name: String = "",
    val active_substance: String? = null,
    val form: String = "tablets",
    val category: String = "pain_fever",
    val location: String = "bathroom",
    val package_size: String? = null,
    val current_quantity: Double = 1.0,
    val unit: String = "ks",
    val min_quantity_warning: Double = 0.0,
    val expiration_date: String? = null,
    val opened_date: String? = null,
    val validity_months_after_opening: Int? = null,
    val is_prescription: Boolean = false,
    val requires_refrigeration: Boolean = false,
    val age_group: String = "all",
    val dosage_instructions: String? = null,
    val storage_instructions: String? = null,
    val sukl_code_or_url: String? = null,
    val notes: String? = null,
    val assigned_user_id: Int? = null,
    val assigned_user_name: String? = null,
    val created_at: String? = null,
    val updated_at: String? = null,
    val days_until_expiration: Int? = null,
    val expiration_status: String = "ok",
    val after_opening_expired: Boolean = false,
    val is_low_stock: Boolean = false
)

@Serializable
data class MedicineCreate(
    val name: String,
    val active_substance: String? = null,
    val form: String = "tablets",
    val category: String = "pain_fever",
    val location: String = "bathroom",
    val package_size: String? = null,
    val current_quantity: Double = 1.0,
    val unit: String = "ks",
    val min_quantity_warning: Double = 0.0,
    val expiration_date: String? = null,
    val opened_date: String? = null,
    val validity_months_after_opening: Int? = null,
    val is_prescription: Boolean = false,
    val requires_refrigeration: Boolean = false,
    val age_group: String = "all",
    val dosage_instructions: String? = null,
    val storage_instructions: String? = null,
    val sukl_code_or_url: String? = null,
    val notes: String? = null,
    val assigned_user_id: Int? = null
)

@Serializable
data class MedicineUpdate(
    val name: String? = null,
    val active_substance: String? = null,
    val form: String? = null,
    val category: String? = null,
    val location: String? = null,
    val package_size: String? = null,
    val current_quantity: Double? = null,
    val unit: String? = null,
    val min_quantity_warning: Double? = null,
    val expiration_date: String? = null,
    val opened_date: String? = null,
    val validity_months_after_opening: Int? = null,
    val is_prescription: Boolean? = null,
    val requires_refrigeration: Boolean? = null,
    val age_group: String? = null,
    val dosage_instructions: String? = null,
    val storage_instructions: String? = null,
    val sukl_code_or_url: String? = null,
    val notes: String? = null,
    val assigned_user_id: Int? = null
)

@Serializable
data class MedicineStats(
    val total_items: Int = 0,
    val expired_count: Int = 0,
    val expiring_soon_count: Int = 0,
    val low_stock_count: Int = 0,
    val prescription_count: Int = 0,
    val requires_fridge_count: Int = 0,
    val active_schedules_count: Int = 0,
    val locations_count: Map<String, Int> = emptyMap(),
    val categories_count: Map<String, Int> = emptyMap()
)

@Serializable
data class MedicationSchedule(
    val id: Int = 0,
    val medicine_id: Int = 0,
    val user_id: Int = 0,
    val schedule_type: String = "chronic",
    val start_date: String = "",
    val end_date: String? = null,
    val times_per_day: Int = 1,
    val time_slots: List<String> = emptyList(),
    val food_relation: String = "any",
    val dosage_per_take: String = "1 tableta",
    val is_active: Boolean = true,
    val notes: String? = null,
    val created_at: String? = null,
    val medicine_name: String? = null,
    val user_name: String? = null,
    val is_taken_today: Boolean = false
)

@Serializable
data class MedicationScheduleCreate(
    val medicine_id: Int,
    val user_id: Int,
    val schedule_type: String = "chronic",
    val start_date: String,
    val end_date: String? = null,
    val times_per_day: Int = 1,
    val time_slots: List<String> = listOf("morning"),
    val food_relation: String = "any",
    val dosage_per_take: String = "1 tableta",
    val is_active: Boolean = true,
    val notes: String? = null
)

@Serializable
data class MedicationScheduleUpdate(
    val schedule_type: String? = null,
    val start_date: String? = null,
    val end_date: String? = null,
    val times_per_day: Int? = null,
    val time_slots: List<String>? = null,
    val food_relation: String? = null,
    val dosage_per_take: String? = null,
    val is_active: Boolean? = null,
    val notes: String? = null
)

@Serializable
data class MedicationLog(
    val id: Int = 0,
    val schedule_id: Int? = null,
    val medicine_id: Int = 0,
    val user_id: Int = 0,
    val taken_at: String? = null,
    val time_slot: String? = null,
    val dose_taken: String? = null,
    val status: String = "taken",
    val notes: String? = null,
    val medicine_name: String? = null,
    val user_name: String? = null
)

@Serializable
data class MedicationLogCreate(
    val schedule_id: Int? = null,
    val medicine_id: Int,
    val user_id: Int,
    val time_slot: String? = null,
    val dose_taken: String? = null,
    val status: String = "taken",
    val notes: String? = null,
    val decrement_stock: Boolean = true
)

@Serializable
data class PediatricPreparation(
    val brand_name: String = "",
    val concentration: String = "",
    val amount_per_single_dose: String = "",
    val note: String? = null
)

@Serializable
data class PediatricDosage(
    val weight_kg: Double = 0.0,
    val drug: String = "",
    val drug_name_cs: String = "",
    val single_dose_mg_min: Double = 0.0,
    val single_dose_mg_max: Double = 0.0,
    val daily_max_mg: Double = 0.0,
    val interval_hours: Int = 0,
    val max_doses_per_day: Int = 0,
    val preparations: List<PediatricPreparation> = emptyList(),
    val safety_warnings: List<String> = emptyList()
)

@Serializable
data class FirstAidGuide(
    val id: String = "",
    val title: String = "",
    val category: String = "emergency",
    val urgency: String = "high",
    val emergency_call: String? = null,
    val summary: String = "",
    val action_steps: List<String> = emptyList(),
    val dont_do_steps: List<String> = emptyList(),
    val note: String? = null
)
