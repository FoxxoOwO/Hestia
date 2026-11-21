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

export const medicinesApi = {
  // ==========================================
  // MEDICINES & FIRST AID
  // ==========================================
  async getMedicines(params?: {
    category?: string;
    location?: string;
    search?: string;
    is_low_stock?: boolean;
    status_filter?: string;
    assigned_user_id?: number;
  }): Promise<Medicine[]> {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.location) query.append('location', params.location);
    if (params?.search) query.append('search', params.search);
    if (params?.is_low_stock !== undefined) query.append('is_low_stock', String(params.is_low_stock));
    if (params?.status_filter) query.append('status_filter', params.status_filter);
    if (params?.assigned_user_id) query.append('assigned_user_id', String(params.assigned_user_id));

    const qs = query.toString();
    const res = await apiFetch(`${API_BASE}/medicines${qs ? `?${qs}` : ''}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch medicines');
    return res.json();
  },

  async getMedicineStats(): Promise<MedicineStats> {
    const res = await apiFetch(`${API_BASE}/medicines/stats`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch medicine stats');
    return res.json();
  },

  async getMedicine(id: number): Promise<Medicine> {
    const res = await apiFetch(`${API_BASE}/medicines/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch medicine');
    return res.json();
  },

  async createMedicine(data: MedicineCreate): Promise<Medicine> {
    const res = await apiFetch(`${API_BASE}/medicines`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create medicine');
    return res.json();
  },

  async updateMedicine(id: number, data: MedicineUpdate): Promise<Medicine> {
    const res = await apiFetch(`${API_BASE}/medicines/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update medicine');
    return res.json();
  },

  async deleteMedicine(id: number): Promise<void> {
    const res = await apiFetch(`${API_BASE}/medicines/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete medicine');
  },

  async markMedicineOpened(id: number, openedDate?: string): Promise<Medicine> {
    const query = openedDate ? `?opened_date=${encodeURIComponent(openedDate)}` : '';
    const res = await apiFetch(`${API_BASE}/medicines/${id}/mark-opened${query}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to mark medicine as opened');
    return res.json();
  },

  async adjustMedicineStock(id: number, delta: number): Promise<Medicine> {
    const res = await apiFetch(`${API_BASE}/medicines/${id}/adjust-stock?delta=${delta}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to adjust medicine stock');
    return res.json();
  },

  async addMedicineToShopping(id: number): Promise<{ success: boolean; shopping_item_id: number; name: string; message: string }> {
    const res = await apiFetch(`${API_BASE}/medicines/${id}/add-to-shopping`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to add medicine to shopping list');
    return res.json();
  },

  async getMedicationSchedules(userId?: number, isActive?: boolean): Promise<MedicationSchedule[]> {
    const query = new URLSearchParams();
    if (userId !== undefined) query.append('user_id', String(userId));
    if (isActive !== undefined) query.append('is_active', String(isActive));

    const qs = query.toString();
    const res = await apiFetch(`${API_BASE}/medicines/schedules${qs ? `?${qs}` : ''}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch medication schedules');
    return res.json();
  },

  async createMedicationSchedule(data: MedicationScheduleCreate): Promise<MedicationSchedule> {
    const res = await apiFetch(`${API_BASE}/medicines/schedules`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create medication schedule');
    return res.json();
  },

  async updateMedicationSchedule(id: number, data: MedicationScheduleUpdate): Promise<MedicationSchedule> {
    const res = await apiFetch(`${API_BASE}/medicines/schedules/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update medication schedule');
    return res.json();
  },

  async deleteMedicationSchedule(id: number): Promise<void> {
    const res = await apiFetch(`${API_BASE}/medicines/schedules/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete medication schedule');
  },

  async getMedicationLogs(params?: { medicine_id?: number; user_id?: number; limit?: number }): Promise<MedicationLog[]> {
    const query = new URLSearchParams();
    if (params?.medicine_id) query.append('medicine_id', String(params.medicine_id));
    if (params?.user_id) query.append('user_id', String(params.user_id));
    if (params?.limit) query.append('limit', String(params.limit));

    const qs = query.toString();
    const res = await apiFetch(`${API_BASE}/medicines/logs${qs ? `?${qs}` : ''}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch medication logs');
    return res.json();
  },

  async createMedicationLog(data: MedicationLogCreate): Promise<MedicationLog> {
    const res = await apiFetch(`${API_BASE}/medicines/logs`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to log medication taken');
    return res.json();
  },

  async getFirstAidGuides(): Promise<FirstAidGuide[]> {
    const res = await apiFetch(`${API_BASE}/medicines/first-aid/guides`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch first aid guides');
    return res.json();
  },

  async getPediatricDosage(weightKg: number, drug: string): Promise<PediatricDosage> {
    const res = await apiFetch(`${API_BASE}/medicines/first-aid/pediatric-dosage?weight_kg=${weightKg}&drug=${encodeURIComponent(drug)}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to calculate pediatric dosage');
    return res.json();
  },

};
