package com.example.hestia.ui.screens.medicines

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.hestia.data.models.FirstAidGuide
import com.example.hestia.data.models.MedicationLog
import com.example.hestia.data.models.MedicationSchedule
import com.example.hestia.data.models.Medicine
import com.example.hestia.data.models.MedicineStats
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.util.friendly
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class MedicinesUiState(
    val medicines: List<Medicine> = emptyList(),
    val stats: MedicineStats? = null,
    val schedules: List<MedicationSchedule> = emptyList(),
    val logs: List<MedicationLog> = emptyList(),
    val guides: List<FirstAidGuide> = emptyList(),
    val loading: Boolean = true,
    val error: String? = null,
    val search: String = "",
    val category: String = "",
)

class MedicinesViewModel(private val repository: HestiaRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(MedicinesUiState())
    val uiState: StateFlow<MedicinesUiState> = _uiState.asStateFlow()

    private var currentUserId: Int? = null

    fun setCurrentUser(userId: Int?) {
        if (currentUserId != userId) {
            currentUserId = userId
            load()
        }
    }

    fun setSearch(value: String) {
        _uiState.value = _uiState.value.copy(search = value)
        load()
    }

    fun setCategory(value: String) {
        _uiState.value = _uiState.value.copy(category = value)
        load()
    }

    fun setError(error: Throwable) {
        _uiState.value = _uiState.value.copy(error = error.friendly())
    }

    fun load() {
        viewModelScope.launch {
            if (_uiState.value.search.isNotBlank()) delay(300)
            _uiState.value = _uiState.value.copy(loading = true)
            val state = _uiState.value
            repository.getMedicines(
                category = state.category.ifBlank { null },
                location = null,
                query = state.search.ifBlank { null },
            ).onSuccess { medicines ->
                _uiState.value = _uiState.value.copy(medicines = medicines, error = null)
            }.onFailure { e -> _uiState.value = _uiState.value.copy(error = e.friendly()) }

            repository.getMedicineStats().onSuccess { _uiState.value = _uiState.value.copy(stats = it) }
            repository.getMedicationSchedules(currentUserId, true).onSuccess { _uiState.value = _uiState.value.copy(schedules = it) }
            repository.getMedicationLogs(limit = 40).onSuccess { _uiState.value = _uiState.value.copy(logs = it) }
            repository.getFirstAidGuides().onSuccess { _uiState.value = _uiState.value.copy(guides = it) }
            _uiState.value = _uiState.value.copy(loading = false)
        }
    }
}

class MedicinesViewModelFactory(private val repository: HestiaRepository) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return MedicinesViewModel(repository) as T
    }
}
