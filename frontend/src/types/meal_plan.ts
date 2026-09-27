export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealPlanItem {
  id: number;
  date: string; // YYYY-MM-DD
  meal_type: MealType;
  recipe_id?: number | null;
  custom_title?: string | null;
  servings: number;
  notes?: string | null;
  is_cooked: boolean;
  created_by_id?: number | null;
  created_at: string;
  updated_at: string;

  // Recipe enrichment
  recipe_title?: string | null;
  recipe_image_url?: string | null;
  recipe_prep_time?: number | null;
  recipe_cook_time?: number | null;
  recipe_difficulty?: string | null;
}

export interface MealPlanItemCreatePayload {
  date: string;
  meal_type: MealType;
  recipe_id?: number | null;
  custom_title?: string | null;
  servings?: number;
  notes?: string | null;
  is_cooked?: boolean;
}

export interface GenerateShoppingPayload {
  start_date: string;
  end_date: string;
  check_pantry?: boolean;
}

export interface GenerateShoppingResponse {
  added_items_count: number;
  already_in_pantry_count: number;
  added_items: string[];
}
