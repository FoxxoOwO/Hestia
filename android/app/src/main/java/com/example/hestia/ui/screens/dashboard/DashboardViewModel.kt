package com.example.hestia.ui.screens.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.hestia.data.models.*
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.util.friendly
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class DashboardUiState(
    val loading: Boolean = true,
    val error: String? = null,
    val pendingShopping: Int = 0,
    val choresDue: Int = 0,
    val choresOverdue: Int = 0,
    val myChores: List<Chore> = emptyList(),
    val panicTasks: List<Chore> = emptyList(),
    val leaderboard: List<LeaderboardMember> = emptyList(),
    val thirstyPlants: Int = 0,
    val petTasks: Int = 0,
    val pets: List<Pet> = emptyList(),
    val medicineStats: MedicineStats? = null,
    val finance: FinanceSummary? = null,
    val fleet: VehicleFleetStats? = null,
    val expiringDocs: Int = 0,
    val activities: List<ActivityLog> = emptyList(),
    val aiStatus: AiStatus? = null,
)

class DashboardViewModel(private val repository: HestiaRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    fun load(currentUser: User?) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(loading = true, error = null)

            coroutineScope {
                val jobs = listOf(
                    async {
                        repository.getShoppingItems().onSuccess { list ->
                            _uiState.value = _uiState.value.copy(pendingShopping = list.count { !it.is_checked })
                        }
                    },
                    async {
                        repository.getChores().onSuccess { list ->
                            _uiState.value = _uiState.value.copy(
                                choresDue = list.count { chore ->
                                    chore.days_until_due?.let { days -> days <= 0 && days > -1 } == true
                                },
                                choresOverdue = list.count { it.is_overdue },
                                myChores = list.filter { chore ->
                                    chore.current_assignee_id == currentUser?.id &&
                                        (chore.is_overdue || (chore.days_until_due ?: 99) <= 1)
                                }.sortedBy { it.days_until_due ?: 99 },
                            )
                        }
                    },
                    async { repository.getPanicModeTasks().onSuccess { _uiState.value = _uiState.value.copy(panicTasks = it) } },
                    async { repository.getLeaderboard().onSuccess { _uiState.value = _uiState.value.copy(leaderboard = it) } },
                    async { repository.getPlants(needsWatering = true).onSuccess { _uiState.value = _uiState.value.copy(thirstyPlants = it.size) } },
                    async {
                        repository.getPets().onSuccess { list ->
                            _uiState.value = _uiState.value.copy(
                                pets = list.take(4),
                                petTasks = list.sumOf { pet -> pet.tasks.count { !it.is_completed } },
                            )
                        }
                    },
                    async { repository.getMedicineStats().onSuccess { _uiState.value = _uiState.value.copy(medicineStats = it) } },
                    async { repository.getFinanceSummary().onSuccess { _uiState.value = _uiState.value.copy(finance = it) } },
                    async { repository.getVehicleStats().onSuccess { _uiState.value = _uiState.value.copy(fleet = it) } },
                    async { repository.getDocuments(status = "expiring_soon").onSuccess { _uiState.value = _uiState.value.copy(expiringDocs = it.size) } },
                    async { repository.getActivities(limit = 6).onSuccess { _uiState.value = _uiState.value.copy(activities = it.items) } },
                    async { repository.getAiStatus().onSuccess { _uiState.value = _uiState.value.copy(aiStatus = it) } },
                )
                val results = jobs.awaitAll()
                _uiState.value = _uiState.value.copy(
                    error = results.firstNotNullOfOrNull { it.exceptionOrNull()?.friendly() }
                )
            }
            _uiState.value = _uiState.value.copy(loading = false)
        }
    }
}

class DashboardViewModelFactory(private val repository: HestiaRepository) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return DashboardViewModel(repository) as T
    }
}
