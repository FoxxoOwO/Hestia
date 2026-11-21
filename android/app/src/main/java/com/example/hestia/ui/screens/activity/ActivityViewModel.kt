package com.example.hestia.ui.screens.activity

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.hestia.data.models.ActivityLog
import com.example.hestia.data.models.ActivityStats
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.util.friendly
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ActivityUiState(
    val items: List<ActivityLog> = emptyList(),
    val stats: ActivityStats? = null,
    val loading: Boolean = true,
    val error: String? = null,
    val module: String = "",
    val search: String = "",
    val total: Int = 0,
)

class ActivityViewModel(private val repository: HestiaRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(ActivityUiState())
    val uiState: StateFlow<ActivityUiState> = _uiState.asStateFlow()

    fun setModule(value: String) {
        _uiState.value = _uiState.value.copy(module = value)
        load()
    }

    fun setSearch(value: String) {
        _uiState.value = _uiState.value.copy(search = value)
        load()
    }

    fun setError(error: Throwable) {
        _uiState.value = _uiState.value.copy(error = error.friendly())
    }

    fun load(limit: Int = 100) {
        viewModelScope.launch {
            if (_uiState.value.search.isNotBlank()) delay(300)
            _uiState.value = _uiState.value.copy(loading = true)
            val state = _uiState.value
            repository.getActivities(
                limit = limit,
                module = state.module.ifBlank { null },
                search = state.search.ifBlank { null },
            ).onSuccess { response ->
                _uiState.value = _uiState.value.copy(
                    items = response.items,
                    total = response.total,
                    error = null,
                )
            }.onFailure { e -> _uiState.value = _uiState.value.copy(error = e.friendly()) }

            repository.getActivityStats().onSuccess { _uiState.value = _uiState.value.copy(stats = it) }
            _uiState.value = _uiState.value.copy(loading = false)
        }
    }
}

class ActivityViewModelFactory(private val repository: HestiaRepository) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return ActivityViewModel(repository) as T
    }
}
