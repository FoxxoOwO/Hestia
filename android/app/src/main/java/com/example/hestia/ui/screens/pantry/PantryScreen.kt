package com.example.hestia.ui.screens.pantry

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hestia.data.models.PantryItem
import com.example.hestia.data.models.PantryItemCreate
import com.example.hestia.data.models.PantryItemUpdate
import com.example.hestia.data.models.ShoppingItemCreate
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.theme.*
import com.example.hestia.ui.components.EmptyStateCard
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PantryScreen(
    repository: HestiaRepository,
    modifier: Modifier = Modifier
) {
    val coroutineScope = rememberCoroutineScope()
    var pantryItems by remember { mutableStateOf<List<PantryItem>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var searchQuery by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf("all") }
    var showAddDialog by remember { mutableStateOf(false) }
    var snackbarMessage by remember { mutableStateOf<String?>(null) }

    fun refreshPantry() {
        coroutineScope.launch {
            isLoading = true
            repository.getPantryItems().onSuccess { pantryItems = it }
            isLoading = false
        }
    }

    LaunchedEffect(Unit) {
        refreshPantry()
    }

    val categories = listOf(
        "all" to "Vše",
        "fridge" to "Lednice",
        "freezer" to "Mrazák",
        "pantry" to "Spíž",
        "produce" to "Zelenina/Ovoce",
        "other" to "Ostatní"
    )

    val filteredItems = pantryItems.filter { item ->
        val matchesCategory = selectedCategory == "all" || item.category == selectedCategory
        val matchesQuery = searchQuery.isBlank() || item.name.contains(searchQuery, ignoreCase = true)
        matchesCategory && matchesQuery
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background,
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddDialog = true },
                containerColor = HestiaOrange,
                contentColor = Color.White,
                shape = CircleShape
            ) {
                Icon(Icons.Default.Add, contentDescription = "Přidat do spíže")
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
                // Search bar
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Hledat ve spíži a lednici...") },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                    trailingIcon = {
                        if (searchQuery.isNotEmpty()) {
                            IconButton(onClick = { searchQuery = "" }) {
                                Icon(Icons.Default.Clear, contentDescription = "Vymazat")
                            }
                        }
                    },
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 6.dp),
                    singleLine = true
                )

                // Category Filter Pills
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.padding(vertical = 4.dp)
                ) {
                    items(categories) { (key, label) ->
                        FilterChip(
                            selected = selectedCategory == key,
                            onClick = { selectedCategory = key },
                            label = { Text(label, fontSize = 12.sp) }
                        )
                    }
                }

                Text(
                    text = "Zásoby ve spíži (${filteredItems.size})",
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(vertical = 6.dp)
                )

                if (filteredItems.isEmpty()) {
                    EmptyStateCard(
                        message = if (searchQuery.isBlank()) "V této kategorii nejsou žádné potraviny." else "Nebyly nalezeny žádné odpovídající potraviny.",
                        icon = Icons.Default.Inventory2
                    )
                } else {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(bottom = 80.dp)
                    ) {
                        items(filteredItems, key = { it.id }) { item ->
                            val statusColor = when (item.status) {
                                "expired" -> StatusRed
                                "expiring_soon" -> StatusYellow
                                else -> StatusGreen
                            }

                            Card(
                                shape = RoundedCornerShape(12.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                                        ) {
                                            Text(
                                                text = item.name,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 15.sp
                                            )
                                            Surface(
                                                shape = RoundedCornerShape(4.dp),
                                                color = statusColor.copy(alpha = 0.15f)
                                            ) {
                                                Text(
                                                    text = when (item.status) {
                                                        "expired" -> "Prošlé"
                                                        "expiring_soon" -> "Brzy projde"
                                                        else -> "Čerstvé"
                                                    },
                                                    fontSize = 10.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = statusColor,
                                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                                )
                                            }
                                        }

                                        Row(
                                            modifier = Modifier.padding(top = 4.dp),
                                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Text(
                                                text = "${item.quantity} ${item.unit}",
                                                fontSize = 13.sp,
                                                fontWeight = FontWeight.SemiBold,
                                                color = HestiaOrange
                                            )
                                            if (!item.expiration_date.isNullOrBlank()) {
                                                Text(
                                                    text = "Expirace: ${item.expiration_date}",
                                                    fontSize = 11.sp,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }
                                        }
                                    }

                                    // Quick +/- Quantity & Actions
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(2.dp)
                                    ) {
                                        IconButton(
                                            onClick = {
                                                val newQty = (item.quantity - 1.0).coerceAtLeast(0.0)
                                                coroutineScope.launch {
                                                    repository.updatePantryItem(item.id, PantryItemUpdate(quantity = newQty))
                                                    refreshPantry()
                                                }
                                            },
                                            modifier = Modifier.size(30.dp)
                                        ) {
                                            Icon(Icons.Default.Remove, contentDescription = "Ubrat", modifier = Modifier.size(16.dp))
                                        }

                                        IconButton(
                                            onClick = {
                                                val newQty = item.quantity + 1.0
                                                coroutineScope.launch {
                                                    repository.updatePantryItem(item.id, PantryItemUpdate(quantity = newQty))
                                                    refreshPantry()
                                                }
                                            },
                                            modifier = Modifier.size(30.dp)
                                        ) {
                                            Icon(Icons.Default.Add, contentDescription = "Přidat", modifier = Modifier.size(16.dp))
                                        }

                                        IconButton(
                                            onClick = {
                                                coroutineScope.launch {
                                                    repository.createShoppingItem(
                                                        ShoppingItemCreate(
                                                            name = item.name,
                                                            amount = 1.0,
                                                            unit = item.unit,
                                                            notes = "Ze spíže (${item.category})"
                                                        )
                                                    ).onSuccess {
                                                        snackbarMessage = "${item.name} přidáno do nákupu!"
                                                    }
                                                }
                                            },
                                            modifier = Modifier.size(30.dp)
                                        ) {
                                            Icon(
                                                Icons.Default.AddShoppingCart,
                                                contentDescription = "Do nákupního seznamu",
                                                tint = HestiaOrange,
                                                modifier = Modifier.size(18.dp)
                                            )
                                        }

                                        IconButton(
                                            onClick = {
                                                coroutineScope.launch {
                                                    repository.deletePantryItem(item.id)
                                                    refreshPantry()
                                                    snackbarMessage = "Položka smazána"
                                                }
                                            },
                                            modifier = Modifier.size(30.dp)
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.Delete,
                                                contentDescription = "Smazat",
                                                tint = MaterialTheme.colorScheme.error.copy(alpha = 0.7f),
                                                modifier = Modifier.size(18.dp)
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

    // Add Pantry Item Dialog
    if (showAddDialog) {
        var name by remember { mutableStateOf("") }
        var category by remember { mutableStateOf(if (selectedCategory != "all") selectedCategory else "pantry") }
        var quantity by remember { mutableStateOf("1") }
        var unit by remember { mutableStateOf("ks") }
        var expirationDate by remember { mutableStateOf("") }
        var note by remember { mutableStateOf("") }

        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            title = { Text("Přidat potravinu do zásob", fontWeight = FontWeight.Bold) },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text("Název potraviny *") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = quantity,
                            onValueChange = { quantity = it },
                            label = { Text("Množství") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )

                        OutlinedTextField(
                            value = unit,
                            onValueChange = { unit = it },
                            label = { Text("Jednotka") },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                    }

                    // Category radio pills
                    Text("Umístění:", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(categories.filter { it.first != "all" }) { (catKey, catLabel) ->
                            FilterChip(
                                selected = category == catKey,
                                onClick = { category = catKey },
                                label = { Text(catLabel, fontSize = 11.sp) }
                            )
                        }
                    }

                    OutlinedTextField(
                        value = expirationDate,
                        onValueChange = { expirationDate = it },
                        label = { Text("Datum expirace (RRRR-MM-DD)") },
                        placeholder = { Text("2026-09-30") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = note,
                        onValueChange = { note = it },
                        label = { Text("Poznámka") },
                        modifier = Modifier.fillMaxWidth(),
                        maxLines = 2
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (name.isNotBlank()) {
                            coroutineScope.launch {
                                repository.createPantryItem(
                                    PantryItemCreate(
                                        name = name.trim(),
                                        category = category,
                                        quantity = quantity.toDoubleOrNull() ?: 1.0,
                                        unit = unit.trim().ifBlank { "ks" },
                                        expiration_date = expirationDate.trim().ifBlank { null },
                                        note = note.trim().ifBlank { null }
                                    )
                                ).onSuccess {
                                    showAddDialog = false
                                    refreshPantry()
                                    snackbarMessage = "Potravina přidána do zásob!"
                                }
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = HestiaOrange)
                ) {
                    Text("Přidat do zásob")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddDialog = false }) {
                    Text("Zrušit")
                }
            }
        )
    }
}
