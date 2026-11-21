import {
  Recipe, ScaledRecipeResponse, PantryItem,
  RecipePantryMatch, ShoppingItem, User,
  Pet, PetMedicalRecord, PetMedication, PetWeightLog,
  PetTask, PetLogEntry, PetFoodSafetyResponse,
  PetSymptomResponse, PetSitterProfile, PetSosFlyer,
  Chore, ChoreCreateInput, ChoreUpdateInput, ChoreCompleteInput,
  ChoreReward, ChoreRedemption, LeaderboardMember,
  Transaction, TransactionCreate, TransactionUpdate,
  CategoryBudget, CategoryBudgetCreate,
  Subscription, SubscriptionCreate, SubscriptionUpdate,
  SavingsGoal, SavingsGoalCreate, SavingsGoalUpdate,
  DebtSettlementResponse, FinanceMonthlySummary,
  CsvImportPreview, CsvImportConfirm, ReceiptScanResponse, UserFinanceProfile,
  DocumentItem, DocumentCreate, DocumentUpdate, DocumentStats, DocumentUploadResult,
  Vehicle, VehicleCreate, VehicleUpdate, VehicleRefueling, VehicleRefuelingCreate,
  VehicleServiceRecord, VehicleServiceRecordCreate, VehicleFleetStats,
  Medicine, MedicineCreate, MedicineUpdate, MedicineStats,
  MedicationSchedule, MedicationScheduleCreate, MedicationScheduleUpdate,
  MedicationLog, MedicationLogCreate,
  PediatricDosage, FirstAidGuide,
  ActivityLog, ActivityStats, ActivityListResponse, PublicMember,
  ServerBackup, BackupRestoreResult,
  Asset, AssetCreatePayload, AssetStats,
  MealPlanItem, MealPlanItemCreatePayload, GenerateShoppingPayload, GenerateShoppingResponse
} from '../../types';

import { API_BASE, apiFetch, getHeaders, getAuthOnlyHeaders } from '../http';

export const recipesApi = {
  // Recipes
  async getRecipes(params?: {
    query?: string;
    difficulty?: string;
    price_level?: string;
    max_time?: number;
    tag?: string;
    favorite_only?: boolean;
  }): Promise<Recipe[]> {
    const searchParams = new URLSearchParams();
    if (params?.query) searchParams.append('query', params.query);
    if (params?.difficulty) searchParams.append('difficulty', params.difficulty);
    if (params?.price_level) searchParams.append('price_level', params.price_level);
    if (params?.max_time) searchParams.append('max_time', params.max_time.toString());
    if (params?.tag) searchParams.append('tag', params.tag);
    if (params?.favorite_only) searchParams.append('favorite_only', 'true');

    const res = await apiFetch(`${API_BASE}/recipes?${searchParams.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch recipes');
    return res.json();
  },

  async getRecipe(id: number): Promise<Recipe> {
    const res = await apiFetch(`${API_BASE}/recipes/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch recipe');
    return res.json();
  },

  async createRecipe(recipe: Partial<Recipe>): Promise<Recipe> {
    const res = await apiFetch(`${API_BASE}/recipes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(recipe),
    });
    if (!res.ok) throw new Error('Failed to create recipe');
    return res.json();
  },

  async updateRecipe(id: number, recipe: Partial<Recipe>): Promise<Recipe> {
    const res = await apiFetch(`${API_BASE}/recipes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(recipe),
    });
    if (!res.ok) throw new Error('Failed to update recipe');
    return res.json();
  },

  async deleteRecipe(id: number): Promise<void> {
    const res = await apiFetch(`${API_BASE}/recipes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete recipe');
  },

  async toggleFavorite(id: number): Promise<Recipe> {
    const res = await apiFetch(`${API_BASE}/recipes/${id}/toggle-favorite`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to toggle favorite');
    return res.json();
  },

  async scaleRecipe(id: number, servings: number): Promise<ScaledRecipeResponse> {
    const res = await apiFetch(`${API_BASE}/recipes/${id}/scale?servings=${servings}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to scale recipe');
    return res.json();
  },

};
