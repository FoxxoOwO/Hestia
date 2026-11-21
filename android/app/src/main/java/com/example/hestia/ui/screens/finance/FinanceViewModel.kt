package com.example.hestia.ui.screens.finance

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.hestia.data.models.*
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.util.Fmt
import com.example.hestia.util.friendly
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class FinanceUiState(
    val month: String = Fmt.monthKey(Fmt.today()),
    val summary: FinanceSummary? = null,
    val transactions: List<TransactionItem> = emptyList(),
    val budgets: List<CategoryBudget> = emptyList(),
    val settlement: DebtSettlementResponse? = null,
    val subscriptions: List<Subscription> = emptyList(),
    val goals: List<SavingsGoal> = emptyList(),
    val profile: UserFinanceProfile? = null,
    val users: List<User> = emptyList(),
    val loading: Boolean = true,
    val error: String? = null,
)

class FinanceViewModel(private val repository: HestiaRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(FinanceUiState())
    val uiState: StateFlow<FinanceUiState> = _uiState.asStateFlow()

    init {
        loadUsers()
        load(_uiState.value.month)
    }

    fun setMonth(month: String) {
        _uiState.value = _uiState.value.copy(month = month)
        load(month)
    }

    fun setError(error: Throwable) {
        _uiState.value = _uiState.value.copy(error = error.friendly())
    }

    fun setErrorMessage(message: String) {
        _uiState.value = _uiState.value.copy(error = message)
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }

    fun setProfile(profile: UserFinanceProfile) {
        _uiState.value = _uiState.value.copy(profile = profile)
    }

    fun loadUsers() {
        viewModelScope.launch {
            repository.getUsers().onSuccess { _uiState.value = _uiState.value.copy(users = it) }
        }
    }

    fun load(month: String = _uiState.value.month) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(loading = true, error = null)
            repository.getFinanceSummary(month).onSuccess { summary ->
                _uiState.value = _uiState.value.copy(summary = summary)
            }.onFailure { e -> setError(e) }

            repository.getTransactions(month)
                .onSuccess { _uiState.value = _uiState.value.copy(transactions = it) }
                .onFailure { e -> setError(e) }

            repository.getBudgets()
                .onSuccess { _uiState.value = _uiState.value.copy(budgets = it) }
                .onFailure { e -> setError(e) }

            repository.getDebtSettlements().onSuccess { _uiState.value = _uiState.value.copy(settlement = it) }
            repository.getSubscriptions().onSuccess { _uiState.value = _uiState.value.copy(subscriptions = it) }
            repository.getSavingsGoals().onSuccess { _uiState.value = _uiState.value.copy(goals = it) }
            repository.getFinanceProfile().onSuccess { _uiState.value = _uiState.value.copy(profile = it) }
            _uiState.value = _uiState.value.copy(loading = false)
        }
    }
}

class FinanceViewModelFactory(private val repository: HestiaRepository) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return FinanceViewModel(repository) as T
    }
}
