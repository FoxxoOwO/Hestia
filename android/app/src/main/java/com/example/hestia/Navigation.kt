package com.example.hestia

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.example.hestia.ui.components.HestiaBottomNav
import com.example.hestia.ui.components.HestiaTopBar
import com.example.hestia.ui.navigation.Screen
import com.example.hestia.ui.screens.auth.LoginScreen
import com.example.hestia.ui.screens.auth.ServerConfigScreen
import com.example.hestia.ui.screens.chores.ChoresScreen
import com.example.hestia.ui.screens.dashboard.DashboardScreen
import com.example.hestia.ui.screens.medicines.MedicinesScreen
import com.example.hestia.ui.screens.plants.PlantsScreen
import com.example.hestia.ui.screens.settings.SettingsScreen
import com.example.hestia.ui.screens.shopping.ShoppingScreen
import com.example.hestia.ui.screens.vehicles.VehiclesScreen

@Composable
fun MainNavigation() {
    val app = HestiaApplication.instance
    val repository = app.repository

    val isLoggedIn by repository.preferences.isLoggedInFlow.collectAsState(initial = false)
    val currentUser by repository.preferences.currentUserFlow.collectAsState(initial = null)

    var currentScreen by remember { mutableStateOf<Screen>(Screen.Dashboard) }
    var authSubScreen by remember { mutableStateOf<Screen>(Screen.Login) }

    if (!isLoggedIn) {
        when (authSubScreen) {
            Screen.ServerConfig -> {
                ServerConfigScreen(
                    repository = repository,
                    onConfigured = { authSubScreen = Screen.Login }
                )
            }
            else -> {
                LoginScreen(
                    repository = repository,
                    onLoginSuccess = { currentScreen = Screen.Dashboard },
                    onNavigateServerConfig = { authSubScreen = Screen.ServerConfig }
                )
            }
        }
    } else {
        // Handle Android Back button
        BackHandler(enabled = currentScreen != Screen.Dashboard) {
            currentScreen = Screen.Dashboard
        }

        Scaffold(
            topBar = {
                HestiaTopBar(
                    title = currentScreen.title,
                    currentUser = currentUser,
                    onSettingsClick = { currentScreen = Screen.Settings },
                    onUserClick = { currentScreen = Screen.Settings }
                )
            },
            bottomBar = {
                if (currentScreen != Screen.Settings && currentScreen != Screen.ServerConfig) {
                    HestiaBottomNav(
                        currentRoute = currentScreen.route,
                        onNavigate = { currentScreen = it }
                    )
                }
            }
        ) { paddingValues ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                when (currentScreen) {
                    Screen.Dashboard -> DashboardScreen(
                        repository = repository,
                        onNavigate = { currentScreen = it }
                    )
                    Screen.Shopping -> ShoppingScreen(repository = repository)
                    Screen.Chores -> ChoresScreen(repository = repository)
                    Screen.Medicines -> MedicinesScreen(repository = repository)
                    Screen.Plants -> PlantsScreen(repository = repository)
                    Screen.Vehicles -> VehiclesScreen(repository = repository)
                    Screen.Settings -> SettingsScreen(
                        repository = repository,
                        onLogout = { currentScreen = Screen.Dashboard },
                        onNavigateServerConfig = { currentScreen = Screen.ServerConfig }
                    )
                    Screen.ServerConfig -> ServerConfigScreen(
                        repository = repository,
                        onConfigured = { currentScreen = Screen.Settings }
                    )
                    Screen.Login -> {}
                }
            }
        }
    }
}
