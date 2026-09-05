export * from './plant';
export * from './pet';
export * from './chore';
export * from './finance';
export * from './document';
export * from './vehicle';

export type Role = 'admin' | 'member';

export interface User {
  id: number;
  username: string;
  display_name: string;
  email?: string;
  role: Role;
  avatar_color: string;
  preferred_language: 'cs' | 'en';
  preferred_theme: 'system' | 'light' | 'dark';
  is_active: boolean;
  created_at: string;
}

export type Difficulty = 'easy' | 'medium' | 'hard';
export type PriceLevel = 'low' | 'medium' | 'high';

export interface IngredientItem {
  name: string;
  amount: number;
  unit: string;
  note?: string;
  category?: string;
}

export interface InstructionStep {
  step: number;
  text: string;
  timer_minutes?: number | null;
}

export interface Recipe {
  id: number;
  title: string;
  description?: string;
  image_url?: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  total_time_minutes: number;
  difficulty: Difficulty;
  price_level: PriceLevel;
  default_servings: number;
  tags: string[];
  utensils: string[];
  ingredients: IngredientItem[];
  instructions: InstructionStep[];
  source_url?: string;
  is_favorite: boolean;
  created_by_id?: number;
  created_at: string;
  updated_at: string;
}

export interface ScaledIngredientItem extends IngredientItem {
  original_amount: number;
  scaled_amount: number;
  is_in_pantry: boolean;
  pantry_amount?: number;
}

export interface ScaledRecipeResponse {
  recipe: Recipe;
  target_servings: number;
  scale_factor: number;
  scaled_ingredients: ScaledIngredientItem[];
}

export type PantryCategory = 'fridge' | 'freezer' | 'pantry' | 'produce' | 'spices' | 'bakery' | 'other';
export type PantryStatus = 'fresh' | 'expiring_soon' | 'expired';

export interface PantryItem {
  id: number;
  name: string;
  category: PantryCategory;
  quantity: number;
  unit: string;
  expiration_date?: string;
  min_quantity?: number;
  note?: string;
  updated_at: string;
  status: PantryStatus;
}

export interface RecipePantryMatch {
  recipe_id: number;
  recipe_title: string;
  total_ingredients_count: number;
  matched_ingredients_count: number;
  missing_ingredients_count: number;
  match_percentage: number;
  missing_ingredients: {
    ingredient_name: string;
    required_amount: number;
    unit: string;
    available_in_pantry: boolean;
  }[];
  can_cook_now: boolean;
}

export interface ShoppingItem {
  id: number;
  name: string;
  amount?: number;
  unit?: string;
  category: string;
  is_checked: boolean;
  recipe_id?: number;
  added_by_id?: number;
  created_at: string;
}
