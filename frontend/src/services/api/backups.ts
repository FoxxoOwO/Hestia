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

export const backupsApi = {
  // System Backups & Export/Import
  async exportData(): Promise<Blob> {
    const res = await apiFetch(`${API_BASE}/system/export`, {
      method: 'GET',
      headers: getAuthOnlyHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Chyba při exportu dat' }));
      throw new Error(err.detail || 'Chyba při exportu dat');
    }
    return res.blob();
  },

  async importData(file: File, mode: 'merge' | 'replace'): Promise<{
    status: string;
    message: string;
    mode: string;
    imported_counts: Record<string, number>;
    total_imported: number;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode);

    const res = await apiFetch(`${API_BASE}/system/import`, {
      method: 'POST',
      headers: getAuthOnlyHeaders(),
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Chyba při importu dat' }));
      throw new Error(err.detail || 'Chyba při importu dat');
    }
    return res.json();
  },

  async getBackups(): Promise<ServerBackup[]> {
    const res = await apiFetch(`${API_BASE}/system/backups`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Chyba při načítání záloh');
    return res.json();
  },

  async createBackup(note?: string): Promise<{
    status: string;
    message: string;
    backup: ServerBackup;
  }> {
    const res = await apiFetch(`${API_BASE}/system/backups`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ note: note || null }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Chyba při vytváření zálohy' }));
      throw new Error(err.detail || 'Chyba při vytváření zálohy');
    }
    return res.json();
  },

  async downloadBackup(filename: string): Promise<Blob> {
    const res = await apiFetch(`${API_BASE}/system/backups/${encodeURIComponent(filename)}/download`, {
      method: 'GET',
      headers: getAuthOnlyHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Chyba při stahování zálohy' }));
      throw new Error(err.detail || 'Chyba při stahování zálohy');
    }
    return res.blob();
  },

  async restoreBackup(filename: string): Promise<BackupRestoreResult> {
    const res = await apiFetch(`${API_BASE}/system/backups/${encodeURIComponent(filename)}/restore`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Chyba při obnově systému ze zálohy' }));
      throw new Error(err.detail || 'Chyba při obnově systému ze zálohy');
    }
    return res.json();
  },

  async deleteBackup(filename: string): Promise<{ status: string; message: string }> {
    const res = await apiFetch(`${API_BASE}/system/backups/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Chyba při mazání zálohy' }));
      throw new Error(err.detail || 'Chyba při mazání zálohy');
    }
    return res.json();
  },

};
