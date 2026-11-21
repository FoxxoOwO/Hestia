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

export const usersApi = {
  // Users
  async getUsers(): Promise<User[]> {
    const res = await apiFetch(`${API_BASE}/auth/users`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async createUser(data: {
    username: string;
    display_name: string;
    password: string;
    role: 'admin' | 'member';
    avatar_color?: string;
    preferred_language?: string;
    preferred_theme?: string;
  }): Promise<User> {
    const res = await apiFetch(`${API_BASE}/auth/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Člena domácnosti se nepodařilo vytvořit');
    }
    return res.json();
  },

  async updateUser(userId: number, data: {
    username?: string;
    display_name?: string;
    email?: string;
    role?: string;
    avatar_color?: string;
    password?: string;
    preferred_language?: string;
    preferred_theme?: string;
  }): Promise<User> {
    const res = await apiFetch(`${API_BASE}/auth/users/${userId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Chyba při úpravě člena' }));
      throw new Error(err.detail || 'Chyba při úpravě člena');
    }
    return res.json();
  },

  async deleteUser(userId: number): Promise<{ status: string; message: string }> {
    const res = await apiFetch(`${API_BASE}/auth/users/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Chyba při mazání člena' }));
      throw new Error(err.detail || 'Chyba při mazání člena');
    }
    return res.json();
  },

};
