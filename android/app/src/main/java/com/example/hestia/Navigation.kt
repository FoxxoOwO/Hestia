package com.example.hestia

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.theme.HestiaOrange
import com.example.hestia.ui.components.HestiaTopBar
import com.example.hestia.ui.components.SwitchUserDialog
import com.example.hestia.ui.navigation.Screen
import com.example.hestia.ui.navigation.drawerModuleScreens
import com.example.hestia.ui.screens.activity.ActivityScreen
import com.example.hestia.ui.screens.assets.AssetsScreen
import com.example.hestia.ui.screens.auth.LoginScreen
import com.example.hestia.ui.screens.auth.ServerConfigScreen
import com.example.hestia.ui.screens.chores.ChoresScreen
import com.example.hestia.ui.screens.dashboard.DashboardScreen
import com.example.hestia.ui.screens.documents.DocumentsScreen
import com.example.hestia.ui.screens.finance.FinanceScreen
import com.example.hestia.ui.screens.mealplanner.MealPlannerScreen
import com.example.hestia.ui.screens.medicines.MedicinesScreen
import com.example.hestia.ui.screens.pantry.PantryScreen
import com.example.hestia.ui.screens.pets.PetsScreen
import com.example.hestia.ui.screens.plants.PlantsScreen
import com.example.hestia.ui.screens.recipes.RecipesScreen
import com.example.hestia.ui.screens.settings.SettingsScreen
import com.example.hestia.ui.screens.shopping.ShoppingScreen
import com.example.hestia.ui.screens.vehicles.VehiclesScreen
import kotlinx.coroutines.launch

@Composable
fun MainNavigation() {
    val app = HestiaApplication.instance
    val repository = app.repository

    var showServerConfig by remember { mutableStateOf(false) }

    if (showServerConfig) {
        ServerConfigScreen(
            repository = repository,
            onConfigured = { showServerConfig = false }
        )
    } else {
        NativeComposeNavigation(
            repository = repository,
            onNavigateServerConfig = { showServerConfig = true }
        )
    }
}

@Composable
fun NativeComposeNavigation(
    repository: HestiaRepository,
    onNavigateServerConfig: () -> Unit
) {
    val isLoggedIn by repository.preferences.isLoggedInFlow.collectAsState(initial = false)
    val currentUser by repository.preferences.currentUserFlow.collectAsState(initial = null)

    var currentScreen by remember { mutableStateOf<Screen>(Screen.Dashboard) }
    var authSubScreen by remember { mutableStateOf<Screen>(Screen.Login) }
    var showSwitchUserDialog by remember { mutableStateOf(false) }

    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val coroutineScope = rememberCoroutineScope()

    if (showSwitchUserDialog) {
        SwitchUserDialog(
            repository = repository,
            onDismiss = { showSwitchUserDialog = false },
            onUserSwitched = {
                showSwitchUserDialog = false
            }
        )
    }

    if (!isLoggedIn) {
        when (authSubScreen) {
            Screen.ServerConfig -> ServerConfigScreen(
                repository = repository,
                onConfigured = { authSubScreen = Screen.Login }
            )

            else -> LoginScreen(
                repository = repository,
                onLoginSuccess = { currentScreen = Screen.Dashboard },
                onNavigateServerConfig = { authSubScreen = Screen.ServerConfig }
            )
        }
        return
    }

    BackHandler(enabled = drawerState.isOpen || currentScreen != Screen.Dashboard) {
        if (drawerState.isOpen) {
            coroutineScope.launch { drawerState.close() }
        } else {
            currentScreen = Screen.Dashboard
        }
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet(modifier = Modifier.width(310.dp)) {
                Column(
                    modifier = Modifier
                        .fillMaxHeight()
                        .verticalScroll(rememberScrollState())
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(HestiaOrange.copy(alpha = 0.12f))
                            .padding(horizontal = 20.dp, vertical = 24.dp)
                    ) {
                        Column {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(44.dp)
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(HestiaOrange),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        Icons.Default.Home,
                                        contentDescription = null,
                                        tint = Color.White,
                                        modifier = Modifier.size(24.dp)
                                    )
                                }
                                Column {
                                    Text(
                                        text = "HESTIA",
                                        style = MaterialTheme.typography.titleLarge,
                                        fontWeight = FontWeight.Black,
                                        color = HestiaOrange,
                                        letterSpacing = 1.sp
                                    )
                                    Text(
                                        text = "Chytrá správa domácnosti",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }

                            currentUser?.let { user ->
                                Spacer(modifier = Modifier.height(16.dp))
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(28.dp)
                                            .clip(CircleShape)
                                            .background(HestiaOrange),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = user.initials,
                                            color = Color.White,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                    Column {
                                        Text(
                                            text = user.display_name.ifBlank { user.username },
                                            style = MaterialTheme.typography.bodySmall,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Text(
                                            text = if (user.role == "admin") "Správce domova" else "Člen domova",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = "MODULY DOMÁCNOSTI",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp)
                    )

                    drawerModuleScreens.forEach { screen ->
                        NavigationDrawerItem(
                            label = {
                                Text(
                                    text = screen.title,
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = if (currentScreen == screen) FontWeight.Bold else FontWeight.Normal
                                )
                            },
                            icon = {
                                screen.icon?.let {
                                    Icon(
                                        it,
                                        contentDescription = null,
                                        tint = if (currentScreen == screen) HestiaOrange
                                        else MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            },
                            selected = currentScreen == screen,
                            onClick = {
                                currentScreen = screen
                                coroutineScope.launch { drawerState.close() }
                            },
                            colors = NavigationDrawerItemDefaults.colors(
                                selectedContainerColor = HestiaOrange.copy(alpha = 0.15f),
                                selectedTextColor = HestiaOrange,
                                selectedIconColor = HestiaOrange
                            ),
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 2.dp)
                        )
                    }

                    HorizontalDivider(
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                        color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)
                    )

                    NavigationDrawerItem(
                        label = {
                            Text(
                                text = Screen.Settings.title,
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = if (currentScreen == Screen.Settings) FontWeight.Bold else FontWeight.Normal
                            )
                        },
                        icon = {
                            Icon(
                                Icons.Default.Settings,
                                contentDescription = null,
                                tint = if (currentScreen == Screen.Settings) HestiaOrange
                                else MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        },
                        selected = currentScreen == Screen.Settings,
                        onClick = {
                            currentScreen = Screen.Settings
                            coroutineScope.launch { drawerState.close() }
                        },
                        colors = NavigationDrawerItemDefaults.colors(
                            selectedContainerColor = HestiaOrange.copy(alpha = 0.15f),
                            selectedTextColor = HestiaOrange,
                            selectedIconColor = HestiaOrange
                        ),
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 2.dp)
                    )

                    Spacer(modifier = Modifier.height(16.dp))
                }
            }
        }
    ) {
        Scaffold(
            topBar = {
                HestiaTopBar(
                    title = currentScreen.title,
                    currentUser = currentUser,
                    onMenuClick = { coroutineScope.launch { drawerState.open() } },
                    onSettingsClick = { currentScreen = Screen.Settings },
                    onUserClick = { showSwitchUserDialog = true }
                )
            },
        ) { paddingValues ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                when (currentScreen) {
                    Screen.Dashboard -> DashboardScreen(
                        repository = repository,
                        currentUser = currentUser,
                        onNavigate = { currentScreen = it }
                    )
                    Screen.Recipes -> RecipesScreen(repository = repository)
                    Screen.MealPlanner -> MealPlannerScreen(repository = repository)
                    Screen.Pantry -> PantryScreen(repository = repository)
                    Screen.Shopping -> ShoppingScreen(repository = repository)
                    Screen.Plants -> PlantsScreen(repository = repository)
                    Screen.Pets -> PetsScreen(repository = repository)
                    Screen.Chores -> ChoresScreen(repository = repository)
                    Screen.Finance -> FinanceScreen(repository = repository, currentUserId = currentUser?.id)
                    Screen.Documents -> DocumentsScreen(repository = repository)
                    Screen.Assets -> AssetsScreen(repository = repository)
                    Screen.Vehicles -> VehiclesScreen(repository = repository)
                    Screen.Medicines -> MedicinesScreen(repository = repository, currentUser = currentUser)
                    Screen.Activity -> ActivityScreen(repository = repository)
                    Screen.Settings -> SettingsScreen(
                        repository = repository,
                        onLogout = {
                            coroutineScope.launch {
                                repository.logout()
                                currentScreen = Screen.Dashboard
                                authSubScreen = Screen.Login
                            }
                        },
                        onNavigateServerConfig = onNavigateServerConfig,
                        onSwitchUser = { showSwitchUserDialog = true }
                    )
                    Screen.ServerConfig -> ServerConfigScreen(
                        repository = repository,
                        onConfigured = { currentScreen = Screen.Settings }
                    )
                    Screen.Login -> Box(Modifier.fillMaxSize()) {
                        CircularProgressIndicator(Modifier.align(androidx.compose.ui.Alignment.Center))
                    }
                }
            }
        }
    }
}
