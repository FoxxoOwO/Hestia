package com.example.hestia.ui.screens.chores

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hestia.data.models.Chore
import com.example.hestia.data.models.PanicModeResponse
import com.example.hestia.data.models.User
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.theme.HestiaOrange
import com.example.hestia.theme.StatusBlue
import com.example.hestia.theme.StatusRed
import com.example.hestia.ui.components.EmptyStateCard
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

@Composable
fun ChoresScreen(
    repository: HestiaRepository,
    modifier: Modifier = Modifier
) {
    val coroutineScope = rememberCoroutineScope()
    var chores by remember { mutableStateOf<List<Chore>>(emptyList()) }
    var currentUser by remember { mutableStateOf<User?>(null) }
    var selectedTab by remember { mutableStateOf(0) } // 0 = Moje úkoly, 1 = Všechny
    var isLoading by remember { mutableStateOf(true) }

    var showPanicDialog by remember { mutableStateOf(false) }
    var panicModeResponse by remember { mutableStateOf<PanicModeResponse?>(null) }

    fun refreshChores() {
        coroutineScope.launch {
            isLoading = true
            currentUser = repository.preferences.currentUserFlow.first()
            repository.getChores().onSuccess { chores = it }
            isLoading = false
        }
    }

    LaunchedEffect(Unit) {
        refreshChores()
    }

    val myChores = chores.filter { chore ->
        currentUser != null && chore.current_assignee_id == currentUser!!.id
    }
    val displayedChores = if (selectedTab == 0 && myChores.isNotEmpty()) myChores else chores

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = HestiaOrange)
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(horizontal = 16.dp)
            ) {
                // Header & Panic Mode Button
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Úklid a povinnosti",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )

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
                        shape = RoundedCornerShape(10.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Icon(Icons.Default.Bolt, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Panic Mode", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }

                // Tabs: Moje úkoly / Všechny
                PrimaryTabRow(
                    selectedTabIndex = selectedTab,
                    containerColor = Color.Transparent,
                    contentColor = HestiaOrange,
                    divider = {}
                ) {
                    Tab(
                        selected = selectedTab == 0,
                        onClick = { selectedTab = 0 },
                        text = { Text("Moje úkoly (${myChores.size})") }
                    )
                    Tab(
                        selected = selectedTab == 1,
                        onClick = { selectedTab = 1 },
                        text = { Text("Všechny (${chores.size})") }
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                if (displayedChores.isEmpty()) {
                    EmptyStateCard(
                        message = if (selectedTab == 0) "Nemáte žádné přidělené úkoly!" else "Žádné úkoly k zobrazení.",
                        icon = Icons.Default.CheckCircle
                    )
                } else {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.fillMaxSize()
                    ) {
                        items(displayedChores, key = { it.id }) { chore ->
                            Card(
                                shape = RoundedCornerShape(14.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.Top
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = chore.title,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 15.sp,
                                                color = MaterialTheme.colorScheme.onSurface
                                            )
                                            if (!chore.description.isNullOrBlank()) {
                                                Text(
                                                    text = chore.description,
                                                    fontSize = 12.sp,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                                    modifier = Modifier.padding(top = 2.dp)
                                                )
                                            }
                                        }

                                        Badge(
                                            containerColor = HestiaOrange.copy(alpha = 0.15f),
                                            contentColor = HestiaOrange
                                        ) {
                                            Text(
                                                text = "+${chore.points} b.",
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 11.sp,
                                                modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                            )
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(10.dp))

                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Row(
                                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            AssistChip(
                                                onClick = {},
                                                label = { Text("${chore.estimated_minutes} min", fontSize = 10.sp) },
                                                leadingIcon = {
                                                    Icon(Icons.Default.Schedule, contentDescription = null, modifier = Modifier.size(12.dp))
                                                }
                                            )
                                            if (chore.is_rotation_enabled) {
                                                AssistChip(
                                                    onClick = {},
                                                    label = { Text("Rotuje", fontSize = 10.sp) },
                                                    leadingIcon = {
                                                        Icon(Icons.Default.Sync, contentDescription = null, modifier = Modifier.size(12.dp))
                                                    }
                                                )
                                            }
                                        }

                                        Button(
                                            onClick = {
                                                coroutineScope.launch {
                                                    repository.completeChore(chore.id)
                                                    refreshChores()
                                                }
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = HestiaOrange),
                                            shape = RoundedCornerShape(10.dp),
                                            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                                        ) {
                                            Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(14.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("Splněno", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }
                        }

                        item { Spacer(modifier = Modifier.height(24.dp)) }
                    }
                }
            }
        }
    }

    // Panic Mode Dialog
    if (showPanicDialog && panicModeResponse != null) {
        AlertDialog(
            onDismissRequest = { showPanicDialog = false },
            icon = { Icon(Icons.Default.Bolt, contentDescription = null, tint = StatusRed) },
            title = { Text("Panic Mode: 15 minutový blesk") },
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
                    Text("Rozumím")
                }
            }
        )
    }
}
