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

export const petsApi = {
  // Pets
  async getPets(params?: {
    species?: string;
    favorite_only?: boolean;
    query?: string;
  }): Promise<Pet[]> {
    const query = new URLSearchParams();
    if (params?.species && params.species !== 'all') query.set('species', params.species);
    if (params?.favorite_only) query.set('favorite_only', 'true');
    if (params?.query) query.set('query', params.query);

    const res = await apiFetch(`${API_BASE}/pets?${query.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch pets');
    return res.json();
  },

  async getPet(id: number): Promise<Pet> {
    const res = await apiFetch(`${API_BASE}/pets/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch pet');
    return res.json();
  },

  async createPet(pet: any): Promise<Pet> {
    const res = await apiFetch(`${API_BASE}/pets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(pet),
    });
    if (!res.ok) throw new Error('Failed to create pet');
    return res.json();
  },

  async updatePet(id: number, pet: any): Promise<Pet> {
    const res = await apiFetch(`${API_BASE}/pets/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(pet),
    });
    if (!res.ok) throw new Error('Failed to update pet');
    return res.json();
  },

  async deletePet(id: number): Promise<void> {
    const res = await apiFetch(`${API_BASE}/pets/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete pet');
  },

  async feedPet(id: number): Promise<Pet> {
    const res = await apiFetch(`${API_BASE}/pets/${id}/feed`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to record feeding');
    return res.json();
  },

  async toggleFavoritePet(id: number): Promise<Pet> {
    const res = await apiFetch(`${API_BASE}/pets/${id}/toggle-favorite`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to toggle favorite');
    return res.json();
  },

  async addPetMedicalRecord(petId: number, record: any): Promise<PetMedicalRecord> {
    const res = await apiFetch(`${API_BASE}/pets/${petId}/medical`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(record),
    });
    if (!res.ok) throw new Error('Failed to add medical record');
    return res.json();
  },

  async addPetMedication(petId: number, med: any): Promise<PetMedication> {
    const res = await apiFetch(`${API_BASE}/pets/${petId}/medications`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(med),
    });
    if (!res.ok) throw new Error('Failed to add medication');
    return res.json();
  },

  async deletePetMedication(petId: number, medId: number): Promise<void> {
    const res = await apiFetch(`${API_BASE}/pets/${petId}/medications/${medId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete medication');
  },

  async addPetWeight(petId: number, weight: any): Promise<PetWeightLog> {
    const res = await apiFetch(`${API_BASE}/pets/${petId}/weight`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(weight),
    });
    if (!res.ok) throw new Error('Failed to add weight log');
    return res.json();
  },

  async createPetTask(petId: number, task: any): Promise<PetTask> {
    const res = await apiFetch(`${API_BASE}/pets/${petId}/tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(task),
    });
    if (!res.ok) throw new Error('Failed to create pet task');
    return res.json();
  },

  async completePetTask(petId: number, taskId: number): Promise<PetTask> {
    const res = await apiFetch(`${API_BASE}/pets/${petId}/complete-task/${taskId}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to complete task');
    return res.json();
  },

  async addPetLog(petId: number, log: any): Promise<PetLogEntry> {
    const res = await apiFetch(`${API_BASE}/pets/${petId}/logs`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(log),
    });
    if (!res.ok) throw new Error('Failed to add diary entry');
    return res.json();
  },

  async getPetSitterProfile(petId: number): Promise<PetSitterProfile> {
    const res = await apiFetch(`${API_BASE}/pets/${petId}/sitter-profile`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to get sitter profile');
    return res.json();
  },

  async getPetSosFlyer(petId: number): Promise<PetSosFlyer> {
    const res = await apiFetch(`${API_BASE}/pets/${petId}/sos-flyer`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to get SOS flyer');
    return res.json();
  },

  async addPetSupplyToShopping(petId: number, itemName: string, amount: number = 1, unit: string = 'balení'): Promise<any> {
    const query = new URLSearchParams({ item_name: itemName, amount: String(amount), unit });
    const res = await apiFetch(`${API_BASE}/pets/${petId}/add-supply-to-shopping?${query.toString()}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to add supply to shopping');
    return res.json();
  },

};
