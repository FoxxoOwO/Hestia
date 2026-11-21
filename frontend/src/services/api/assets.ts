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

export const assetsApi = {
  // --- Assets & Warranty Tracker ---
  async getAssets(params?: {
    category?: string;
    room?: string;
    status?: string;
    warranty_status?: string;
    search?: string;
  }): Promise<Asset[]> {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.room) query.append('room', params.room);
    if (params?.status) query.append('status', params.status);
    if (params?.warranty_status) query.append('warranty_status', params.warranty_status);
    if (params?.search) query.append('search', params.search);

    const qs = query.toString();
    const res = await apiFetch(`${API_BASE}/assets${qs ? `?${qs}` : ''}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Nepodařilo se načíst seznam spotřebičů');
    return res.json();
  },

  async getAssetStats(): Promise<AssetStats> {
    const res = await apiFetch(`${API_BASE}/assets/stats`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Nepodařilo se načíst statistiky majetku');
    return res.json();
  },

  async getAsset(id: number): Promise<Asset> {
    const res = await apiFetch(`${API_BASE}/assets/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Nepodařilo se načíst detail spotřebiče');
    return res.json();
  },

  async createAsset(data: AssetCreatePayload): Promise<Asset> {
    const res = await apiFetch(`${API_BASE}/assets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Nepodařilo se vytvořit spotřebič');
    return res.json();
  },

  async updateAsset(id: number, data: Partial<AssetCreatePayload>): Promise<Asset> {
    const res = await apiFetch(`${API_BASE}/assets/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Nepodařilo se upravit spotřebič');
    return res.json();
  },

  async deleteAsset(id: number): Promise<void> {
    const res = await apiFetch(`${API_BASE}/assets/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Nepodařilo se odstranit spotřebič');
  },

  async uploadAssetFile(id: number, file: File, fileType: 'invoice' | 'manual'): Promise<{ url: string; file_type: string; asset: Asset }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiFetch(`${API_BASE}/assets/${id}/upload-file?file_type=${fileType}`, {
      method: 'POST',
      headers: getAuthOnlyHeaders(),
      body: formData,
    });
    if (!res.ok) throw new Error('Nepodařilo se nahrát soubor ke spotřebiči');
    return res.json();
  },

};
