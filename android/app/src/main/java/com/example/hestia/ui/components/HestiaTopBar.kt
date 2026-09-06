package com.example.hestia.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hestia.data.models.User
import com.example.hestia.theme.HestiaOrange

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HestiaTopBar(
    title: String,
    currentUser: User?,
    onMenuClick: () -> Unit,
    onSettingsClick: () -> Unit,
    onUserClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    TopAppBar(
        navigationIcon = {
            IconButton(onClick = onMenuClick) {
                Icon(
                    imageVector = Icons.Default.Menu,
                    contentDescription = "Boční menu",
                    tint = MaterialTheme.colorScheme.onSurface
                )
            }
        },
        title = {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.LocalFireDepartment,
                    contentDescription = null,
                    tint = HestiaOrange,
                    modifier = Modifier.size(26.dp)
                )
                Column {
                    Text(
                        text = title,
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                    if (currentUser != null) {
                        Text(
                            text = currentUser.display_name,
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        },
        actions = {
            if (currentUser != null) {
                // User avatar bubble
                val userColor = try {
                    Color(android.graphics.Color.parseColor(currentUser.avatar_color ?: "#F97316"))
                } catch (_: Exception) {
                    HestiaOrange
                }

                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(userColor)
                        .clickable { onUserClick() },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = currentUser.display_name.take(1).uppercase(),
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }
                Spacer(modifier = Modifier.width(4.dp))
            }

            IconButton(onClick = onSettingsClick) {
                Icon(
                    imageVector = Icons.Default.Settings,
                    contentDescription = "Nastavení",
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.surface,
            titleContentColor = MaterialTheme.colorScheme.onSurface
        ),
        modifier = modifier
    )
}
