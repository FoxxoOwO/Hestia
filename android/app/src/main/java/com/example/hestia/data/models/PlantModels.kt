package com.example.hestia.data.models

import kotlinx.serialization.Serializable

// ==========================================================
// PLANTS
// ==========================================================

@Serializable
data class PlantTask(
    val id: Int = 0,
    val plant_id: Int = 0,
    val task_type: String = "water",
    val due_date: String = "",
    val interval_days: Int = 7,
    val notes: String? = null,
    val is_completed: Boolean = false,
    val last_completed_at: String? = null,
    val created_at: String? = null
)

@Serializable
data class PlantTaskCreate(
    val task_type: String = "water",
    val due_date: String,
    val interval_days: Int = 7,
    val notes: String? = null,
    val is_completed: Boolean = false
)

@Serializable
data class PlantLogEntry(
    val id: Int = 0,
    val plant_id: Int = 0,
    val entry_type: String = "note",
    val image_url: String? = null,
    val title: String = "",
    val notes: String? = null,
    val created_at: String? = null
)

@Serializable
data class PlantLogEntryCreate(
    val entry_type: String = "note",
    val image_url: String? = null,
    val title: String,
    val notes: String? = null
)

@Serializable
data class Plant(
    val id: Int = 0,
    val name: String = "",
    val species_latin: String? = null,
    val species_czech: String? = null,
    val room: String = "living_room",
    val light_requirement: String = "bright_indirect",
    val watering_interval_days: Int = 7,
    val winter_watering_interval_days: Int = 14,
    val fertilizing_interval_days: Int = 14,
    val misting_required: Boolean = false,
    val pot_diameter_cm: Double? = null,
    val substrate_type: String? = null,
    val pet_toxicity: String = "safe",
    val pet_toxicity_notes: String? = null,
    val primary_image_url: String? = null,
    val health_status: String = "healthy",
    val health_notes: String? = null,
    val last_watered_date: String? = null,
    val next_watering_date: String? = null,
    val is_winter_mode: Boolean = false,
    val is_favorite: Boolean = false,
    val notes: String? = null,
    val created_by_id: Int? = null,
    val created_at: String? = null,
    val updated_at: String? = null,
    val days_until_watering: Int = 0,
    val is_thirsty: Boolean = false,
    val watering_status: String = "ok",
    val tasks: List<PlantTask> = emptyList(),
    val log_entries: List<PlantLogEntry> = emptyList()
)

@Serializable
data class PlantCreate(
    val name: String,
    val species_latin: String? = null,
    val species_czech: String? = null,
    val room: String = "living_room",
    val light_requirement: String = "bright_indirect",
    val watering_interval_days: Int = 7,
    val winter_watering_interval_days: Int = 14,
    val fertilizing_interval_days: Int = 14,
    val misting_required: Boolean = false,
    val pot_diameter_cm: Double? = null,
    val substrate_type: String? = null,
    val pet_toxicity: String = "safe",
    val pet_toxicity_notes: String? = null,
    val primary_image_url: String? = null,
    val health_status: String = "healthy",
    val health_notes: String? = null,
    val last_watered_date: String? = null,
    val next_watering_date: String? = null,
    val is_winter_mode: Boolean = false,
    val is_favorite: Boolean = false,
    val notes: String? = null
)

@Serializable
data class PlantUpdate(
    val name: String? = null,
    val species_latin: String? = null,
    val species_czech: String? = null,
    val room: String? = null,
    val light_requirement: String? = null,
    val watering_interval_days: Int? = null,
    val winter_watering_interval_days: Int? = null,
    val fertilizing_interval_days: Int? = null,
    val misting_required: Boolean? = null,
    val pot_diameter_cm: Double? = null,
    val substrate_type: String? = null,
    val pet_toxicity: String? = null,
    val pet_toxicity_notes: String? = null,
    val primary_image_url: String? = null,
    val health_status: String? = null,
    val health_notes: String? = null,
    val last_watered_date: String? = null,
    val next_watering_date: String? = null,
    val is_winter_mode: Boolean? = null,
    val is_favorite: Boolean? = null,
    val notes: String? = null
)

@Serializable
data class PlantAiRequest(
    val plant_name: String? = null,
    val image_base64: String? = null,
    val image_url: String? = null,
    val target_language: String = "cs"
)

@Serializable
data class PlantAiExtracted(
    val common_name: String = "",
    val species_latin: String = "",
    val species_czech: String = "",
    val description: String = "",
    val light_requirement: String = "bright_indirect",
    val watering_interval_days: Int = 7,
    val winter_watering_interval_days: Int = 14,
    val fertilizing_interval_days: Int = 30,
    val misting_required: Boolean = false,
    val substrate_recommendation: String = "",
    val pet_toxicity: String = "safe",
    val pet_toxicity_details: String = "",
    val initial_health_assessment: String = ""
)

@Serializable
data class PlantDiagnosisRequest(
    val plant_id: Int? = null,
    val plant_name: String? = null,
    val symptoms_description: String,
    val image_base64: String? = null,
    val image_url: String? = null,
    val target_language: String = "cs"
)

@Serializable
data class PlantDiagnosisResponse(
    val plant_name: String = "",
    val diagnosis: String = "",
    val cause: String = "",
    val severity: String = "low",
    val is_contagious: Boolean = false,
    val action_steps: List<String> = emptyList(),
    val prevention_tips: String = ""
)

@Serializable
data class PlantSitterItem(
    val plant_id: Int = 0,
    val plant_name: String = "",
    val species: String = "",
    val room: String = "",
    val image_url: String? = null,
    val action_required: String = "water",
    val recommended_water_amount: String = "",
    val instructions: String = ""
)
