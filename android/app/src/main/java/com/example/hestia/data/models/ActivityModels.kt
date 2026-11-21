package com.example.hestia.data.models

import kotlinx.serialization.Serializable

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
