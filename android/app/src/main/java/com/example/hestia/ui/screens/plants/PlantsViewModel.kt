package com.example.hestia.ui.screens.plants

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.hestia.data.models.Plant
import com.example.hestia.data.models.PlantSitterItem
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.util.friendly
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class PlantsUiState(
    val plants: List<Plant> = emptyList(),
    val sitter: List<PlantSitterItem> = emptyList(),
    val loading: Boolean = true,
    val error: String? = null,
    val onlyThirsty: Boolean = false,
    val search: String = "",
)

class PlantsViewModel(private val repository: HestiaRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(PlantsUiState())
    val uiState: StateFlow<PlantsUiState> = _uiState.asStateFlow()

    fun setSearch(value: String) {
        _uiState.value = _uiState.value.copy(search = value)
        load()
    }

    fun setOnlyThirsty(value: Boolean) {
        _uiState.value = _uiState.value.copy(onlyThirsty = value)
        load()
    }

    fun setError(error: Throwable) {
        _uiState.value = _uiState.value.copy(error = error.friendly())
    }

    fun load() {
        viewModelScope.launch {
            if (_uiState.value.search.isNotBlank()) delay(350)
            _uiState.value = _uiState.value.copy(loading = true)
            val state = _uiState.value
            repository.getPlants(
                query = state.search.ifBlank { null },
                needsWatering = state.onlyThirsty.takeIf { it },
            ).onSuccess { plants ->
                _uiState.value = _uiState.value.copy(plants = plants, error = null)
            }.onFailure { e ->
                _uiState.value = _uiState.value.copy(error = e.friendly())
            }
            _uiState.value = _uiState.value.copy(loading = false)
        }
    }

    fun loadSitter() {
        viewModelScope.launch {
            repository.getPlantSitterSchedule()
                .onSuccess { _uiState.value = _uiState.value.copy(sitter = it) }
                .onFailure { e -> _uiState.value = _uiState.value.copy(error = e.friendly()) }
        }
    }
}

class PlantsViewModelFactory(private val repository: HestiaRepository) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return PlantsViewModel(repository) as T
    }
}
