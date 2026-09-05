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
  VehicleServiceRecord, VehicleServiceRecordCreate, VehicleFleetStats
} from '../types';

const API_BASE = '/api/v1';

const getHeaders = () => {
  const token = localStorage.getItem('hestia_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const getAuthOnlyHeaders = () => {
  const token = localStorage.getItem('hestia_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Recipes
  async getRecipes(params?: {
    query?: string;
    difficulty?: string;
    price_level?: string;
    max_time?: number;
    tag?: string;
    favorite_only?: boolean;
  }): Promise<Recipe[]> {
    const searchParams = new URLSearchParams();
    if (params?.query) searchParams.append('query', params.query);
    if (params?.difficulty) searchParams.append('difficulty', params.difficulty);
    if (params?.price_level) searchParams.append('price_level', params.price_level);
    if (params?.max_time) searchParams.append('max_time', params.max_time.toString());
    if (params?.tag) searchParams.append('tag', params.tag);
    if (params?.favorite_only) searchParams.append('favorite_only', 'true');

    const res = await fetch(`${API_BASE}/recipes?${searchParams.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch recipes');
    return res.json();
  },

  async getRecipe(id: number): Promise<Recipe> {
    const res = await fetch(`${API_BASE}/recipes/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch recipe');
    return res.json();
  },

  async createRecipe(recipe: Partial<Recipe>): Promise<Recipe> {
    const res = await fetch(`${API_BASE}/recipes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(recipe),
    });
    if (!res.ok) throw new Error('Failed to create recipe');
    return res.json();
  },

  async updateRecipe(id: number, recipe: Partial<Recipe>): Promise<Recipe> {
    const res = await fetch(`${API_BASE}/recipes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(recipe),
    });
    if (!res.ok) throw new Error('Failed to update recipe');
    return res.json();
  },

  async deleteRecipe(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/recipes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete recipe');
  },

  async toggleFavorite(id: number): Promise<Recipe> {
    const res = await fetch(`${API_BASE}/recipes/${id}/toggle-favorite`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to toggle favorite');
    return res.json();
  },

  async scaleRecipe(id: number, servings: number): Promise<ScaledRecipeResponse> {
    const res = await fetch(`${API_BASE}/recipes/${id}/scale?servings=${servings}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to scale recipe');
    return res.json();
  },

  // Pantry
  async getPantryItems(category?: string, query?: string): Promise<PantryItem[]> {
    const searchParams = new URLSearchParams();
    if (category && category !== 'all') searchParams.append('category', category);
    if (query) searchParams.append('query', query);

    const res = await fetch(`${API_BASE}/pantry?${searchParams.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch pantry items');
    return res.json();
  },

  async createPantryItem(item: Partial<PantryItem>): Promise<PantryItem> {
    const res = await fetch(`${API_BASE}/pantry`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Failed to create pantry item');
    return res.json();
  },

  async updatePantryItem(id: number, item: Partial<PantryItem>): Promise<PantryItem> {
    const res = await fetch(`${API_BASE}/pantry/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Failed to update pantry item');
    return res.json();
  },

  async deletePantryItem(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/pantry/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete pantry item');
  },

  async matchRecipesWithPantry(): Promise<RecipePantryMatch[]> {
    const res = await fetch(`${API_BASE}/pantry/match-recipes`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to match recipes');
    return res.json();
  },

  // Shopping List
  async getShoppingItems(): Promise<ShoppingItem[]> {
    const res = await fetch(`${API_BASE}/shopping`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch shopping items');
    return res.json();
  },

  async createShoppingItem(item: Partial<ShoppingItem>): Promise<ShoppingItem> {
    const res = await fetch(`${API_BASE}/shopping`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Failed to create shopping item');
    return res.json();
  },

  async updateShoppingItem(id: number, item: Partial<ShoppingItem>): Promise<ShoppingItem> {
    const res = await fetch(`${API_BASE}/shopping/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Failed to update shopping item');
    return res.json();
  },

  async deleteShoppingItem(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/shopping/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete shopping item');
  },

  async addRecipeToShopping(recipeId: number, ingredients: any[]): Promise<ShoppingItem[]> {
    const res = await fetch(`${API_BASE}/shopping/add-from-recipe`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ recipe_id: recipeId, ingredients }),
    });
    if (!res.ok) throw new Error('Failed to add ingredients to shopping');
    return res.json();
  },

  async clearCompletedShopping(): Promise<void> {
    const res = await fetch(`${API_BASE}/shopping/clear-completed`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to clear completed items');
  },

  async clearAllShopping(): Promise<void> {
    const res = await fetch(`${API_BASE}/shopping/clear-all`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to clear all items');
  },

  // Gemini AI
  async importRecipeWithGemini(data: { url?: string; raw_text?: string; target_language?: string }): Promise<Partial<Recipe>> {
    const res = await fetch(`${API_BASE}/ai/import-recipe`, {
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

  async analyzePlantWithGemini(data: {
    plant_name?: string;
    image_base64?: string;
    image_url?: string;
    target_language?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/ai/analyze-plant`, {
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
    const res = await fetch(`${API_BASE}/ai/diagnose-plant-health`, {
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
    const res = await fetch(`${API_BASE}/ai/check-pet-food-safety`, {
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
    const res = await fetch(`${API_BASE}/ai/diagnose-pet-symptoms`, {
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
    const res = await fetch(`${API_BASE}/ai/status`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to get AI status');
    return res.json();
  },

  // Plants
  async getPlants(params?: {
    room?: string;
    thirsty_only?: boolean;
    pet_toxicity?: string;
    health_status?: string;
    query?: string;
  }): Promise<any[]> {
    const searchParams = new URLSearchParams();
    if (params?.room && params.room !== 'all') searchParams.append('room', params.room);
    if (params?.thirsty_only) searchParams.append('thirsty_only', 'true');
    if (params?.pet_toxicity && params.pet_toxicity !== 'all') searchParams.append('pet_toxicity', params.pet_toxicity);
    if (params?.health_status && params.health_status !== 'all') searchParams.append('health_status', params.health_status);
    if (params?.query) searchParams.append('query', params.query);

    const res = await fetch(`${API_BASE}/plants?${searchParams.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch plants');
    return res.json();
  },

  async getPlant(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/plants/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch plant');
    return res.json();
  },

  async createPlant(plant: any): Promise<any> {
    const res = await fetch(`${API_BASE}/plants`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(plant),
    });
    if (!res.ok) throw new Error('Failed to create plant');
    return res.json();
  },

  async updatePlant(id: number, plant: any): Promise<any> {
    const res = await fetch(`${API_BASE}/plants/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(plant),
    });
    if (!res.ok) throw new Error('Failed to update plant');
    return res.json();
  },

  async deletePlant(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/plants/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete plant');
  },

  async waterPlant(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/plants/${id}/water`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to water plant');
    return res.json();
  },

  async toggleWinterMode(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/plants/${id}/toggle-winter-mode`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to toggle winter mode');
    return res.json();
  },

  async toggleFavoritePlant(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/plants/${id}/toggle-favorite`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to toggle favorite');
    return res.json();
  },

  async createPlantTask(plantId: number, task: any): Promise<any> {
    const res = await fetch(`${API_BASE}/plants/${plantId}/tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(task),
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  },

  async completePlantTask(plantId: number, taskId: number): Promise<any> {
    const res = await fetch(`${API_BASE}/plants/${plantId}/complete-task/${taskId}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to complete task');
    return res.json();
  },

  async addPlantLogEntry(plantId: number, entry: any): Promise<any> {
    const res = await fetch(`${API_BASE}/plants/${plantId}/logs`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error('Failed to add log entry');
    return res.json();
  },

  async getPlantSitterSchedule(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/plants/plant-sitter`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to get plant sitter schedule');
    return res.json();
  },

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

    const res = await fetch(`${API_BASE}/pets?${query.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch pets');
    return res.json();
  },

  async getPet(id: number): Promise<Pet> {
    const res = await fetch(`${API_BASE}/pets/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch pet');
    return res.json();
  },

  async createPet(pet: any): Promise<Pet> {
    const res = await fetch(`${API_BASE}/pets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(pet),
    });
    if (!res.ok) throw new Error('Failed to create pet');
    return res.json();
  },

  async updatePet(id: number, pet: any): Promise<Pet> {
    const res = await fetch(`${API_BASE}/pets/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(pet),
    });
    if (!res.ok) throw new Error('Failed to update pet');
    return res.json();
  },

  async deletePet(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/pets/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete pet');
  },

  async feedPet(id: number): Promise<Pet> {
    const res = await fetch(`${API_BASE}/pets/${id}/feed`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to record feeding');
    return res.json();
  },

  async toggleFavoritePet(id: number): Promise<Pet> {
    const res = await fetch(`${API_BASE}/pets/${id}/toggle-favorite`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to toggle favorite');
    return res.json();
  },

  async addPetMedicalRecord(petId: number, record: any): Promise<PetMedicalRecord> {
    const res = await fetch(`${API_BASE}/pets/${petId}/medical`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(record),
    });
    if (!res.ok) throw new Error('Failed to add medical record');
    return res.json();
  },

  async addPetMedication(petId: number, med: any): Promise<PetMedication> {
    const res = await fetch(`${API_BASE}/pets/${petId}/medications`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(med),
    });
    if (!res.ok) throw new Error('Failed to add medication');
    return res.json();
  },

  async deletePetMedication(petId: number, medId: number): Promise<void> {
    const res = await fetch(`${API_BASE}/pets/${petId}/medications/${medId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete medication');
  },

  async addPetWeight(petId: number, weight: any): Promise<PetWeightLog> {
    const res = await fetch(`${API_BASE}/pets/${petId}/weight`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(weight),
    });
    if (!res.ok) throw new Error('Failed to add weight log');
    return res.json();
  },

  async createPetTask(petId: number, task: any): Promise<PetTask> {
    const res = await fetch(`${API_BASE}/pets/${petId}/tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(task),
    });
    if (!res.ok) throw new Error('Failed to create pet task');
    return res.json();
  },

  async completePetTask(petId: number, taskId: number): Promise<PetTask> {
    const res = await fetch(`${API_BASE}/pets/${petId}/complete-task/${taskId}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to complete task');
    return res.json();
  },

  async addPetLog(petId: number, log: any): Promise<PetLogEntry> {
    const res = await fetch(`${API_BASE}/pets/${petId}/logs`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(log),
    });
    if (!res.ok) throw new Error('Failed to add diary entry');
    return res.json();
  },

  async getPetSitterProfile(petId: number): Promise<PetSitterProfile> {
    const res = await fetch(`${API_BASE}/pets/${petId}/sitter-profile`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to get sitter profile');
    return res.json();
  },

  async getPetSosFlyer(petId: number): Promise<PetSosFlyer> {
    const res = await fetch(`${API_BASE}/pets/${petId}/sos-flyer`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to get SOS flyer');
    return res.json();
  },

  async addPetSupplyToShopping(petId: number, itemName: string, amount: number = 1, unit: string = 'balení'): Promise<any> {
    const query = new URLSearchParams({ item_name: itemName, amount: String(amount), unit });
    const res = await fetch(`${API_BASE}/pets/${petId}/add-supply-to-shopping?${query.toString()}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to add supply to shopping');
    return res.json();
  },

  // Users
  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/auth/users`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  // Chores & Household Tasks
  async getChores(params?: {
    room?: string;
    category?: string;
    frequency?: string;
    assignee_id?: number;
    is_appliance_maintenance?: boolean;
    search?: string;
  }): Promise<Chore[]> {
    const query = new URLSearchParams();
    if (params?.room) query.append('room', params.room);
    if (params?.category) query.append('category', params.category);
    if (params?.frequency) query.append('frequency', params.frequency);
    if (params?.assignee_id !== undefined) query.append('assignee_id', String(params.assignee_id));
    if (params?.is_appliance_maintenance !== undefined) query.append('is_appliance_maintenance', String(params.is_appliance_maintenance));
    if (params?.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE}/chores?${query.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch chores');
    return res.json();
  },

  async getChore(id: number): Promise<Chore> {
    const res = await fetch(`${API_BASE}/chores/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch chore');
    return res.json();
  },

  async createChore(data: ChoreCreateInput): Promise<Chore> {
    const res = await fetch(`${API_BASE}/chores`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create chore');
    return res.json();
  },

  async updateChore(id: number, data: ChoreUpdateInput): Promise<Chore> {
    const res = await fetch(`${API_BASE}/chores/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update chore');
    return res.json();
  },

  async deleteChore(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/chores/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete chore');
  },

  async completeChore(id: number, data?: ChoreCompleteInput): Promise<Chore> {
    const res = await fetch(`${API_BASE}/chores/${id}/complete`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data || {}),
    });
    if (!res.ok) throw new Error('Failed to complete chore');
    return res.json();
  },

  async reassignChore(id: number, newAssigneeId: number): Promise<Chore> {
    const res = await fetch(`${API_BASE}/chores/${id}/reassign`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ new_assignee_id: newAssigneeId }),
    });
    if (!res.ok) throw new Error('Failed to reassign chore');
    return res.json();
  },

  async getChoreLeaderboard(): Promise<LeaderboardMember[]> {
    const res = await fetch(`${API_BASE}/chores/leaderboard`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch leaderboard');
    return res.json();
  },

  async getPanicModeTasks(): Promise<Chore[]> {
    const res = await fetch(`${API_BASE}/chores/panic-mode-tasks`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch panic mode tasks');
    return res.json();
  },

  async getChoreRewards(): Promise<ChoreReward[]> {
    const res = await fetch(`${API_BASE}/chores/rewards`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch rewards');
    return res.json();
  },

  async createChoreReward(data: { title: string; description?: string; cost_points: number; icon?: string }): Promise<ChoreReward> {
    const res = await fetch(`${API_BASE}/chores/rewards`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create reward');
    return res.json();
  },

  async redeemChoreReward(rewardId: number): Promise<ChoreRedemption> {
    const res = await fetch(`${API_BASE}/chores/rewards/${rewardId}/redeem`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to redeem reward');
    }
    return res.json();
  },

  async addChoreSupplyToShopping(choreId: number, itemName?: string, amount: number = 1, unit: string = 'balení'): Promise<any> {
    const query = new URLSearchParams();
    if (itemName) query.append('item_name', itemName);
    query.append('amount', String(amount));
    query.append('unit', unit);

    const res = await fetch(`${API_BASE}/chores/${choreId}/add-supply-to-shopping?${query.toString()}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to add supply to shopping');
    return res.json();
  },

  // Finance & Budget
  async getFinanceSummary(month?: string): Promise<FinanceMonthlySummary> {
    const url = month ? `${API_BASE}/finance/summary?month=${encodeURIComponent(month)}` : `${API_BASE}/finance/summary`;
    const res = await fetch(url, { headers: getHeaders() });
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

    const res = await fetch(`${API_BASE}/finance/transactions?${searchParams.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
  },

  async createTransaction(data: TransactionCreate): Promise<Transaction> {
    const res = await fetch(`${API_BASE}/finance/transactions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create transaction');
    return res.json();
  },

  async updateTransaction(id: number, data: TransactionUpdate): Promise<Transaction> {
    const res = await fetch(`${API_BASE}/finance/transactions/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update transaction');
    return res.json();
  },

  async deleteTransaction(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/finance/transactions/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete transaction');
  },

  async getCategoryBudgets(): Promise<CategoryBudget[]> {
    const res = await fetch(`${API_BASE}/finance/budgets`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch category budgets');
    return res.json();
  },

  async setCategoryBudget(data: CategoryBudgetCreate): Promise<CategoryBudget> {
    const res = await fetch(`${API_BASE}/finance/budgets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to set category budget');
    return res.json();
  },

  async getDebtSettlement(month?: string): Promise<DebtSettlementResponse> {
    const url = month ? `${API_BASE}/finance/settlement?month=${encodeURIComponent(month)}` : `${API_BASE}/finance/settlement`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch debt settlement');
    return res.json();
  },

  async settleDebts(): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/finance/settle`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to settle debts');
    return res.json();
  },

  async getSubscriptions(): Promise<Subscription[]> {
    const res = await fetch(`${API_BASE}/finance/subscriptions`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch subscriptions');
    return res.json();
  },

  async createSubscription(data: SubscriptionCreate): Promise<Subscription> {
    const res = await fetch(`${API_BASE}/finance/subscriptions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create subscription');
    return res.json();
  },

  async updateSubscription(id: number, data: SubscriptionUpdate): Promise<Subscription> {
    const res = await fetch(`${API_BASE}/finance/subscriptions/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update subscription');
    return res.json();
  },

  async deleteSubscription(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/finance/subscriptions/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete subscription');
  },

  async getSavingsGoals(): Promise<SavingsGoal[]> {
    const res = await fetch(`${API_BASE}/finance/goals`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch savings goals');
    return res.json();
  },

  async createSavingsGoal(data: SavingsGoalCreate): Promise<SavingsGoal> {
    const res = await fetch(`${API_BASE}/finance/goals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create savings goal');
    return res.json();
  },

  async updateSavingsGoal(id: number, data: SavingsGoalUpdate): Promise<SavingsGoal> {
    const res = await fetch(`${API_BASE}/finance/goals/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update savings goal');
    return res.json();
  },

  async deleteSavingsGoal(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/finance/goals/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete savings goal');
  },

  async addSavingsToGoal(goalId: number, amount: number): Promise<SavingsGoal> {
    const res = await fetch(`${API_BASE}/finance/goals/${goalId}/add-savings`, {
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

    const res = await fetch(`${API_BASE}/finance/import/preview`, {
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
    const res = await fetch(`${API_BASE}/finance/import/confirm`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to confirm import');
    return res.json();
  },

  async scanFinanceReceipt(payload: { image_base64?: string; image_url?: string }): Promise<ReceiptScanResponse> {
    const res = await fetch(`${API_BASE}/finance/scan-receipt`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to scan receipt');
    return res.json();
  },

  async getUserFinanceProfile(): Promise<UserFinanceProfile> {
    const res = await fetch(`${API_BASE}/finance/profile`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch user finance profile');
    return res.json();
  },

  async updateUserFinanceProfile(data: { bank_account?: string; iban?: string }): Promise<UserFinanceProfile> {
    const res = await fetch(`${API_BASE}/finance/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update user finance profile');
    return res.json();
  },

  // Documents & Digital Archive
  async getDocuments(params?: {
    category?: string;
    status?: string;
    search?: string;
    vault_unlocked?: boolean;
    sort_by?: string;
    sort_order?: string;
  }): Promise<DocumentItem[]> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.vault_unlocked !== undefined) searchParams.append('vault_unlocked', String(params.vault_unlocked));
    if (params?.sort_by) searchParams.append('sort_by', params.sort_by);
    if (params?.sort_order) searchParams.append('sort_order', params.sort_order);

    const res = await fetch(`${API_BASE}/documents?${searchParams.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  },

  async getDocumentStats(): Promise<DocumentStats> {
    const res = await fetch(`${API_BASE}/documents/stats`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch document stats');
    return res.json();
  },

  async getDocument(id: number): Promise<DocumentItem> {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch document');
    return res.json();
  },

  async uploadDocumentFile(file: File, autoAnalyze: boolean = true): Promise<DocumentUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('auto_analyze', String(autoAnalyze));

    const res = await fetch(`${API_BASE}/documents/upload`, {
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
    const res = await fetch(`${API_BASE}/documents`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create document');
    return res.json();
  },

  async updateDocument(id: number, data: DocumentUpdate): Promise<DocumentItem> {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update document');
    return res.json();
  },

  async deleteDocument(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete document');
  },

  async verifyVaultPin(pin: string): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/documents/vault/verify`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ pin }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Nesprávný PIN');
    }
    return res.json();
  },

  async setVaultPin(newPin: string, oldPin?: string): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/documents/vault/pin`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ new_pin: newPin, old_pin: oldPin }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Chyba při změně PIN');
    }
    return res.json();
  },

  // ==========================================
  // VEHICLES & FLEET
  // ==========================================
  async getVehicles(params?: { query?: string; favorite_only?: boolean }): Promise<Vehicle[]> {
    const sp = new URLSearchParams();
    if (params?.query) sp.append('query', params.query);
    if (params?.favorite_only) sp.append('favorite_only', 'true');
    const qs = sp.toString() ? `?${sp.toString()}` : '';

    const res = await fetch(`${API_BASE}/vehicles${qs}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch vehicles');
    return res.json();
  },

  async getVehicleFleetStats(): Promise<VehicleFleetStats> {
    const res = await fetch(`${API_BASE}/vehicles/stats`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch vehicle fleet stats');
    return res.json();
  },

  async getVehicle(id: number): Promise<Vehicle> {
    const res = await fetch(`${API_BASE}/vehicles/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch vehicle');
    return res.json();
  },

  async createVehicle(data: VehicleCreate): Promise<Vehicle> {
    const res = await fetch(`${API_BASE}/vehicles`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create vehicle');
    return res.json();
  },

  async updateVehicle(id: number, data: VehicleUpdate): Promise<Vehicle> {
    const res = await fetch(`${API_BASE}/vehicles/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update vehicle');
    return res.json();
  },

  async deleteVehicle(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/vehicles/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete vehicle');
  },

  async updateVehicleMileage(id: number, mileage: number): Promise<Vehicle> {
    const res = await fetch(`${API_BASE}/vehicles/${id}/mileage`, {
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
    const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/refuelings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add refueling');
    return res.json();
  },

  async getVehicleRefuelings(vehicleId: number): Promise<VehicleRefueling[]> {
    const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/refuelings`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch refuelings');
    return res.json();
  },

  async deleteRefueling(vehicleId: number, refuelingId: number): Promise<void> {
    const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/refuelings/${refuelingId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete refueling');
  },

  async addServiceRecord(vehicleId: number, data: VehicleServiceRecordCreate): Promise<VehicleServiceRecord> {
    const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/services`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add service record');
    return res.json();
  },

  async getVehicleServiceRecords(vehicleId: number): Promise<VehicleServiceRecord[]> {
    const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/services`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch service records');
    return res.json();
  },

  async deleteServiceRecord(vehicleId: number, serviceId: number): Promise<void> {
    const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/services/${serviceId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete service record');
  }
};
