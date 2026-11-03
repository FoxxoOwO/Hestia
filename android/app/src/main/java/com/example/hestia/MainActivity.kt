package com.example.hestia

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import com.example.hestia.data.local.PreferencesManager
import com.example.hestia.theme.HestiaTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        enableEdgeToEdge()
        setContent {
            val repository = HestiaApplication.instance.repository
            val theme by repository.preferences.themeFlow.collectAsState(
                initial = PreferencesManager.THEME_SYSTEM
            )
            val darkTheme = when (theme) {
                PreferencesManager.THEME_LIGHT -> false
                PreferencesManager.THEME_DARK -> true
                else -> isSystemInDarkTheme()
            }

            HestiaTheme(darkTheme = darkTheme) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    MainNavigation()
                }
            }
        }
    }
}
