package com.example.hestia.data.repository

import com.example.hestia.data.api.ApiClient
import com.example.hestia.data.api.HestiaApiService
import com.example.hestia.data.local.PreferencesManager
import com.example.hestia.data.models.*
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking

class HestiaRepository(
    val preferences: PreferencesManager
) {
    @Volatile
    private var cachedToken: String? = null

    init {
        // Cache token in memory for fast synchronous interceptor access
        try {
            cachedToken = runBlocking { preferences.authTokenFlow.first() }
        } catch (_: Exception) {}
    }

    private val apiClient = ApiClient(tokenProvider = { cachedToken })

    private suspend fun getService(): HestiaApiService {
        val serverUrl = preferences.serverUrlFlow.first()
        return apiClient.getService(serverUrl)
    }

    // --- HEALTH ---
    suspend fun checkHealth(url: String? = null): Result<HealthResponse> = runCatching {
        val service = if (url != null) apiClient.getService(url) else getService()
        service.checkHealth()
    }

    // --- AUTH ---
    suspend fun login(username: String, password: String): Result<TokenResponse> = runCatching {
        val response = getService().login(LoginRequest(username, password))
        cachedToken = response.access_token
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

    suspend fun logout() {
        cachedToken = null
        preferences.clearAuth()
    }

    // --- SHOPPING LIST ---
    suspend fun getShoppingItems(): Result<List<ShoppingItem>> = runCatching {
        getService().getShoppingItems()
    }

    suspend fun createShoppingItem(item: ShoppingItemCreate): Result<ShoppingItem> = runCatching {
        getService().createShoppingItem(item)
    }

    suspend fun toggleShoppingItem(item: ShoppingItem): Result<ShoppingItem> = runCatching {
        getService().updateShoppingItem(item.id, ShoppingItemUpdate(is_checked = !item.is_checked))
    }

    suspend fun deleteShoppingItem(id: Int): Result<Unit> = runCatching {
        getService().deleteShoppingItem(id)
    }

    suspend fun clearCheckedShoppingItems(): Result<Unit> = runCatching {
        getService().clearCheckedShoppingItems()
    }

    // --- CHORES ---
    suspend fun getChores(): Result<List<Chore>> = runCatching {
        getService().getChores()
    }

    suspend fun completeChore(id: Int): Result<ChoreCompleteResult> = runCatching {
        getService().completeChore(id)
    }

    suspend fun getPanicMode(): Result<PanicModeResponse> = runCatching {
        getService().getPanicMode()
    }

    // --- MEDICINES ---
    suspend fun getMedicines(): Result<List<Medicine>> = runCatching {
        getService().getMedicines()
    }

    suspend fun getMedicineStats(): Result<MedicineStats> = runCatching {
        getService().getMedicineStats()
    }

    suspend fun takeMedicineDose(id: Int): Result<Map<String, String>> = runCatching {
        getService().takeMedicineDose(id)
    }

    suspend fun getFirstAidGuides(): Result<List<FirstAidGuide>> = runCatching {
        getService().getFirstAidGuides()
    }

    // --- PLANTS ---
    suspend fun getPlants(): Result<List<Plant>> = runCatching {
        getService().getPlants()
    }

    suspend fun waterPlant(id: Int): Result<WaterActionResult> = runCatching {
        getService().waterPlant(id)
    }

    // --- VEHICLES ---
    suspend fun getVehicles(): Result<List<Vehicle>> = runCatching {
        getService().getVehicles()
    }

    suspend fun refuelVehicle(id: Int, refueling: RefuelingCreate): Result<Map<String, String>> = runCatching {
        getService().refuelVehicle(id, refueling)
    }

    suspend fun updateVehicleMileage(id: Int, mileage: Int): Result<Map<String, String>> = runCatching {
        getService().updateVehicleMileage(id, MileageUpdate(mileage))
    }

    // --- ACTIVITIES ---
    suspend fun getActivities(limit: Int = 30): Result<List<ActivityLog>> = runCatching {
        getService().getActivities(limit)
    }
}
