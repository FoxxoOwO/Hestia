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

import { API_BASE, apiFetch, getHeaders, getAuthOnlyHeaders, setVaultToken } from '../http';

export const documentsApi = {
  // Documents & Digital Archive
  async getDocuments(params?: {
    category?: string;
    status?: string;
    search?: string;
    sort_by?: string;
    sort_order?: string;
  }): Promise<DocumentItem[]> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.sort_by) searchParams.append('sort_by', params.sort_by);
    if (params?.sort_order) searchParams.append('sort_order', params.sort_order);

    const res = await apiFetch(`${API_BASE}/documents?${searchParams.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  },

  async getDocumentStats(): Promise<DocumentStats> {
    const res = await apiFetch(`${API_BASE}/documents/stats`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch document stats');
    return res.json();
  },

  async getDocument(id: number): Promise<DocumentItem> {
    const res = await apiFetch(`${API_BASE}/documents/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch document');
    return res.json();
  },

  async uploadDocumentFile(file: File, autoAnalyze: boolean = true): Promise<DocumentUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('auto_analyze', String(autoAnalyze));

    const res = await apiFetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      headers: getAuthOnlyHeaders(),
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to upload document file');
    }
    return res.json();
  },

  async createDocument(data: DocumentCreate): Promise<DocumentItem> {
    const res = await apiFetch(`${API_BASE}/documents`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create document');
    return res.json();
  },

  async updateDocument(id: number, data: DocumentUpdate): Promise<DocumentItem> {
    const res = await apiFetch(`${API_BASE}/documents/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update document');
    return res.json();
  },

  async deleteDocument(id: number): Promise<void> {
    const res = await apiFetch(`${API_BASE}/documents/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete document');
  },

  async fetchDocumentFileBlob(
    id: number,
    download: boolean = false,
    fallbackName: string = 'dokument'
  ): Promise<{ blob: Blob; filename: string }> {
    const res = await apiFetch(`${API_BASE}/documents/${id}/file?download=${download ? 'true' : 'false'}`, {
      headers: getAuthOnlyHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Soubor dokumentu se nepodařilo načíst.');
    }
    const disposition = res.headers.get('Content-Disposition') || '';
    const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    const asciiMatch = disposition.match(/filename="?([^";]+)"?/i);
    const filename = utf8Match
      ? decodeURIComponent(utf8Match[1])
      : asciiMatch?.[1] || fallbackName;
    const blob = await res.blob();
    return { blob, filename };
  },

  async verifyVaultPin(pin: string): Promise<{ status: string; message: string; vault_token?: string }> {
    const res = await apiFetch(`${API_BASE}/documents/vault/verify`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ pin }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Nesprávný PIN');
    }
    const data = await res.json();
    if (data.vault_token) setVaultToken(data.vault_token);
    return data;
  },

  async setVaultPin(newPin: string, oldPin?: string): Promise<{ status: string; message: string; vault_token?: string }> {
    const res = await apiFetch(`${API_BASE}/documents/vault/pin`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ new_pin: newPin, old_pin: oldPin || undefined }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Chyba při změně PIN');
    }
    const data = await res.json();
    if (data.vault_token) setVaultToken(data.vault_token);
    return data;
  },

};
