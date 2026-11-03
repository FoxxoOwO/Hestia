package com.example.hestia.data.models

import kotlinx.serialization.Serializable

// ==========================================================
// AUTH & USERS
// ==========================================================

@Serializable
data class LoginRequest(val username: String, val password: String)

@Serializable
data class User(
    val id: Int = 0,
    val username: String = "",
    val display_name: String = "",
    val email: String? = null,
    val role: String = "member",
    val avatar_color: String? = "#F97316",
    val preferred_language: String = "cs",
    val preferred_theme: String = "system",
    val is_active: Boolean = true,
    val created_at: String? = null
) {
    val initials: String
        get() = display_name.ifBlank { username }.trim().take(1).uppercase().ifBlank { "?" }
}

@Serializable
data class UserCreate(
    val username: String,
    val display_name: String,
    val password: String,
    val email: String? = null,
    val role: String = "member",
    val avatar_color: String = "#F97316",
    val preferred_language: String = "cs",
    val preferred_theme: String = "system"
)

@Serializable
data class UserUpdate(
    val username: String? = null,
    val display_name: String? = null,
    val email: String? = null,
    val role: String? = null,
    val avatar_color: String? = null,
    val preferred_language: String? = null,
    val preferred_theme: String? = null,
    val password: String? = null
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
    val status: String = "unknown",
    val app: String = "",
    val version: String = "",
    val modules: List<String> = emptyList()
)

@Serializable
data class UserSimple(
    val id: Int = 0,
    val username: String = "",
    val display_name: String = "",
    val avatar_color: String? = "#F97316"
)

// ==========================================================
// SHOPPING LIST
// ==========================================================

@Serializable
data class ShoppingItem(
    val id: Int = 0,
    val name: String = "",
    val amount: Double? = null,
    val unit: String? = null,
    val category: String = "other",
    val is_checked: Boolean = false,
    val recipe_id: Int? = null,
    val added_by_id: Int? = null,
    val created_at: String? = null
)

@Serializable
data class ShoppingItemCreate(
    val name: String,
    val amount: Double? = 1.0,
    val unit: String? = "ks",
    val category: String = "other",
    val is_checked: Boolean = false,
    val recipe_id: Int? = null
)

@Serializable
data class ShoppingItemUpdate(
    val name: String? = null,
    val amount: Double? = null,
    val unit: String? = null,
    val category: String? = null,
    val is_checked: Boolean? = null
)

@Serializable
data class AddFromRecipeIngredient(
    val name: String,
    val amount: Double? = null,
    val unit: String? = null,
    val category: String? = "other"
)

@Serializable
data class AddRecipeToShoppingRequest(
    val recipe_id: Int,
    val ingredients: List<AddFromRecipeIngredient>
)

// ==========================================================
// RECIPES
// ==========================================================

@Serializable
data class RecipeIngredient(
    val name: String = "",
    val amount: Double = 1.0,
    val unit: String = "ks",
    val note: String? = null,
    val category: String? = "other"
)

@Serializable
data class RecipeStep(
    val step: Int = 1,
    val text: String = "",
    val timer_minutes: Int? = null
)

@Serializable
data class Recipe(
    val id: Int = 0,
    val title: String = "",
    val description: String? = null,
    val image_url: String? = null,
    val prep_time_minutes: Int = 15,
    val cook_time_minutes: Int = 30,
    val total_time_minutes: Int = 45,
    val difficulty: String = "medium",
    val price_level: String = "medium",
    val default_servings: Int = 4,
    val tags: List<String> = emptyList(),
    val utensils: List<String> = emptyList(),
    val ingredients: List<RecipeIngredient> = emptyList(),
    val instructions: List<RecipeStep> = emptyList(),
    val source_url: String? = null,
    val is_favorite: Boolean = false,
    val created_by_id: Int? = null,
    val created_at: String? = null,
    val updated_at: String? = null
)

@Serializable
data class RecipeCreate(
    val title: String,
    val description: String? = null,
    val image_url: String? = null,
    val prep_time_minutes: Int = 15,
    val cook_time_minutes: Int = 30,
    val difficulty: String = "medium",
    val price_level: String = "medium",
    val default_servings: Int = 4,
    val tags: List<String> = emptyList(),
    val utensils: List<String> = emptyList(),
    val ingredients: List<RecipeIngredient> = emptyList(),
    val instructions: List<RecipeStep> = emptyList(),
    val source_url: String? = null,
    val is_favorite: Boolean = false
)

@Serializable
data class RecipeUpdate(
    val title: String? = null,
    val description: String? = null,
    val image_url: String? = null,
    val prep_time_minutes: Int? = null,
    val cook_time_minutes: Int? = null,
    val difficulty: String? = null,
    val price_level: String? = null,
    val default_servings: Int? = null,
    val tags: List<String>? = null,
    val utensils: List<String>? = null,
    val ingredients: List<RecipeIngredient>? = null,
    val instructions: List<RecipeStep>? = null,
    val source_url: String? = null,
    val is_favorite: Boolean? = null
)

@Serializable
data class ScaledIngredientItem(
    val name: String = "",
    val original_amount: Double = 0.0,
    val scaled_amount: Double = 0.0,
    val unit: String = "ks",
    val note: String? = null,
    val category: String? = "other",
    val is_in_pantry: Boolean = false,
    val pantry_amount: Double? = null
)

@Serializable
data class ScaledRecipeResponse(
    val recipe: Recipe = Recipe(),
    val target_servings: Int = 4,
    val scale_factor: Double = 1.0,
    val scaled_ingredients: List<ScaledIngredientItem> = emptyList()
)

// ==========================================================
// PANTRY
// ==========================================================

@Serializable
data class PantryItem(
    val id: Int = 0,
    val name: String = "",
    val category: String = "pantry",
    val quantity: Double = 1.0,
    val unit: String = "ks",
    val expiration_date: String? = null,
    val min_quantity: Double? = null,
    val note: String? = null,
    val status: String = "fresh",
    val updated_at: String? = null
)

@Serializable
data class PantryItemCreate(
    val name: String,
    val category: String = "pantry",
    val quantity: Double = 1.0,
    val unit: String = "ks",
    val expiration_date: String? = null,
    val min_quantity: Double? = null,
    val note: String? = null
)

@Serializable
data class PantryItemUpdate(
    val name: String? = null,
    val category: String? = null,
    val quantity: Double? = null,
    val unit: String? = null,
    val expiration_date: String? = null,
    val min_quantity: Double? = null,
    val note: String? = null
)

@Serializable
data class RecipeMatchIngredient(
    val ingredient_name: String = "",
    val required_amount: Double = 0.0,
    val unit: String = "",
    val available_in_pantry: Boolean = false,
    val pantry_quantity: Double? = null
)

@Serializable
data class RecipePantryMatch(
    val recipe_id: Int = 0,
    val recipe_title: String = "",
    val total_ingredients_count: Int = 0,
    val matched_ingredients_count: Int = 0,
    val missing_ingredients_count: Int = 0,
    val match_percentage: Double = 0.0,
    val missing_ingredients: List<RecipeMatchIngredient> = emptyList(),
    val can_cook_now: Boolean = false
)

// ==========================================================
// MEAL PLANNER
// ==========================================================

@Serializable
data class MealPlanItem(
    val id: Int = 0,
    val date: String = "",
    val meal_type: String = "dinner",
    val recipe_id: Int? = null,
    val custom_title: String? = null,
    val servings: Int = 4,
    val notes: String? = null,
    val is_cooked: Boolean = false,
    val created_by_id: Int? = null,
    val created_at: String? = null,
    val updated_at: String? = null,
    val recipe_title: String? = null,
    val recipe_image_url: String? = null,
    val recipe_prep_time: Int? = null,
    val recipe_cook_time: Int? = null,
    val recipe_difficulty: String? = null
) {
    val displayTitle: String
        get() = recipe_title ?: custom_title ?: "Jídlo"
}

@Serializable
data class MealPlanItemCreate(
    val date: String,
    val meal_type: String = "dinner",
    val recipe_id: Int? = null,
    val custom_title: String? = null,
    val servings: Int = 4,
    val notes: String? = null,
    val is_cooked: Boolean = false
)

@Serializable
data class MealPlanItemUpdate(
    val date: String? = null,
    val meal_type: String? = null,
    val recipe_id: Int? = null,
    val custom_title: String? = null,
    val servings: Int? = null,
    val notes: String? = null,
    val is_cooked: Boolean? = null
)

@Serializable
data class GenerateShoppingRequest(
    val start_date: String,
    val end_date: String,
    val check_pantry: Boolean = true
)

@Serializable
data class GenerateShoppingResponse(
    val added_items_count: Int = 0,
    val already_in_pantry_count: Int = 0,
    val added_items: List<String> = emptyList()
)

// ==========================================================
// CHORES & GAMIFICATION
// ==========================================================

@Serializable
data class Chore(
    val id: Int = 0,
    val title: String = "",
    val description: String? = null,
    val room: String = "general",
    val category: String = "routine",
    val frequency: String = "weekly",
    val interval_days: Int = 7,
    val points: Int = 10,
    val estimated_minutes: Int = 15,
    val is_rotation_enabled: Boolean = true,
    val rotation_member_ids: String = "[]",
    val rotation_member_ids_list: List<Int> = emptyList(),
    val current_assignee_id: Int? = null,
    val current_assignee: UserSimple? = null,
    val due_date: String? = null,
    val days_until_due: Int? = null,
    val is_overdue: Boolean = false,
    val last_completed_at: String? = null,
    val last_completed_by_id: Int? = null,
    val last_completed_by: UserSimple? = null,
    val cleaning_supplies_needed: String? = null,
    val is_appliance_maintenance: Boolean = false,
    val appliance_name: String? = null,
    val is_active: Boolean = true,
    val created_at: String? = null,
    val updated_at: String? = null
)

@Serializable
data class ChoreCreate(
    val title: String,
    val description: String? = null,
    val room: String = "general",
    val category: String = "routine",
    val frequency: String = "weekly",
    val interval_days: Int = 7,
    val points: Int = 10,
    val estimated_minutes: Int = 15,
    val is_rotation_enabled: Boolean = true,
    val rotation_member_ids: List<Int> = emptyList(),
    val current_assignee_id: Int? = null,
    val due_date: String? = null,
    val cleaning_supplies_needed: String? = null,
    val is_appliance_maintenance: Boolean = false,
    val appliance_name: String? = null
)

@Serializable
data class ChoreUpdate(
    val title: String? = null,
    val description: String? = null,
    val room: String? = null,
    val category: String? = null,
    val frequency: String? = null,
    val interval_days: Int? = null,
    val points: Int? = null,
    val estimated_minutes: Int? = null,
    val is_rotation_enabled: Boolean? = null,
    val rotation_member_ids: List<Int>? = null,
    val current_assignee_id: Int? = null,
    val due_date: String? = null,
    val cleaning_supplies_needed: String? = null,
    val is_appliance_maintenance: Boolean? = null,
    val appliance_name: String? = null,
    val is_active: Boolean? = null
)

@Serializable
data class ChoreCompleteRequest(val notes: String? = null, val custom_points: Int? = null)

@Serializable
data class ChoreReassignRequest(val new_assignee_id: Int)

@Serializable
data class LeaderboardMember(
    val user_id: Int = 0,
    val username: String = "",
    val display_name: String = "",
    val avatar_color: String = "#F97316",
    val total_points: Int = 0,
    val weekly_points: Int = 0,
    val available_points: Int = 0,
    val chores_completed_count: Int = 0
)

@Serializable
data class ChoreRewardItem(
    val id: Int = 0,
    val title: String = "",
    val description: String? = null,
    val cost_points: Int = 50,
    val icon: String = "Gift",
    val is_active: Boolean = true,
    val created_at: String? = null
)

@Serializable
data class ChoreRewardCreate(
    val title: String,
    val description: String? = null,
    val cost_points: Int = 50,
    val icon: String = "Gift",
    val is_active: Boolean = true
)

@Serializable
data class ChoreRedemption(
    val id: Int = 0,
    val reward_id: Int = 0,
    val user_id: Int = 0,
    val points_spent: Int = 0,
    val status: String = "approved",
    val redeemed_at: String? = null,
    val reward: ChoreRewardItem? = null,
    val user: UserSimple? = null
)

@Serializable
data class ChoreCompletionResponse(
    val id: Int = 0,
    val chore_id: Int = 0,
    val user_id: Int = 0,
    val points_awarded: Int = 0,
    val completed_at: String? = null,
    val notes: String? = null,
    val user: UserSimple? = null
)

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

// ==========================================================
// PETS
// ==========================================================

@Serializable
data class PetMedicalRecord(
    val id: Int = 0,
    val pet_id: Int = 0,
    val record_type: String = "checkup",
    val title: String = "",
    val performed_date: String = "",
    val valid_until: String? = null,
    val batch_number: String? = null,
    val veterinarian: String? = null,
    val notes: String? = null,
    val document_url: String? = null,
    val created_at: String? = null
)

@Serializable
data class PetMedicalRecordCreate(
    val record_type: String = "checkup",
    val title: String,
    val performed_date: String,
    val valid_until: String? = null,
    val batch_number: String? = null,
    val veterinarian: String? = null,
    val notes: String? = null,
    val document_url: String? = null
)

@Serializable
data class PetMedication(
    val id: Int = 0,
    val pet_id: Int = 0,
    val name: String = "",
    val dosage: String = "",
    val frequency: String = "",
    val start_date: String? = null,
    val end_date: String? = null,
    val is_active: Boolean = true,
    val notes: String? = null,
    val created_at: String? = null
)

@Serializable
data class PetMedicationCreate(
    val name: String,
    val dosage: String,
    val frequency: String,
    val start_date: String? = null,
    val end_date: String? = null,
    val is_active: Boolean = true,
    val notes: String? = null
)

@Serializable
data class PetWeightLog(
    val id: Int = 0,
    val pet_id: Int = 0,
    val weight_kg: Double = 0.0,
    val recorded_date: String = "",
    val notes: String? = null,
    val created_at: String? = null
)

@Serializable
data class PetWeightLogCreate(
    val weight_kg: Double,
    val recorded_date: String,
    val notes: String? = null
)

@Serializable
data class PetTask(
    val id: Int = 0,
    val pet_id: Int = 0,
    val task_type: String = "custom",
    val title: String = "",
    val due_date: String = "",
    val interval_days: Int = 0,
    val notes: String? = null,
    val is_completed: Boolean = false,
    val last_completed_at: String? = null,
    val created_at: String? = null
)

@Serializable
data class PetTaskCreate(
    val task_type: String = "custom",
    val title: String,
    val due_date: String,
    val interval_days: Int = 0,
    val notes: String? = null
)

@Serializable
data class PetLogEntry(
    val id: Int = 0,
    val pet_id: Int = 0,
    val entry_type: String = "note",
    val title: String = "",
    val notes: String? = null,
    val image_url: String? = null,
    val created_at: String? = null
)

@Serializable
data class PetLogEntryCreate(
    val entry_type: String = "note",
    val title: String,
    val notes: String? = null,
    val image_url: String? = null
)

@Serializable
data class Pet(
    val id: Int = 0,
    val name: String = "",
    val species: String = "dog",
    val breed: String? = null,
    val birth_date: String? = null,
    val gender: String = "unknown",
    val is_neutered: Boolean = false,
    val color: String? = null,
    val microchip_number: String? = null,
    val passport_number: String? = null,
    val primary_image_url: String? = null,
    val dietary_needs: String? = null,
    val allergies_and_intolerances: String? = null,
    val vet_name: String? = null,
    val vet_clinic: String? = null,
    val vet_phone: String? = null,
    val vet_address: String? = null,
    val emergency_vet_phone: String? = null,
    val emergency_vet_clinic: String? = null,
    val last_fed_at: String? = null,
    val last_fed_by_name: String? = null,
    val is_favorite: Boolean = false,
    val notes: String? = null,
    val created_by_id: Int? = null,
    val created_at: String? = null,
    val updated_at: String? = null,
    val age_formatted: String = "",
    val latest_weight_kg: Double? = null,
    val has_upcoming_vet_task: Boolean = false,
    val medical_records: List<PetMedicalRecord> = emptyList(),
    val medications: List<PetMedication> = emptyList(),
    val weight_logs: List<PetWeightLog> = emptyList(),
    val tasks: List<PetTask> = emptyList(),
    val log_entries: List<PetLogEntry> = emptyList()
)

@Serializable
data class PetCreate(
    val name: String,
    val species: String = "dog",
    val breed: String? = null,
    val birth_date: String? = null,
    val gender: String = "unknown",
    val is_neutered: Boolean = false,
    val color: String? = null,
    val microchip_number: String? = null,
    val passport_number: String? = null,
    val primary_image_url: String? = null,
    val dietary_needs: String? = null,
    val allergies_and_intolerances: String? = null,
    val vet_name: String? = null,
    val vet_clinic: String? = null,
    val vet_phone: String? = null,
    val vet_address: String? = null,
    val emergency_vet_phone: String? = null,
    val emergency_vet_clinic: String? = null,
    val initial_weight_kg: Double? = null,
    val notes: String? = null
)

@Serializable
data class PetUpdate(
    val name: String? = null,
    val species: String? = null,
    val breed: String? = null,
    val birth_date: String? = null,
    val gender: String? = null,
    val is_neutered: Boolean? = null,
    val color: String? = null,
    val microchip_number: String? = null,
    val passport_number: String? = null,
    val primary_image_url: String? = null,
    val dietary_needs: String? = null,
    val allergies_and_intolerances: String? = null,
    val vet_name: String? = null,
    val vet_clinic: String? = null,
    val vet_phone: String? = null,
    val vet_address: String? = null,
    val emergency_vet_phone: String? = null,
    val emergency_vet_clinic: String? = null,
    val notes: String? = null,
    val is_favorite: Boolean? = null
)

@Serializable
data class PetFoodSafetyRequest(
    val species: String = "dog",
    val food_name: String,
    val target_language: String = "cs"
)

@Serializable
data class PetFoodSafetyResponse(
    val food_name: String = "",
    val species: String = "dog",
    val safety_level: String = "safe",
    val headline: String = "",
    val risk_description: String = "",
    val toxic_dose_info: String? = null,
    val symptoms_of_poisoning: List<String> = emptyList(),
    val first_aid_action: String = ""
)

@Serializable
data class PetSymptomRequest(
    val pet_id: Int? = null,
    val pet_name: String? = null,
    val pet_species: String = "dog",
    val pet_age: String? = null,
    val symptoms_description: String,
    val image_base64: String? = null,
    val image_url: String? = null,
    val target_language: String = "cs"
)

@Serializable
data class PetSymptomResponse(
    val pet_name: String? = null,
    val severity: String = "low",
    val assessment_headline: String = "",
    val possible_causes: List<String> = emptyList(),
    val urgency_message: String = "",
    val action_steps: List<String> = emptyList(),
    val red_flag_symptoms: List<String> = emptyList(),
    val home_care_advice: String = ""
)

@Serializable
data class PetSitterProfile(
    val pet_id: Int = 0,
    val name: String = "",
    val species: String = "",
    val breed: String? = null,
    val age: String = "",
    val gender: String = "",
    val color: String? = null,
    val microchip_number: String? = null,
    val primary_image_url: String? = null,
    val feeding_routine: String = "",
    val allergies_warning: String = "",
    val active_medications: List<PetSitterMedication> = emptyList(),
    val vet_contacts: PetVetContacts? = null,
    val daily_routine_notes: String = ""
)

@Serializable
data class PetSitterMedication(
    val name: String = "",
    val dosage: String = "",
    val frequency: String = ""
)

@Serializable
data class PetVetContacts(
    val vet_name: String? = null,
    val vet_clinic: String? = null,
    val vet_phone: String? = null,
    val emergency_vet_phone: String? = null,
    val emergency_vet_clinic: String? = null
)

@Serializable
data class PetSosFlyer(
    val pet_id: Int = 0,
    val name: String = "",
    val species: String = "",
    val breed: String? = null,
    val color: String? = null,
    val microchip_number: String? = null,
    val image_url: String? = null,
    val owner_contact_name: String = "",
    val owner_contact_phone: String = "",
    val last_seen_date: String = "",
    val distinctive_features: String? = null,
    val reward_note: String? = null
)

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

// ==========================================================
// DOCUMENTS
// ==========================================================

@Serializable
data class DocumentItem(
    val id: Int = 0,
    val title: String = "",
    val category: String = "warranty",
    val file_path: String = "",
    val file_name: String = "",
    val file_size: Int = 0,
    val file_type: String = "application/pdf",
    val issuer: String? = null,
    val document_date: String? = null,
    val expiry_date: String? = null,
    val warranty_months: Int? = null,
    val contract_number: String? = null,
    val amount: Double? = null,
    val physical_location: String? = null,
    val is_vault_protected: Boolean = false,
    val tags: String? = null,
    val summary: String? = null,
    val ocr_fulltext: String? = null,
    val related_entity_type: String? = null,
    val related_entity_id: Int? = null,
    val created_by_id: Int? = null,
    val created_at: String? = null,
    val updated_at: String? = null,
    val days_until_expiry: Int? = null,
    val status: String = "active"
)

@Serializable
data class DocumentCreate(
    val title: String,
    val category: String = "warranty",
    val file_path: String = "manual_entry",
    val file_name: String = "manual_entry.pdf",
    val file_size: Int = 0,
    val file_type: String = "application/pdf",
    val issuer: String? = null,
    val document_date: String? = null,
    val expiry_date: String? = null,
    val warranty_months: Int? = null,
    val contract_number: String? = null,
    val amount: Double? = null,
    val physical_location: String? = null,
    val is_vault_protected: Boolean = false,
    val tags: String? = null,
    val summary: String? = null
)

@Serializable
data class DocumentUpdate(
    val title: String? = null,
    val category: String? = null,
    val issuer: String? = null,
    val document_date: String? = null,
    val expiry_date: String? = null,
    val warranty_months: Int? = null,
    val contract_number: String? = null,
    val amount: Double? = null,
    val physical_location: String? = null,
    val is_vault_protected: Boolean? = null,
    val tags: String? = null,
    val summary: String? = null
)

@Serializable
data class DocumentStats(
    val total_documents: Int = 0,
    val expiring_soon_count: Int = 0,
    val expired_count: Int = 0,
    val vault_count: Int = 0,
    val categories: Map<String, Int> = emptyMap()
)

@Serializable
data class DocumentAiMetadata(
    val title: String? = null,
    val category: String? = "warranty",
    val issuer: String? = null,
    val document_date: String? = null,
    val expiry_date: String? = null,
    val warranty_months: Int? = null,
    val contract_number: String? = null,
    val amount: Double? = null,
    val tags: String? = null,
    val summary: String? = null,
    val ocr_fulltext: String? = null
)

@Serializable
data class DocumentUploadResult(
    val file_path: String = "",
    val file_name: String = "",
    val file_size: Int = 0,
    val file_type: String = "application/pdf",
    val ai_metadata: DocumentAiMetadata? = null
)

@Serializable
data class VaultVerifyRequest(val pin: String)

@Serializable
data class VaultVerifyResponse(val success: Boolean = true, val message: String = "")

@Serializable
data class VaultSetPinRequest(val old_pin: String? = null, val new_pin: String)

// ==========================================================
// VEHICLES
// ==========================================================

@Serializable
data class VehicleRefueling(
    val id: Int = 0,
    val vehicle_id: Int = 0,
    val date: String = "",
    val mileage: Int = 0,
    val fuel_amount_l: Double = 0.0,
    val price_per_l: Double? = null,
    val total_price: Double = 0.0,
    val is_full_tank: Boolean = true,
    val fuel_brand: String? = null,
    val notes: String? = null,
    val calculated_consumption: Double? = null,
    val created_by_id: Int? = null,
    val created_at: String? = null
)

@Serializable
data class VehicleRefuelingCreate(
    val date: String,
    val mileage: Int,
    val fuel_amount_l: Double,
    val price_per_l: Double? = null,
    val total_price: Double,
    val is_full_tank: Boolean = true,
    val fuel_brand: String? = null,
    val notes: String? = null,
    val record_to_finance: Boolean = false
)

@Serializable
data class VehicleServiceRecord(
    val id: Int = 0,
    val vehicle_id: Int = 0,
    val service_type: String = "regular_service",
    val title: String = "",
    val date: String = "",
    val mileage: Int = 0,
    val cost: Double = 0.0,
    val service_shop: String? = null,
    val performed_operations: String? = null,
    val invoice_file_path: String? = null,
    val created_by_id: Int? = null,
    val created_at: String? = null
)

@Serializable
data class VehicleServiceRecordCreate(
    val service_type: String = "regular_service",
    val title: String,
    val date: String,
    val mileage: Int,
    val cost: Double = 0.0,
    val service_shop: String? = null,
    val performed_operations: String? = null,
    val invoice_file_path: String? = null,
    val record_to_finance: Boolean = false
)

@Serializable
data class Vehicle(
    val id: Int = 0,
    val name: String = "",
    val make: String = "",
    val model: String = "",
    val year: Int? = null,
    val color: String? = null,
    val license_plate: String = "",
    val vin: String? = null,
    val fuel_type: String = "diesel",
    val tank_capacity_l: Double? = 50.0,
    val engine_power_kw: Int? = null,
    val engine_displacement_cc: Int? = null,
    val transmission: String = "manual",
    val current_mileage: Int = 0,
    val primary_image_url: String? = null,
    val mot_expiry_date: String? = null,
    val vignette_expiry_date: String? = null,
    val vignette_type: String? = "1_year",
    val insurance_company: String? = null,
    val insurance_policy_number: String? = null,
    val insurance_expiry_date: String? = null,
    val insurance_assistance_phone: String? = null,
    val first_aid_kit_expiry_date: String? = null,
    val tire_type: String? = "winter",
    val tire_dimension: String? = null,
    val tire_tread_depth_mm: Double? = null,
    val tire_storage_location: String? = null,
    val tire_last_swapped_date: String? = null,
    val oil_change_interval_km: Int? = 15000,
    val oil_change_interval_months: Int? = 12,
    val last_oil_change_mileage: Int? = null,
    val last_oil_change_date: String? = null,
    val notes: String? = null,
    val is_favorite: Boolean = false,
    val created_by_id: Int? = null,
    val created_at: String? = null,
    val updated_at: String? = null,
    val mot_days_remaining: Int? = null,
    val mot_status: String = "ok",
    val vignette_days_remaining: Int? = null,
    val vignette_status: String = "ok",
    val insurance_days_remaining: Int? = null,
    val insurance_status: String = "ok",
    val first_aid_days_remaining: Int? = null,
    val oil_change_km_remaining: Int? = null,
    val oil_change_days_remaining: Int? = null,
    val oil_status: String = "ok",
    val overall_status: String = "ok",
    val average_consumption: Double? = null,
    val total_spent_fuel: Double = 0.0,
    val total_spent_service: Double = 0.0,
    val cost_per_km: Double? = null,
    val refuelings: List<VehicleRefueling> = emptyList(),
    val service_records: List<VehicleServiceRecord> = emptyList()
)

@Serializable
data class VehicleCreate(
    val name: String,
    val make: String,
    val model: String,
    val year: Int? = null,
    val color: String? = null,
    val license_plate: String,
    val vin: String? = null,
    val fuel_type: String = "diesel",
    val tank_capacity_l: Double? = 50.0,
    val engine_power_kw: Int? = null,
    val engine_displacement_cc: Int? = null,
    val transmission: String = "manual",
    val current_mileage: Int = 0,
    val mot_expiry_date: String? = null,
    val vignette_expiry_date: String? = null,
    val vignette_type: String? = "1_year",
    val insurance_company: String? = null,
    val insurance_policy_number: String? = null,
    val insurance_expiry_date: String? = null,
    val insurance_assistance_phone: String? = null,
    val first_aid_kit_expiry_date: String? = null,
    val tire_type: String? = "winter",
    val tire_dimension: String? = null,
    val tire_tread_depth_mm: Double? = null,
    val tire_storage_location: String? = null,
    val oil_change_interval_km: Int? = 15000,
    val oil_change_interval_months: Int? = 12,
    val last_oil_change_mileage: Int? = null,
    val last_oil_change_date: String? = null,
    val notes: String? = null
)

@Serializable
data class VehicleUpdate(
    val name: String? = null,
    val make: String? = null,
    val model: String? = null,
    val year: Int? = null,
    val color: String? = null,
    val license_plate: String? = null,
    val vin: String? = null,
    val fuel_type: String? = null,
    val tank_capacity_l: Double? = null,
    val engine_power_kw: Int? = null,
    val engine_displacement_cc: Int? = null,
    val transmission: String? = null,
    val current_mileage: Int? = null,
    val mot_expiry_date: String? = null,
    val vignette_expiry_date: String? = null,
    val vignette_type: String? = null,
    val insurance_company: String? = null,
    val insurance_policy_number: String? = null,
    val insurance_expiry_date: String? = null,
    val insurance_assistance_phone: String? = null,
    val first_aid_kit_expiry_date: String? = null,
    val tire_type: String? = null,
    val tire_dimension: String? = null,
    val tire_tread_depth_mm: Double? = null,
    val tire_storage_location: String? = null,
    val tire_last_swapped_date: String? = null,
    val oil_change_interval_km: Int? = null,
    val oil_change_interval_months: Int? = null,
    val last_oil_change_mileage: Int? = null,
    val last_oil_change_date: String? = null,
    val notes: String? = null,
    val is_favorite: Boolean? = null
)

@Serializable
data class MileageUpdate(val mileage: Int)

@Serializable
data class VehicleFleetStats(
    val total_vehicles: Int = 0,
    val warning_deadlines_count: Int = 0,
    val expired_deadlines_count: Int = 0,
    val total_spent_fuel_all: Double = 0.0,
    val total_spent_service_all: Double = 0.0,
    val fleet_average_consumption: Double? = null
)

// ==========================================================
// ASSETS
// ==========================================================

@Serializable
data class Asset(
    val id: Int = 0,
    val name: String = "",
    val category: String = "large_appliance",
    val room: String = "kitchen",
    val brand: String? = null,
    val model_number: String? = null,
    val serial_number: String? = null,
    val purchase_date: String? = null,
    val warranty_months: Int = 24,
    val purchase_price: Double? = null,
    val store_or_vendor: String? = null,
    val invoice_url: String? = null,
    val manual_url: String? = null,
    val status: String = "active",
    val notes: String? = null,
    val contact_service: String? = null,
    val created_at: String? = null,
    val updated_at: String? = null,
    val warranty_expiry_date: String? = null,
    val days_until_warranty_expiry: Int? = null,
    val warranty_status: String = "none",
    val is_under_warranty: Boolean = false
)

@Serializable
data class AssetCreate(
    val name: String,
    val category: String = "large_appliance",
    val room: String = "kitchen",
    val brand: String? = null,
    val model_number: String? = null,
    val serial_number: String? = null,
    val purchase_date: String? = null,
    val warranty_months: Int = 24,
    val purchase_price: Double? = null,
    val store_or_vendor: String? = null,
    val invoice_url: String? = null,
    val manual_url: String? = null,
    val status: String = "active",
    val notes: String? = null,
    val contact_service: String? = null
)

@Serializable
data class AssetUpdate(
    val name: String? = null,
    val category: String? = null,
    val room: String? = null,
    val brand: String? = null,
    val model_number: String? = null,
    val serial_number: String? = null,
    val purchase_date: String? = null,
    val warranty_months: Int? = null,
    val purchase_price: Double? = null,
    val store_or_vendor: String? = null,
    val invoice_url: String? = null,
    val manual_url: String? = null,
    val status: String? = null,
    val notes: String? = null,
    val contact_service: String? = null
)

@Serializable
data class AssetUploadResult(
    val url: String = "",
    val file_type: String = "invoice",
    val asset: Asset? = null
)

@Serializable
data class AssetStats(
    val total_assets: Int = 0,
    val total_value: Double = 0.0,
    val active_warranties: Int = 0,
    val expiring_soon_warranties: Int = 0,
    val expired_warranties: Int = 0
)

// ==========================================================
// ACTIVITIES
// ==========================================================

@Serializable
data class ActivityLog(
    val id: Int = 0,
    val user_id: Int? = null,
    val user_name: String = "Systém",
    val user_avatar_color: String? = "#F97316",
    val module: String = "system",
    val action_type: String = "info",
    val title: String = "",
    val description: String? = null,
    val entity_type: String? = null,
    val entity_id: Int? = null,
    val created_at: String = ""
) {
    val displayName: String get() = user_name.ifBlank { "Systém" }
    val effectiveColor: String get() = user_avatar_color ?: "#F97316"
}

@Serializable
data class ActivityListResponse(
    val items: List<ActivityLog> = emptyList(),
    val total: Int = 0,
    val limit: Int = 50,
    val offset: Int = 0
)

@Serializable
data class ActivityStats(
    val total_activities: Int = 0,
    val activities_today: Int = 0,
    val module_counts: Map<String, Int> = emptyMap(),
    val most_active_member: String? = null
)

// ==========================================================
// SYSTEM & BACKUPS
// ==========================================================

@Serializable
data class BackupItem(
    val filename: String = "",
    val created_at: String = "",
    val size_kb: Double = 0.0,
    val items_count: Int = 0,
    val note: String? = null
)

@Serializable
data class BackupRestoreResult(
    val status: String = "success",
    val message: String = ""
)

// ==========================================================
// GEMINI AI MODELS
// ==========================================================

@Serializable
data class AiRecipeImportRequest(
    val url: String? = null,
    val raw_text: String? = null,
    val target_language: String = "cs"
)

@Serializable
data class GeminiExtractedRecipe(
    val title: String = "",
    val description: String? = "",
    val image_url: String? = "",
    val prep_time_minutes: Int = 15,
    val cook_time_minutes: Int = 30,
    val difficulty: String = "medium",
    val price_level: String = "medium",
    val default_servings: Int = 4,
    val tags: List<String> = emptyList(),
    val utensils: List<String> = emptyList(),
    val ingredients: List<RecipeIngredient> = emptyList(),
    val instructions: List<RecipeStep> = emptyList(),
    val source_url: String? = null
)

@Serializable
data class GeminiBase64FileImportRequest(
    val filename: String,
    val file_base64: String,
    val target_language: String = "cs"
)

@Serializable
data class RecipeFileImportResponse(
    val total: Int = 0,
    val filename: String = "",
    val recipes: List<GeminiExtractedRecipe> = emptyList()
)

@Serializable
data class AiStatus(
    val configured: Boolean = false,
    val model: String = "",
    val message: String = ""
)

@Serializable
data class SimpleMessageResponse(
    val status: String = "success",
    val message: String = "",
    val deleted_count: Int? = null
)
