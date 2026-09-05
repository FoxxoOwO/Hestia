export type PetSpecies = 'dog' | 'cat' | 'rabbit' | 'bird' | 'rodent' | 'reptile' | 'other';
export type PetGender = 'male' | 'female' | 'unknown';
export type PetMedicalRecordType = 'vaccination' | 'deworming' | 'antiparasitic' | 'checkup' | 'surgery' | 'medication' | 'other';
export type PetTaskType = 'vaccination' | 'deworming' | 'antiparasitic' | 'vet_visit' | 'grooming' | 'medication' | 'feeding' | 'custom';
export type PetLogEntryType = 'photo' | 'note' | 'milestone' | 'symptom_check' | 'vet_visit';

export interface PetMedicalRecord {
  id: number;
  pet_id: number;
  record_type: PetMedicalRecordType;
  title: string;
  performed_date: string;
  valid_until?: string;
  batch_number?: string;
  veterinarian?: string;
  notes?: string;
  document_url?: string;
  created_at: string;
}

export interface PetMedication {
  id: number;
  pet_id: number;
  name: string;
  dosage: string;
  frequency: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
}

export interface PetWeightLog {
  id: number;
  pet_id: number;
  weight_kg: number;
  recorded_date: string;
  notes?: string;
  created_at: string;
}

export interface PetTask {
  id: number;
  pet_id: number;
  task_type: PetTaskType;
  title: string;
  due_date: string;
  interval_days: number;
  is_completed: boolean;
  last_completed_at?: string;
  notes?: string;
  created_at: string;
}

export interface PetLogEntry {
  id: number;
  pet_id: number;
  entry_type: PetLogEntryType;
  title: string;
  notes?: string;
  image_url?: string;
  created_at: string;
}

export interface Pet {
  id: number;
  name: string;
  species: PetSpecies;
  breed?: string;
  birth_date?: string;
  gender: PetGender;
  is_neutered: boolean;
  color?: string;
  microchip_number?: string;
  passport_number?: string;
  primary_image_url?: string;

  dietary_needs?: string;
  allergies_and_intolerances?: string;

  vet_name?: string;
  vet_clinic?: string;
  vet_phone?: string;
  vet_address?: string;
  emergency_vet_phone?: string;
  emergency_vet_clinic?: string;

  last_fed_at?: string;
  last_fed_by_name?: string;
  is_favorite: boolean;
  notes?: string;

  created_by_id?: number;
  created_at: string;
  updated_at: string;

  // Server calculated
  age_formatted: string;
  latest_weight_kg?: number;
  has_upcoming_vet_task: boolean;

  medical_records?: PetMedicalRecord[];
  medications?: PetMedication[];
  weight_logs?: PetWeightLog[];
  tasks?: PetTask[];
  log_entries?: PetLogEntry[];
}

export interface PetFoodSafetyResponse {
  food_name: string;
  species: string;
  safety_level: 'safe' | 'caution' | 'toxic';
  headline: string;
  risk_description: string;
  toxic_dose_info?: string;
  symptoms_of_poisoning: string[];
  first_aid_action: string;
}

export interface PetSymptomResponse {
  pet_name?: string;
  severity: 'low' | 'medium' | 'emergency';
  assessment_headline: string;
  possible_causes: string[];
  urgency_message: string;
  action_steps: string[];
  red_flag_symptoms: string[];
  home_care_advice: string;
}

export interface PetSitterProfile {
  pet_id: number;
  name: string;
  species: string;
  breed?: string;
  age: string;
  gender: string;
  color?: string;
  microchip_number?: string;
  primary_image_url?: string;
  feeding_routine: string;
  allergies_warning: string;
  active_medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    notes?: string;
  }>;
  vet_contacts: {
    vet_name?: string;
    vet_clinic?: string;
    vet_phone?: string;
    vet_address?: string;
    emergency_vet_phone?: string;
    emergency_vet_clinic?: string;
  };
  daily_routine_notes: string;
}

export interface PetSosFlyer {
  pet_id: number;
  name: string;
  species: string;
  breed?: string;
  color?: string;
  microchip_number?: string;
  image_url?: string;
  owner_contact_name: string;
  owner_contact_phone: string;
  last_seen_date: string;
  distinctive_features?: string;
  reward_note?: string;
}
