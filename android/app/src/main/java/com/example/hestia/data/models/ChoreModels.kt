package com.example.hestia.data.models

import kotlinx.serialization.Serializable

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
