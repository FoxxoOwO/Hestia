package com.example.hestia.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.example.hestia.data.models.User
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.json.Json

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "hestia_settings")

class PreferencesManager(private val context: Context) {

    private val json = Json { ignoreUnknownKeys = true }

    companion object {
        val KEY_SERVER_URL = stringPreferencesKey("server_url")
        val KEY_AUTH_TOKEN = stringPreferencesKey("auth_token")
        val KEY_USER_DATA = stringPreferencesKey("user_data")
        val KEY_APP_MODE = stringPreferencesKey("app_mode")
        val KEY_THEME = stringPreferencesKey("theme")
        val KEY_LANGUAGE = stringPreferencesKey("language")

        const val DEFAULT_SERVER_URL = "http://10.0.2.2:8000"
        const val MODE_WEB = "web"
        const val MODE_NATIVE = "native"

        const val THEME_SYSTEM = "system"
        const val THEME_LIGHT = "light"
        const val THEME_DARK = "dark"

        const val LANG_CS = "cs"
        const val LANG_EN = "en"
    }

    // Native UI is the default — the app is a full native client.
    val appModeFlow: Flow<String> = context.dataStore.data.map { preferences ->
        preferences[KEY_APP_MODE] ?: MODE_NATIVE
    }

    val serverUrlFlow: Flow<String> = context.dataStore.data.map { preferences ->
        preferences[KEY_SERVER_URL]?.trimEnd('/') ?: DEFAULT_SERVER_URL
    }

    val authTokenFlow: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[KEY_AUTH_TOKEN]
    }

    val themeFlow: Flow<String> = context.dataStore.data.map { preferences ->
        preferences[KEY_THEME] ?: THEME_SYSTEM
    }

    val languageFlow: Flow<String> = context.dataStore.data.map { preferences ->
        preferences[KEY_LANGUAGE] ?: LANG_CS
    }

    val currentUserFlow: Flow<User?> = context.dataStore.data.map { preferences ->
        val raw = preferences[KEY_USER_DATA] ?: return@map null
        try {
            json.decodeFromString<User>(raw)
        } catch (e: Exception) {
            null
        }
    }

    val isLoggedInFlow: Flow<Boolean> = authTokenFlow.map { !it.isNullOrBlank() }

    suspend fun setAppMode(mode: String) {
        context.dataStore.edit { preferences ->
            preferences[KEY_APP_MODE] = mode
        }
    }

    suspend fun setTheme(theme: String) {
        context.dataStore.edit { preferences ->
            preferences[KEY_THEME] = theme
        }
    }

    suspend fun setLanguage(language: String) {
        context.dataStore.edit { preferences ->
            preferences[KEY_LANGUAGE] = language
        }
    }

    suspend fun setServerUrl(url: String) {
        val cleanUrl = url.trim().trimEnd('/')
        context.dataStore.edit { preferences ->
            preferences[KEY_SERVER_URL] = cleanUrl
        }
    }

    suspend fun saveAuth(token: String, user: User) {
        val userJson = json.encodeToString(user)
        context.dataStore.edit { preferences ->
            preferences[KEY_AUTH_TOKEN] = token
            preferences[KEY_USER_DATA] = userJson
        }
    }

    suspend fun saveUser(user: User) {
        val userJson = json.encodeToString(user)
        context.dataStore.edit { preferences ->
            preferences[KEY_USER_DATA] = userJson
        }
    }

    suspend fun clearAuth() {
        context.dataStore.edit { preferences ->
            preferences.remove(KEY_AUTH_TOKEN)
            preferences.remove(KEY_USER_DATA)
        }
    }
}
