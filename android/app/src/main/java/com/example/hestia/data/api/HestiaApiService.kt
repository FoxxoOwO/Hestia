package com.example.hestia.data.api

import com.example.hestia.data.models.*
import okhttp3.MultipartBody
import okhttp3.RequestBody
import okhttp3.ResponseBody
import retrofit2.http.*

interface HestiaApiService {

    // ---------- HEALTH ----------
    @GET("api/health")
    suspend fun checkHealth(): HealthResponse

    // ---------- AUTH & USERS ----------
    @POST("api/v1/auth/login")
    suspend fun login(@Body body: LoginRequest): TokenResponse

    @GET("api/v1/auth/public-members")
    suspend fun getPublicMembers(): List<PublicMember>

    @GET("api/v1/auth/me")
    suspend fun getMe(): User

    @PUT("api/v1/auth/me")
    suspend fun updateMe(@Body body: UserUpdate): User

    @GET("api/v1/auth/users")
    suspend fun getUsers(): List<User>

    @POST("api/v1/auth/users")
    suspend fun createUser(@Body body: UserCreate): User

    @PUT("api/v1/auth/users/{userId}")
    suspend fun updateUser(@Path("userId") userId: Int, @Body body: UserUpdate): User

    @DELETE("api/v1/auth/users/{userId}")
    suspend fun deleteUser(@Path("userId") userId: Int): SimpleMessageResponse

    // ---------- RECIPES ----------
    @GET("api/v1/recipes")
    suspend fun getRecipes(
        @Query("query") query: String? = null,
        @Query("difficulty") difficulty: String? = null,
        @Query("price_level") priceLevel: String? = null,
        @Query("max_time") maxTime: Int? = null,
        @Query("tag") tag: String? = null,
        @Query("favorite_only") favoriteOnly: Boolean? = null
    ): List<Recipe>

    @GET("api/v1/recipes/{id}")
    suspend fun getRecipe(@Path("id") id: Int): Recipe

    @POST("api/v1/recipes")
    suspend fun createRecipe(@Body body: RecipeCreate): Recipe

    @PUT("api/v1/recipes/{id}")
    suspend fun updateRecipe(@Path("id") id: Int, @Body body: RecipeUpdate): Recipe

    @DELETE("api/v1/recipes/{id}")
    suspend fun deleteRecipe(@Path("id") id: Int): SimpleMessageResponse

    @POST("api/v1/recipes/{id}/toggle-favorite")
    suspend fun toggleRecipeFavorite(@Path("id") id: Int): Recipe

    @GET("api/v1/recipes/{id}/scale")
    suspend fun scaleRecipe(@Path("id") id: Int, @Query("servings") servings: Int): ScaledRecipeResponse

    // ---------- PANTRY ----------
    @GET("api/v1/pantry")
    suspend fun getPantryItems(
        @Query("category") category: String? = null,
        @Query("status_filter") status: String? = null,
        @Query("query") query: String? = null
    ): List<PantryItem>

    @POST("api/v1/pantry")
    suspend fun createPantryItem(@Body body: PantryItemCreate): PantryItem

    @PUT("api/v1/pantry/{id}")
    suspend fun updatePantryItem(@Path("id") id: Int, @Body body: PantryItemUpdate): PantryItem

    @DELETE("api/v1/pantry/{id}")
    suspend fun deletePantryItem(@Path("id") id: Int): SimpleMessageResponse

    @GET("api/v1/pantry/match-recipes")
    suspend fun getRecipePantryMatches(): List<RecipePantryMatch>

    // ---------- SHOPPING ----------
    @GET("api/v1/shopping")
    suspend fun getShoppingItems(): List<ShoppingItem>

    @POST("api/v1/shopping")
    suspend fun createShoppingItem(@Body body: ShoppingItemCreate): ShoppingItem

    @PUT("api/v1/shopping/{id}")
    suspend fun updateShoppingItem(@Path("id") id: Int, @Body body: ShoppingItemUpdate): ShoppingItem

    @DELETE("api/v1/shopping/{id}")
    suspend fun deleteShoppingItem(@Path("id") id: Int): SimpleMessageResponse

    @POST("api/v1/shopping/add-from-recipe")
    suspend fun addRecipeToShopping(@Body body: AddRecipeToShoppingRequest): List<ShoppingItem>

    @POST("api/v1/shopping/clear-completed")
    suspend fun clearCompletedShopping(): SimpleMessageResponse

    @POST("api/v1/shopping/clear-all")
    suspend fun clearAllShopping(): SimpleMessageResponse

    // ---------- MEAL PLANS ----------
    @GET("api/v1/meal-plans")
    suspend fun getMealPlans(
        @Query("start_date") startDate: String? = null,
        @Query("end_date") endDate: String? = null
    ): List<MealPlanItem>

    @POST("api/v1/meal-plans")
    suspend fun createMealPlanItem(@Body body: MealPlanItemCreate): MealPlanItem

    @PUT("api/v1/meal-plans/{id}")
    suspend fun updateMealPlanItem(@Path("id") id: Int, @Body body: MealPlanItemUpdate): MealPlanItem

    @DELETE("api/v1/meal-plans/{id}")
    suspend fun deleteMealPlanItem(@Path("id") id: Int): Unit

    @POST("api/v1/meal-plans/{id}/toggle-cooked")
    suspend fun toggleMealPlanCooked(@Path("id") id: Int): MealPlanItem

    @POST("api/v1/meal-plans/generate-shopping")
    suspend fun generateShoppingFromMealPlan(@Body body: GenerateShoppingRequest): GenerateShoppingResponse

    // ---------- CHORES ----------
    @GET("api/v1/chores")
    suspend fun getChores(
        @Query("room") room: String? = null,
        @Query("category") category: String? = null,
        @Query("frequency") frequency: String? = null,
        @Query("assignee_id") assigneeId: Int? = null,
        @Query("is_appliance_maintenance") isApplianceMaintenance: Boolean? = null,
        @Query("search") search: String? = null
    ): List<Chore>

    @GET("api/v1/chores/{id}")
    suspend fun getChore(@Path("id") id: Int): Chore

    @POST("api/v1/chores")
    suspend fun createChore(@Body body: ChoreCreate): Chore

    @PUT("api/v1/chores/{id}")
    suspend fun updateChore(@Path("id") id: Int, @Body body: ChoreUpdate): Chore

    @DELETE("api/v1/chores/{id}")
    suspend fun deleteChore(@Path("id") id: Int): SimpleMessageResponse

    @POST("api/v1/chores/{id}/complete")
    suspend fun completeChore(
        @Path("id") id: Int,
        @Body body: ChoreCompleteRequest = ChoreCompleteRequest()
    ): Chore

    @POST("api/v1/chores/{id}/reassign")
    suspend fun reassignChore(@Path("id") id: Int, @Body body: ChoreReassignRequest): Chore

    @GET("api/v1/chores/leaderboard")
    suspend fun getLeaderboard(): List<LeaderboardMember>

    @GET("api/v1/chores/panic-mode-tasks")
    suspend fun getPanicModeTasks(): List<Chore>

    @GET("api/v1/chores/rewards")
    suspend fun getChoreRewards(): List<ChoreRewardItem>

    @POST("api/v1/chores/rewards")
    suspend fun createChoreReward(@Body body: ChoreRewardCreate): ChoreRewardItem

    @POST("api/v1/chores/rewards/{id}/redeem")
    suspend fun redeemChoreReward(@Path("id") id: Int): ChoreRedemption

    @POST("api/v1/chores/{id}/add-supply-to-shopping")
    suspend fun addChoreSupplyToShopping(
        @Path("id") id: Int,
        @Query("item_name") itemName: String? = null,
        @Query("amount") amount: Double = 1.0,
        @Query("unit") unit: String = "balení"
    ): SimpleMessageResponse

    // ---------- PLANTS ----------
    @GET("api/v1/plants")
    suspend fun getPlants(
        @Query("room") room: String? = null,
        @Query("thirsty_only") needsWatering: Boolean? = null,
        @Query("pet_toxicity") petToxicity: String? = null,
        @Query("query") query: String? = null
    ): List<Plant>

    @GET("api/v1/plants/{id}")
    suspend fun getPlant(@Path("id") id: Int): Plant

    @POST("api/v1/plants")
    suspend fun createPlant(@Body body: PlantCreate): Plant

    @PUT("api/v1/plants/{id}")
    suspend fun updatePlant(@Path("id") id: Int, @Body body: PlantUpdate): Plant

    @DELETE("api/v1/plants/{id}")
    suspend fun deletePlant(@Path("id") id: Int): SimpleMessageResponse

    @POST("api/v1/plants/{id}/water")
    suspend fun waterPlant(@Path("id") id: Int): Plant

    @POST("api/v1/plants/{id}/toggle-winter-mode")
    suspend fun togglePlantWinterMode(@Path("id") id: Int): Plant

    @POST("api/v1/plants/{id}/toggle-favorite")
    suspend fun togglePlantFavorite(@Path("id") id: Int): Plant

    @POST("api/v1/plants/{id}/tasks")
    suspend fun addPlantTask(@Path("id") id: Int, @Body body: PlantTaskCreate): PlantTask

    @POST("api/v1/plants/{id}/complete-task/{taskId}")
    suspend fun completePlantTask(@Path("id") id: Int, @Path("taskId") taskId: Int): PlantTask

    @POST("api/v1/plants/{id}/logs")
    suspend fun addPlantLog(@Path("id") id: Int, @Body body: PlantLogEntryCreate): PlantLogEntry

    @GET("api/v1/plants/plant-sitter")
    suspend fun getPlantSitterSchedule(): List<PlantSitterItem>

    @POST("api/v1/ai/analyze-plant")
    suspend fun aiAnalyzePlant(@Body body: PlantAiRequest): PlantAiExtracted

    @POST("api/v1/ai/diagnose-plant-health")
    suspend fun aiDiagnosePlant(@Body body: PlantDiagnosisRequest): PlantDiagnosisResponse

    // ---------- PETS ----------
    @GET("api/v1/pets")
    suspend fun getPets(
        @Query("species") species: String? = null,
        @Query("favorite_only") favoriteOnly: Boolean? = null,
        @Query("query") query: String? = null
    ): List<Pet>

    @GET("api/v1/pets/{id}")
    suspend fun getPet(@Path("id") id: Int): Pet

    @POST("api/v1/pets")
    suspend fun createPet(@Body body: PetCreate): Pet

    @PUT("api/v1/pets/{id}")
    suspend fun updatePet(@Path("id") id: Int, @Body body: PetUpdate): Pet

    @DELETE("api/v1/pets/{id}")
    suspend fun deletePet(@Path("id") id: Int): SimpleMessageResponse

    @POST("api/v1/pets/{id}/feed")
    suspend fun feedPet(@Path("id") id: Int): Pet

    @POST("api/v1/pets/{id}/toggle-favorite")
    suspend fun togglePetFavorite(@Path("id") id: Int): Pet

    @POST("api/v1/pets/{id}/medical")
    suspend fun addPetMedicalRecord(@Path("id") id: Int, @Body body: PetMedicalRecordCreate): PetMedicalRecord

    @POST("api/v1/pets/{id}/medications")
    suspend fun addPetMedication(@Path("id") id: Int, @Body body: PetMedicationCreate): PetMedication

    @DELETE("api/v1/pets/{id}/medications/{medId}")
    suspend fun deletePetMedication(@Path("id") id: Int, @Path("medId") medId: Int): SimpleMessageResponse

    @POST("api/v1/pets/{id}/weight")
    suspend fun addPetWeight(@Path("id") id: Int, @Body body: PetWeightLogCreate): PetWeightLog

    @POST("api/v1/pets/{id}/tasks")
    suspend fun addPetTask(@Path("id") id: Int, @Body body: PetTaskCreate): PetTask

    @POST("api/v1/pets/{id}/complete-task/{taskId}")
    suspend fun completePetTask(@Path("id") id: Int, @Path("taskId") taskId: Int): PetTask

    @POST("api/v1/pets/{id}/logs")
    suspend fun addPetLog(@Path("id") id: Int, @Body body: PetLogEntryCreate): PetLogEntry

    @GET("api/v1/pets/{id}/sitter-profile")
    suspend fun getPetSitterProfile(@Path("id") id: Int): PetSitterProfile

    @GET("api/v1/pets/{id}/sos-flyer")
    suspend fun getPetSosFlyer(@Path("id") id: Int): PetSosFlyer

    @POST("api/v1/pets/{id}/add-supply-to-shopping")
    suspend fun addPetSupplyToShopping(
        @Path("id") id: Int,
        @Query("item_name") itemName: String? = null,
        @Query("amount") amount: Double = 1.0,
        @Query("unit") unit: String = "ks"
    ): SimpleMessageResponse

    @POST("api/v1/ai/check-pet-food-safety")
    suspend fun checkPetFoodSafety(@Body body: PetFoodSafetyRequest): PetFoodSafetyResponse

    @POST("api/v1/ai/diagnose-pet-symptoms")
    suspend fun diagnosePetSymptoms(@Body body: PetSymptomRequest): PetSymptomResponse

    // ---------- MEDICINES ----------
    @GET("api/v1/medicines")
    suspend fun getMedicines(
        @Query("category") category: String? = null,
        @Query("location") location: String? = null,
        @Query("search") query: String? = null,
        @Query("status_filter") statusFilter: String? = null,
        @Query("is_low_stock") lowStock: Boolean? = null,
        @Query("assigned_user_id") assignedUserId: Int? = null
    ): List<Medicine>

    @GET("api/v1/medicines/{id}")
    suspend fun getMedicine(@Path("id") id: Int): Medicine

    @POST("api/v1/medicines")
    suspend fun createMedicine(@Body body: MedicineCreate): Medicine

    @PUT("api/v1/medicines/{id}")
    suspend fun updateMedicine(@Path("id") id: Int, @Body body: MedicineUpdate): Medicine

    @DELETE("api/v1/medicines/{id}")
    suspend fun deleteMedicine(@Path("id") id: Int): Unit

    @GET("api/v1/medicines/stats")
    suspend fun getMedicineStats(): MedicineStats

    @POST("api/v1/medicines/{id}/mark-opened")
    suspend fun markMedicineOpened(
        @Path("id") id: Int,
        @Query("opened_date") openedDate: String? = null
    ): Medicine

    @POST("api/v1/medicines/{id}/adjust-stock")
    suspend fun adjustMedicineStock(@Path("id") id: Int, @Query("delta") delta: Double): Medicine

    @POST("api/v1/medicines/{id}/add-to-shopping")
    suspend fun addMedicineToShopping(@Path("id") id: Int): SimpleMessageResponse

    @GET("api/v1/medicines/schedules")
    suspend fun getMedicationSchedules(
        @Query("user_id") userId: Int? = null,
        @Query("is_active") activeOnly: Boolean? = null
    ): List<MedicationSchedule>

    @POST("api/v1/medicines/schedules")
    suspend fun createMedicationSchedule(@Body body: MedicationScheduleCreate): MedicationSchedule

    @PUT("api/v1/medicines/schedules/{id}")
    suspend fun updateMedicationSchedule(@Path("id") id: Int, @Body body: MedicationScheduleUpdate): MedicationSchedule

    @DELETE("api/v1/medicines/schedules/{id}")
    suspend fun deleteMedicationSchedule(@Path("id") id: Int): Unit

    @GET("api/v1/medicines/logs")
    suspend fun getMedicationLogs(
        @Query("medicine_id") medicineId: Int? = null,
        @Query("user_id") userId: Int? = null,
        @Query("limit") limit: Int = 100
    ): List<MedicationLog>

    @POST("api/v1/medicines/logs")
    suspend fun createMedicationLog(@Body body: MedicationLogCreate): MedicationLog

    @GET("api/v1/medicines/first-aid/guides")
    suspend fun getFirstAidGuides(): List<FirstAidGuide>

    @GET("api/v1/medicines/first-aid/pediatric-dosage")
    suspend fun getPediatricDosage(
        @Query("weight_kg") weightKg: Double,
        @Query("drug") drug: String
    ): PediatricDosage

    // ---------- FINANCE ----------
    @GET("api/v1/finance/summary")
    suspend fun getFinanceSummary(@Query("month") month: String? = null): FinanceSummary

    @GET("api/v1/finance/transactions")
    suspend fun getTransactions(
        @Query("month") month: String? = null,
        @Query("category") category: String? = null,
        @Query("transaction_type") transactionType: String? = null,
        @Query("limit") limit: Int = 200
    ): List<TransactionItem>

    @POST("api/v1/finance/transactions")
    suspend fun createTransaction(@Body body: TransactionCreate): TransactionItem

    @PUT("api/v1/finance/transactions/{id}")
    suspend fun updateTransaction(@Path("id") id: Int, @Body body: TransactionUpdate): TransactionItem

    @DELETE("api/v1/finance/transactions/{id}")
    suspend fun deleteTransaction(@Path("id") id: Int): SimpleMessageResponse

    @GET("api/v1/finance/budgets")
    suspend fun getBudgets(): List<CategoryBudget>

    @POST("api/v1/finance/budgets")
    suspend fun createBudget(@Body body: CategoryBudgetCreate): CategoryBudget

    @GET("api/v1/finance/settlement")
    suspend fun getDebtSettlements(): DebtSettlementResponse

    @POST("api/v1/finance/settle")
    suspend fun settleDebt(@Body body: SettleRequest): SimpleMessageResponse

    @GET("api/v1/finance/subscriptions")
    suspend fun getSubscriptions(): List<Subscription>

    @POST("api/v1/finance/subscriptions")
    suspend fun createSubscription(@Body body: SubscriptionCreate): Subscription

    @PUT("api/v1/finance/subscriptions/{id}")
    suspend fun updateSubscription(@Path("id") id: Int, @Body body: SubscriptionUpdate): Subscription

    @DELETE("api/v1/finance/subscriptions/{id}")
    suspend fun deleteSubscription(@Path("id") id: Int): SimpleMessageResponse

    @GET("api/v1/finance/goals")
    suspend fun getSavingsGoals(): List<SavingsGoal>

    @POST("api/v1/finance/goals")
    suspend fun createSavingsGoal(@Body body: SavingsGoalCreate): SavingsGoal

    @PUT("api/v1/finance/goals/{id}")
    suspend fun updateSavingsGoal(@Path("id") id: Int, @Body body: SavingsGoalUpdate): SavingsGoal

    @POST("api/v1/finance/goals/{id}/add-savings")
    suspend fun addSavingsDeposit(@Path("id") id: Int, @Body body: SavingsGoalDeposit): SavingsGoal

    @DELETE("api/v1/finance/goals/{id}")
    suspend fun deleteSavingsGoal(@Path("id") id: Int): SimpleMessageResponse

    @Multipart
    @POST("api/v1/finance/import/preview")
    suspend fun previewCsvImport(@Part file: MultipartBody.Part): CsvImportPreview

    @POST("api/v1/finance/import/confirm")
    suspend fun confirmCsvImport(@Body body: CsvImportConfirm): SimpleMessageResponse

    @POST("api/v1/finance/scan-receipt")
    suspend fun scanReceipt(@Body body: ReceiptScanRequest): ReceiptScanResponse

    @GET("api/v1/finance/profile")
    suspend fun getFinanceProfile(): UserFinanceProfile

    @PUT("api/v1/finance/profile")
    suspend fun updateFinanceProfile(@Body body: UserFinanceProfileUpdate): UserFinanceProfile

    // ---------- DOCUMENTS ----------
    @GET("api/v1/documents")
    suspend fun getDocuments(
        @Query("category") category: String? = null,
        @Query("status") status: String? = null,
        @Query("search") query: String? = null,
        @Query("vault_unlocked") vaultUnlocked: Boolean? = null
    ): List<DocumentItem>

    @GET("api/v1/documents/{id}")
    suspend fun getDocument(@Path("id") id: Int): DocumentItem

    @Multipart
    @POST("api/v1/documents/upload")
    suspend fun uploadDocument(
        @Part file: MultipartBody.Part,
        @Part("auto_analyze") autoAnalyze: RequestBody
    ): DocumentUploadResult

    @POST("api/v1/documents")
    suspend fun createDocument(@Body body: DocumentCreate): DocumentItem

    @PUT("api/v1/documents/{id}")
    suspend fun updateDocument(@Path("id") id: Int, @Body body: DocumentUpdate): DocumentItem

    @DELETE("api/v1/documents/{id}")
    suspend fun deleteDocument(@Path("id") id: Int): SimpleMessageResponse

    @GET("api/v1/documents/stats")
    suspend fun getDocumentStats(): DocumentStats

    @POST("api/v1/documents/vault/verify")
    suspend fun verifyVaultPin(@Body body: VaultVerifyRequest): VaultVerifyResponse

    @POST("api/v1/documents/vault/pin")
    suspend fun setVaultPin(@Body body: VaultSetPinRequest): SimpleMessageResponse

    // ---------- VEHICLES ----------
    @GET("api/v1/vehicles")
    suspend fun getVehicles(
        @Query("query") query: String? = null,
        @Query("favorite_only") favoriteOnly: Boolean? = null
    ): List<Vehicle>

    @GET("api/v1/vehicles/stats")
    suspend fun getVehicleStats(): VehicleFleetStats

    @GET("api/v1/vehicles/{id}")
    suspend fun getVehicle(@Path("id") id: Int): Vehicle

    @POST("api/v1/vehicles")
    suspend fun createVehicle(@Body body: VehicleCreate): Vehicle

    @PUT("api/v1/vehicles/{id}")
    suspend fun updateVehicle(@Path("id") id: Int, @Body body: VehicleUpdate): Vehicle

    @DELETE("api/v1/vehicles/{id}")
    suspend fun deleteVehicle(@Path("id") id: Int): SimpleMessageResponse

    @POST("api/v1/vehicles/{id}/mileage")
    suspend fun updateVehicleMileage(@Path("id") id: Int, @Body body: MileageUpdate): Vehicle

    @POST("api/v1/vehicles/{id}/refuelings")
    suspend fun addRefueling(@Path("id") id: Int, @Body body: VehicleRefuelingCreate): VehicleRefueling

    @GET("api/v1/vehicles/{id}/refuelings")
    suspend fun getRefuelings(@Path("id") id: Int): List<VehicleRefueling>

    @DELETE("api/v1/vehicles/{id}/refuelings/{refuelingId}")
    suspend fun deleteRefueling(@Path("id") id: Int, @Path("refuelingId") refuelingId: Int): SimpleMessageResponse

    @POST("api/v1/vehicles/{id}/services")
    suspend fun addServiceRecord(@Path("id") id: Int, @Body body: VehicleServiceRecordCreate): VehicleServiceRecord

    @GET("api/v1/vehicles/{id}/services")
    suspend fun getServiceRecords(@Path("id") id: Int): List<VehicleServiceRecord>

    @DELETE("api/v1/vehicles/{id}/services/{serviceId}")
    suspend fun deleteServiceRecord(@Path("id") id: Int, @Path("serviceId") serviceId: Int): SimpleMessageResponse

    // ---------- ASSETS ----------
    @GET("api/v1/assets")
    suspend fun getAssets(
        @Query("category") category: String? = null,
        @Query("room") room: String? = null,
        @Query("status") status: String? = null,
        @Query("search") query: String? = null,
        @Query("warranty_status") warrantyExpiring: String? = null
    ): List<Asset>

    @GET("api/v1/assets/stats")
    suspend fun getAssetStats(): AssetStats

    @GET("api/v1/assets/{id}")
    suspend fun getAsset(@Path("id") id: Int): Asset

    @POST("api/v1/assets")
    suspend fun createAsset(@Body body: AssetCreate): Asset

    @PUT("api/v1/assets/{id}")
    suspend fun updateAsset(@Path("id") id: Int, @Body body: AssetUpdate): Asset

    @DELETE("api/v1/assets/{id}")
    suspend fun deleteAsset(@Path("id") id: Int): Unit

    @Multipart
    @POST("api/v1/assets/{id}/upload-file")
    suspend fun uploadAssetFile(
        @Path("id") id: Int,
        @Query("file_type") fileType: String,
        @Part file: MultipartBody.Part
    ): AssetUploadResult

    // ---------- ACTIVITIES ----------
    @GET("api/v1/activities")
    suspend fun getActivities(
        @Query("limit") limit: Int = 50,
        @Query("offset") offset: Int = 0,
        @Query("module") module: String? = null,
        @Query("user_id") userId: Int? = null,
        @Query("action_type") actionType: String? = null,
        @Query("search") search: String? = null
    ): ActivityListResponse

    @GET("api/v1/activities/stats")
    suspend fun getActivityStats(): ActivityStats

    @DELETE("api/v1/activities")
    suspend fun clearActivities(@Query("older_than_days") olderThanDays: Int? = null): SimpleMessageResponse

    // ---------- SYSTEM & BACKUPS ----------
    @GET("api/v1/system/backups")
    suspend fun getBackups(): List<BackupItem>

    @POST("api/v1/system/backups")
    suspend fun createBackup(@Body body: Map<String, String> = emptyMap()): SimpleMessageResponse

    @Streaming
    @GET("api/v1/system/backups/{filename}/download")
    suspend fun downloadBackup(@Path("filename") filename: String): ResponseBody

    @POST("api/v1/system/backups/{filename}/restore")
    suspend fun restoreBackup(@Path("filename") filename: String): BackupRestoreResult

    @DELETE("api/v1/system/backups/{filename}")
    suspend fun deleteBackup(@Path("filename") filename: String): SimpleMessageResponse

    @Streaming
    @GET("api/v1/system/export")
    suspend fun exportData(): ResponseBody

    @Multipart
    @POST("api/v1/system/import")
    suspend fun importData(
        @Part file: MultipartBody.Part,
        @Part("mode") mode: RequestBody
    ): SimpleMessageResponse

    @POST("api/v1/system/reset-data")
    suspend fun resetAllData(@Body body: Map<String, String>): SimpleMessageResponse

    // ---------- AI ----------
    @GET("api/v1/ai/status")
    suspend fun getAiStatus(): AiStatus

    @POST("api/v1/ai/import-recipe")
    suspend fun aiImportRecipe(@Body body: AiRecipeImportRequest): GeminiExtractedRecipe

    @POST("api/v1/ai/import-recipe-base64")
    suspend fun aiImportRecipeBase64(@Body body: GeminiBase64FileImportRequest): RecipeFileImportResponse
}
