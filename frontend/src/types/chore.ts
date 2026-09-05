export interface UserSimple {
  id: number;
  username: string;
  display_name: string;
  avatar_color?: string;
}

export type ChoreRoom =
  | 'kitchen'
  | 'bathroom'
  | 'living_room'
  | 'bedroom'
  | 'hallway'
  | 'kids_room'
  | 'garden'
  | 'general';

export type ChoreCategory =
  | 'routine'
  | 'deep_clean'
  | 'maintenance'
  | 'panic_mode';

export type ChoreFrequency =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'seasonal'
  | 'as_needed';

export interface Chore {
  id: number;
  title: string;
  description: string | null;
  room: ChoreRoom | string;
  category: ChoreCategory;
  frequency: ChoreFrequency;
  interval_days: number;
  points: number;
  estimated_minutes: number;
  is_rotation_enabled: boolean;
  rotation_member_ids: string;
  rotation_member_ids_list: number[];
  current_assignee_id: number | null;
  current_assignee: UserSimple | null;
  due_date: string | null;
  days_until_due: number | null;
  is_overdue: boolean;
  last_completed_at: string | null;
  last_completed_by_id: number | null;
  last_completed_by: UserSimple | null;
  cleaning_supplies_needed: string | null;
  is_appliance_maintenance: boolean;
  appliance_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChoreCreateInput {
  title: string;
  description?: string;
  room?: string;
  category?: string;
  frequency?: string;
  interval_days?: number;
  points?: number;
  estimated_minutes?: number;
  is_rotation_enabled?: boolean;
  rotation_member_ids?: number[];
  current_assignee_id?: number | null;
  due_date?: string;
  cleaning_supplies_needed?: string;
  is_appliance_maintenance?: boolean;
  appliance_name?: string;
}

export interface ChoreUpdateInput extends Partial<ChoreCreateInput> {
  is_active?: boolean;
}

export interface ChoreCompleteInput {
  notes?: string;
  custom_points?: number;
}

export interface ChoreReward {
  id: number;
  title: string;
  description: string | null;
  cost_points: number;
  icon: string;
  is_active: boolean;
  created_at: string;
}

export interface ChoreRedemption {
  id: number;
  reward_id: number;
  user_id: number;
  points_spent: number;
  status: string;
  redeemed_at: string;
  reward?: ChoreReward;
  user?: UserSimple;
}

export interface LeaderboardMember {
  user_id: number;
  username: string;
  display_name: string;
  avatar_color: string;
  total_points: number;
  weekly_points: number;
  available_points: number;
  chores_completed_count: number;
}
