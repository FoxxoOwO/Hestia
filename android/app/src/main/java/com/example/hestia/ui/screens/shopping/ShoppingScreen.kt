package com.example.hestia.ui.screens.shopping

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hestia.data.models.AddFromRecipeIngredient
import com.example.hestia.data.models.ShoppingItem
import com.example.hestia.data.models.ShoppingItemCreate
import com.example.hestia.data.models.ShoppingItemUpdate
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.theme.HestiaOrange
import com.example.hestia.theme.StatusGreen
import com.example.hestia.theme.StatusRed
import com.example.hestia.ui.components.*
import com.example.hestia.util.Fmt
import com.example.hestia.util.Labels
import com.example.hestia.util.friendly
import kotlinx.coroutines.launch

@Composable
fun ShoppingScreen(repository: HestiaRepository) {
    val scope = rememberCoroutineScope()
    var items by remember { mutableStateOf<List<ShoppingItem>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }

    var newName by remember { mutableStateOf("") }
    var newAmount by remember { mutableStateOf("") }
    var newUnit by remember { mutableStateOf("ks") }
    var newCategory by remember { mutableStateOf("other") }

    var showRecipePicker by remember { mutableStateOf(false) }
    var showClearDialog by remember { mutableStateOf(false) }
    var editing by remember { mutableStateOf<ShoppingItem?>(null) }

    suspend fun load() {
        loading = true
        repository.getShoppingItems()
            .onSuccess { items = it; error = null }
            .onFailure { error = it.friendly() }
        loading = false
    }

    LaunchedEffect(Unit) { load() }

    fun addItem() {
        val name = newName.trim()
        if (name.isBlank()) return
        scope.launch {
            busy = true
            repository.createShoppingItem(
                ShoppingItemCreate(
                    name = name,
                    amount = newAmount.toDoubleOrNull(),
                    unit = newUnit.ifBlank { null },
                    category = newCategory
                )
            ).onSuccess {
                newName = ""
                newAmount = ""
                load()
            }.onFailure { error = it.friendly() }
            busy = false
        }
    }

    val pending = items.filter { !it.is_checked }
    val done = items.filter { it.is_checked }

    Column(modifier = Modifier.fillMaxSize()) {
        // Quick add bar
        Card(
            modifier = Modifier.fillMaxWidth().padding(12.dp),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f))
        ) {
            Column(Modifier.padding(12.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    OutlinedTextField(
                        value = newName,
                        onValueChange = { newName = it },
                        placeholder = { Text("Přidat položku…") },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp),
                        keyboardActions = KeyboardActions(onDone = { addItem() }),
                        trailingIcon = {
                            IconButton(onClick = { addItem() }, enabled = !busy && newName.isNotBlank()) {
                                Icon(Icons.Default.Add, contentDescription = "Přidat", tint = HestiaOrange)
                            }
                        }
                    )
                }
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    HestiaNumberField(
                        value = newAmount,
                        onValueChange = { newAmount = it },
                        label = "Množství",
                        modifier = Modifier.weight(1f),
                        decimal = true
                    )
                    HestiaField(
                        value = newUnit,
                        onValueChange = { newUnit = it },
                        label = "Jedn.",
                        modifier = Modifier.weight(1f)
                    )
                }
                Spacer(Modifier.height(8.dp))
                HestiaDropdown(
                    label = "Kategorie",
                    options = Labels.shoppingCategories,
                    selected = newCategory,
                    onSelect = { newCategory = it }
                )
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(
                        onClick = { showRecipePicker = true },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.Restaurant, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Z receptu", fontSize = 12.sp)
                    }
                    OutlinedButton(
                        onClick = { showClearDialog = true },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.DeleteSweep, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Vyčistit", fontSize = 12.sp)
                    }
                }
            }
        }

        if (error != null) {
            ErrorBox(error, onRetry = { scope.launch { load() } })
        }

        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                "Ke koupi: ${pending.size}   •   Hotovo: ${done.size}",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            if (done.isNotEmpty()) {
                Text(
                    "Smazat hotové",
                    fontSize = 12.sp,
                    color = HestiaOrange,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.clickable {
                        scope.launch {
                            repository.clearCompletedShopping()
                                .onSuccess { load() }
                                .onFailure { error = it.friendly() }
                        }
                    }
                )
            }
        }

        if (loading) {
            LoadingBox()
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
            ) {
                if (pending.isEmpty() && done.isEmpty()) {
                    item {
                        Column(
                            modifier = Modifier.fillMaxWidth().padding(40.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(Icons.Default.ShoppingCart, contentDescription = null, tint = HestiaOrange, modifier = Modifier.size(44.dp))
                            Spacer(Modifier.height(10.dp))
                            Text("Nákupní seznam je prázdný", fontWeight = FontWeight.SemiBold)
                            Text("Přidejte položku nebo vygenerujte nákup z jídelníčku.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }

                items(pending, key = { it.id }) { item ->
                    ShoppingRow(
                        item = item,
                        onToggle = {
                            scope.launch {
                                repository.updateShoppingItem(item.id, ShoppingItemUpdate(is_checked = !item.is_checked))
                                    .onSuccess { load() }
                                    .onFailure { error = it.friendly() }
                            }
                        },
                        onEdit = { editing = item },
                        onDelete = {
                            scope.launch {
                                repository.deleteShoppingItem(item.id)
                                    .onSuccess { load() }
                                    .onFailure { error = it.friendly() }
                            }
                        }
                    )
                }

                if (done.isNotEmpty()) {
                    item {
                        Text(
                            "HOTOVO",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(start = 8.dp, top = 12.dp, bottom = 4.dp)
                        )
                    }
                    items(done, key = { it.id }) { item ->
                        ShoppingRow(
                            item = item,
                            onToggle = {
                                scope.launch {
                                    repository.updateShoppingItem(item.id, ShoppingItemUpdate(is_checked = !item.is_checked))
                                        .onSuccess { load() }
                                        .onFailure { error = it.friendly() }
                                }
                            },
                            onEdit = { editing = item },
                            onDelete = {
                                scope.launch {
                                    repository.deleteShoppingItem(item.id)
                                        .onSuccess { load() }
                                        .onFailure { error = it.friendly() }
                                }
                            }
                        )
                    }
                }
                item { Spacer(Modifier.height(80.dp)) }
            }
        }
    }

    if (showRecipePicker) {
        RecipePickerDialog(
            repository = repository,
            onDismiss = { showRecipePicker = false },
            onAdd = { recipeId, ingredients ->
                scope.launch {
                    busy = true
                    repository.addRecipeToShopping(recipeId, ingredients)
                        .onSuccess { showRecipePicker = false; load() }
                        .onFailure { error = it.friendly() }
                    busy = false
                }
            }
        )
    }

    if (showClearDialog) {
        AlertDialog(
            onDismissRequest = { showClearDialog = false },
            title = { Text("Vyčistit seznam") },
            text = { Text("Odškrtnuté položky můžete smazat, nebo vyprázdnit celý seznam.") },
            confirmButton = {
                TextButton(onClick = {
                    showClearDialog = false
                    scope.launch {
                        repository.clearAllShopping().onSuccess { load() }.onFailure { error = it.friendly() }
                    }
                }) { Text("Smazat vše", color = StatusRed) }
            },
            dismissButton = {
                TextButton(onClick = {
                    showClearDialog = false
                    scope.launch {
                        repository.clearCompletedShopping().onSuccess { load() }.onFailure { error = it.friendly() }
                    }
                }) { Text("Jen hotové") }
            }
        )
    }

    editing?.let { item ->
        ShoppingEditDialog(
            item = item,
            onDismiss = { editing = null },
            onSave = { update ->
                scope.launch {
                    repository.updateShoppingItem(item.id, update)
                        .onSuccess { editing = null; load() }
                        .onFailure { error = it.friendly() }
                }
            }
        )
    }
}

@Composable
private fun ShoppingRow(
    item: ShoppingItem,
    onToggle: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (item.is_checked) MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f)
            else MaterialTheme.colorScheme.surface
        ),
        modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Checkbox(
                checked = item.is_checked,
                onCheckedChange = { onToggle() },
                colors = CheckboxDefaults.colors(checkedColor = StatusGreen)
            )
            Column(
                modifier = Modifier.weight(1f).clickable { onEdit() }
            ) {
                Text(
                    item.name,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    textDecoration = if (item.is_checked) TextDecoration.LineThrough else TextDecoration.None,
                    color = if (item.is_checked) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.onSurface
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    val qty = listOfNotNull(
                        item.amount?.let { Fmt.number(it) },
                        item.unit
                    ).joinToString(" ")
                    if (qty.isNotBlank()) {
                        Text(qty, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Text(
                        Labels.categoryLabel(item.category),
                        fontSize = 10.sp,
                        color = HestiaOrange,
                        modifier = Modifier
                            .background(HestiaOrange.copy(alpha = 0.1f), RoundedCornerShape(4.dp))
                            .padding(horizontal = 4.dp)
                    )
                }
            }
            IconButton(onClick = onDelete, modifier = Modifier.size(34.dp)) {
                Icon(Icons.Default.Close, contentDescription = "Smazat", tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(16.dp))
            }
        }
    }
}

@Composable
private fun ShoppingEditDialog(
    item: ShoppingItem,
    onDismiss: () -> Unit,
    onSave: (ShoppingItemUpdate) -> Unit
) {
    var name by remember { mutableStateOf(item.name) }
    var amount by remember { mutableStateOf(item.amount?.let { Fmt.number(it) } ?: "") }
    var unit by remember { mutableStateOf(item.unit ?: "ks") }
    var category by remember { mutableStateOf(item.category) }

    DialogScaffold(
        title = "Upravit položku",
        onDismiss = onDismiss,
        onConfirm = {
            onSave(
                ShoppingItemUpdate(
                    name = name.trim(),
                    amount = amount.toDoubleOrNull(),
                    unit = unit.ifBlank { null },
                    category = category
                )
            )
        }
    ) {
        HestiaField(name, { name = it }, "Název")
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            HestiaNumberField(amount, { amount = it }, "Množství", Modifier.weight(1f), decimal = true)
            HestiaField(unit, { unit = it }, "Jednotka", Modifier.weight(1f))
        }
        Spacer(Modifier.height(8.dp))
        HestiaDropdown("Kategorie", Labels.shoppingCategories, category, { category = it })
    }
}

@Composable
private fun RecipePickerDialog(
    repository: HestiaRepository,
    onDismiss: () -> Unit,
    onAdd: (Int, List<AddFromRecipeIngredient>) -> Unit
) {
    val scope = rememberCoroutineScope()
    var recipes by remember { mutableStateOf<List<Pair<Int, String>>>(emptyList()) }
    var selected by remember { mutableStateOf<Int?>(null) }
    var ingredients by remember { mutableStateOf<List<AddFromRecipeIngredient>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        repository.getRecipes().onSuccess { list ->
            recipes = list.map { it.id to it.title }
        }
        loading = false
    }

    LaunchedEffect(selected) {
        val id = selected ?: return@LaunchedEffect
        repository.getRecipe(id).onSuccess { recipe ->
            ingredients = recipe.ingredients.map {
                AddFromRecipeIngredient(it.name, it.amount, it.unit, it.category ?: "other")
            }
        }
    }

    DialogScaffold(
        title = "Přidat z receptu",
        onDismiss = onDismiss,
        confirmText = "Přidat ${ingredients.size} položek",
        confirmEnabled = selected != null && ingredients.isNotEmpty(),
        onConfirm = { selected?.let { onAdd(it, ingredients) } }
    ) {
        if (loading) {
            LinearProgressIndicator(modifier = Modifier.fillMaxWidth(), color = HestiaOrange)
        } else if (recipes.isEmpty()) {
            Text("Nejdřív si vytvořte recept.", fontSize = 13.sp)
        } else {
            recipes.forEach { (id, title) ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { selected = id }
                        .padding(vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    RadioButton(selected = selected == id, onClick = { selected = id })
                    Text(title, fontSize = 14.sp)
                }
            }
            if (ingredients.isNotEmpty()) {
                HorizontalDivider(Modifier.padding(vertical = 8.dp))
                Text("Suroviny:", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                ingredients.forEach {
                    Text("• ${it.name} — ${Fmt.number(it.amount ?: 1.0)} ${it.unit ?: "ks"}", fontSize = 12.sp)
                }
            }
        }
    }
}
