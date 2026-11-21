package com.example.hestia.ui.screens.documents

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.hestia.data.models.DocumentItem
import com.example.hestia.data.models.DocumentStats
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.util.friendly
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class DocumentsUiState(
    val documents: List<DocumentItem> = emptyList(),
    val stats: DocumentStats? = null,
    val loading: Boolean = true,
    val error: String? = null,
    val search: String = "",
    val category: String? = null,
    val statusFilter: String? = null,
    val vaultUnlocked: Boolean = false,
)

class DocumentsViewModel(private val repository: HestiaRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(DocumentsUiState())
    val uiState: StateFlow<DocumentsUiState> = _uiState.asStateFlow()

    fun setSearch(value: String) {
        _uiState.value = _uiState.value.copy(search = value)
        load()
    }

    fun setCategory(value: String?) {
        _uiState.value = _uiState.value.copy(category = value)
        load()
    }

    fun setStatusFilter(value: String?) {
        _uiState.value = _uiState.value.copy(statusFilter = value)
        load()
    }

    fun setVaultUnlocked(value: Boolean) {
        _uiState.value = _uiState.value.copy(vaultUnlocked = value)
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
            if (_uiState.value.search.isNotBlank()) delay(350)
            _uiState.value = _uiState.value.copy(loading = true)
            val state = _uiState.value
            repository.getDocuments(
                category = state.category,
                query = state.search.ifBlank { null },
                status = state.statusFilter,
                vaultUnlocked = state.vaultUnlocked,
            ).onSuccess { documents ->
                _uiState.value = _uiState.value.copy(documents = documents, error = null)
            }.onFailure { e -> _uiState.value = _uiState.value.copy(error = e.friendly()) }

            repository.getDocumentStats().onSuccess { _uiState.value = _uiState.value.copy(stats = it) }
            _uiState.value = _uiState.value.copy(loading = false)
        }
    }
}

class DocumentsViewModelFactory(private val repository: HestiaRepository) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return DocumentsViewModel(repository) as T
    }
}
