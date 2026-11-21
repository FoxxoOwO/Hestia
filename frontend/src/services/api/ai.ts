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

export const aiApi = {
  // Gemini AI
  async importRecipeWithGemini(data: { url?: string; raw_text?: string; target_language?: string }): Promise<Partial<Recipe>> {
    const res = await apiFetch(`${API_BASE}/ai/import-recipe`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Gemini import failed');
    }
    return res.json();
  },

  async importRecipeFromFile(file: File, target_language?: string): Promise<{ success: boolean; count: number; filename: string; recipes: Partial<Recipe>[] }> {
    const formData = new FormData();
    formData.append('file', file);
    if (target_language) {
      formData.append('target_language', target_language);
    }

    const res = await apiFetch(`${API_BASE}/ai/import-recipe-file`, {
      method: 'POST',
      headers: getAuthOnlyHeaders(),
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Nepodařilo se importovat recept ze souboru.');
    }
    return res.json();
  },

  async analyzePlantWithGemini(data: {
    plant_name?: string;
    image_base64?: string;
    image_url?: string;
    target_language?: string;
  }): Promise<any> {
    const res = await apiFetch(`${API_BASE}/ai/analyze-plant`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Nepodařilo se analyzovat rostlinu.');
    }
    return res.json();
  },

  async diagnosePlantHealth(data: {
    plant_id?: number;
    plant_name?: string;
    symptoms_description: string;
    image_base64?: string;
    image_url?: string;
    target_language?: string;
  }): Promise<any> {
    const res = await apiFetch(`${API_BASE}/ai/diagnose-plant-health`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Chyba při diagnostice rostliny.');
    }
    return res.json();
  },

  async checkPetFoodSafety(data: {
    species: string;
    food_name: string;
    target_language?: string;
  }): Promise<PetFoodSafetyResponse> {
    const res = await apiFetch(`${API_BASE}/ai/check-pet-food-safety`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Chyba při kontrole bezpečnosti potraviny.');
    }
    return res.json();
  },

  async diagnosePetSymptoms(data: {
    pet_id?: number;
    pet_name?: string;
    pet_species?: string;
    pet_age?: string;
    symptoms_description: string;
    image_base64?: string;
    image_url?: string;
    target_language?: string;
  }): Promise<PetSymptomResponse> {
    const res = await apiFetch(`${API_BASE}/ai/diagnose-pet-symptoms`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Chyba při veterinární analýze.');
    }
    return res.json();
  },

  async getAiStatus(): Promise<{ gemini_configured: boolean; model: string }> {
    const res = await apiFetch(`${API_BASE}/ai/status`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to get AI status');
    return res.json();
  },

};
