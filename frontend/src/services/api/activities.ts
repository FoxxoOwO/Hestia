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

export const activitiesApi = {
  // Activities & Audit Log
  async getActivities(params?: {
    limit?: number;
    offset?: number;
    module?: string;
    user_id?: number;
    action_type?: string;
    search?: string;
  }): Promise<ActivityListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    if (params?.module && params.module !== 'all') searchParams.append('module', params.module);
    if (params?.user_id) searchParams.append('user_id', params.user_id.toString());
    if (params?.action_type && params.action_type !== 'all') searchParams.append('action_type', params.action_type);
    if (params?.search) searchParams.append('search', params.search);

    const res = await apiFetch(`${API_BASE}/activities?${searchParams.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch activity logs');
    return res.json();
  },

  async getActivityStats(): Promise<ActivityStats> {
    const res = await apiFetch(`${API_BASE}/activities/stats`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch activity stats');
    return res.json();
  },

  async clearActivities(olderThanDays?: number): Promise<{ status: string; message: string; deleted_count: number }> {
    const url = olderThanDays ? `${API_BASE}/activities?older_than_days=${olderThanDays}` : `${API_BASE}/activities`;
    const res = await apiFetch(url, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to clear activity logs');
    return res.json();
  },

};
