package com.example.hestia.data.models

import kotlinx.serialization.Serializable

// ==========================================================
// VEHICLES
// ==========================================================

@Serializable
data class VehicleRefueling(
    val id: Int = 0,
    val vehicle_id: Int = 0,
    val date: String = "",
    val mileage: Int = 0,
    val fuel_amount_l: Double = 0.0,
    val price_per_l: Double? = null,
    val total_price: Double = 0.0,
    val is_full_tank: Boolean = true,
    val fuel_brand: String? = null,
    val notes: String? = null,
    val calculated_consumption: Double? = null,
    val created_by_id: Int? = null,
    val created_at: String? = null
)

@Serializable
data class VehicleRefuelingCreate(
    val date: String,
    val mileage: Int,
    val fuel_amount_l: Double,
    val price_per_l: Double? = null,
    val total_price: Double,
    val is_full_tank: Boolean = true,
    val fuel_brand: String? = null,
    val notes: String? = null,
    val record_to_finance: Boolean = false
)

@Serializable
data class VehicleServiceRecord(
    val id: Int = 0,
    val vehicle_id: Int = 0,
    val service_type: String = "regular_service",
    val title: String = "",
    val date: String = "",
    val mileage: Int = 0,
    val cost: Double = 0.0,
    val service_shop: String? = null,
    val performed_operations: String? = null,
    val invoice_file_path: String? = null,
    val created_by_id: Int? = null,
    val created_at: String? = null
)

@Serializable
data class VehicleServiceRecordCreate(
    val service_type: String = "regular_service",
    val title: String,
    val date: String,
    val mileage: Int,
    val cost: Double = 0.0,
    val service_shop: String? = null,
    val performed_operations: String? = null,
    val invoice_file_path: String? = null,
    val record_to_finance: Boolean = false
)

@Serializable
data class Vehicle(
    val id: Int = 0,
    val name: String = "",
    val make: String = "",
    val model: String = "",
    val year: Int? = null,
    val color: String? = null,
    val license_plate: String = "",
    val vin: String? = null,
    val fuel_type: String = "diesel",
    val tank_capacity_l: Double? = 50.0,
    val engine_power_kw: Int? = null,
    val engine_displacement_cc: Int? = null,
    val transmission: String = "manual",
    val current_mileage: Int = 0,
    val primary_image_url: String? = null,
    val mot_expiry_date: String? = null,
    val vignette_expiry_date: String? = null,
    val vignette_type: String? = "1_year",
    val insurance_company: String? = null,
    val insurance_policy_number: String? = null,
    val insurance_expiry_date: String? = null,
    val insurance_assistance_phone: String? = null,
    val first_aid_kit_expiry_date: String? = null,
    val tire_type: String? = "winter",
    val tire_dimension: String? = null,
    val tire_tread_depth_mm: Double? = null,
    val tire_storage_location: String? = null,
    val tire_last_swapped_date: String? = null,
    val oil_change_interval_km: Int? = 15000,
    val oil_change_interval_months: Int? = 12,
    val last_oil_change_mileage: Int? = null,
    val last_oil_change_date: String? = null,
    val notes: String? = null,
    val is_favorite: Boolean = false,
    val created_by_id: Int? = null,
    val created_at: String? = null,
    val updated_at: String? = null,
    val mot_days_remaining: Int? = null,
    val mot_status: String = "ok",
    val vignette_days_remaining: Int? = null,
    val vignette_status: String = "ok",
    val insurance_days_remaining: Int? = null,
    val insurance_status: String = "ok",
    val first_aid_days_remaining: Int? = null,
    val oil_change_km_remaining: Int? = null,
    val oil_change_days_remaining: Int? = null,
    val oil_status: String = "ok",
    val overall_status: String = "ok",
    val average_consumption: Double? = null,
    val total_spent_fuel: Double = 0.0,
    val total_spent_service: Double = 0.0,
    val cost_per_km: Double? = null,
    val refuelings: List<VehicleRefueling> = emptyList(),
    val service_records: List<VehicleServiceRecord> = emptyList()
)

@Serializable
data class VehicleCreate(
    val name: String,
    val make: String,
    val model: String,
    val year: Int? = null,
    val color: String? = null,
    val license_plate: String,
    val vin: String? = null,
    val fuel_type: String = "diesel",
    val tank_capacity_l: Double? = 50.0,
    val engine_power_kw: Int? = null,
    val engine_displacement_cc: Int? = null,
    val transmission: String = "manual",
    val current_mileage: Int = 0,
    val mot_expiry_date: String? = null,
    val vignette_expiry_date: String? = null,
    val vignette_type: String? = "1_year",
    val insurance_company: String? = null,
    val insurance_policy_number: String? = null,
    val insurance_expiry_date: String? = null,
    val insurance_assistance_phone: String? = null,
    val first_aid_kit_expiry_date: String? = null,
    val tire_type: String? = "winter",
    val tire_dimension: String? = null,
    val tire_tread_depth_mm: Double? = null,
    val tire_storage_location: String? = null,
    val oil_change_interval_km: Int? = 15000,
    val oil_change_interval_months: Int? = 12,
    val last_oil_change_mileage: Int? = null,
    val last_oil_change_date: String? = null,
    val notes: String? = null
)

@Serializable
data class VehicleUpdate(
    val name: String? = null,
    val make: String? = null,
    val model: String? = null,
    val year: Int? = null,
    val color: String? = null,
    val license_plate: String? = null,
    val vin: String? = null,
    val fuel_type: String? = null,
    val tank_capacity_l: Double? = null,
    val engine_power_kw: Int? = null,
    val engine_displacement_cc: Int? = null,
    val transmission: String? = null,
    val current_mileage: Int? = null,
    val mot_expiry_date: String? = null,
    val vignette_expiry_date: String? = null,
    val vignette_type: String? = null,
    val insurance_company: String? = null,
    val insurance_policy_number: String? = null,
    val insurance_expiry_date: String? = null,
    val insurance_assistance_phone: String? = null,
    val first_aid_kit_expiry_date: String? = null,
    val tire_type: String? = null,
    val tire_dimension: String? = null,
    val tire_tread_depth_mm: Double? = null,
    val tire_storage_location: String? = null,
    val tire_last_swapped_date: String? = null,
    val oil_change_interval_km: Int? = null,
    val oil_change_interval_months: Int? = null,
    val last_oil_change_mileage: Int? = null,
    val last_oil_change_date: String? = null,
    val notes: String? = null,
    val is_favorite: Boolean? = null
)

@Serializable
data class MileageUpdate(val mileage: Int)

@Serializable
data class VehicleFleetStats(
    val total_vehicles: Int = 0,
    val warning_deadlines_count: Int = 0,
    val expired_deadlines_count: Int = 0,
    val total_spent_fuel_all: Double = 0.0,
    val total_spent_service_all: Double = 0.0,
    val fleet_average_consumption: Double? = null
)
