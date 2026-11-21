package com.example.hestia.data.models

import kotlinx.serialization.Serializable

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
data class VaultVerifyResponse(
    val status: String = "success",
    val success: Boolean = true,
    val message: String = "",
    val vault_token: String? = null,
    val expires_in: Int? = null
)

@Serializable
data class VaultSetPinRequest(val old_pin: String? = null, val new_pin: String)
