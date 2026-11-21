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

export const pantryApi = {
  // Pantry
  async getPantryItems(category?: string, query?: string): Promise<PantryItem[]> {
    const searchParams = new URLSearchParams();
    if (category && category !== 'all') searchParams.append('category', category);
    if (query) searchParams.append('query', query);

    const res = await apiFetch(`${API_BASE}/pantry?${searchParams.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch pantry items');
    return res.json();
  },

  async createPantryItem(item: Partial<PantryItem>): Promise<PantryItem> {
    const res = await apiFetch(`${API_BASE}/pantry`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Failed to create pantry item');
    return res.json();
  },

  async updatePantryItem(id: number, item: Partial<PantryItem>): Promise<PantryItem> {
    const res = await apiFetch(`${API_BASE}/pantry/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Failed to update pantry item');
    return res.json();
  },

  async deletePantryItem(id: number): Promise<void> {
    const res = await apiFetch(`${API_BASE}/pantry/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete pantry item');
  },

  async matchRecipesWithPantry(): Promise<RecipePantryMatch[]> {
    const res = await apiFetch(`${API_BASE}/pantry/match-recipes`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to match recipes');
    return res.json();
  },

};
