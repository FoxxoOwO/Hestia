package com.example.hestia.ui.screens.vehicles

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.hestia.data.models.Vehicle
import com.example.hestia.data.models.VehicleFleetStats
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.util.friendly
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class VehiclesUiState(
    val vehicles: List<Vehicle> = emptyList(),
    val stats: VehicleFleetStats? = null,
    val loading: Boolean = true,
    val error: String? = null,
    val search: String = "",
)

class VehiclesViewModel(private val repository: HestiaRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(VehiclesUiState())
    val uiState: StateFlow<VehiclesUiState> = _uiState.asStateFlow()

    fun setSearch(value: String) {
        _uiState.value = _uiState.value.copy(search = value)
        load()
    }

    fun setError(error: Throwable) {
        _uiState.value = _uiState.value.copy(error = error.friendly())
    }

    fun load() {
        viewModelScope.launch {
            if (_uiState.value.search.isNotBlank()) delay(350)
            _uiState.value = _uiState.value.copy(loading = true)
            repository.getVehicles(query = _uiState.value.search.ifBlank { null })
                .onSuccess { vehicles ->
                    _uiState.value = _uiState.value.copy(vehicles = vehicles, error = null)
                }
                .onFailure { e -> _uiState.value = _uiState.value.copy(error = e.friendly()) }
            repository.getVehicleStats().onSuccess { _uiState.value = _uiState.value.copy(stats = it) }
            _uiState.value = _uiState.value.copy(loading = false)
        }
    }
}

class VehiclesViewModelFactory(private val repository: HestiaRepository) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return VehiclesViewModel(repository) as T
    }
}
