package com.example.hestia.data.api

import com.example.hestia.data.models.*
import retrofit2.http.*

interface HestiaApiService {

    // --- HEALTH & STATUS ---
    @GET("api/health")
    suspend fun checkHealth(): HealthResponse

    // --- AUTHENTICATION ---
    @POST("api/v1/auth/login")
    suspend fun login(@Body body: LoginRequest): TokenResponse

    @GET("api/v1/auth/public-members")
    suspend fun getPublicMembers(): List<PublicMember>

    @GET("api/v1/auth/me")
    suspend fun getMe(): User

    // --- SHOPPING LIST ---
    @GET("api/v1/shopping")
    suspend fun getShoppingItems(): List<ShoppingItem>

    @POST("api/v1/shopping")
    suspend fun createShoppingItem(@Body item: ShoppingItemCreate): ShoppingItem

    @PATCH("api/v1/shopping/{id}")
    suspend fun updateShoppingItem(
        @Path("id") id: Int,
        @Body update: ShoppingItemUpdate
    ): ShoppingItem

    @DELETE("api/v1/shopping/{id}")
    suspend fun deleteShoppingItem(@Path("id") id: Int)

    @DELETE("api/v1/shopping/checked")
    suspend fun clearCheckedShoppingItems()

    // --- CHORES ---
    @GET("api/v1/chores")
    suspend fun getChores(): List<Chore>

    @POST("api/v1/chores/{id}/complete")
    suspend fun completeChore(@Path("id") id: Int): ChoreCompleteResult

    @GET("api/v1/chores/panic-mode")
    suspend fun getPanicMode(): PanicModeResponse

    // --- MEDICINES ---
    @GET("api/v1/medicines")
    suspend fun getMedicines(): List<Medicine>

    @GET("api/v1/medicines/stats")
    suspend fun getMedicineStats(): MedicineStats

    @POST("api/v1/medicines/{id}/take-dose")
    suspend fun takeMedicineDose(@Path("id") id: Int): Map<String, String>

    @GET("api/v1/medicines/first-aid-guides")
    suspend fun getFirstAidGuides(): List<FirstAidGuide>

    // --- PLANTS ---
    @GET("api/v1/plants")
    suspend fun getPlants(): List<Plant>

    @POST("api/v1/plants/{id}/water")
    suspend fun waterPlant(@Path("id") id: Int): WaterActionResult

    // --- VEHICLES ---
    @GET("api/v1/vehicles")
    suspend fun getVehicles(): List<Vehicle>

    @POST("api/v1/vehicles/{id}/refuel")
    suspend fun refuelVehicle(
        @Path("id") id: Int,
        @Body body: RefuelingCreate
    ): Map<String, String>

    @POST("api/v1/vehicles/{id}/mileage")
    suspend fun updateVehicleMileage(
        @Path("id") id: Int,
        @Body body: MileageUpdate
    ): Map<String, String>

    // --- RECIPES ---
    @GET("api/v1/recipes")
    suspend fun getRecipes(): List<Recipe>

    @GET("api/v1/recipes/{id}")
    suspend fun getRecipe(@Path("id") id: Int): Recipe

    // --- PANTRY ---
    @GET("api/v1/pantry")
    suspend fun getPantryItems(): List<PantryItem>

    @POST("api/v1/pantry")
    suspend fun createPantryItem(@Body item: PantryItemCreate): PantryItem

    @DELETE("api/v1/pantry/{id}")
    suspend fun deletePantryItem(@Path("id") id: Int)

    // --- PETS ---
    @GET("api/v1/pets")
    suspend fun getPets(): List<Pet>

    @POST("api/v1/pets/{id}/feed")
    suspend fun feedPet(@Path("id") id: Int): Map<String, String>

    // --- FINANCE ---
    @GET("api/v1/finance/summary")
    suspend fun getFinanceSummary(): FinanceSummary

    @GET("api/v1/finance/transactions")
    suspend fun getTransactions(@Query("limit") limit: Int = 50): List<TransactionItem>

    @GET("api/v1/finance/settlements")
    suspend fun getDebtSettlements(): DebtSettlementResponse

    // --- DOCUMENTS ---
    @GET("api/v1/documents")
    suspend fun getDocuments(): List<DocumentItem>

    @GET("api/v1/documents/stats")
    suspend fun getDocumentStats(): DocumentStats

    // --- ACTIVITIES ---
    @GET("api/v1/activities")
    suspend fun getActivities(
        @Query("limit") limit: Int = 30
    ): ActivityListResponse

    // --- SYSTEM & BACKUPS ---
    @GET("api/v1/system/backups")
    suspend fun getBackups(): List<BackupItem>

    @POST("api/v1/system/backups")
    suspend fun createBackup(@Body body: Map<String, String> = emptyMap()): Map<String, String>

    @POST("api/v1/system/reset-data")
    suspend fun resetAllData(
        @Body body: Map<String, String>
    ): Map<String, String>
}
