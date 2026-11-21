package com.example.hestia.ui.screens.recipes

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.hestia.data.models.Recipe
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.util.friendly
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class RecipesUiState(
    val recipes: List<Recipe> = emptyList(),
    val loading: Boolean = true,
    val error: String? = null,
    val search: String = "",
    val difficulty: String? = null,
    val priceLevel: String? = null,
    val favoriteOnly: Boolean = false,
    val maxTime: String = "",
)

class RecipesViewModel(private val repository: HestiaRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(RecipesUiState())
    val uiState: StateFlow<RecipesUiState> = _uiState.asStateFlow()

    fun setSearch(value: String) {
        _uiState.value = _uiState.value.copy(search = value)
        load()
    }

    fun setDifficulty(value: String?) {
        _uiState.value = _uiState.value.copy(difficulty = value)
        load()
    }

    fun setPriceLevel(value: String?) {
        _uiState.value = _uiState.value.copy(priceLevel = value)
        load()
    }

    fun setFavoriteOnly(value: Boolean) {
        _uiState.value = _uiState.value.copy(favoriteOnly = value)
        load()
    }

    fun setMaxTime(value: String) {
        _uiState.value = _uiState.value.copy(maxTime = value)
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
            if (_uiState.value.search.isNotBlank() || _uiState.value.maxTime.isNotBlank()) delay(350)
            _uiState.value = _uiState.value.copy(loading = true)
            val state = _uiState.value
            repository.getRecipes(
                query = state.search.ifBlank { null },
                difficulty = state.difficulty,
                priceLevel = state.priceLevel,
                maxTime = state.maxTime.toIntOrNull(),
                favoriteOnly = state.favoriteOnly.takeIf { it },
            ).onSuccess { recipes ->
                _uiState.value = _uiState.value.copy(recipes = recipes, error = null)
            }.onFailure { e ->
                _uiState.value = _uiState.value.copy(error = e.friendly())
            }
            _uiState.value = _uiState.value.copy(loading = false)
        }
    }
}

class RecipesViewModelFactory(private val repository: HestiaRepository) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return RecipesViewModel(repository) as T
    }
}
