package com.example.hestia.ui.screens.chores

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.hestia.data.models.Chore
import com.example.hestia.data.models.ChoreRewardItem
import com.example.hestia.data.models.LeaderboardMember
import com.example.hestia.data.models.User
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.util.friendly
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ChoresUiState(
    val chores: List<Chore> = emptyList(),
    val leaderboard: List<LeaderboardMember> = emptyList(),
    val rewards: List<ChoreRewardItem> = emptyList(),
    val panicTasks: List<Chore> = emptyList(),
    val members: List<User> = emptyList(),
    val loading: Boolean = true,
    val error: String? = null,
    val roomFilter: String? = null,
    val onlyOverdue: Boolean = false,
    val search: String = "",
)

class ChoresViewModel(private val repository: HestiaRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(ChoresUiState())
    val uiState: StateFlow<ChoresUiState> = _uiState.asStateFlow()

    fun setSearch(value: String) {
        _uiState.value = _uiState.value.copy(search = value)
        loadChores()
    }

    fun setRoom(value: String?) {
        _uiState.value = _uiState.value.copy(roomFilter = value)
        loadChores()
    }

    fun setOnlyOverdue(value: Boolean) {
        _uiState.value = _uiState.value.copy(onlyOverdue = value)
        loadChores()
    }

    fun setError(error: Throwable) {
        _uiState.value = _uiState.value.copy(error = error.friendly())
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }

    fun loadChores() {
        viewModelScope.launch {
            if (_uiState.value.search.isNotBlank()) delay(350)
            _uiState.value = _uiState.value.copy(loading = true)
            val state = _uiState.value
            repository.getChores(room = state.roomFilter, search = state.search.ifBlank { null })
                .onSuccess { list ->
                    _uiState.value = _uiState.value.copy(
                        chores = if (state.onlyOverdue) list.filter { it.is_overdue } else list,
                        error = null,
                    )
                }
                .onFailure { e -> _uiState.value = _uiState.value.copy(error = e.friendly()) }
            _uiState.value = _uiState.value.copy(loading = false)
        }
    }

    fun loadAll() {
        loadChores()
        viewModelScope.launch {
            repository.getLeaderboard().onSuccess { _uiState.value = _uiState.value.copy(leaderboard = it) }
            repository.getChoreRewards().onSuccess { _uiState.value = _uiState.value.copy(rewards = it) }
            repository.getPanicModeTasks().onSuccess { _uiState.value = _uiState.value.copy(panicTasks = it) }
            repository.getUsers().onSuccess { _uiState.value = _uiState.value.copy(members = it) }
        }
    }
}

class ChoresViewModelFactory(private val repository: HestiaRepository) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return ChoresViewModel(repository) as T
    }
}
