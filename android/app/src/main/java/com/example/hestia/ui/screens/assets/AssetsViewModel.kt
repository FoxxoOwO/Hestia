package com.example.hestia.ui.screens.assets

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.hestia.data.models.Asset
import com.example.hestia.data.models.AssetStats
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.util.friendly
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class AssetsUiState(
    val assets: List<Asset> = emptyList(),
    val stats: AssetStats? = null,
    val loading: Boolean = true,
    val error: String? = null,
    val search: String = "",
    val category: String = "",
    val warrantyOnly: Boolean = false,
)

class AssetsViewModel(private val repository: HestiaRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(AssetsUiState())
    val uiState: StateFlow<AssetsUiState> = _uiState.asStateFlow()

    fun setSearch(value: String) {
        _uiState.value = _uiState.value.copy(search = value)
        load()
    }

    fun setCategory(value: String) {
        _uiState.value = _uiState.value.copy(category = value)
        load()
    }

    fun setWarrantyOnly(value: Boolean) {
        _uiState.value = _uiState.value.copy(warrantyOnly = value)
        load()
    }

    fun setError(error: Throwable) {
        _uiState.value = _uiState.value.copy(error = error.friendly())
    }

    fun setErrorMessage(message: String) {
        _uiState.value = _uiState.value.copy(error = message)
    }

    fun load() {
        viewModelScope.launch {
            if (_uiState.value.search.isNotBlank()) delay(300)
            _uiState.value = _uiState.value.copy(loading = true)
            val state = _uiState.value
            repository.getAssets(
                category = state.category.ifBlank { null },
                query = state.search.ifBlank { null },
                warrantyStatus = if (state.warrantyOnly) "expiring_soon" else null,
            ).onSuccess { assets ->
                _uiState.value = _uiState.value.copy(assets = assets, error = null)
            }.onFailure { e -> _uiState.value = _uiState.value.copy(error = e.friendly()) }

            repository.getAssetStats().onSuccess { _uiState.value = _uiState.value.copy(stats = it) }
            _uiState.value = _uiState.value.copy(loading = false)
        }
    }
}

class AssetsViewModelFactory(private val repository: HestiaRepository) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return AssetsViewModel(repository) as T
    }
}
