import {
  Recipe, ScaledRecipeResponse, PantryItem,
  RecipePantryMatch, ShoppingItem, User,
  Pet, PetMedicalRecord, PetMedication, PetWeightLog,
  PetTask, PetLogEntry, PetFoodSafetyResponse,
  PetSymptomResponse, PetSitterProfile, PetSosFlyer,
  Chore, ChoreCreateInput, ChoreUpdateInput, ChoreCompleteInput,
  ChoreReward, ChoreRedemption, LeaderboardMember
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
  }
};
