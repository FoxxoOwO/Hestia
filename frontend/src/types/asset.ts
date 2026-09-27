export type AssetCategory = 
  | 'large_appliance'
  | 'small_appliance'
  | 'electronics'
  | 'tools_garden'
  | 'furniture'
  | 'plumbing_hvac'
  | 'other';

export type AssetRoom = 
  | 'kitchen'
  | 'bathroom'
  | 'living_room'
  | 'bedroom'
  | 'hallway'
  | 'garage'
  | 'garden'
  | 'workshop'
  | 'attic_cellar'
  | 'general';

export type AssetStatus = 'active' | 'in_repair' | 'disposed' | 'sold';

export type WarrantyStatus = 'valid' | 'expiring_soon' | 'expired' | 'none';

export interface Asset {
  id: number;
  name: string;
  category: AssetCategory;
  room: AssetRoom;
  brand?: string | null;
  model_number?: string | null;
  serial_number?: string | null;
  purchase_date?: string | null;
  warranty_months: number;
  purchase_price?: number | null;
  store_or_vendor?: string | null;
  invoice_url?: string | null;
  manual_url?: string | null;
  status: AssetStatus;
  notes?: string | null;
  contact_service?: string | null;
  created_at: string;
  updated_at: string;

  // Computed warranty properties
  warranty_expiry_date?: string | null;
  days_until_warranty_expiry?: number | null;
  warranty_status: WarrantyStatus;
  is_under_warranty: boolean;
}

export interface AssetCreatePayload {
  name: string;
  category: AssetCategory;
  room: AssetRoom;
  brand?: string;
  model_number?: string;
  serial_number?: string;
  purchase_date?: string;
  warranty_months?: number;
  purchase_price?: number;
  store_or_vendor?: string;
  invoice_url?: string;
  manual_url?: string;
  status?: AssetStatus;
  notes?: string;
  contact_service?: string;
}

export interface AssetStats {
  total_assets: number;
  total_value: number;
  active_warranties: number;
  expiring_soon_warranties: number;
  expired_warranties: number;
}
