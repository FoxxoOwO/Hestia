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

export const plantsApi = {
  // Plants
  async getPlants(params?: {
    room?: string;
    thirsty_only?: boolean;
    pet_toxicity?: string;
    health_status?: string;
    query?: string;
  }): Promise<any[]> {
    const searchParams = new URLSearchParams();
    if (params?.room && params.room !== 'all') searchParams.append('room', params.room);
    if (params?.thirsty_only) searchParams.append('thirsty_only', 'true');
    if (params?.pet_toxicity && params.pet_toxicity !== 'all') searchParams.append('pet_toxicity', params.pet_toxicity);
    if (params?.health_status && params.health_status !== 'all') searchParams.append('health_status', params.health_status);
    if (params?.query) searchParams.append('query', params.query);

    const res = await apiFetch(`${API_BASE}/plants?${searchParams.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch plants');
    return res.json();
  },

  async getPlant(id: number): Promise<any> {
    const res = await apiFetch(`${API_BASE}/plants/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch plant');
    return res.json();
  },

  async createPlant(plant: any): Promise<any> {
    const res = await apiFetch(`${API_BASE}/plants`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(plant),
    });
    if (!res.ok) throw new Error('Failed to create plant');
    return res.json();
  },

  async updatePlant(id: number, plant: any): Promise<any> {
    const res = await apiFetch(`${API_BASE}/plants/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(plant),
    });
    if (!res.ok) throw new Error('Failed to update plant');
    return res.json();
  },

  async deletePlant(id: number): Promise<void> {
    const res = await apiFetch(`${API_BASE}/plants/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete plant');
  },

  async waterPlant(id: number): Promise<any> {
    const res = await apiFetch(`${API_BASE}/plants/${id}/water`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to water plant');
    return res.json();
  },

  async toggleWinterMode(id: number): Promise<any> {
    const res = await apiFetch(`${API_BASE}/plants/${id}/toggle-winter-mode`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to toggle winter mode');
    return res.json();
  },

  async toggleFavoritePlant(id: number): Promise<any> {
    const res = await apiFetch(`${API_BASE}/plants/${id}/toggle-favorite`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to toggle favorite');
    return res.json();
  },

  async createPlantTask(plantId: number, task: any): Promise<any> {
    const res = await apiFetch(`${API_BASE}/plants/${plantId}/tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(task),
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  },

  async completePlantTask(plantId: number, taskId: number): Promise<any> {
    const res = await apiFetch(`${API_BASE}/plants/${plantId}/complete-task/${taskId}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to complete task');
    return res.json();
  },

  async addPlantLogEntry(plantId: number, entry: any): Promise<any> {
    const res = await apiFetch(`${API_BASE}/plants/${plantId}/logs`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error('Failed to add log entry');
    return res.json();
  },

  async getPlantSitterSchedule(): Promise<any[]> {
    const res = await apiFetch(`${API_BASE}/plants/plant-sitter`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to get plant sitter schedule');
    return res.json();
  },

};
