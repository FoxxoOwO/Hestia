package com.example.hestia.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.ui.graphics.vector.ImageVector

sealed class Screen(val route: String, val title: String, val icon: ImageVector? = null) {
    object ServerConfig : Screen("server_config", "Server")
    object Login : Screen("login", "Přihlášení")

    // --- CORE HESTIA MODULES ---
    object Dashboard : Screen("dashboard", "Přehled", Icons.Filled.Home)
    object Recipes : Screen("recipes", "Recepty & Vaření", Icons.Filled.Restaurant)
    object MealPlanner : Screen("meal_planner", "Jídelníček", Icons.Filled.CalendarMonth)
    object Pantry : Screen("pantry", "Spíž & Lednice", Icons.Filled.Inventory2)
    object Shopping : Screen("shopping", "Nákupní seznam", Icons.Filled.ShoppingCart)
    object Plants : Screen("plants", "Květiny & Zálivka", Icons.Filled.LocalFlorist)
    object Pets : Screen("pets", "Domácí mazlíčci", Icons.Filled.Pets)
    object Chores : Screen("chores", "Úkoly & Úklid", Icons.Filled.CheckCircle)
    object Finance : Screen("finance", "Rodinné finance", Icons.Filled.AccountBalanceWallet)
    object Documents : Screen("documents", "Digitální archiv", Icons.Filled.Folder)
    object Assets : Screen("assets", "Spotřebiče & Vybavení", Icons.Filled.Kitchen)
    object Vehicles : Screen("vehicles", "Vozový park & Garáž", Icons.Filled.DirectionsCar)
    object Medicines : Screen("medicines", "Lékárnička & SOS", Icons.Filled.MedicalServices)
    object Activity : Screen("activity", "Historie aktivit", Icons.Filled.History)

    object Settings : Screen("settings", "Nastavení & Zálohy", Icons.Filled.Settings)
}

// All modules for the side Navigation Drawer
val drawerModuleScreens = listOf(
    Screen.Dashboard,
    Screen.Recipes,
    Screen.MealPlanner,
    Screen.Pantry,
    Screen.Shopping,
    Screen.Plants,
    Screen.Pets,
    Screen.Chores,
    Screen.Finance,
    Screen.Documents,
    Screen.Assets,
    Screen.Vehicles,
    Screen.Medicines,
    Screen.Activity
)
