package com.example.hestia.ui.screens.pantry

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hestia.data.models.PantryItem
import com.example.hestia.data.models.PantryItemCreate
import com.example.hestia.data.models.PantryItemUpdate
import com.example.hestia.data.models.RecipePantryMatch
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.theme.HestiaOrange
import com.example.hestia.theme.StatusGreen
import com.example.hestia.theme.StatusRed
import com.example.hestia.theme.StatusYellow
import com.example.hestia.ui.components.*
import com.example.hestia.ui.components.EmptyState
import com.example.hestia.util.Fmt
import com.example.hestia.util.Labels
import com.example.hestia.util.friendly
import kotlinx.coroutines.launch

@Composable
fun PantryScreen(repository: HestiaRepository) {
    val scope = rememberCoroutineScope()
    var items by remember { mutableStateOf<List<PantryItem>>(emptyList()) }
    var matches by remember { mutableStateOf<List<RecipePantryMatch>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var search by remember { mutableStateOf("") }
    var categoryFilter by remember { mutableStateOf<String?>(null) }
    var tab by remember { mutableStateOf(0) }
    var editing by remember { mutableStateOf<PantryItem?>(null) }
    var showCreate by remember { mutableStateOf(false) }
    var deleteTarget by remember { mutableStateOf<PantryItem?>(null) }

    suspend fun load() {
        loading = true
        repository.getPantryItems(category = categoryFilter, query = search.ifBlank { null })
            .onSuccess { items = it; error = null }
            .onFailure { error = it.friendly() }
        loading = false
    }

    suspend fun loadMatches() {
        repository.getRecipePantryMatches().onSuccess { matches = it }.onFailure { error = it.friendly() }
    }

    LaunchedEffect(categoryFilter, search) {
        if (search.isNotBlank()) kotlinx.coroutines.delay(350)
        load()
    }
    LaunchedEffect(tab) { if (tab == 1) loadMatches() }

    Column(Modifier.fillMaxSize()) {
        TabRow(selectedTabIndex = tab, containerColor = MaterialTheme.colorScheme.surface) {
            Tab(selected = tab == 0, onClick = { tab = 0 }, text = { Text("Spíž (${items.size})") })
            Tab(selected = tab == 1, onClick = { tab = 1 }, text = { Text("Co uvařit") })
        }

        if (tab == 0) {
            Column(Modifier.padding(12.dp)) {
                HestiaField(
                    value = search,
                    onValueChange = { search = it },
                    label = "Hledat surovinu",
                    trailingIcon = {
                        if (search.isNotBlank()) {
                            IconButton(onClick = { search = "" }) { Icon(Icons.Default.Clear, null) }
                        }
                    }
                )
                Spacer(Modifier.height(8.dp))
                ChipSelector(
                    options = Labels.pantryCategories,
                    selected = categoryFilter,
                    onSelect = { categoryFilter = it.ifBlank { null } },
                    includeAll = true
                )
            }

            ErrorBox(error, onRetry = { scope.launch { load() } })

            if (loading) {
                LoadingBox()
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                    modifier = Modifier.fillMaxSize()
                ) {
                    if (items.isEmpty()) {
                        item {
                            EmptyState(
                                icon = Icons.Default.Inventory2,
                                title = "Spíž je prázdná",
                                subtitle = "Přidejte suroviny, ať víte, co máte doma."
                            )
                        }
                    }
                    items(items, key = { it.id }) { item ->
                        PantryRow(
                            item = item,
                            onMinus = {
                                scope.launch {
                                    val newQty = (item.quantity - 1).coerceAtLeast(0.0)
                                    repository.updatePantryItem(item.id, PantryItemUpdate(quantity = newQty))
                                        .onSuccess { load() }
                                }
                            },
                            onPlus = {
                                scope.launch {
                                    repository.updatePantryItem(item.id, PantryItemUpdate(quantity = item.quantity + 1))
                                        .onSuccess { load() }
                                }
                            },
                            onEdit = { editing = item },
                            onDelete = { deleteTarget = item }
                        )
                    }
                    item { Spacer(Modifier.height(90.dp)) }
                }
            }
        } else {
            ErrorBox(error, onRetry = { scope.launch { loadMatches() } })
            LazyColumn(
                contentPadding = PaddingValues(12.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                if (matches.isEmpty()) {
                    item {
                        EmptyState(
                            icon = Icons.Default.Restaurant,
                            title = "Zatím žádná shoda",
                            subtitle = "Naplňte spíž a recepty — Hestia spočítá, co můžete uvařit hned."
                        )
                    }
                }
                items(matches, key = { it.recipe_id }) { m ->
                    Card(
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)
                    ) {
                        Column(Modifier.padding(12.dp)) {
                            Row(
                                Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(m.recipe_title, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, modifier = Modifier.weight(1f))
                                if (m.can_cook_now) {
                                    StatusPill("Uvaříte hned", StatusGreen)
                                } else {
                                    StatusPill("${m.matched_ingredients_count}/${m.total_ingredients_count}", StatusYellow)
                                }
                            }
                            Spacer(Modifier.height(4.dp))
                            LinearProgressIndicator(
                                progress = { (m.match_percentage / 100.0).toFloat() },
                                modifier = Modifier.fillMaxWidth().height(6.dp),
                                color = if (m.can_cook_now) StatusGreen else HestiaOrange,
                                trackColor = MaterialTheme.colorScheme.surfaceVariant
                            )
                            if (m.missing_ingredients.isNotEmpty()) {
                                Spacer(Modifier.height(6.dp))
                                Text(
                                    "Chybí: " + m.missing_ingredients.joinToString(", ") { it.ingredient_name },
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
                item { Spacer(Modifier.height(90.dp)) }
            }
        }
    }

    // FAB-like add button
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.BottomEnd) {
        ExtendedFloatingActionButton(
            onClick = { showCreate = true },
            containerColor = HestiaOrange,
            contentColor = androidx.compose.ui.graphics.Color.White,
            modifier = Modifier.padding(20.dp),
            icon = { Icon(Icons.Default.Add, null) },
            text = { Text("Přidat") }
        )
    }

    if (showCreate) {
        PantryFormDialog(
            initial = null,
            onDismiss = { showCreate = false },
            onSave = { create ->
                scope.launch {
                    repository.createPantryItem(create)
                        .onSuccess { showCreate = false; load() }
                        .onFailure { error = it.friendly() }
                }
            }
        )
    }

    editing?.let { item ->
        PantryFormDialog(
            initial = item,
            onDismiss = { editing = null },
            onSave = { create ->
                scope.launch {
                    repository.updatePantryItem(
                        item.id,
                        PantryItemUpdate(
                            name = create.name,
                            category = create.category,
                            quantity = create.quantity,
                            unit = create.unit,
                            expiration_date = create.expiration_date,
                            min_quantity = create.min_quantity,
                            note = create.note
                        )
                    ).onSuccess { editing = null; load() }.onFailure { error = it.friendly() }
                }
            }
        )
    }

    deleteTarget?.let { item ->
        ConfirmDialog(
            title = "Smazat surovinu",
            message = "Opravdu smazat „${item.name}“ ze spíže?",
            onConfirm = {
                scope.launch {
                    repository.deletePantryItem(item.id).onSuccess { load() }.onFailure { error = it.friendly() }
                }
            },
            onDismiss = { deleteTarget = null }
        )
    }
}

@Composable
private fun PantryRow(
    item: PantryItem,
    onMinus: () -> Unit,
    onPlus: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    val statusLabel = when (item.status) {
        "expired" -> "Prošlé"
        "expiring_soon" -> "Brzy prošlé"
        "low" -> "Dochází"
        else -> null
    }
    Card(
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(item.name, fontWeight = FontWeight.Medium, fontSize = 14.sp)
                    if (statusLabel != null) {
                        Spacer(Modifier.width(6.dp))
                        StatusPill(statusLabel, statusColor(item.status))
                    }
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        "${Fmt.number(item.quantity)} ${item.unit}",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = HestiaOrange
                    )
                    Text(Labels.label(Labels.pantryCategories, item.category), fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    item.expiration_date?.let {
                        Text("exp. ${Fmt.date(it)}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
            IconButton(onClick = onMinus, modifier = Modifier.size(30.dp)) {
                Icon(Icons.Default.Remove, "Ubrat", modifier = Modifier.size(16.dp))
            }
            IconButton(onClick = onPlus, modifier = Modifier.size(30.dp)) {
                Icon(Icons.Default.Add, "Přidat", modifier = Modifier.size(16.dp))
            }
            IconButton(onClick = onEdit, modifier = Modifier.size(30.dp)) {
                Icon(Icons.Default.Edit, "Upravit", modifier = Modifier.size(15.dp))
            }
            IconButton(onClick = onDelete, modifier = Modifier.size(30.dp)) {
                Icon(Icons.Default.Delete, "Smazat", tint = StatusRed, modifier = Modifier.size(15.dp))
            }
        }
    }
}

@Composable
private fun PantryFormDialog(
    initial: PantryItem?,
    onDismiss: () -> Unit,
    onSave: (PantryItemCreate) -> Unit
) {
    var name by remember { mutableStateOf(initial?.name ?: "") }
    var category by remember { mutableStateOf(initial?.category ?: "pantry") }
    var quantity by remember { mutableStateOf(initial?.quantity?.let { Fmt.number(it) } ?: "1") }
    var unit by remember { mutableStateOf(initial?.unit ?: "ks") }
    var expiration by remember { mutableStateOf(initial?.expiration_date) }
    var minQuantity by remember { mutableStateOf(initial?.min_quantity?.let { Fmt.number(it) } ?: "") }
    var note by remember { mutableStateOf(initial?.note ?: "") }

    DialogScaffold(
        title = if (initial == null) "Nová surovina" else "Upravit surovinu",
        onDismiss = onDismiss,
        confirmEnabled = name.isNotBlank(),
        onConfirm = {
            onSave(
                PantryItemCreate(
                    name = name.trim(),
                    category = category,
                    quantity = quantity.toDoubleOrNull() ?: 1.0,
                    unit = unit.ifBlank { "ks" },
                    expiration_date = expiration,
                    min_quantity = minQuantity.toDoubleOrNull(),
                    note = note.ifBlank { null }
                )
            )
        }
    ) {
        HestiaField(name, { name = it }, "Název")
        Spacer(Modifier.height(8.dp))
        HestiaDropdown("Kategorie", Labels.pantryCategories, category, { category = it })
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            HestiaNumberField(quantity, { quantity = it }, "Množství", Modifier.weight(1f), decimal = true)
            HestiaField(unit, { unit = it }, "Jednotka", Modifier.weight(1f))
        }
        Spacer(Modifier.height(8.dp))
        DateField("Datum expirace", expiration, { expiration = it })
        Spacer(Modifier.height(8.dp))
        HestiaNumberField(minQuantity, { minQuantity = it }, "Min. množství (upozornění)", decimal = true)
        Spacer(Modifier.height(8.dp))
        HestiaField(note, { note = it }, "Poznámka", singleLine = false, minLines = 2)
    }
}

