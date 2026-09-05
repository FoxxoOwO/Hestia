export type RoomType =
  | 'living_room'
  | 'bedroom'
  | 'kitchen'
  | 'bathroom'
  | 'balcony'
  | 'hallway'
  | 'office'
  | 'other';

export type LightRequirement = 'direct_sun' | 'bright_indirect' | 'semi_shade' | 'shade';
export type PetToxicity = 'safe' | 'toxic' | 'mildly_toxic';
export type HealthStatus = 'healthy' | 'needs_attention' | 'sick';
export type WateringStatus = 'ok' | 'due_today' | 'overdue' | 'watered_today';

export interface PlantTask {
  id: number;
  plant_id: number;
  task_type: 'water' | 'fertilize' | 'repot' | 'mist' | 'clean_leaves' | 'custom';
  due_date: string;
  last_completed_at?: string;
  interval_days: number;
  notes?: string;
  is_completed: boolean;
  created_at: string;
}

export interface PlantLogEntry {
  id: number;
  plant_id: number;
  entry_type: 'photo' | 'note' | 'repotting' | 'ai_diagnosis';
  image_url?: string;
  title: string;
  notes?: string;
  created_at: string;
}

export interface Plant {
  id: number;
  name: string;
  species_latin?: string;
  species_czech?: string;
  room: RoomType;
  light_requirement: LightRequirement;
  watering_interval_days: number;
  winter_watering_interval_days: number;
  fertilizing_interval_days: number;
  misting_required: boolean;
  pot_diameter_cm?: number;
  substrate_type?: string;
  pet_toxicity: PetToxicity;
  pet_toxicity_notes?: string;
  primary_image_url?: string;
  health_status: HealthStatus;
  health_notes?: string;
  last_watered_date?: string;
  next_watering_date?: string;
  is_winter_mode: boolean;
  is_favorite: boolean;
  notes?: string;
  created_by_id?: number;
  created_at: string;
  updated_at: string;
  
  // Calculated on server
  days_until_watering: number;
  is_thirsty: boolean;
  watering_status: WateringStatus;
  
  tasks?: PlantTask[];
  log_entries?: PlantLogEntry[];
}

export interface PlantAiExtracted {
  common_name: string;
  species_latin: string;
  species_czech: string;
  description: string;
  light_requirement: LightRequirement;
  watering_interval_days: number;
  winter_watering_interval_days: number;
  fertilizing_interval_days: number;
  misting_required: boolean;
  substrate_recommendation: string;
  pet_toxicity: PetToxicity;
  pet_toxicity_details: string;
  initial_health_assessment: string;
}

export interface PlantDiagnosisResponse {
  plant_name: string;
  diagnosis: string;
  cause: string;
  severity: 'low' | 'medium' | 'high';
  is_contagious: boolean;
  action_steps: string[];
  prevention_tips: string;
}

export interface PlantSitterScheduleItem {
  plant_id: number;
  plant_name: string;
  species: string;
  room: string;
  image_url?: string;
  action_required: 'water' | 'do_not_touch' | 'mist';
  recommended_water_amount: string;
  instructions: string;
}
