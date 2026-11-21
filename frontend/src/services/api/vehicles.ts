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

export const vehiclesApi = {
  // ==========================================
  // VEHICLES & FLEET
  // ==========================================
  async getVehicles(params?: { query?: string; favorite_only?: boolean }): Promise<Vehicle[]> {
    const sp = new URLSearchParams();
    if (params?.query) sp.append('query', params.query);
    if (params?.favorite_only) sp.append('favorite_only', 'true');
    const qs = sp.toString() ? `?${sp.toString()}` : '';

    const res = await apiFetch(`${API_BASE}/vehicles${qs}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch vehicles');
    return res.json();
  },

  async getVehicleFleetStats(): Promise<VehicleFleetStats> {
    const res = await apiFetch(`${API_BASE}/vehicles/stats`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch vehicle fleet stats');
    return res.json();
  },

  async getVehicle(id: number): Promise<Vehicle> {
    const res = await apiFetch(`${API_BASE}/vehicles/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch vehicle');
    return res.json();
  },

  async createVehicle(data: VehicleCreate): Promise<Vehicle> {
    const res = await apiFetch(`${API_BASE}/vehicles`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create vehicle');
    return res.json();
  },

  async updateVehicle(id: number, data: VehicleUpdate): Promise<Vehicle> {
    const res = await apiFetch(`${API_BASE}/vehicles/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update vehicle');
    return res.json();
  },

  async deleteVehicle(id: number): Promise<void> {
    const res = await apiFetch(`${API_BASE}/vehicles/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete vehicle');
  },

  async updateVehicleMileage(id: number, mileage: number): Promise<Vehicle> {
    const res = await apiFetch(`${API_BASE}/vehicles/${id}/mileage`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ mileage }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Chyba při aktualizaci tachometru');
    }
    return res.json();
  },

  async addRefueling(vehicleId: number, data: VehicleRefuelingCreate): Promise<VehicleRefueling> {
    const res = await apiFetch(`${API_BASE}/vehicles/${vehicleId}/refuelings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add refueling');
    return res.json();
  },

  async getVehicleRefuelings(vehicleId: number): Promise<VehicleRefueling[]> {
    const res = await apiFetch(`${API_BASE}/vehicles/${vehicleId}/refuelings`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch refuelings');
    return res.json();
  },

  async deleteRefueling(vehicleId: number, refuelingId: number): Promise<void> {
    const res = await apiFetch(`${API_BASE}/vehicles/${vehicleId}/refuelings/${refuelingId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete refueling');
  },

  async addServiceRecord(vehicleId: number, data: VehicleServiceRecordCreate): Promise<VehicleServiceRecord> {
    const res = await apiFetch(`${API_BASE}/vehicles/${vehicleId}/services`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add service record');
    return res.json();
  },

  async getVehicleServiceRecords(vehicleId: number): Promise<VehicleServiceRecord[]> {
    const res = await apiFetch(`${API_BASE}/vehicles/${vehicleId}/services`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch service records');
    return res.json();
  },

  async deleteServiceRecord(vehicleId: number, serviceId: number): Promise<void> {
    const res = await apiFetch(`${API_BASE}/vehicles/${vehicleId}/services/${serviceId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete service record');
  },

};
