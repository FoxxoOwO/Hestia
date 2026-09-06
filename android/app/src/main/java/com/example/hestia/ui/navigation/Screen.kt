package com.example.hestia.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.ui.graphics.vector.ImageVector

sealed class Screen(val route: String, val title: String, val icon: ImageVector? = null) {
    object ServerConfig : Screen("server_config", "Server")
    object Login : Screen("login", "Přihlášení")
    object Dashboard : Screen("dashboard", "Přehled", Icons.Filled.Home)
    object Shopping : Screen("shopping", "Nákup", Icons.Filled.ShoppingCart)
    object Chores : Screen("chores", "Úkoly", Icons.Filled.CheckCircle)
    object Medicines : Screen("medicines", "Léky", Icons.Filled.MedicalServices)
    object Plants : Screen("plants", "Květiny", Icons.Filled.LocalFlorist)
    object Vehicles : Screen("vehicles", "Garáž", Icons.Filled.DirectionsCar)
    object Settings : Screen("settings", "Nastavení", Icons.Filled.Settings)
}

val bottomNavScreens = listOf(
    Screen.Dashboard,
    Screen.Shopping,
    Screen.Chores,
    Screen.Medicines,
    Screen.Vehicles
)
