package com.example.hestia.data.models

import kotlinx.serialization.Serializable

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
