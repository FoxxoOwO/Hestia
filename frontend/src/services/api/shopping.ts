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

export const shoppingApi = {
  // Shopping List
  async getShoppingItems(): Promise<ShoppingItem[]> {
    const res = await apiFetch(`${API_BASE}/shopping`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch shopping items');
    return res.json();
  },

  async createShoppingItem(item: Partial<ShoppingItem>): Promise<ShoppingItem> {
    const res = await apiFetch(`${API_BASE}/shopping`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Failed to create shopping item');
    return res.json();
  },

  async updateShoppingItem(id: number, item: Partial<ShoppingItem>): Promise<ShoppingItem> {
    const res = await apiFetch(`${API_BASE}/shopping/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Failed to update shopping item');
    return res.json();
  },

  async deleteShoppingItem(id: number): Promise<void> {
    const res = await apiFetch(`${API_BASE}/shopping/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete shopping item');
  },

  async addRecipeToShopping(recipeId: number, ingredients: any[]): Promise<ShoppingItem[]> {
    const res = await apiFetch(`${API_BASE}/shopping/add-from-recipe`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ recipe_id: recipeId, ingredients }),
    });
    if (!res.ok) throw new Error('Failed to add ingredients to shopping');
    return res.json();
  },

  async clearCompletedShopping(): Promise<void> {
    const res = await apiFetch(`${API_BASE}/shopping/clear-completed`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to clear completed items');
  },

  async clearAllShopping(): Promise<void> {
    const res = await apiFetch(`${API_BASE}/shopping/clear-all`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to clear all items');
  },

};
