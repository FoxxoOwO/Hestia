package com.example.hestia.ui.screens.activity

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.example.hestia.data.models.ActivityLog
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.theme.HestiaOrange
import com.example.hestia.ui.components.EmptyStateCard
import kotlinx.coroutines.launch

@Composable
fun ActivityScreen(
    repository: HestiaRepository,
    modifier: Modifier = Modifier
) {
    val coroutineScope = rememberCoroutineScope()
    var activities by remember { mutableStateOf<List<ActivityLog>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }

    fun refreshActivities() {
        coroutineScope.launch {
            isLoading = true
            repository.getActivities(50).onSuccess {
                activities = it
            }
            isLoading = false
        }
    }

    LaunchedEffect(Unit) {
        refreshActivities()
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background
    ) { paddingValues ->
        if (isLoading && activities.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = HestiaOrange)
            }
        } else if (activities.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(16.dp),
                contentAlignment = Alignment.Center
            ) {
                EmptyStateCard(
                    message = "Zatím nebyly zaznamenány žádné aktivity v domácnosti.",
                    icon = Icons.Default.History
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                contentPadding = PaddingValues(vertical = 16.dp)
            ) {
                item {
                    Text(
                        text = "Poslední události a historie (${activities.size})",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }

                items(activities, key = { it.id }) { log ->
                    ActivityLogCard(log = log)
                }
            }
        }
    }
}

@Composable
fun ActivityLogCard(log: ActivityLog) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.Top
        ) {
            // User avatar or icon
            val avatarColor = try {
                if (!log.user_avatar_color.isNullOrBlank() && log.user_avatar_color.startsWith("#")) {
                    Color(android.graphics.Color.parseColor(log.user_avatar_color))
                } else HestiaOrange
            } catch (e: Exception) {
                HestiaOrange
            }

            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(avatarColor),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = log.user_name.take(1).uppercase(),
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = log.user_name,
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Bold
                    )

                    Surface(
                        color = getModuleColor(log.module).copy(alpha = 0.15f),
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text(
                            text = getModuleLabel(log.module),
                            color = getModuleColor(log.module),
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = log.title,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold
                )

                if (!log.description.isNullOrBlank()) {
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = log.description,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = formatActivityTimestamp(log.created_at),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                )
            }
        }
    }
}

fun getModuleLabel(module: String): String {
    return when (module.lowercase()) {
        "shopping" -> "Nákupy"
        "chores" -> "Úklid"
        "medicines" -> "Léky"
        "plants" -> "Rostliny"
        "vehicles" -> "Vozidla"
        "recipes" -> "Kuchařka"
        "pantry" -> "Spíž"
        "pets" -> "Mazlíčci"
        "finance" -> "Finance"
        "documents" -> "Dokumenty"
        "auth" -> "Přihlášení"
        "system" -> "Systém"
        else -> module.replaceFirstChar { it.uppercase() }
    }
}

fun getModuleColor(module: String): Color {
    return when (module.lowercase()) {
        "shopping" -> Color(0xFF10B981)
        "chores" -> Color(0xFF3B82F6)
        "medicines" -> Color(0xFFEF4444)
        "plants" -> Color(0xFF22C55E)
        "vehicles" -> Color(0xFF8B5CF6)
        "recipes" -> Color(0xFFF97316)
        "pantry" -> Color(0xFFD97706)
        "pets" -> Color(0xFFEC4899)
        "finance" -> Color(0xFF059669)
        "documents" -> Color(0xFF6366F1)
        "auth" -> Color(0xFF64748B)
        "system" -> Color(0xFF475569)
        else -> Color(0xFFF97316)
    }
}

fun formatActivityTimestamp(isoString: String): String {
    if (isoString.length >= 16) {
        val datePart = isoString.substring(0, 10)
        val timePart = isoString.substring(11, 16)
        return "$datePart v $timePart"
    }
    return isoString
}
