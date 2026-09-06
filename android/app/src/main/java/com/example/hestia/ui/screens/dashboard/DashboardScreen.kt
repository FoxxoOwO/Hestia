package com.example.hestia.ui.screens.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import com.example.hestia.data.models.*
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.theme.*
import com.example.hestia.ui.components.EmptyStateCard
import com.example.hestia.ui.components.SectionHeader
import com.example.hestia.ui.components.StatCard
import com.example.hestia.ui.navigation.Screen
import kotlinx.coroutines.launch

@Composable
fun DashboardScreen(
    repository: HestiaRepository,
    onNavigate: (Screen) -> Unit,
    modifier: Modifier = Modifier
) {
    val coroutineScope = rememberCoroutineScope()
    var isLoading by remember { mutableStateOf(true) }

    var chores by remember { mutableStateOf<List<Chore>>(emptyList()) }
    var shoppingItems by remember { mutableStateOf<List<ShoppingItem>>(emptyList()) }
    var plants by remember { mutableStateOf<List<Plant>>(emptyList()) }
    var medStats by remember { mutableStateOf(MedicineStats()) }
    var activities by remember { mutableStateOf<List<ActivityLog>>(emptyList()) }

    var panicModeResponse by remember { mutableStateOf<PanicModeResponse?>(null) }
    var showPanicDialog by remember { mutableStateOf(false) }

    fun refreshData() {
        coroutineScope.launch {
            isLoading = true
            repository.getChores().onSuccess { chores = it }
            repository.getShoppingItems().onSuccess { shoppingItems = it }
            repository.getPlants().onSuccess { plants = it }
            repository.getMedicineStats().onSuccess { medStats = it }
            repository.getActivities(10).onSuccess { activities = it }
            isLoading = false
        }
    }

    LaunchedEffect(Unit) {
        refreshData()
    }

    val urgentChores = chores.filter { it.is_active }
    val thirstyPlants = plants.filter { it.days_until_watering <= 0 }
    val uncheckedShoppingCount = shoppingItems.count { !it.is_checked }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = HestiaOrange)
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Top KPI Grid
                item {
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        StatCard(
                            title = "K nákupu",
                            value = "$uncheckedShoppingCount",
                            subtitle = "položek",
                            icon = Icons.Default.ShoppingCart,
                            iconColor = HestiaOrange,
                            onClick = { onNavigate(Screen.Shopping) },
                            modifier = Modifier.weight(1f)
                        )
                        StatCard(
                            title = "Úkoly",
                            value = "${urgentChores.size}",
                            subtitle = "k vyřešení",
                            icon = Icons.Default.CheckCircle,
                            iconColor = StatusBlue,
                            onClick = { onNavigate(Screen.Chores) },
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        StatCard(
                            title = "Žíznivé kytky",
                            value = "${thirstyPlants.size}",
                            subtitle = "zalít dnes",
                            icon = Icons.Default.LocalFlorist,
                            iconColor = StatusGreen,
                            onClick = { onNavigate(Screen.Plants) },
                            modifier = Modifier.weight(1f)
                        )
                        StatCard(
                            title = "Léky expirace",
                            value = "${medStats.expiring_soon + medStats.expired}",
                            subtitle = "ke kontrole",
                            icon = Icons.Default.MedicalServices,
                            iconColor = if (medStats.expired > 0) StatusRed else StatusYellow,
                            onClick = { onNavigate(Screen.Medicines) },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                // Quick Action Bar
                item {
                    SectionHeader(title = "Bleskové akce")
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // Panic Mode Button
                        FilledTonalButton(
                            onClick = {
                                coroutineScope.launch {
                                    repository.getPanicMode().onSuccess {
                                        panicModeResponse = it
                                        showPanicDialog = true
                                    }
                                }
                            },
                            colors = ButtonDefaults.filledTonalButtonColors(
                                containerColor = StatusRed.copy(alpha = 0.15f),
                                contentColor = StatusRed
                            ),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.Bolt, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Panic Mode", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }

                        // Water all thirsty plants button
                        if (thirstyPlants.isNotEmpty()) {
                            FilledTonalButton(
                                onClick = {
                                    coroutineScope.launch {
                                        thirstyPlants.forEach { plant ->
                                            repository.waterPlant(plant.id)
                                        }
                                        refreshData()
                                    }
                                },
                                colors = ButtonDefaults.filledTonalButtonColors(
                                    containerColor = StatusGreen.copy(alpha = 0.15f),
                                    contentColor = StatusGreen
                                ),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(Icons.Default.WaterDrop, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Zalít vše", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }

                // Urgent Chores Section
                item {
                    SectionHeader(
                        title = "Dnešní úkoly",
                        actionText = "Všechny",
                        onActionClick = { onNavigate(Screen.Chores) }
                    )
                }

                if (urgentChores.isEmpty()) {
                    item {
                        EmptyStateCard(
                            message = "Skvělá práce! Žádné resty v úklidu.",
                            icon = Icons.Default.Celebration
                        )
                    }
                } else {
                    items(urgentChores.take(3)) { chore ->
                        Card(
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = chore.title,
                                        fontWeight = FontWeight.SemiBold,
                                        fontSize = 14.sp
                                    )
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                                        modifier = Modifier.padding(top = 4.dp)
                                    ) {
                                        Badge(
                                            containerColor = HestiaOrange.copy(alpha = 0.15f),
                                            contentColor = HestiaOrange
                                        ) {
                                            Text("+${chore.points} b.", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                        }
                                        Text(
                                            text = "${chore.estimated_minutes} min",
                                            fontSize = 11.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }

                                Button(
                                    onClick = {
                                        coroutineScope.launch {
                                            repository.completeChore(chore.id)
                                            refreshData()
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = HestiaOrange),
                                    shape = RoundedCornerShape(10.dp),
                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                                ) {
                                    Text("Splněno", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }

                // Recent Activities (Audit Log)
                item {
                    SectionHeader(title = "Nedávná rodinná aktivita")
                }

                if (activities.isEmpty()) {
                    item {
                        EmptyStateCard(
                            message = "Zatím žádné zaznamenané aktivity.",
                            icon = Icons.Default.History
                        )
                    }
                } else {
                    items(activities.take(5)) { act ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                        ) {
                            val userColor = try {
                                Color(android.graphics.Color.parseColor(act.user_color ?: "#F97316"))
                            } catch (_: Exception) {
                                HestiaOrange
                            }

                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(CircleShape)
                                    .background(userColor),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = act.displayName.take(1).uppercase(),
                                    color = Color.White,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = act.title,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = MaterialTheme.colorScheme.onBackground
                                )
                                Text(
                                    text = "${act.displayName} • ${act.created_at.take(16).replace('T', ' ')}",
                                    fontSize = 10.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }

                item { Spacer(modifier = Modifier.height(16.dp)) }
            }
        }
    }

    // Panic Mode Dialog
    if (showPanicDialog && panicModeResponse != null) {
        AlertDialog(
            onDismissRequest = { showPanicDialog = false },
            icon = { Icon(Icons.Default.Bolt, contentDescription = null, tint = StatusRed) },
            title = { Text("Panic Mode (15min sprint)") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = panicModeResponse!!.message,
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    panicModeResponse!!.panic_tasks.forEach { task ->
                        Card(
                            shape = RoundedCornerShape(10.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(10.dp)) {
                                Text(task.title, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                Text("${task.room} • ${task.estimated_minutes} min • +${task.points} b.", fontSize = 10.sp, color = HestiaOrange)
                                if (task.tip.isNotBlank()) {
                                    Text("Tip: ${task.tip}", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showPanicDialog = false }) {
                    Text("Rozumím, jdeme na to!")
                }
            }
        )
    }
}
