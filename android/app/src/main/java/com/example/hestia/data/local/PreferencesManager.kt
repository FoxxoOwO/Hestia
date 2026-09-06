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
        const val DEFAULT_SERVER_URL = "http://10.0.2.2:8000"
    }

    val serverUrlFlow: Flow<String> = context.dataStore.data.map { preferences ->
        preferences[KEY_SERVER_URL]?.trimEnd('/') ?: DEFAULT_SERVER_URL
    }

    val authTokenFlow: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[KEY_AUTH_TOKEN]
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

    suspend fun clearAuth() {
        context.dataStore.edit { preferences ->
            preferences.remove(KEY_AUTH_TOKEN)
            preferences.remove(KEY_USER_DATA)
        }
    }
}
