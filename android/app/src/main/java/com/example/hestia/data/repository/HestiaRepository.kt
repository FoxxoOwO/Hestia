package com.example.hestia.data.repository

import com.example.hestia.data.api.ApiClient
import com.example.hestia.data.api.HestiaApiService
import com.example.hestia.data.local.PreferencesManager
import com.example.hestia.data.models.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File

class HestiaRepository(
    val preferences: PreferencesManager
) {
    @Volatile
    private var cachedToken: String? = null

    @Volatile
    private var tokenLoaded = false

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    init {
        // Načtení tokenu z DataStore nesmí blokovat hlavní vlákno při startu aplikace.
        scope.launch {
            cachedToken = runCatching { preferences.authTokenFlow.first() }.getOrNull()
            tokenLoaded = true
        }
    }

    /** Synchronní čtení tokenu pro OkHttp – běží na jeho vlákně, ne na UI. */
    private fun currentToken(): String? {
        if (!tokenLoaded) {
            cachedToken = runCatching { runBlocking { preferences.authTokenFlow.first() } }.getOrNull()
            tokenLoaded = true
        }
        return cachedToken
    }

    private val apiClient = ApiClient(
        tokenProvider = { currentToken() },
        onUnauthorized = {
            // 401 = token vypršel; odhlásíme, aby se zobrazila přihlašovací obrazovka.
            cachedToken = null
            tokenLoaded = true
            scope.launch { runCatching { preferences.clearAuth() } }
        }
    )

    private val json = Json { ignoreUnknownKeys = true; isLenient = true }

    private suspend fun getService(): HestiaApiService {
        val serverUrl = preferences.serverUrlFlow.first()
        return apiClient.getService(serverUrl)
    }

    /** Aktuální adresa serveru – používá se pro přímé odkazy na soubory. */
    suspend fun serverUrl(): String = preferences.serverUrlFlow.first()

    // ---------------- HEALTH ----------------
    suspend fun checkHealth(url: String? = null): Result<HealthResponse> = runCatching {
        val service = if (url != null) apiClient.getService(url) else getService()
        service.checkHealth()
    }

    // ---------------- AUTH ----------------
    suspend fun login(username: String, password: String): Result<TokenResponse> = runCatching {
        val response = getService().login(LoginRequest(username, password))
        cachedToken = response.access_token
        tokenLoaded = true
        preferences.saveAuth(response.access_token, response.user)
        response
    }

    suspend fun getPublicMembers(): Result<List<PublicMember>> = runCatching {
        getService().getPublicMembers()
    }

    suspend fun getMe(): Result<User> = runCatching {
        val user = getService().getMe()
        cachedToken?.let { preferences.saveAuth(it, user) }
        user
    }

    suspend fun updateMe(body: UserUpdate): Result<User> = runCatching {
        val user = getService().updateMe(body)
        cachedToken?.let { preferences.saveAuth(it, user) }
        user
    }

    suspend fun getUsers(): Result<List<User>> = runCatching { getService().getUsers() }

    suspend fun createUser(body: UserCreate): Result<User> = runCatching {
        getService().createUser(body)
    }

    suspend fun updateUser(id: Int, body: UserUpdate): Result<User> = runCatching {
        getService().updateUser(id, body)
    }

    suspend fun deleteUser(id: Int): Result<SimpleMessageResponse> = runCatching {
        getService().deleteUser(id)
    }

    suspend fun logout() {
        cachedToken = null
        tokenLoaded = true
        preferences.clearAuth()
    }

    // ---------------- RECIPES ----------------
    suspend fun getRecipes(
        query: String? = null,
        difficulty: String? = null,
        priceLevel: String? = null,
        maxTime: Int? = null,
        tag: String? = null,
        favoriteOnly: Boolean? = null
    ): Result<List<Recipe>> = runCatching {
        getService().getRecipes(query, difficulty, priceLevel, maxTime, tag, favoriteOnly)
    }

    suspend fun getRecipe(id: Int): Result<Recipe> = runCatching { getService().getRecipe(id) }

    suspend fun createRecipe(body: RecipeCreate): Result<Recipe> = runCatching {
        getService().createRecipe(body)
    }

    suspend fun updateRecipe(id: Int, body: RecipeUpdate): Result<Recipe> = runCatching {
        getService().updateRecipe(id, body)
    }

    suspend fun deleteRecipe(id: Int): Result<SimpleMessageResponse> = runCatching {
        getService().deleteRecipe(id)
    }

    suspend fun toggleRecipeFavorite(id: Int): Result<Recipe> = runCatching {
        getService().toggleRecipeFavorite(id)
    }

    suspend fun scaleRecipe(id: Int, servings: Int): Result<ScaledRecipeResponse> = runCatching {
        getService().scaleRecipe(id, servings)
    }

    // ---------------- PANTRY ----------------
    suspend fun getPantryItems(
        category: String? = null,
        status: String? = null,
        query: String? = null
    ): Result<List<PantryItem>> = runCatching {
        getService().getPantryItems(category, status, query)
    }

    suspend fun createPantryItem(body: PantryItemCreate): Result<PantryItem> = runCatching {
        getService().createPantryItem(body)
    }

    suspend fun updatePantryItem(id: Int, body: PantryItemUpdate): Result<PantryItem> = runCatching {
        getService().updatePantryItem(id, body)
    }

    suspend fun deletePantryItem(id: Int): Result<SimpleMessageResponse> = runCatching {
        getService().deletePantryItem(id)
    }

    suspend fun getRecipePantryMatches(): Result<List<RecipePantryMatch>> = runCatching {
        getService().getRecipePantryMatches()
    }

    // ---------------- SHOPPING ----------------
    suspend fun getShoppingItems(): Result<List<ShoppingItem>> = runCatching {
        getService().getShoppingItems()
    }

    suspend fun createShoppingItem(body: ShoppingItemCreate): Result<ShoppingItem> = runCatching {
        getService().createShoppingItem(body)
    }

    suspend fun updateShoppingItem(id: Int, body: ShoppingItemUpdate): Result<ShoppingItem> = runCatching {
        getService().updateShoppingItem(id, body)
    }

    suspend fun deleteShoppingItem(id: Int): Result<SimpleMessageResponse> = runCatching {
        getService().deleteShoppingItem(id)
    }

    suspend fun addRecipeToShopping(recipeId: Int, ingredients: List<AddFromRecipeIngredient>): Result<List<ShoppingItem>> = runCatching {
        getService().addRecipeToShopping(AddRecipeToShoppingRequest(recipeId, ingredients))
    }

    suspend fun clearCompletedShopping(): Result<SimpleMessageResponse> = runCatching {
        getService().clearCompletedShopping()
    }

    suspend fun clearAllShopping(): Result<SimpleMessageResponse> = runCatching {
        getService().clearAllShopping()
    }

    // ---------------- MEAL PLANS ----------------
    suspend fun getMealPlans(startDate: String? = null, endDate: String? = null): Result<List<MealPlanItem>> = runCatching {
        getService().getMealPlans(startDate, endDate)
    }

    suspend fun createMealPlanItem(body: MealPlanItemCreate): Result<MealPlanItem> = runCatching {
        getService().createMealPlanItem(body)
    }

    suspend fun updateMealPlanItem(id: Int, body: MealPlanItemUpdate): Result<MealPlanItem> = runCatching {
        getService().updateMealPlanItem(id, body)
    }

    suspend fun deleteMealPlanItem(id: Int): Result<Unit> = runCatching {
        getService().deleteMealPlanItem(id)
    }

    suspend fun toggleMealPlanCooked(id: Int): Result<MealPlanItem> = runCatching {
        getService().toggleMealPlanCooked(id)
    }

    suspend fun generateShoppingFromMealPlan(startDate: String, endDate: String, checkPantry: Boolean = true): Result<GenerateShoppingResponse> = runCatching {
        getService().generateShoppingFromMealPlan(GenerateShoppingRequest(startDate, endDate, checkPantry))
    }

    // ---------------- CHORES ----------------
    suspend fun getChores(
        room: String? = null,
        category: String? = null,
        frequency: String? = null,
        assigneeId: Int? = null,
        isApplianceMaintenance: Boolean? = null,
        search: String? = null
    ): Result<List<Chore>> = runCatching {
        getService().getChores(room, category, frequency, assigneeId, isApplianceMaintenance, search)
    }

    suspend fun getChore(id: Int): Result<Chore> = runCatching { getService().getChore(id) }

    suspend fun createChore(body: ChoreCreate): Result<Chore> = runCatching {
        getService().createChore(body)
    }

    suspend fun updateChore(id: Int, body: ChoreUpdate): Result<Chore> = runCatching {
        getService().updateChore(id, body)
    }

    suspend fun deleteChore(id: Int): Result<SimpleMessageResponse> = runCatching {
        getService().deleteChore(id)
    }

    suspend fun completeChore(id: Int, notes: String? = null, customPoints: Int? = null): Result<Chore> = runCatching {
        getService().completeChore(id, ChoreCompleteRequest(notes, customPoints))
    }

    suspend fun reassignChore(id: Int, newAssigneeId: Int): Result<Chore> = runCatching {
        getService().reassignChore(id, ChoreReassignRequest(newAssigneeId))
    }

    suspend fun getLeaderboard(): Result<List<LeaderboardMember>> = runCatching {
        getService().getLeaderboard()
    }

    suspend fun getPanicModeTasks(): Result<List<Chore>> = runCatching {
        getService().getPanicModeTasks()
    }

    suspend fun getChoreRewards(): Result<List<ChoreRewardItem>> = runCatching {
        getService().getChoreRewards()
    }

    suspend fun createChoreReward(body: ChoreRewardCreate): Result<ChoreRewardItem> = runCatching {
        getService().createChoreReward(body)
    }

    suspend fun redeemChoreReward(id: Int): Result<ChoreRedemption> = runCatching {
        getService().redeemChoreReward(id)
    }

    suspend fun addChoreSupplyToShopping(choreId: Int, itemName: String?, amount: Double = 1.0, unit: String = "balení"): Result<SimpleMessageResponse> = runCatching {
        getService().addChoreSupplyToShopping(choreId, itemName, amount, unit)
    }

    // ---------------- PLANTS ----------------
    suspend fun getPlants(
        room: String? = null,
        needsWatering: Boolean? = null,
        petToxicity: String? = null,
        query: String? = null
    ): Result<List<Plant>> = runCatching {
        getService().getPlants(room, needsWatering, petToxicity, query)
    }

    suspend fun getPlant(id: Int): Result<Plant> = runCatching { getService().getPlant(id) }

    suspend fun createPlant(body: PlantCreate): Result<Plant> = runCatching {
        getService().createPlant(body)
    }

    suspend fun updatePlant(id: Int, body: PlantUpdate): Result<Plant> = runCatching {
        getService().updatePlant(id, body)
    }

    suspend fun deletePlant(id: Int): Result<SimpleMessageResponse> = runCatching {
        getService().deletePlant(id)
    }

    suspend fun waterPlant(id: Int): Result<Plant> = runCatching { getService().waterPlant(id) }

    suspend fun togglePlantWinterMode(id: Int): Result<Plant> = runCatching {
        getService().togglePlantWinterMode(id)
    }

    suspend fun togglePlantFavorite(id: Int): Result<Plant> = runCatching {
        getService().togglePlantFavorite(id)
    }

    suspend fun addPlantTask(plantId: Int, body: PlantTaskCreate): Result<PlantTask> = runCatching {
        getService().addPlantTask(plantId, body)
    }

    suspend fun completePlantTask(plantId: Int, taskId: Int): Result<PlantTask> = runCatching {
        getService().completePlantTask(plantId, taskId)
    }

    suspend fun addPlantLog(plantId: Int, body: PlantLogEntryCreate): Result<PlantLogEntry> = runCatching {
        getService().addPlantLog(plantId, body)
    }

    suspend fun getPlantSitterSchedule(): Result<List<PlantSitterItem>> = runCatching {
        getService().getPlantSitterSchedule()
    }

    suspend fun aiAnalyzePlant(body: PlantAiRequest): Result<PlantAiExtracted> = runCatching {
        getService().aiAnalyzePlant(body)
    }

    suspend fun aiDiagnosePlant(body: PlantDiagnosisRequest): Result<PlantDiagnosisResponse> = runCatching {
        getService().aiDiagnosePlant(body)
    }

    // ---------------- PETS ----------------
    suspend fun getPets(species: String? = null, favoriteOnly: Boolean? = null, query: String? = null): Result<List<Pet>> = runCatching {
        getService().getPets(species, favoriteOnly, query)
    }

    suspend fun getPet(id: Int): Result<Pet> = runCatching { getService().getPet(id) }

    suspend fun createPet(body: PetCreate): Result<Pet> = runCatching { getService().createPet(body) }

    suspend fun updatePet(id: Int, body: PetUpdate): Result<Pet> = runCatching {
        getService().updatePet(id, body)
    }

    suspend fun deletePet(id: Int): Result<SimpleMessageResponse> = runCatching {
        getService().deletePet(id)
    }

    suspend fun feedPet(id: Int): Result<Pet> = runCatching { getService().feedPet(id) }

    suspend fun togglePetFavorite(id: Int): Result<Pet> = runCatching {
        getService().togglePetFavorite(id)
    }

    suspend fun addPetMedicalRecord(petId: Int, body: PetMedicalRecordCreate): Result<PetMedicalRecord> = runCatching {
        getService().addPetMedicalRecord(petId, body)
    }

    suspend fun addPetMedication(petId: Int, body: PetMedicationCreate): Result<PetMedication> = runCatching {
        getService().addPetMedication(petId, body)
    }

    suspend fun deletePetMedication(petId: Int, medId: Int): Result<SimpleMessageResponse> = runCatching {
        getService().deletePetMedication(petId, medId)
    }

    suspend fun addPetWeight(petId: Int, body: PetWeightLogCreate): Result<PetWeightLog> = runCatching {
        getService().addPetWeight(petId, body)
    }

    suspend fun addPetTask(petId: Int, body: PetTaskCreate): Result<PetTask> = runCatching {
        getService().addPetTask(petId, body)
    }

    suspend fun completePetTask(petId: Int, taskId: Int): Result<PetTask> = runCatching {
        getService().completePetTask(petId, taskId)
    }

    suspend fun addPetLog(petId: Int, body: PetLogEntryCreate): Result<PetLogEntry> = runCatching {
        getService().addPetLog(petId, body)
    }

    suspend fun getPetSitterProfile(petId: Int): Result<PetSitterProfile> = runCatching {
        getService().getPetSitterProfile(petId)
    }

    suspend fun getPetSosFlyer(petId: Int): Result<PetSosFlyer> = runCatching {
        getService().getPetSosFlyer(petId)
    }

    suspend fun addPetSupplyToShopping(petId: Int, itemName: String?, amount: Double = 1.0, unit: String = "ks"): Result<SimpleMessageResponse> = runCatching {
        getService().addPetSupplyToShopping(petId, itemName, amount, unit)
    }

    suspend fun checkPetFoodSafety(body: PetFoodSafetyRequest): Result<PetFoodSafetyResponse> = runCatching {
        getService().checkPetFoodSafety(body)
    }

    suspend fun diagnosePetSymptoms(body: PetSymptomRequest): Result<PetSymptomResponse> = runCatching {
        getService().diagnosePetSymptoms(body)
    }

    // ---------------- MEDICINES ----------------
    suspend fun getMedicines(
        category: String? = null,
        location: String? = null,
        query: String? = null,
        statusFilter: String? = null,
        lowStock: Boolean? = null,
        assignedUserId: Int? = null
    ): Result<List<Medicine>> = runCatching {
        getService().getMedicines(category, location, query, statusFilter, lowStock, assignedUserId)
    }

    suspend fun getMedicine(id: Int): Result<Medicine> = runCatching { getService().getMedicine(id) }

    suspend fun createMedicine(body: MedicineCreate): Result<Medicine> = runCatching {
        getService().createMedicine(body)
    }

    suspend fun updateMedicine(id: Int, body: MedicineUpdate): Result<Medicine> = runCatching {
        getService().updateMedicine(id, body)
    }

    suspend fun deleteMedicine(id: Int): Result<Unit> = runCatching { getService().deleteMedicine(id) }

    suspend fun getMedicineStats(): Result<MedicineStats> = runCatching {
        getService().getMedicineStats()
    }

    suspend fun markMedicineOpened(id: Int, openedDate: String? = null): Result<Medicine> = runCatching {
        getService().markMedicineOpened(id, openedDate)
    }

    suspend fun adjustMedicineStock(id: Int, delta: Double): Result<Medicine> = runCatching {
        getService().adjustMedicineStock(id, delta)
    }

    suspend fun addMedicineToShopping(id: Int): Result<SimpleMessageResponse> = runCatching {
        getService().addMedicineToShopping(id)
    }

    suspend fun getMedicationSchedules(userId: Int? = null, activeOnly: Boolean? = null): Result<List<MedicationSchedule>> = runCatching {
        getService().getMedicationSchedules(userId, activeOnly)
    }

    suspend fun createMedicationSchedule(body: MedicationScheduleCreate): Result<MedicationSchedule> = runCatching {
        getService().createMedicationSchedule(body)
    }

    suspend fun updateMedicationSchedule(id: Int, body: MedicationScheduleUpdate): Result<MedicationSchedule> = runCatching {
        getService().updateMedicationSchedule(id, body)
    }

    suspend fun deleteMedicationSchedule(id: Int): Result<Unit> = runCatching {
        getService().deleteMedicationSchedule(id)
    }

    suspend fun getMedicationLogs(medicineId: Int? = null, userId: Int? = null, limit: Int = 100): Result<List<MedicationLog>> = runCatching {
        getService().getMedicationLogs(medicineId, userId, limit)
    }

    suspend fun createMedicationLog(body: MedicationLogCreate): Result<MedicationLog> = runCatching {
        getService().createMedicationLog(body)
    }

    suspend fun takeMedicineDose(medicineId: Int, userId: Int, dose: String? = null, timeSlot: String? = null): Result<MedicationLog> = runCatching {
        getService().createMedicationLog(
            MedicationLogCreate(
                medicine_id = medicineId,
                user_id = userId,
                dose_taken = dose,
                time_slot = timeSlot,
                status = "taken",
                decrement_stock = true
            )
        )
    }

    suspend fun getFirstAidGuides(): Result<List<FirstAidGuide>> = runCatching {
        getService().getFirstAidGuides()
    }

    suspend fun getPediatricDosage(weightKg: Double, drug: String): Result<PediatricDosage> = runCatching {
        getService().getPediatricDosage(weightKg, drug)
    }

    // ---------------- FINANCE ----------------
    suspend fun getFinanceSummary(month: String? = null): Result<FinanceSummary> = runCatching {
        getService().getFinanceSummary(month)
    }

    suspend fun getTransactions(month: String? = null, category: String? = null, transactionType: String? = null, limit: Int = 200): Result<List<TransactionItem>> = runCatching {
        getService().getTransactions(month, category, transactionType, limit)
    }

    suspend fun createTransaction(body: TransactionCreate): Result<TransactionItem> = runCatching {
        getService().createTransaction(body)
    }

    suspend fun updateTransaction(id: Int, body: TransactionUpdate): Result<TransactionItem> = runCatching {
        getService().updateTransaction(id, body)
    }

    suspend fun deleteTransaction(id: Int): Result<SimpleMessageResponse> = runCatching {
        getService().deleteTransaction(id)
    }

    suspend fun getBudgets(): Result<List<CategoryBudget>> = runCatching {
        getService().getBudgets()
    }

    suspend fun createBudget(body: CategoryBudgetCreate): Result<CategoryBudget> = runCatching {
        getService().createBudget(body)
    }

    suspend fun getDebtSettlements(): Result<DebtSettlementResponse> = runCatching {
        getService().getDebtSettlements()
    }

    suspend fun settleDebt(fromUserId: Int, toUserId: Int, amount: Double, note: String? = null): Result<SimpleMessageResponse> = runCatching {
        getService().settleDebt(SettleRequest(fromUserId, toUserId, amount, note))
    }

    suspend fun getSubscriptions(): Result<List<Subscription>> = runCatching {
        getService().getSubscriptions()
    }

    suspend fun createSubscription(body: SubscriptionCreate): Result<Subscription> = runCatching {
        getService().createSubscription(body)
    }

    suspend fun updateSubscription(id: Int, body: SubscriptionUpdate): Result<Subscription> = runCatching {
        getService().updateSubscription(id, body)
    }

    suspend fun deleteSubscription(id: Int): Result<SimpleMessageResponse> = runCatching {
        getService().deleteSubscription(id)
    }

    suspend fun getSavingsGoals(): Result<List<SavingsGoal>> = runCatching {
        getService().getSavingsGoals()
    }

    suspend fun createSavingsGoal(body: SavingsGoalCreate): Result<SavingsGoal> = runCatching {
        getService().createSavingsGoal(body)
    }

    suspend fun updateSavingsGoal(id: Int, body: SavingsGoalUpdate): Result<SavingsGoal> = runCatching {
        getService().updateSavingsGoal(id, body)
    }

    suspend fun addSavingsDeposit(id: Int, amount: Double): Result<SavingsGoal> = runCatching {
        getService().addSavingsDeposit(id, SavingsGoalDeposit(amount))
    }

    suspend fun deleteSavingsGoal(id: Int): Result<SimpleMessageResponse> = runCatching {
        getService().deleteSavingsGoal(id)
    }

    suspend fun previewCsvImport(csvContent: String): Result<CsvImportPreview> = runCatching {
        val part = MultipartBody.Part.createFormData(
            "file",
            "import.csv",
            csvContent.toByteArray().toRequestBody("text/csv".toMediaTypeOrNull())
        )
        getService().previewCsvImport(part)
    }

    suspend fun confirmCsvImport(rows: List<CsvImportRow>, payerId: Int, isShared: Boolean): Result<SimpleMessageResponse> = runCatching {
        getService().confirmCsvImport(CsvImportConfirm(rows, payerId, isShared))
    }

    suspend fun scanReceipt(imageBase64: String): Result<ReceiptScanResponse> = runCatching {
        getService().scanReceipt(ReceiptScanRequest(image_base64 = imageBase64))
    }

    suspend fun getFinanceProfile(): Result<UserFinanceProfile> = runCatching {
        getService().getFinanceProfile()
    }

    suspend fun updateFinanceProfile(body: UserFinanceProfileUpdate): Result<UserFinanceProfile> = runCatching {
        getService().updateFinanceProfile(body)
    }

    // ---------------- DOCUMENTS ----------------
    suspend fun getDocuments(
        category: String? = null,
        status: String? = null,
        query: String? = null,
        vaultUnlocked: Boolean? = null
    ): Result<List<DocumentItem>> = runCatching {
        getService().getDocuments(category, status, query, vaultUnlocked)
    }

    suspend fun getDocument(id: Int): Result<DocumentItem> = runCatching {
        getService().getDocument(id)
    }

    suspend fun uploadDocument(bytes: ByteArray, filename: String, mimeType: String, autoAnalyze: Boolean = true): Result<DocumentUploadResult> = runCatching {
        val body = bytes.toRequestBody(mimeType.toMediaTypeOrNull())
        val part = MultipartBody.Part.createFormData("file", filename, body)
        val auto = autoAnalyze.toString().toRequestBody("text/plain".toMediaTypeOrNull())
        getService().uploadDocument(part, auto)
    }

    suspend fun createDocument(body: DocumentCreate): Result<DocumentItem> = runCatching {
        getService().createDocument(body)
    }

    suspend fun updateDocument(id: Int, body: DocumentUpdate): Result<DocumentItem> = runCatching {
        getService().updateDocument(id, body)
    }

    suspend fun deleteDocument(id: Int): Result<SimpleMessageResponse> = runCatching {
        getService().deleteDocument(id)
    }

    suspend fun getDocumentStats(): Result<DocumentStats> = runCatching {
        getService().getDocumentStats()
    }

    suspend fun verifyVaultPin(pin: String): Result<VaultVerifyResponse> = runCatching {
        getService().verifyVaultPin(VaultVerifyRequest(pin))
    }

    suspend fun setVaultPin(oldPin: String?, newPin: String): Result<SimpleMessageResponse> = runCatching {
        getService().setVaultPin(VaultSetPinRequest(oldPin, newPin))
    }

    // ---------------- VEHICLES ----------------
    suspend fun getVehicles(query: String? = null, favoriteOnly: Boolean? = null): Result<List<Vehicle>> = runCatching {
        getService().getVehicles(query, favoriteOnly)
    }

    suspend fun getVehicleStats(): Result<VehicleFleetStats> = runCatching {
        getService().getVehicleStats()
    }

    suspend fun getVehicle(id: Int): Result<Vehicle> = runCatching { getService().getVehicle(id) }

    suspend fun createVehicle(body: VehicleCreate): Result<Vehicle> = runCatching {
        getService().createVehicle(body)
    }

    suspend fun updateVehicle(id: Int, body: VehicleUpdate): Result<Vehicle> = runCatching {
        getService().updateVehicle(id, body)
    }

    suspend fun deleteVehicle(id: Int): Result<SimpleMessageResponse> = runCatching {
        getService().deleteVehicle(id)
    }

    suspend fun updateVehicleMileage(id: Int, mileage: Int): Result<Vehicle> = runCatching {
        getService().updateVehicleMileage(id, MileageUpdate(mileage))
    }

    suspend fun addRefueling(vehicleId: Int, body: VehicleRefuelingCreate): Result<VehicleRefueling> = runCatching {
        getService().addRefueling(vehicleId, body)
    }

    suspend fun getRefuelings(vehicleId: Int): Result<List<VehicleRefueling>> = runCatching {
        getService().getRefuelings(vehicleId)
    }

    suspend fun deleteRefueling(vehicleId: Int, refuelingId: Int): Result<SimpleMessageResponse> = runCatching {
        getService().deleteRefueling(vehicleId, refuelingId)
    }

    suspend fun addServiceRecord(vehicleId: Int, body: VehicleServiceRecordCreate): Result<VehicleServiceRecord> = runCatching {
        getService().addServiceRecord(vehicleId, body)
    }

    suspend fun getServiceRecords(vehicleId: Int): Result<List<VehicleServiceRecord>> = runCatching {
        getService().getServiceRecords(vehicleId)
    }

    suspend fun deleteServiceRecord(vehicleId: Int, serviceId: Int): Result<SimpleMessageResponse> = runCatching {
        getService().deleteServiceRecord(vehicleId, serviceId)
    }

    // ---------------- ASSETS ----------------
    suspend fun getAssets(
        category: String? = null,
        room: String? = null,
        status: String? = null,
        query: String? = null,
        warrantyStatus: String? = null
    ): Result<List<Asset>> = runCatching {
        getService().getAssets(category, room, status, query, warrantyStatus)
    }

    suspend fun getAssetStats(): Result<AssetStats> = runCatching { getService().getAssetStats() }

    suspend fun getAsset(id: Int): Result<Asset> = runCatching { getService().getAsset(id) }

    suspend fun createAsset(body: AssetCreate): Result<Asset> = runCatching {
        getService().createAsset(body)
    }

    suspend fun updateAsset(id: Int, body: AssetUpdate): Result<Asset> = runCatching {
        getService().updateAsset(id, body)
    }

    suspend fun deleteAsset(id: Int): Result<Unit> = runCatching { getService().deleteAsset(id) }

    suspend fun uploadAssetFile(id: Int, bytes: ByteArray, filename: String, mimeType: String, fileType: String): Result<AssetUploadResult> = runCatching {
        val part = MultipartBody.Part.createFormData("file", filename, bytes.toRequestBody(mimeType.toMediaTypeOrNull()))
        getService().uploadAssetFile(id, fileType, part)
    }

    // ---------------- ACTIVITIES ----------------
    suspend fun getActivities(
        limit: Int = 50,
        offset: Int = 0,
        module: String? = null,
        userId: Int? = null,
        actionType: String? = null,
        search: String? = null
    ): Result<ActivityListResponse> = runCatching {
        getService().getActivities(limit, offset, module, userId, actionType, search)
    }

    suspend fun getActivityStats(): Result<ActivityStats> = runCatching {
        getService().getActivityStats()
    }

    suspend fun clearActivities(olderThanDays: Int? = null): Result<SimpleMessageResponse> = runCatching {
        getService().clearActivities(olderThanDays)
    }

    // ---------------- SYSTEM ----------------
    suspend fun getBackups(): Result<List<BackupItem>> = runCatching { getService().getBackups() }

    suspend fun createBackup(note: String? = null): Result<SimpleMessageResponse> = runCatching {
        val body = if (note.isNullOrBlank()) emptyMap() else mapOf("note" to note)
        getService().createBackup(body)
    }

    suspend fun downloadBackup(filename: String, target: File): Result<File> = runCatching {
        withContext(Dispatchers.IO) {
            val body = getService().downloadBackup(filename)
            target.outputStream().use { out -> body.byteStream().use { it.copyTo(out) } }
            target
        }
    }

    suspend fun restoreBackup(filename: String): Result<BackupRestoreResult> = runCatching {
        getService().restoreBackup(filename)
    }

    suspend fun deleteBackup(filename: String): Result<SimpleMessageResponse> = runCatching {
        getService().deleteBackup(filename)
    }

    suspend fun exportData(target: File): Result<File> = runCatching {
        withContext(Dispatchers.IO) {
            val body = getService().exportData()
            target.outputStream().use { out -> body.byteStream().use { it.copyTo(out) } }
            target
        }
    }

    suspend fun importData(bytes: ByteArray, filename: String, mode: String = "merge"): Result<SimpleMessageResponse> = runCatching {
        val part = MultipartBody.Part.createFormData("file", filename, bytes.toRequestBody("application/json".toMediaTypeOrNull()))
        val modeBody = mode.toRequestBody("text/plain".toMediaTypeOrNull())
        getService().importData(part, modeBody)
    }

    suspend fun resetAllData(password: String? = null): Result<SimpleMessageResponse> = runCatching {
        val body = mutableMapOf("confirmation" to "SMAZAT")
        if (!password.isNullOrBlank()) body["password"] = password
        getService().resetAllData(body)
    }

    // ---------------- AI ----------------
    suspend fun getAiStatus(): Result<AiStatus> = runCatching { getService().getAiStatus() }

    suspend fun aiImportRecipe(url: String? = null, rawText: String? = null, targetLanguage: String = "cs"): Result<GeminiExtractedRecipe> = runCatching {
        getService().aiImportRecipe(AiRecipeImportRequest(url, rawText, targetLanguage))
    }

    suspend fun aiImportRecipeFile(filename: String, base64: String, targetLanguage: String = "cs"): Result<RecipeFileImportResponse> = runCatching {
        getService().aiImportRecipeBase64(GeminiBase64FileImportRequest(filename, base64, targetLanguage))
    }
}
