package com.example.hestia.ui.screens.chores

import androidx.compose.foundation.clickable
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
import com.example.hestia.data.models.*
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.theme.HestiaOrange
import com.example.hestia.theme.StatusGreen
import com.example.hestia.theme.StatusRed
import com.example.hestia.theme.StatusYellow
import com.example.hestia.ui.components.*
import com.example.hestia.util.Fmt
import com.example.hestia.util.Labels
import com.example.hestia.util.friendly
import kotlinx.coroutines.launch

@Composable
fun ChoresScreen(repository: HestiaRepository) {
    val scope = rememberCoroutineScope()
    var tab by remember { mutableStateOf(0) }
    var chores by remember { mutableStateOf<List<Chore>>(emptyList()) }
    var leaderboard by remember { mutableStateOf<List<LeaderboardMember>>(emptyList()) }
    var rewards by remember { mutableStateOf<List<ChoreRewardItem>>(emptyList()) }
    var panicTasks by remember { mutableStateOf<List<Chore>>(emptyList()) }
    var members by remember { mutableStateOf<List<User>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    var roomFilter by remember { mutableStateOf<String?>(null) }
    var onlyOverdue by remember { mutableStateOf(false) }
    var search by remember { mutableStateOf("") }

    var showCreate by remember { mutableStateOf(false) }
    var editing by remember { mutableStateOf<Chore?>(null) }
    var deleteTarget by remember { mutableStateOf<Chore?>(null) }
    var completing by remember { mutableStateOf<Chore?>(null) }
    var assigning by remember { mutableStateOf<Chore?>(null) }
    var showRewardForm by remember { mutableStateOf(false) }
    var showWheel by remember { mutableStateOf(false) }
    var redeemTarget by remember { mutableStateOf<ChoreRewardItem?>(null) }
    var message by remember { mutableStateOf<String?>(null) }

    suspend fun loadChores() {
        loading = true
        repository.getChores(room = roomFilter, search = search.ifBlank { null })
            .onSuccess { list ->
                chores = if (onlyOverdue) list.filter { it.is_overdue } else list
                error = null
            }
            .onFailure { error = it.friendly() }
        loading = false
    }

    suspend fun loadAll() {
        loadChores()
        repository.getLeaderboard().onSuccess { leaderboard = it }
        repository.getChoreRewards().onSuccess { rewards = it }
        repository.getPanicModeTasks().onSuccess { panicTasks = it }
        repository.getUsers().onSuccess { members = it }
    }

    LaunchedEffect(roomFilter, onlyOverdue, search) {
        if (search.isNotBlank()) kotlinx.coroutines.delay(350)
        loadChores()
    }
    LaunchedEffect(tab) { if (tab != 0) loadAll() }


    Column(Modifier.fillMaxSize()) {
        ScrollableTabRow(
            selectedTabIndex = tab,
            containerColor = MaterialTheme.colorScheme.surface,
            edgePadding = 8.dp
        ) {
            listOf("Úkoly", "Žebříček", "Odměny", "Panic mode").forEachIndexed { i, label ->
                Tab(selected = tab == i, onClick = { tab = i }, text = { Text(label, fontSize = 12.sp) })
            }
        }

        ErrorBox(error, onRetry = { scope.launch { loadAll() } })
        message?.let {
            Card(
                colors = CardDefaults.cardColors(containerColor = StatusGreen.copy(alpha = 0.12f)),
                modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 4.dp)
            ) {
                Text(it, color = StatusGreen, fontSize = 12.sp, modifier = Modifier.padding(10.dp))
            }
        }

        when (tab) {
            0 -> Column {
                Column(Modifier.padding(horizontal = 12.dp)) {
                    HestiaField(
                        value = search,
                        onValueChange = { search = it },
                        label = "Hledat úkol"
                    )
                    Spacer(Modifier.height(6.dp))
                    ChipSelector(
                        options = Labels.rooms,
                        selected = roomFilter,
                        onSelect = { roomFilter = it.ifBlank { null } },
                        includeAll = true,
                        allLabel = "Všechny místnosti"
                    )
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        FilterChip(
                            selected = onlyOverdue,
                            onClick = { onlyOverdue = !onlyOverdue },
                            label = { Text("Jen po termínu") }
                        )
                        Spacer(Modifier.width(8.dp))
                        AssistChip(
                            onClick = { showWheel = true },
                            label = { Text("Kolo úkolů") },
                            leadingIcon = { Icon(Icons.Default.Casino, null, modifier = Modifier.size(16.dp)) }
                        )
                    }
                }

                if (loading) {
                    LoadingBox()
                } else {
                    LazyColumn(
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                        modifier = Modifier.fillMaxSize()
                    ) {
                        if (chores.isEmpty()) {
                            item { EmptyState(Icons.Default.CheckCircle, "Žádné úkoly", "Vytvořte první úkol pro domácnost.") }
                        }
                        items(chores, key = { it.id }) { chore ->
                            ChoreCard(
                                chore = chore,
                                onComplete = { completing = chore },
                                onReassign = { assigning = chore },
                                onEdit = { editing = chore },
                                onDelete = { deleteTarget = chore },
                                onAddSupply = {
                                    scope.launch {
                                        repository.addChoreSupplyToShopping(chore.id, null)
                                            .onSuccess { message = "Potřeby přidány do nákupního seznamu" }
                                            .onFailure { error = it.friendly() }
                                    }
                                }
                            )
                        }
                        item { Spacer(Modifier.height(90.dp)) }
                    }
                }
            }

            1 -> LazyColumn(contentPadding = PaddingValues(12.dp)) {
                if (leaderboard.isEmpty()) {
                    item { EmptyState(Icons.Default.EmojiEvents, "Žebříček je prázdný", "Splňte první úkol a získejte body.") }
                }
                items(leaderboard) { m ->
                    Card(
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)
                    ) {
                        Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier.size(38.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Surface(
                                    shape = androidx.compose.foundation.shape.CircleShape,
                                    color = HestiaOrange.copy(alpha = 0.15f),
                                    modifier = Modifier.size(36.dp)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Text(
                                            (m.display_name.ifBlank { m.username }).take(1).uppercase(),
                                            fontWeight = FontWeight.Bold,
                                            color = HestiaOrange
                                        )
                                    }
                                }
                            }
                            Spacer(Modifier.width(10.dp))
                            Column(Modifier.weight(1f)) {
                                Text(m.display_name.ifBlank { m.username }, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                                Text(
                                    "${m.chores_completed_count} úkolů • ${m.weekly_points} b. tento týden",
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text("${m.total_points}", fontWeight = FontWeight.Black, color = HestiaOrange, fontSize = 16.sp)
                                Text("${m.available_points} volných", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                }
                item { Spacer(Modifier.height(20.dp)) }
            }

            2 -> LazyColumn(contentPadding = PaddingValues(12.dp)) {
                item {
                    Row(
                        Modifier.fillMaxWidth().padding(bottom = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Odměny za body", fontWeight = FontWeight.Bold)
                        TextButton(onClick = { showRewardForm = true }) { Text("+ Nová odměna") }
                    }
                }
                if (rewards.isEmpty()) {
                    item { EmptyState(Icons.Default.CardGiftcard, "Zatím žádné odměny", "Přidejte odměnu, kterou si členové koupí za body.") }
                }
                items(rewards, key = { it.id }) { r ->
                    Card(shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                        Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.CardGiftcard, null, tint = HestiaOrange)
                            Spacer(Modifier.width(10.dp))
                            Column(Modifier.weight(1f)) {
                                Text(r.title, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                                r.description?.let { Text(it, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                                Text("${r.cost_points} bodů", fontSize = 11.sp, color = HestiaOrange, fontWeight = FontWeight.SemiBold)
                            }
                            Button(
                                onClick = { redeemTarget = r },
                                shape = RoundedCornerShape(10.dp),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
                            ) { Text("Uplatnit", fontSize = 12.sp) }
                        }
                    }
                }
                item { Spacer(Modifier.height(20.dp)) }
            }

            else -> LazyColumn(contentPadding = PaddingValues(12.dp)) {
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = StatusRed.copy(alpha = 0.1f)),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp)
                    ) {
                        Column(Modifier.padding(12.dp)) {
                            Text("PANIC MODE", fontWeight = FontWeight.Black, color = StatusRed)
                            Text(
                                "Rychlé úkoly pro nepořádek před návštěvou — nejkratší a nejdůležitější věci první.",
                                fontSize = 11.sp
                            )
                        }
                    }
                }
                if (panicTasks.isEmpty()) {
                    item { EmptyState(Icons.Default.Bolt, "Nic k řešení", "Panic mode nemá žádné úkoly.") }
                }
                items(panicTasks, key = { it.id }) { chore ->
                    ChoreCard(
                        chore = chore,
                        onComplete = { completing = chore },
                        onReassign = { assigning = chore },
                        onEdit = { editing = chore },
                        onDelete = { deleteTarget = chore },
                        onAddSupply = {}
                    )
                }
                item { Spacer(Modifier.height(20.dp)) }
            }
        }
    }

    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.BottomEnd) {
        if (tab == 0) {
            ExtendedFloatingActionButton(
                onClick = { showCreate = true },
                containerColor = HestiaOrange,
                contentColor = Color.White,
                modifier = Modifier.padding(20.dp),
                icon = { Icon(Icons.Default.Add, null) },
                text = { Text("Nový úkol") }
            )
        }
    }

    if (showCreate || editing != null) {
        val initial = editing
        ChoreFormDialog(
            initial = initial,
            members = members,
            onDismiss = { showCreate = false; editing = null },
            onSave = { create ->
                scope.launch {
                    val result = if (initial == null) {
                        repository.createChore(create)
                    } else {
                        repository.updateChore(
                            initial.id,
                            ChoreUpdate(
                                title = create.title,
                                description = create.description,
                                room = create.room,
                                category = create.category,
                                frequency = create.frequency,
                                interval_days = create.interval_days,
                                points = create.points,
                                estimated_minutes = create.estimated_minutes,
                                is_rotation_enabled = create.is_rotation_enabled,
                                rotation_member_ids = create.rotation_member_ids,
                                current_assignee_id = create.current_assignee_id,
                                due_date = create.due_date,
                                cleaning_supplies_needed = create.cleaning_supplies_needed,
                                is_appliance_maintenance = create.is_appliance_maintenance,
                                appliance_name = create.appliance_name
                            )
                        )
                    }
                    result.onSuccess {
                        showCreate = false
                        editing = null
                        loadAll()
                    }.onFailure { error = it.friendly() }
                }
            }
        )
    }

    completing?.let { chore ->
        CompleteChoreDialog(
            chore = chore,
            onDismiss = { completing = null },
            onConfirm = { notes, points ->
                scope.launch {
                    repository.completeChore(chore.id, notes.ifBlank { null }, points)
                        .onSuccess {
                            message = "Úkol „${chore.title}“ splněn (+${points ?: chore.points} b.)"
                            completing = null
                            loadAll()
                        }
                        .onFailure { error = it.friendly() }
                }
            }
        )
    }

    assigning?.let { chore ->
        AlertDialog(
            onDismissRequest = { assigning = null },
            title = { Text("Přiřadit úkol") },
            text = {
                Column {
                    members.forEach { m ->
                        Row(
                            Modifier.fillMaxWidth().clickable {
                                scope.launch {
                                    repository.reassignChore(chore.id, m.id)
                                        .onSuccess {
                                            message = "Úkol přiřazen: ${m.display_name}"
                                            assigning = null
                                            loadAll()
                                        }
                                        .onFailure { error = it.friendly() }
                                }
                            }.padding(vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.Person, null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(10.dp))
                            Text(m.display_name.ifBlank { m.username })
                        }
                    }
                }
            },
            confirmButton = {},
            dismissButton = { TextButton(onClick = { assigning = null }) { Text("Zavřít") } }
        )
    }

    deleteTarget?.let { chore ->
        ConfirmDialog(
            title = "Smazat úkol",
            message = "Smazat „${chore.title}“? Historie zůstane v aktivitách.",
            onConfirm = {
                scope.launch {
                    repository.deleteChore(chore.id).onSuccess { loadAll() }.onFailure { error = it.friendly() }
                }
            },
            onDismiss = { deleteTarget = null }
        )
    }

    if (showRewardForm) {
        var title by remember { mutableStateOf("") }
        var desc by remember { mutableStateOf("") }
        var cost by remember { mutableStateOf("50") }
        DialogScaffold(
            title = "Nová odměna",
            onDismiss = { showRewardForm = false },
            confirmEnabled = title.isNotBlank(),
            onConfirm = {
                scope.launch {
                    repository.createChoreReward(
                        ChoreRewardCreate(
                            title = title.trim(),
                            description = desc.ifBlank { null },
                            cost_points = cost.toIntOrNull() ?: 50
                        )
                    ).onSuccess {
                        showRewardForm = false
                        loadAll()
                    }.onFailure { error = it.friendly() }
                }
            }
        ) {
            HestiaField(title, { title = it }, "Název odměny")
            Spacer(Modifier.height(8.dp))
            HestiaField(desc, { desc = it }, "Popis", singleLine = false, minLines = 2)
            Spacer(Modifier.height(8.dp))
            HestiaNumberField(cost, { cost = it }, "Cena v bodech")
        }
    }

    redeemTarget?.let { reward ->
        ConfirmDialog(
            title = "Uplatnit odměnu",
            message = "Uplatnit „${reward.title}“ za ${reward.cost_points} bodů?",
            confirmLabel = "Uplatnit",
            destructive = false,
            onConfirm = {
                scope.launch {
                    repository.redeemChoreReward(reward.id)
                        .onSuccess { message = "Odměna uplatněna: ${reward.title}" }
                        .onFailure { error = it.friendly() }
                }
            },
            onDismiss = { redeemTarget = null }
        )
    }

    if (showWheel) {
        val publicMembers = remember(members) {
            members.map { PublicMember(id = it.id, username = it.username, display_name = it.display_name, avatar_color = it.avatar_color) }
        }
        ChoreWheelDialog(
            members = publicMembers,
            chores = chores,
            onDismiss = { showWheel = false },
            onAssign = { choreId, memberId ->
                scope.launch {
                    repository.reassignChore(choreId, memberId)
                        .onSuccess { loadAll() }
                        .onFailure { error = it.friendly() }
                }
            }
        )
    }
}

@Composable
private fun ChoreCard(
    chore: Chore,
    onComplete: () -> Unit,
    onReassign: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
    onAddSupply: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (chore.is_overdue) StatusRed.copy(alpha = 0.07f) else MaterialTheme.colorScheme.surface
        ),
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)
    ) {
        Column(Modifier.padding(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(chore.title, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                        if (chore.is_overdue) {
                            Spacer(Modifier.width(6.dp))
                            StatusPill("Po termínu", StatusRed)
                        }
                    }
                    Text(
                        "${Labels.label(Labels.rooms, chore.room)} • ${Labels.label(Labels.choreFrequencies, chore.frequency)} • ${chore.points} b.",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    chore.current_assignee?.let {
                        Text("Na řadě: ${it.display_name}", fontSize = 11.sp, color = HestiaOrange)
                    }
                    chore.due_date?.let {
                        Text(
                            "Termín: ${Fmt.date(it)} (${Fmt.daysUntilText(chore.days_until_due ?: Fmt.daysUntil(it))})",
                            fontSize = 11.sp,
                            color = if (chore.is_overdue) StatusRed else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                FilledTonalButton(
                    onClick = onComplete,
                    shape = RoundedCornerShape(10.dp),
                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Icon(Icons.Default.Check, null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Hotovo", fontSize = 12.sp)
                }
            }
            if (!chore.description.isNullOrBlank()) {
                Spacer(Modifier.height(6.dp))
                Text(chore.description, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                IconButton(onClick = onReassign, modifier = Modifier.size(32.dp)) {
                    Icon(Icons.Default.SwapHoriz, "Přiřadit", modifier = Modifier.size(16.dp))
                }
                IconButton(onClick = onEdit, modifier = Modifier.size(32.dp)) {
                    Icon(Icons.Default.Edit, "Upravit", modifier = Modifier.size(16.dp))
                }
                if (!chore.cleaning_supplies_needed.isNullOrBlank()) {
                    IconButton(onClick = onAddSupply, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Default.ShoppingCart, "Potřeby do nákupu", modifier = Modifier.size(16.dp))
                    }
                }
                Spacer(Modifier.weight(1f))
                IconButton(onClick = onDelete, modifier = Modifier.size(32.dp)) {
                    Icon(Icons.Default.Delete, "Smazat", tint = StatusRed, modifier = Modifier.size(16.dp))
                }
            }
        }
    }
}

@Composable
private fun CompleteChoreDialog(
    chore: Chore,
    onDismiss: () -> Unit,
    onConfirm: (String, Int?) -> Unit
) {
    var notes by remember { mutableStateOf("") }
    var points by remember { mutableStateOf(chore.points.toString()) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Splnit úkol") },
        text = {
            Column {
                Text(chore.title, fontWeight = FontWeight.SemiBold)
                Spacer(Modifier.height(10.dp))
                HestiaNumberField(points, { points = it }, "Body za úkol")
                Spacer(Modifier.height(8.dp))
                HestiaField(notes, { notes = it }, "Poznámka", singleLine = false, minLines = 2)
            }
        },
        confirmButton = {
            TextButton(onClick = { onConfirm(notes, points.toIntOrNull()) }) {
                Text("Splnit", color = HestiaOrange, fontWeight = FontWeight.SemiBold)
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Zrušit") } }
    )
}

@Composable
private fun ChoreFormDialog(
    initial: Chore?,
    members: List<User>,
    onDismiss: () -> Unit,
    onSave: (ChoreCreate) -> Unit
) {
    var title by remember { mutableStateOf(initial?.title ?: "") }
    var description by remember { mutableStateOf(initial?.description ?: "") }
    var room by remember { mutableStateOf(initial?.room ?: "general") }
    var category by remember { mutableStateOf(initial?.category ?: "routine") }
    var frequency by remember { mutableStateOf(initial?.frequency ?: "weekly") }
    var intervalDays by remember { mutableStateOf((initial?.interval_days ?: 7).toString()) }
    var points by remember { mutableStateOf((initial?.points ?: 10).toString()) }
    var minutes by remember { mutableStateOf((initial?.estimated_minutes ?: 15).toString()) }
    var rotationEnabled by remember { mutableStateOf(initial?.is_rotation_enabled ?: true) }
    var rotationIds by remember { mutableStateOf(initial?.rotation_member_ids_list?.toSet() ?: emptySet()) }
    var assigneeId by remember { mutableStateOf(initial?.current_assignee_id) }
    var dueDate by remember { mutableStateOf(initial?.due_date) }
    var supplies by remember { mutableStateOf(initial?.cleaning_supplies_needed ?: "") }
    var appliance by remember { mutableStateOf(initial?.is_appliance_maintenance ?: false) }
    var applianceName by remember { mutableStateOf(initial?.appliance_name ?: "") }

    DialogScaffold(
        title = if (initial == null) "Nový úkol" else "Upravit úkol",
        onDismiss = onDismiss,
        confirmEnabled = title.isNotBlank(),
        onConfirm = {
            onSave(
                ChoreCreate(
                    title = title.trim(),
                    description = description.ifBlank { null },
                    room = room,
                    category = category,
                    frequency = frequency,
                    interval_days = intervalDays.toIntOrNull() ?: 7,
                    points = points.toIntOrNull() ?: 10,
                    estimated_minutes = minutes.toIntOrNull() ?: 15,
                    is_rotation_enabled = rotationEnabled,
                    rotation_member_ids = rotationIds.toList(),
                    current_assignee_id = assigneeId,
                    due_date = dueDate,
                    cleaning_supplies_needed = supplies.ifBlank { null },
                    is_appliance_maintenance = appliance,
                    appliance_name = applianceName.ifBlank { null }
                )
            )
        }
    ) {
        HestiaField(title, { title = it }, "Název úkolu")
        Spacer(Modifier.height(8.dp))
        HestiaField(description, { description = it }, "Popis", singleLine = false, minLines = 2)
        Spacer(Modifier.height(8.dp))
        HestiaDropdown("Místnost", Labels.rooms, room, { room = it })
        Spacer(Modifier.height(8.dp))
        HestiaDropdown("Kategorie", Labels.choreCategories, category, { category = it })
        Spacer(Modifier.height(8.dp))
        HestiaDropdown("Frekvence", Labels.choreFrequencies, frequency, { frequency = it })
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            HestiaNumberField(intervalDays, { intervalDays = it }, "Interval (dny)", Modifier.weight(1f))
            HestiaNumberField(points, { points = it }, "Body", Modifier.weight(1f))
        }
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            HestiaNumberField(minutes, { minutes = it }, "Minuty", Modifier.weight(1f))
            HestiaField(applianceName, { applianceName = it }, "Spotřebič", Modifier.weight(1f))
        }
        Spacer(Modifier.height(8.dp))
        DateField("Termín", dueDate, { dueDate = it })
        Spacer(Modifier.height(8.dp))
        HestiaField(supplies, { supplies = it }, "Potřebné potřeby (čárkou)")
        Spacer(Modifier.height(8.dp))
        ToggleRow("Rotace mezi členy", rotationEnabled, { rotationEnabled = it })
        ToggleRow("Údržba spotřebiče", appliance, { appliance = it })
        if (members.isNotEmpty()) {
            Spacer(Modifier.height(8.dp))
            Text("Členové rotace", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            MultiSelectChips(
                options = members.map { it.id.toString() to it.display_name.ifBlank { it.username } },
                selected = rotationIds.map { it.toString() }.toSet(),
                onToggle = { key ->
                    val id = key.toInt()
                    rotationIds = if (id in rotationIds) rotationIds - id else rotationIds + id
                }
            )
            Spacer(Modifier.height(8.dp))
            HestiaDropdown(
                label = "Aktuálně přiřazeno",
                options = members.map { it.id.toString() to it.display_name.ifBlank { it.username } },
                selected = assigneeId?.toString(),
                onSelect = { assigneeId = it.toIntOrNull() }
            )
        }
    }
}
