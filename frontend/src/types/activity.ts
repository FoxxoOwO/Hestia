export interface ActivityLog {
  id: number;
  user_id?: number | null;
  user_name: string;
  user_avatar_color?: string | null;
  module: string;
  action_type: string;
  title: string;
  description?: string | null;
  entity_type?: string | null;
  entity_id?: number | null;
  created_at: string;
}

export interface ActivityStats {
  total_activities: number;
  activities_today: number;
  module_counts: Record<string, number>;
  most_active_member?: string | null;
}

export interface ActivityListResponse {
  items: ActivityLog[];
  total: number;
  limit: number;
  offset: number;
}

export interface PublicMember {
  id: number;
  username: string;
  display_name: string;
  avatar_color?: string;
  role: string;
}
