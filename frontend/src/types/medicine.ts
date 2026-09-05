export type MedicineForm = 
  | 'tablets'
  | 'syrup'
  | 'drops'
  | 'ointment'
  | 'spray'
  | 'injection'
  | 'dressing'
  | 'device'
  | 'other';

export type MedicineCategory = 
  | 'pain_fever'
  | 'cold_cough'
  | 'digestion'
  | 'allergy'
  | 'injury_disinfection'
  | 'eyes_ears'
  | 'chronic_rx'
  | 'vitamins'
  | 'first_aid_material'
  | 'other';

export type MedicineLocation = 
  | 'bathroom'
  | 'kitchen'
  | 'travel_kit'
  | 'cottage'
  | 'car'
  | 'bedroom'
  | 'other';

export type AgeGroup = 
  | 'all'
  | 'adults_only'
  | 'kids_from_3yo'
  | 'kids_from_6yo'
  | 'kids_from_12yo'
  | 'infants'
  | 'seniors';

export type ExpirationStatus = 'ok' | 'warning' | 'expired' | 'unknown';

export interface Medicine {
  id: number;
  name: string;
  active_substance?: string | null;
  form: MedicineForm;
  category: MedicineCategory;
  location: MedicineLocation;
  package_size?: string | null;
  current_quantity: number;
  unit: string;
  min_quantity_warning: number;
  expiration_date?: string | null;
  opened_date?: string | null;
  validity_months_after_opening?: number | null;
  is_prescription: boolean;
  requires_refrigeration: boolean;
  age_group: string;
  dosage_instructions?: string | null;
  storage_instructions?: string | null;
  sukl_code_or_url?: string | null;
  notes?: string | null;
  assigned_user_id?: number | null;
  created_at?: string;
  updated_at?: string;
  days_until_expiration?: number | null;
  expiration_status: ExpirationStatus;
  after_opening_expired: boolean;
  is_low_stock: boolean;
  assigned_user_name?: string | null;
}

export interface MedicineCreate {
  name: string;
  active_substance?: string;
  form?: MedicineForm;
  category?: MedicineCategory;
  location?: MedicineLocation;
  package_size?: string;
  current_quantity?: number;
  unit?: string;
  min_quantity_warning?: number;
  expiration_date?: string;
  opened_date?: string;
  validity_months_after_opening?: number;
  is_prescription?: boolean;
  requires_refrigeration?: boolean;
  age_group?: string;
  dosage_instructions?: string;
  storage_instructions?: string;
  sukl_code_or_url?: string;
  notes?: string;
  assigned_user_id?: number;
}

export interface MedicineUpdate {
  name?: string;
  active_substance?: string;
  form?: MedicineForm;
  category?: MedicineCategory;
  location?: MedicineLocation;
  package_size?: string;
  current_quantity?: number;
  unit?: string;
  min_quantity_warning?: number;
  expiration_date?: string;
  opened_date?: string;
  validity_months_after_opening?: number;
  is_prescription?: boolean;
  requires_refrigeration?: boolean;
  age_group?: string;
  dosage_instructions?: string;
  storage_instructions?: string;
  sukl_code_or_url?: string;
  notes?: string;
  assigned_user_id?: number;
}

export interface MedicationSchedule {
  id: number;
  medicine_id: number;
  user_id: number;
  schedule_type: 'chronic' | 'acute_course' | 'as_needed';
  start_date: string;
  end_date?: string | null;
  times_per_day: number;
  time_slots: string[];
  food_relation: 'before_food' | 'with_food' | 'after_food' | 'empty_stomach' | 'any';
  dosage_per_take: string;
  is_active: boolean;
  notes?: string | null;
  created_at?: string;
  medicine_name?: string | null;
  user_name?: string | null;
  is_taken_today: boolean;
}

export interface MedicationScheduleCreate {
  medicine_id: number;
  user_id: number;
  schedule_type: 'chronic' | 'acute_course' | 'as_needed';
  start_date: string;
  end_date?: string;
  times_per_day: number;
  time_slots: string[];
  food_relation?: string;
  dosage_per_take?: string;
  is_active?: boolean;
  notes?: string;
}

export interface MedicationScheduleUpdate {
  schedule_type?: 'chronic' | 'acute_course' | 'as_needed';
  start_date?: string;
  end_date?: string;
  times_per_day?: number;
  time_slots?: string[];
  food_relation?: string;
  dosage_per_take?: string;
  is_active?: boolean;
  notes?: string;
}

export interface MedicationLog {
  id: number;
  schedule_id?: number | null;
  medicine_id: number;
  user_id: number;
  taken_at: string;
  time_slot?: string | null;
  dose_taken?: string | null;
  status: 'taken' | 'skipped' | 'postponed';
  notes?: string | null;
  medicine_name?: string | null;
  user_name?: string | null;
}

export interface MedicationLogCreate {
  schedule_id?: number;
  medicine_id: number;
  user_id: number;
  time_slot?: string;
  dose_taken?: string;
  status?: 'taken' | 'skipped' | 'postponed';
  notes?: string;
  decrement_stock?: boolean;
}

export interface MedicineStats {
  total_items: number;
  expired_count: number;
  expiring_soon_count: number;
  low_stock_count: number;
  prescription_count: number;
  requires_fridge_count: number;
  active_schedules_count: number;
  locations_count: Record<string, number>;
  categories_count: Record<string, number>;
}

export interface PediatricPreparation {
  brand_name: string;
  concentration: string;
  amount_per_single_dose: string;
  note?: string | null;
}

export interface PediatricDosage {
  weight_kg: number;
  drug: string;
  drug_name_cs: string;
  single_dose_mg_min: number;
  single_dose_mg_max: number;
  daily_max_mg: number;
  interval_hours: number;
  max_doses_per_day: number;
  preparations: PediatricPreparation[];
  safety_warnings: string[];
}

export interface FirstAidGuide {
  id: string;
  title: string;
  category: string;
  urgency: 'critical' | 'high' | 'medium';
  emergency_call?: string | null;
  summary: string;
  action_steps: string[];
  dont_do_steps: string[];
  note?: string | null;
}
