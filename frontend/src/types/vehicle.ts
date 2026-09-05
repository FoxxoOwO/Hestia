export type FuelType = 'petrol' | 'diesel' | 'lpg' | 'cng' | 'hybrid' | 'electric' | 'other';
export type TransmissionType = 'manual' | 'automatic';
export type TireType = 'summer' | 'winter' | 'all_season';
export type VignetteType = '1_year' | '30_days' | '10_days' | '1_day' | 'none';
export type ServiceType = 'regular_service' | 'oil_change' | 'brakes' | 'tires' | 'inspection' | 'repair' | 'other';
export type DeadlineStatus = 'ok' | 'warning' | 'expired' | 'none';

export interface VehicleRefueling {
  id: number;
  vehicle_id: number;
  date: string;
  mileage: number;
  fuel_amount_l: number;
  price_per_l?: number | null;
  total_price: number;
  is_full_tank: boolean;
  fuel_brand?: string | null;
  calculated_consumption?: number | null;
  notes?: string | null;
  created_by_id?: number;
  created_at?: string;
}

export interface VehicleRefuelingCreate {
  date: string;
  mileage: number;
  fuel_amount_l: number;
  price_per_l?: number;
  total_price: number;
  is_full_tank?: boolean;
  fuel_brand?: string;
  notes?: string;
  record_to_finance?: boolean;
}

export interface VehicleServiceRecord {
  id: number;
  vehicle_id: number;
  service_type: ServiceType;
  title: string;
  date: string;
  mileage: number;
  cost: number;
  service_shop?: string | null;
  performed_operations?: string | null;
  invoice_file_path?: string | null;
  created_by_id?: number;
  created_at?: string;
}

export interface VehicleServiceRecordCreate {
  service_type: ServiceType;
  title: string;
  date: string;
  mileage: number;
  cost?: number;
  service_shop?: string;
  performed_operations?: string;
  invoice_file_path?: string;
  record_to_finance?: boolean;
}

export interface Vehicle {
  id: number;
  name: string;
  make: string;
  model: string;
  year?: number | null;
  color?: string | null;
  license_plate: string;
  vin?: string | null;
  fuel_type: FuelType;
  tank_capacity_l?: number | null;
  engine_power_kw?: number | null;
  engine_displacement_cc?: number | null;
  transmission: TransmissionType;
  current_mileage: number;
  primary_image_url?: string | null;

  // Deadlines & Czech Regulations
  mot_expiry_date?: string | null;
  vignette_expiry_date?: string | null;
  vignette_type?: VignetteType;
  insurance_company?: string | null;
  insurance_policy_number?: string | null;
  insurance_expiry_date?: string | null;
  insurance_assistance_phone?: string | null;
  first_aid_kit_expiry_date?: string | null;

  // Tires
  tire_type: TireType;
  tire_dimension?: string | null;
  tire_tread_depth_mm?: number | null;
  tire_storage_location?: string | null;
  tire_last_swapped_date?: string | null;

  // Maintenance Intervals
  oil_change_interval_km?: number;
  oil_change_interval_months?: number;
  last_oil_change_mileage?: number | null;
  last_oil_change_date?: string | null;

  notes?: string | null;
  is_favorite: boolean;
  created_by_id?: number;
  created_at?: string;
  updated_at?: string;

  // Calculated Statuses & Countdowns
  mot_days_remaining?: number | null;
  mot_status: DeadlineStatus;
  vignette_days_remaining?: number | null;
  vignette_status: DeadlineStatus;
  insurance_days_remaining?: number | null;
  insurance_status: DeadlineStatus;
  first_aid_days_remaining?: number | null;

  oil_change_km_remaining?: number | null;
  oil_change_days_remaining?: number | null;
  oil_status: DeadlineStatus;

  overall_status: 'ok' | 'warning' | 'critical';

  average_consumption?: number | null;
  total_spent_fuel: number;
  total_spent_service: number;
  cost_per_km?: number | null;

  refuelings: VehicleRefueling[];
  service_records: VehicleServiceRecord[];
}

export interface VehicleCreate {
  name: string;
  make: string;
  model: string;
  year?: number;
  color?: string;
  license_plate: string;
  vin?: string;
  fuel_type?: FuelType;
  tank_capacity_l?: number;
  engine_power_kw?: number;
  engine_displacement_cc?: number;
  transmission?: TransmissionType;
  current_mileage?: number;
  primary_image_url?: string;

  mot_expiry_date?: string;
  vignette_expiry_date?: string;
  vignette_type?: VignetteType;
  insurance_company?: string;
  insurance_policy_number?: string;
  insurance_expiry_date?: string;
  insurance_assistance_phone?: string;
  first_aid_kit_expiry_date?: string;

  tire_type?: TireType;
  tire_dimension?: string;
  tire_tread_depth_mm?: number;
  tire_storage_location?: string;
  tire_last_swapped_date?: string;

  oil_change_interval_km?: number;
  oil_change_interval_months?: number;
  last_oil_change_mileage?: number;
  last_oil_change_date?: string;

  notes?: string;
  is_favorite?: boolean;
}

export interface VehicleUpdate extends Partial<VehicleCreate> {}

export interface VehicleFleetStats {
  total_vehicles: number;
  warning_deadlines_count: number;
  expired_deadlines_count: number;
  total_spent_fuel_all: number;
  total_spent_service_all: number;
  fleet_average_consumption?: number | null;
}
