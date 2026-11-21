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

export const mealPlansApi = {
  // --- Weekly Meal Planner ---
  async getMealPlans(startDate?: string, endDate?: string): Promise<MealPlanItem[]> {
    const query = new URLSearchParams();
    if (startDate) query.append('start_date', startDate);
    if (endDate) query.append('end_date', endDate);
    const qs = query.toString();
    const res = await apiFetch(`${API_BASE}/meal-plans${qs ? `?${qs}` : ''}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Nepodařilo se načíst jídelníček');
    return res.json();
  },

  async createMealPlanItem(data: MealPlanItemCreatePayload): Promise<MealPlanItem> {
    const res = await apiFetch(`${API_BASE}/meal-plans`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Nepodařilo se přidat jídlo do plánu');
    return res.json();
  },

  async updateMealPlanItem(id: number, data: Partial<MealPlanItemCreatePayload>): Promise<MealPlanItem> {
    const res = await apiFetch(`${API_BASE}/meal-plans/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Nepodařilo se upravit položku jídelníčku');
    return res.json();
  },

  async deleteMealPlanItem(id: number): Promise<void> {
    const res = await apiFetch(`${API_BASE}/meal-plans/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Nepodařilo se odstranit položku z plánu');
  },

  async toggleCookedMealPlan(id: number): Promise<MealPlanItem> {
    const res = await apiFetch(`${API_BASE}/meal-plans/${id}/toggle-cooked`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Nepodařilo se změnit stav uvařeno');
    return res.json();
  },

  async generateShoppingFromMealPlan(payload: GenerateShoppingPayload): Promise<GenerateShoppingResponse> {
    const res = await apiFetch(`${API_BASE}/meal-plans/generate-shopping`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Nepodařilo se vygenerovat nákupní seznam z jídelníčku');
    return res.json();
  }
};
