package com.example.hestia.data.models

import kotlinx.serialization.Serializable

// ==========================================================
// ASSETS
// ==========================================================

@Serializable
data class Asset(
    val id: Int = 0,
    val name: String = "",
    val category: String = "large_appliance",
    val room: String = "kitchen",
    val brand: String? = null,
    val model_number: String? = null,
    val serial_number: String? = null,
    val purchase_date: String? = null,
    val warranty_months: Int = 24,
    val purchase_price: Double? = null,
    val store_or_vendor: String? = null,
    val invoice_url: String? = null,
    val manual_url: String? = null,
    val status: String = "active",
    val notes: String? = null,
    val contact_service: String? = null,
    val created_at: String? = null,
    val updated_at: String? = null,
    val warranty_expiry_date: String? = null,
    val days_until_warranty_expiry: Int? = null,
    val warranty_status: String = "none",
    val is_under_warranty: Boolean = false
)

@Serializable
data class AssetCreate(
    val name: String,
    val category: String = "large_appliance",
    val room: String = "kitchen",
    val brand: String? = null,
    val model_number: String? = null,
    val serial_number: String? = null,
    val purchase_date: String? = null,
    val warranty_months: Int = 24,
    val purchase_price: Double? = null,
    val store_or_vendor: String? = null,
    val invoice_url: String? = null,
    val manual_url: String? = null,
    val status: String = "active",
    val notes: String? = null,
    val contact_service: String? = null
)

@Serializable
data class AssetUpdate(
    val name: String? = null,
    val category: String? = null,
    val room: String? = null,
    val brand: String? = null,
    val model_number: String? = null,
    val serial_number: String? = null,
    val purchase_date: String? = null,
    val warranty_months: Int? = null,
    val purchase_price: Double? = null,
    val store_or_vendor: String? = null,
    val invoice_url: String? = null,
    val manual_url: String? = null,
    val status: String? = null,
    val notes: String? = null,
    val contact_service: String? = null
)

@Serializable
data class AssetUploadResult(
    val url: String = "",
    val file_type: String = "invoice",
    val asset: Asset? = null
)

@Serializable
data class AssetStats(
    val total_assets: Int = 0,
    val total_value: Double = 0.0,
    val active_warranties: Int = 0,
    val expiring_soon_warranties: Int = 0,
    val expired_warranties: Int = 0
)
