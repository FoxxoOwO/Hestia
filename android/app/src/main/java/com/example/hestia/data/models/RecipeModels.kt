package com.example.hestia.data.models

import kotlinx.serialization.Serializable

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
