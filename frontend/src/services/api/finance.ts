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

export const financeApi = {
  // Finance & Budget
  async getFinanceSummary(month?: string): Promise<FinanceMonthlySummary> {
    const url = month ? `${API_BASE}/finance/summary?month=${encodeURIComponent(month)}` : `${API_BASE}/finance/summary`;
    const res = await apiFetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch finance summary');
    return res.json();
  },

  async getFinanceTransactions(params?: {
    month?: string;
    category?: string;
    payer_id?: number;
    transaction_type?: string;
    is_shared?: boolean;
    search?: string;
    limit?: number;
  }): Promise<Transaction[]> {
    const searchParams = new URLSearchParams();
    if (params?.month) searchParams.append('month', params.month);
    if (params?.category) searchParams.append('category', params.category);
    if (params?.payer_id !== undefined) searchParams.append('payer_id', String(params.payer_id));
    if (params?.transaction_type) searchParams.append('transaction_type', params.transaction_type);
    if (params?.is_shared !== undefined) searchParams.append('is_shared', String(params.is_shared));
    if (params?.search) searchParams.append('search', params.search);
    if (params?.limit) searchParams.append('limit', String(params.limit));

    const res = await apiFetch(`${API_BASE}/finance/transactions?${searchParams.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
  },

  async createTransaction(data: TransactionCreate): Promise<Transaction> {
    const res = await apiFetch(`${API_BASE}/finance/transactions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create transaction');
    return res.json();
  },

  async updateTransaction(id: number, data: TransactionUpdate): Promise<Transaction> {
    const res = await apiFetch(`${API_BASE}/finance/transactions/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update transaction');
    return res.json();
  },

  async deleteTransaction(id: number): Promise<void> {
    const res = await apiFetch(`${API_BASE}/finance/transactions/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete transaction');
  },

  async getCategoryBudgets(): Promise<CategoryBudget[]> {
    const res = await apiFetch(`${API_BASE}/finance/budgets`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch category budgets');
    return res.json();
  },

  async setCategoryBudget(data: CategoryBudgetCreate): Promise<CategoryBudget> {
    const res = await apiFetch(`${API_BASE}/finance/budgets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to set category budget');
    return res.json();
  },

  async getDebtSettlement(month?: string): Promise<DebtSettlementResponse> {
    const url = month ? `${API_BASE}/finance/settlement?month=${encodeURIComponent(month)}` : `${API_BASE}/finance/settlement`;
    const res = await apiFetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch debt settlement');
    return res.json();
  },

  async settleDebts(): Promise<{ status: string; message: string }> {
    const res = await apiFetch(`${API_BASE}/finance/settle`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to settle debts');
    return res.json();
  },

  async getSubscriptions(): Promise<Subscription[]> {
    const res = await apiFetch(`${API_BASE}/finance/subscriptions`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch subscriptions');
    return res.json();
  },

  async createSubscription(data: SubscriptionCreate): Promise<Subscription> {
    const res = await apiFetch(`${API_BASE}/finance/subscriptions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create subscription');
    return res.json();
  },

  async updateSubscription(id: number, data: SubscriptionUpdate): Promise<Subscription> {
    const res = await apiFetch(`${API_BASE}/finance/subscriptions/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update subscription');
    return res.json();
  },

  async deleteSubscription(id: number): Promise<void> {
    const res = await apiFetch(`${API_BASE}/finance/subscriptions/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete subscription');
  },

  async getSavingsGoals(): Promise<SavingsGoal[]> {
    const res = await apiFetch(`${API_BASE}/finance/goals`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch savings goals');
    return res.json();
  },

  async createSavingsGoal(data: SavingsGoalCreate): Promise<SavingsGoal> {
    const res = await apiFetch(`${API_BASE}/finance/goals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create savings goal');
    return res.json();
  },

  async updateSavingsGoal(id: number, data: SavingsGoalUpdate): Promise<SavingsGoal> {
    const res = await apiFetch(`${API_BASE}/finance/goals/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update savings goal');
    return res.json();
  },

  async deleteSavingsGoal(id: number): Promise<void> {
    const res = await apiFetch(`${API_BASE}/finance/goals/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete savings goal');
  },

  async addSavingsToGoal(goalId: number, amount: number): Promise<SavingsGoal> {
    const res = await apiFetch(`${API_BASE}/finance/goals/${goalId}/add-savings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) throw new Error('Failed to add savings to goal');
    return res.json();
  },

  async previewFinanceImport(file: File): Promise<CsvImportPreview> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiFetch(`${API_BASE}/finance/import/preview`, {
      method: 'POST',
      headers: getAuthOnlyHeaders(),
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to preview import file');
    }
    return res.json();
  },

  async confirmFinanceImport(data: CsvImportConfirm): Promise<{ status: string; imported_count: number; message: string }> {
    const res = await apiFetch(`${API_BASE}/finance/import/confirm`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to confirm import');
    return res.json();
  },

  async scanFinanceReceipt(payload: { image_base64?: string; image_url?: string }): Promise<ReceiptScanResponse> {
    const res = await apiFetch(`${API_BASE}/finance/scan-receipt`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to scan receipt');
    return res.json();
  },

  async getUserFinanceProfile(): Promise<UserFinanceProfile> {
    const res = await apiFetch(`${API_BASE}/finance/profile`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch user finance profile');
    return res.json();
  },

  async updateUserFinanceProfile(data: { bank_account?: string; iban?: string }): Promise<UserFinanceProfile> {
    const res = await apiFetch(`${API_BASE}/finance/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update user finance profile');
    return res.json();
  },

};
