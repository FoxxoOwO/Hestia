package com.example.hestia.ui.components

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.example.hestia.theme.HestiaOrange
import com.example.hestia.ui.navigation.Screen
import com.example.hestia.ui.navigation.bottomNavScreens

@Composable
fun HestiaBottomNav(
    currentRoute: String,
    onNavigate: (Screen) -> Unit,
    shoppingCount: Int = 0,
    urgentChoresCount: Int = 0,
    modifier: Modifier = Modifier
) {
    NavigationBar(
        containerColor = MaterialTheme.colorScheme.surface,
        modifier = modifier
    ) {
        bottomNavScreens.forEach { screen ->
            val isSelected = currentRoute == screen.route

            NavigationBarItem(
                selected = isSelected,
                onClick = { onNavigate(screen) },
                icon = {
                    BadgedBox(
                        badge = {
                            when {
                                screen == Screen.Shopping && shoppingCount > 0 -> {
                                    Badge { Text(shoppingCount.toString()) }
                                }
                                screen == Screen.Chores && urgentChoresCount > 0 -> {
                                    Badge { Text(urgentChoresCount.toString()) }
                                }
                            }
                        }
                    ) {
                        screen.icon?.let { icon ->
                            Icon(
                                imageVector = icon,
                                contentDescription = screen.title
                            )
                        }
                    }
                },
                label = {
                    Text(text = screen.title)
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = HestiaOrange,
                    selectedTextColor = HestiaOrange,
                    indicatorColor = MaterialTheme.colorScheme.primaryContainer
                )
            )
        }
    }
}
