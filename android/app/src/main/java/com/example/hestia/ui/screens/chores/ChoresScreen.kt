package com.example.hestia.ui.screens.chores

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hestia.data.models.*
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.theme.HestiaOrange
import com.example.hestia.theme.StatusBlue
import com.example.hestia.theme.StatusGreen
import com.example.hestia.theme.StatusRed
import com.example.hestia.ui.components.ChoreWheelDialog
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
    var members by remember { mutableStateOf<List<PublicMember>>(emptyList()) }
    var leaderboard by remember { mutableStateOf<List<LeaderboardMember>>(emptyList()) }
    var currentUser by remember { mutableStateOf<User?>(null) }
    var selectedTab by remember { mutableIntStateOf(0) } // 0 = Moje úkoly, 1 = Všechny, 2 = Síň slávy
    var isLoading by remember { mutableStateOf(true) }

    var showPanicDialog by remember { mutableStateOf(false) }
    var panicModeResponse by remember { mutableStateOf<PanicModeResponse?>(null) }
    var showWheelDialog by remember { mutableStateOf(false) }
    var showAddChoreDialog by remember { mutableStateOf(false) }
    var snackbarMessage by remember { mutableStateOf<String?>(null) }

    fun refreshChores() {
        coroutineScope.launch {
            isLoading = true
            currentUser = repository.preferences.currentUserFlow.first()
            repository.getChores().onSuccess { chores = it }
            repository.getPublicMembers().onSuccess { members = it }
            repository.getLeaderboard().onSuccess { leaderboard = it }
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
        containerColor = MaterialTheme.colorScheme.background,
        floatingActionButton = {
            if (selectedTab != 2) {
                FloatingActionButton(
                    onClick = { showAddChoreDialog = true },
                    containerColor = HestiaOrange,
                    contentColor = Color.White,
                    shape = CircleShape
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Přidat úkol")
                }
            }
        },
        snackbarHost = {
            snackbarMessage?.let { msg ->
                Snackbar(
                    modifier = Modifier.padding(16.dp),
                    action = {
                        TextButton(onClick = { snackbarMessage = null }) {
                            Text("OK", color = HestiaOrange)
                        }
                    }
                ) {
                    Text(msg)
                }
            }
        }
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
                // Header & Action Buttons
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

                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        // Wheel of fortune button
                        FilledTonalButton(
                            onClick = { showWheelDialog = true },
                            colors = ButtonDefaults.filledTonalButtonColors(
                                containerColor = HestiaOrange.copy(alpha = 0.15f),
                                contentColor = HestiaOrange
                            ),
                            shape = RoundedCornerShape(10.dp),
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Icon(Icons.Default.Casino, contentDescription = null, modifier = Modifier.size(15.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Kolo štěstí", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }

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
                            shape = RoundedCornerShape(10.dp),
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Icon(Icons.Default.Bolt, contentDescription = null, modifier = Modifier.size(15.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Panic Mode", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                // Tabs: Moje úkoly / Všechny / Síň slávy
                PrimaryTabRow(
                    selectedTabIndex = selectedTab,
                    containerColor = Color.Transparent,
                    contentColor = HestiaOrange,
                    divider = {}
                ) {
                    Tab(
                        selected = selectedTab == 0,
                        onClick = { selectedTab = 0 },
                        text = { Text("Moje (${myChores.size})", fontSize = 12.sp) }
                    )
                    Tab(
                        selected = selectedTab == 1,
                        onClick = { selectedTab = 1 },
                        text = { Text("Všechny (${chores.size})", fontSize = 12.sp) }
                    )
                    Tab(
                        selected = selectedTab == 2,
                        onClick = { selectedTab = 2 },
                        text = { Text("Síň slávy 🏆", fontSize = 12.sp) }
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                when (selectedTab) {
                    // TAB 0 & 1: Chores List
                    0, 1 -> {
                        if (displayedChores.isEmpty()) {
                            EmptyStateCard(
                                message = if (selectedTab == 0) "Nemáte žádné přidělené úkoly!" else "Žádné úkoly k zobrazení.",
                                icon = Icons.Default.CheckCircle
                            )
                        } else {
                            LazyColumn(
                                verticalArrangement = Arrangement.spacedBy(10.dp),
                                modifier = Modifier.fillMaxSize(),
                                contentPadding = PaddingValues(bottom = 80.dp)
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
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Column(modifier = Modifier.weight(1f)) {
                                                    Text(
                                                        text = chore.title,
                                                        fontWeight = FontWeight.Bold,
                                                        fontSize = 15.sp
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

                                                // Points badge
                                                Surface(
                                                    shape = RoundedCornerShape(8.dp),
                                                    color = HestiaOrange.copy(alpha = 0.15f)
                                                ) {
                                                    Text(
                                                        text = "+${chore.points} b.",
                                                        fontWeight = FontWeight.Bold,
                                                        fontSize = 12.sp,
                                                        color = HestiaOrange,
                                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                                    )
                                                }
                                            }

                                            Spacer(modifier = Modifier.height(8.dp))

                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Row(
                                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                                    verticalAlignment = Alignment.CenterVertically
                                                ) {
                                                    // Frequency
                                                    Surface(
                                                        shape = RoundedCornerShape(4.dp),
                                                        color = MaterialTheme.colorScheme.surfaceVariant
                                                    ) {
                                                        Text(
                                                            text = when (chore.frequency) {
                                                                "daily" -> "Denně"
                                                                "weekly" -> "Týdně"
                                                                "biweekly" -> "1x za 14 dní"
                                                                "monthly" -> "Měsíčně"
                                                                else -> chore.frequency
                                                            },
                                                            fontSize = 10.sp,
                                                            fontWeight = FontWeight.SemiBold,
                                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                                        )
                                                    }

                                                    // Assignee
                                                    val assignee = members.find { it.id == chore.current_assignee_id }
                                                    if (assignee != null) {
                                                        val assigneeColor = try {
                                                            Color(android.graphics.Color.parseColor(assignee.avatar_color ?: "#F97316"))
                                                        } catch (_: Exception) {
                                                            HestiaOrange
                                                        }

                                                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                                            Box(
                                                                modifier = Modifier
                                                                    .size(16.dp)
                                                                    .clip(CircleShape)
                                                                    .background(assigneeColor)
                                                            )
                                                            Text(
                                                                text = assignee.display_name,
                                                                fontSize = 11.sp,
                                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                                            )
                                                        }
                                                    }
                                                }

                                                // Complete button
                                                Button(
                                                    onClick = {
                                                        coroutineScope.launch {
                                                            repository.completeChore(chore.id).onSuccess { res ->
                                                                refreshChores()
                                                                snackbarMessage = "Úkol splněn! Získáno +${res.points_awarded} bodů"
                                                            }
                                                        }
                                                    },
                                                    shape = RoundedCornerShape(8.dp),
                                                    colors = ButtonDefaults.buttonColors(containerColor = StatusGreen),
                                                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                                                ) {
                                                    Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(14.dp))
                                                    Spacer(modifier = Modifier.width(4.dp))
                                                    Text("Splněno", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // TAB 2: Leaderboard (Síň slávy)
                    2 -> {
                        if (leaderboard.isEmpty()) {
                            EmptyStateCard(
                                message = "Zatím nebyly zaznamenány žádné body za úkoly.",
                                icon = Icons.Default.EmojiEvents
                            )
                        } else {
                            LazyColumn(
                                verticalArrangement = Arrangement.spacedBy(10.dp),
                                modifier = Modifier.fillMaxSize(),
                                contentPadding = PaddingValues(bottom = 80.dp)
                            ) {
                                items(leaderboard.sortedByDescending { it.weekly_points }) { member ->
                                    val rank = leaderboard.indexOf(member) + 1
                                    val medal = when (rank) {
                                        1 -> "🥇"
                                        2 -> "🥈"
                                        3 -> "🥉"
                                        else -> "#$rank"
                                    }

                                    Card(
                                        shape = RoundedCornerShape(14.dp),
                                        colors = CardDefaults.cardColors(
                                            containerColor = if (rank == 1) HestiaOrange.copy(alpha = 0.08f) else MaterialTheme.colorScheme.surface
                                        ),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(14.dp),
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                                            ) {
                                                Text(text = medal, fontSize = 20.sp, fontWeight = FontWeight.Bold)

                                                val avatarColor = try {
                                                    Color(android.graphics.Color.parseColor(member.avatar_color))
                                                } catch (_: Exception) {
                                                    HestiaOrange
                                                }

                                                Box(
                                                    modifier = Modifier
                                                        .size(38.dp)
                                                        .clip(CircleShape)
                                                        .background(avatarColor),
                                                    contentAlignment = Alignment.Center
                                                ) {
                                                    Text(
                                                        text = member.display_name.take(1).uppercase(),
                                                        color = Color.White,
                                                        fontWeight = FontWeight.Bold,
                                                        fontSize = 16.sp
                                                    )
                                                }

                                                Column {
                                                    Text(text = member.display_name, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                                    Text(
                                                        text = "${member.chores_completed_count} splněných úkolů",
                                                        fontSize = 11.sp,
                                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                                    )
                                                }
                                            }

                                            Column(horizontalAlignment = Alignment.End) {
                                                Text(
                                                    text = "${member.weekly_points} b.",
                                                    fontWeight = FontWeight.Bold,
                                                    fontSize = 16.sp,
                                                    color = HestiaOrange
                                                )
                                                Text(
                                                    text = "celkem ${member.total_points} b.",
                                                    fontSize = 10.sp,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Wheel of Fortune Dialog
    if (showWheelDialog) {
        ChoreWheelDialog(
            members = members,
            chores = chores,
            onDismiss = { showWheelDialog = false },
            onAssign = { choreId, memberId ->
                coroutineScope.launch {
                    refreshChores()
                    snackbarMessage = "Úkol byl úspěšně vylosován a přiřazen!"
                }
            }
        )
    }

    // Panic Mode Dialog
    if (showPanicDialog && panicModeResponse != null) {
        AlertDialog(
            onDismissRequest = { showPanicDialog = false },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Default.Bolt, contentDescription = null, tint = StatusRed)
                    Text("Panic Mode - 15min Úklid", fontWeight = FontWeight.Bold)
                }
            },
            text = {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    item {
                        Text(
                            text = panicModeResponse!!.message.ifBlank { "Rychlé krizové úkoly před nečekanou návštěvou:" },
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    items(panicModeResponse!!.panic_tasks) { task ->
                        Card(
                            shape = RoundedCornerShape(10.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(10.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(text = task.title, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                    Text(text = "${task.room} • cca ${task.estimated_minutes} min", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                                Surface(shape = RoundedCornerShape(6.dp), color = StatusRed.copy(alpha = 0.15f)) {
                                    Text("+${task.points} b.", color = StatusRed, fontWeight = FontWeight.Bold, fontSize = 11.sp, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(onClick = { showPanicDialog = false }, colors = ButtonDefaults.buttonColors(containerColor = StatusRed)) {
                    Text("Jdeme na to!")
                }
            }
        )
    }

    // Add Chore Dialog
    if (showAddChoreDialog) {
        var title by remember { mutableStateOf("") }
        var description by remember { mutableStateOf("") }
        var room by remember { mutableStateOf("Společné prostory") }
        var points by remember { mutableStateOf("10") }
        var frequency by remember { mutableStateOf("weekly") }
        var assigneeId by remember { mutableStateOf<Int?>(currentUser?.id) }

        val rooms = listOf("Obývací pokoj", "Kuchyně", "Koupelna", "Ložnice", "Chodba", "Zahrada", "Garáž")
        val frequencies = listOf("daily" to "Denně", "weekly" to "Týdně", "biweekly" to "14 dní", "monthly" to "Měsíčně")

        AlertDialog(
            onDismissRequest = { showAddChoreDialog = false },
            title = { Text("Přidat nový úkol", fontWeight = FontWeight.Bold) },
            text = {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    item {
                        OutlinedTextField(
                            value = title,
                            onValueChange = { title = it },
                            label = { Text("Název úkolu *") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }

                    item {
                        OutlinedTextField(
                            value = description,
                            onValueChange = { description = it },
                            label = { Text("Popis") },
                            modifier = Modifier.fillMaxWidth(),
                            maxLines = 2
                        )
                    }

                    item {
                        Text("Místnost:", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        androidx.compose.foundation.lazy.LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            items(rooms) { r ->
                                FilterChip(
                                    selected = room == r,
                                    onClick = { room = r },
                                    label = { Text(r, fontSize = 11.sp) }
                                )
                            }
                        }
                    }

                    item {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(
                                value = points,
                                onValueChange = { points = it },
                                label = { Text("Body") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )

                            Column(modifier = Modifier.weight(1.5f)) {
                                Text("Frekvence:", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                    frequencies.take(2).forEach { (k, l) ->
                                        FilterChip(
                                            selected = frequency == k,
                                            onClick = { frequency = k },
                                            label = { Text(l, fontSize = 10.sp) }
                                        )
                                    }
                                }
                            }
                        }
                    }

                    if (members.isNotEmpty()) {
                        item {
                            Text("Přiřadit členovi:", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            androidx.compose.foundation.lazy.LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                items(members) { m ->
                                    FilterChip(
                                        selected = assigneeId == m.id,
                                        onClick = { assigneeId = m.id },
                                        label = { Text(m.display_name, fontSize = 11.sp) }
                                    )
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (title.isNotBlank()) {
                            coroutineScope.launch {
                                repository.createChore(
                                    ChoreCreate(
                                        title = title.trim(),
                                        description = description.trim().ifBlank { null },
                                        room = room,
                                        points = points.toIntOrNull() ?: 10,
                                        frequency = frequency,
                                        current_assignee_id = assigneeId
                                    )
                                ).onSuccess {
                                    showAddChoreDialog = false
                                    refreshChores()
                                    snackbarMessage = "Úkol vytvořen!"
                                }
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = HestiaOrange)
                ) {
                    Text("Přidat úkol")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddChoreDialog = false }) {
                    Text("Zrušit")
                }
            }
        )
    }
}
