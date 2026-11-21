package com.example.hestia.data.models

import kotlinx.serialization.Serializable

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
    val deleted_count: Int? = null,
    val vault_token: String? = null
)
