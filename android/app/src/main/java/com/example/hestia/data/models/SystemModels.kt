package com.example.hestia.data.models

import kotlinx.serialization.Serializable

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
