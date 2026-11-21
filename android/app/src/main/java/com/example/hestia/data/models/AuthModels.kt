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
    val refresh_token: String? = null,
    val csrf_token: String? = null,
    val user: User
)

@Serializable
data class RefreshRequest(val refresh_token: String? = null)

@Serializable
data class RefreshTokenResponse(
    val access_token: String,
    val refresh_token: String? = null,
    val token_type: String = "bearer"
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
