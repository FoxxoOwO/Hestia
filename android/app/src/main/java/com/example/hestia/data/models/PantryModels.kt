package com.example.hestia.data.models

import kotlinx.serialization.Serializable

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
