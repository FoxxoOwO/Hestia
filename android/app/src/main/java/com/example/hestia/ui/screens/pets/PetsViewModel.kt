package com.example.hestia.ui.screens.pets

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.hestia.data.models.Pet
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.util.friendly
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class PetsUiState(
    val pets: List<Pet> = emptyList(),
    val loading: Boolean = true,
    val error: String? = null,
    val search: String = "",
    val speciesFilter: String? = null,
    val favOnly: Boolean = false,
    val baseUrl: String = "",
)

class PetsViewModel(private val repository: HestiaRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(PetsUiState())
    val uiState: StateFlow<PetsUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(baseUrl = repository.serverUrl())
        }
    }

    fun setSearch(value: String) {
        _uiState.value = _uiState.value.copy(search = value)
        load()
    }

    fun setSpecies(value: String?) {
        _uiState.value = _uiState.value.copy(speciesFilter = value)
        load()
    }

    fun setFavOnly(value: Boolean) {
        _uiState.value = _uiState.value.copy(favOnly = value)
        load()
    }

    fun load() {
        viewModelScope.launch {
            // Debounce pro textové hledání; filtry se změní zřídka, prodlení je přijatelné.
            if (_uiState.value.search.isNotBlank()) delay(350)
            _uiState.value = _uiState.value.copy(loading = true)
            val state = _uiState.value
            repository.getPets(
                species = state.speciesFilter,
                favoriteOnly = state.favOnly.takeIf { it },
                query = state.search.ifBlank { null },
            ).onSuccess { pets ->
                _uiState.value = _uiState.value.copy(pets = pets, error = null)
            }.onFailure { e ->
                _uiState.value = _uiState.value.copy(error = e.friendly())
            }
            _uiState.value = _uiState.value.copy(loading = false)
        }
    }

    /** Spustí mutaci, po úspěchu zavolá [onSuccess] a znovu načte seznam. */
    fun runAction(
        action: suspend () -> Result<*>,
        onSuccess: () -> Unit = {},
    ) {
        viewModelScope.launch {
            action().onSuccess {
                onSuccess()
                load()
            }.onFailure { e ->
                _uiState.value = _uiState.value.copy(error = e.friendly())
            }
        }
    }
}

class PetsViewModelFactory(private val repository: HestiaRepository) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return PetsViewModel(repository) as T
    }
}
