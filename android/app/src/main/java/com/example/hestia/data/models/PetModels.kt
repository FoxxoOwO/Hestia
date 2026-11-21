package com.example.hestia.data.models

import kotlinx.serialization.Serializable

// ==========================================================
// PETS
// ==========================================================

@Serializable
data class PetMedicalRecord(
    val id: Int = 0,
    val pet_id: Int = 0,
    val record_type: String = "checkup",
    val title: String = "",
    val performed_date: String = "",
    val valid_until: String? = null,
    val batch_number: String? = null,
    val veterinarian: String? = null,
    val notes: String? = null,
    val document_url: String? = null,
    val created_at: String? = null
)

@Serializable
data class PetMedicalRecordCreate(
    val record_type: String = "checkup",
    val title: String,
    val performed_date: String,
    val valid_until: String? = null,
    val batch_number: String? = null,
    val veterinarian: String? = null,
    val notes: String? = null,
    val document_url: String? = null
)

@Serializable
data class PetMedication(
    val id: Int = 0,
    val pet_id: Int = 0,
    val name: String = "",
    val dosage: String = "",
    val frequency: String = "",
    val start_date: String? = null,
    val end_date: String? = null,
    val is_active: Boolean = true,
    val notes: String? = null,
    val created_at: String? = null
)

@Serializable
data class PetMedicationCreate(
    val name: String,
    val dosage: String,
    val frequency: String,
    val start_date: String? = null,
    val end_date: String? = null,
    val is_active: Boolean = true,
    val notes: String? = null
)

@Serializable
data class PetWeightLog(
    val id: Int = 0,
    val pet_id: Int = 0,
    val weight_kg: Double = 0.0,
    val recorded_date: String = "",
    val notes: String? = null,
    val created_at: String? = null
)

@Serializable
data class PetWeightLogCreate(
    val weight_kg: Double,
    val recorded_date: String,
    val notes: String? = null
)

@Serializable
data class PetTask(
    val id: Int = 0,
    val pet_id: Int = 0,
    val task_type: String = "custom",
    val title: String = "",
    val due_date: String = "",
    val interval_days: Int = 0,
    val notes: String? = null,
    val is_completed: Boolean = false,
    val last_completed_at: String? = null,
    val created_at: String? = null
)

@Serializable
data class PetTaskCreate(
    val task_type: String = "custom",
    val title: String,
    val due_date: String,
    val interval_days: Int = 0,
    val notes: String? = null
)

@Serializable
data class PetLogEntry(
    val id: Int = 0,
    val pet_id: Int = 0,
    val entry_type: String = "note",
    val title: String = "",
    val notes: String? = null,
    val image_url: String? = null,
    val created_at: String? = null
)

@Serializable
data class PetLogEntryCreate(
    val entry_type: String = "note",
    val title: String,
    val notes: String? = null,
    val image_url: String? = null
)

@Serializable
data class Pet(
    val id: Int = 0,
    val name: String = "",
    val species: String = "dog",
    val breed: String? = null,
    val birth_date: String? = null,
    val gender: String = "unknown",
    val is_neutered: Boolean = false,
    val color: String? = null,
    val microchip_number: String? = null,
    val passport_number: String? = null,
    val primary_image_url: String? = null,
    val dietary_needs: String? = null,
    val allergies_and_intolerances: String? = null,
    val vet_name: String? = null,
    val vet_clinic: String? = null,
    val vet_phone: String? = null,
    val vet_address: String? = null,
    val emergency_vet_phone: String? = null,
    val emergency_vet_clinic: String? = null,
    val last_fed_at: String? = null,
    val last_fed_by_name: String? = null,
    val is_favorite: Boolean = false,
    val notes: String? = null,
    val created_by_id: Int? = null,
    val created_at: String? = null,
    val updated_at: String? = null,
    val age_formatted: String = "",
    val latest_weight_kg: Double? = null,
    val has_upcoming_vet_task: Boolean = false,
    val medical_records: List<PetMedicalRecord> = emptyList(),
    val medications: List<PetMedication> = emptyList(),
    val weight_logs: List<PetWeightLog> = emptyList(),
    val tasks: List<PetTask> = emptyList(),
    val log_entries: List<PetLogEntry> = emptyList()
)

@Serializable
data class PetCreate(
    val name: String,
    val species: String = "dog",
    val breed: String? = null,
    val birth_date: String? = null,
    val gender: String = "unknown",
    val is_neutered: Boolean = false,
    val color: String? = null,
    val microchip_number: String? = null,
    val passport_number: String? = null,
    val primary_image_url: String? = null,
    val dietary_needs: String? = null,
    val allergies_and_intolerances: String? = null,
    val vet_name: String? = null,
    val vet_clinic: String? = null,
    val vet_phone: String? = null,
    val vet_address: String? = null,
    val emergency_vet_phone: String? = null,
    val emergency_vet_clinic: String? = null,
    val initial_weight_kg: Double? = null,
    val notes: String? = null
)

@Serializable
data class PetUpdate(
    val name: String? = null,
    val species: String? = null,
    val breed: String? = null,
    val birth_date: String? = null,
    val gender: String? = null,
    val is_neutered: Boolean? = null,
    val color: String? = null,
    val microchip_number: String? = null,
    val passport_number: String? = null,
    val primary_image_url: String? = null,
    val dietary_needs: String? = null,
    val allergies_and_intolerances: String? = null,
    val vet_name: String? = null,
    val vet_clinic: String? = null,
    val vet_phone: String? = null,
    val vet_address: String? = null,
    val emergency_vet_phone: String? = null,
    val emergency_vet_clinic: String? = null,
    val notes: String? = null,
    val is_favorite: Boolean? = null
)

@Serializable
data class PetFoodSafetyRequest(
    val species: String = "dog",
    val food_name: String,
    val target_language: String = "cs"
)

@Serializable
data class PetFoodSafetyResponse(
    val food_name: String = "",
    val species: String = "dog",
    val safety_level: String = "safe",
    val headline: String = "",
    val risk_description: String = "",
    val toxic_dose_info: String? = null,
    val symptoms_of_poisoning: List<String> = emptyList(),
    val first_aid_action: String = ""
)

@Serializable
data class PetSymptomRequest(
    val pet_id: Int? = null,
    val pet_name: String? = null,
    val pet_species: String = "dog",
    val pet_age: String? = null,
    val symptoms_description: String,
    val image_base64: String? = null,
    val image_url: String? = null,
    val target_language: String = "cs"
)

@Serializable
data class PetSymptomResponse(
    val pet_name: String? = null,
    val severity: String = "low",
    val assessment_headline: String = "",
    val possible_causes: List<String> = emptyList(),
    val urgency_message: String = "",
    val action_steps: List<String> = emptyList(),
    val red_flag_symptoms: List<String> = emptyList(),
    val home_care_advice: String = ""
)

@Serializable
data class PetSitterProfile(
    val pet_id: Int = 0,
    val name: String = "",
    val species: String = "",
    val breed: String? = null,
    val age: String = "",
    val gender: String = "",
    val color: String? = null,
    val microchip_number: String? = null,
    val primary_image_url: String? = null,
    val feeding_routine: String = "",
    val allergies_warning: String = "",
    val active_medications: List<PetSitterMedication> = emptyList(),
    val vet_contacts: PetVetContacts? = null,
    val daily_routine_notes: String = ""
)

@Serializable
data class PetSitterMedication(
    val name: String = "",
    val dosage: String = "",
    val frequency: String = ""
)

@Serializable
data class PetVetContacts(
    val vet_name: String? = null,
    val vet_clinic: String? = null,
    val vet_phone: String? = null,
    val emergency_vet_phone: String? = null,
    val emergency_vet_clinic: String? = null
)

@Serializable
data class PetSosFlyer(
    val pet_id: Int = 0,
    val name: String = "",
    val species: String = "",
    val breed: String? = null,
    val color: String? = null,
    val microchip_number: String? = null,
    val image_url: String? = null,
    val owner_contact_name: String = "",
    val owner_contact_phone: String = "",
    val last_seen_date: String = "",
    val distinctive_features: String? = null,
    val reward_note: String? = null
)
