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

export const choresApi = {
  // Chores & Household Tasks
  async getChores(params?: {
    room?: string;
    category?: string;
    frequency?: string;
    assignee_id?: number;
    is_appliance_maintenance?: boolean;
    search?: string;
  }): Promise<Chore[]> {
    const query = new URLSearchParams();
    if (params?.room) query.append('room', params.room);
    if (params?.category) query.append('category', params.category);
    if (params?.frequency) query.append('frequency', params.frequency);
    if (params?.assignee_id !== undefined) query.append('assignee_id', String(params.assignee_id));
    if (params?.is_appliance_maintenance !== undefined) query.append('is_appliance_maintenance', String(params.is_appliance_maintenance));
    if (params?.search) query.append('search', params.search);

    const res = await apiFetch(`${API_BASE}/chores?${query.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch chores');
    return res.json();
  },

  async getChore(id: number): Promise<Chore> {
    const res = await apiFetch(`${API_BASE}/chores/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch chore');
    return res.json();
  },

  async createChore(data: ChoreCreateInput): Promise<Chore> {
    const res = await apiFetch(`${API_BASE}/chores`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create chore');
    return res.json();
  },

  async updateChore(id: number, data: ChoreUpdateInput): Promise<Chore> {
    const res = await apiFetch(`${API_BASE}/chores/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update chore');
    return res.json();
  },

  async deleteChore(id: number): Promise<void> {
    const res = await apiFetch(`${API_BASE}/chores/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete chore');
  },

  async completeChore(id: number, data?: ChoreCompleteInput): Promise<Chore> {
    const res = await apiFetch(`${API_BASE}/chores/${id}/complete`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data || {}),
    });
    if (!res.ok) throw new Error('Failed to complete chore');
    return res.json();
  },

  async reassignChore(id: number, newAssigneeId: number): Promise<Chore> {
    const res = await apiFetch(`${API_BASE}/chores/${id}/reassign`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ new_assignee_id: newAssigneeId }),
    });
    if (!res.ok) throw new Error('Failed to reassign chore');
    return res.json();
  },

  async getChoreLeaderboard(): Promise<LeaderboardMember[]> {
    const res = await apiFetch(`${API_BASE}/chores/leaderboard`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch leaderboard');
    return res.json();
  },

  async getPanicModeTasks(): Promise<Chore[]> {
    const res = await apiFetch(`${API_BASE}/chores/panic-mode-tasks`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch panic mode tasks');
    return res.json();
  },

  async getChoreRewards(): Promise<ChoreReward[]> {
    const res = await apiFetch(`${API_BASE}/chores/rewards`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch rewards');
    return res.json();
  },

  async createChoreReward(data: { title: string; description?: string; cost_points: number; icon?: string }): Promise<ChoreReward> {
    const res = await apiFetch(`${API_BASE}/chores/rewards`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create reward');
    return res.json();
  },

  async redeemChoreReward(rewardId: number): Promise<ChoreRedemption> {
    const res = await apiFetch(`${API_BASE}/chores/rewards/${rewardId}/redeem`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to redeem reward');
    }
    return res.json();
  },

  async addChoreSupplyToShopping(choreId: number, itemName?: string, amount: number = 1, unit: string = 'balení'): Promise<any> {
    const query = new URLSearchParams();
    if (itemName) query.append('item_name', itemName);
    query.append('amount', String(amount));
    query.append('unit', unit);

    const res = await apiFetch(`${API_BASE}/chores/${choreId}/add-supply-to-shopping?${query.toString()}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to add supply to shopping');
    return res.json();
  },

};
