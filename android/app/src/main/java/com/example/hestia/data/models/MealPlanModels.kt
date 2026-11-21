package com.example.hestia.data.models

import kotlinx.serialization.Serializable

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
