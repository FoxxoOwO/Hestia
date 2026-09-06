package com.example.hestia.ui.screens.pantry

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
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
import com.example.hestia.data.models.PantryItem
import com.example.hestia.data.models.PantryItemCreate
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.theme.*
import com.example.hestia.ui.components.EmptyStateCard
import kotlinx.coroutines.launch

@Composable
fun PantryScreen(
    repository: HestiaRepository,
    modifier: Modifier = Modifier
) {
    val coroutineScope = rememberCoroutineScope()
    var pantryItems by remember { mutableStateOf<List<PantryItem>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var selectedCategory by remember { mutableStateOf("all") }
    var showAddDialog by remember { mutableStateOf(false) }

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

    val filteredItems = pantryItems.filter {
        selectedCategory == "all" || it.category == selectedCategory
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background,
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddDialog = true },
                containerColor = HestiaOrange,
                contentColor = Color.White
            ) {
                Icon(Icons.Default.Add, contentDescription = "Přidat do spíže")
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
                // Category Filter Pills
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.padding(vertical = 10.dp)
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
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(bottom = 8.dp)
                )

                if (filteredItems.isEmpty()) {
                    EmptyStateCard(
                        message = "V této kategorii nejsou žádné potraviny.",
                        icon = Icons.Default.Inventory2
                    )
                } else {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.fillMaxSize()
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
                                            horizontalArrangement = Arrangement.spacedBy(10.dp)
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
                                                    fontSize = 12.sp,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }
                                        }
                                    }

                                    IconButton(
                                        onClick = {
                                            coroutineScope.launch {
                                                repository.deletePantryItem(item.id)
                                                refreshPantry()
                                            }
                                        }
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Delete,
                                            contentDescription = "Smazat",
                                            tint = MaterialTheme.colorScheme.error.copy(alpha = 0.7f),
                                            modifier = Modifier.size(20.dp)
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

    // Add Pantry Item Dialog
    if (showAddDialog) {
        var name by remember { mutableStateOf("") }
        var quantity by remember { mutableStateOf("1.0") }
        var unit by remember { mutableStateOf("ks") }
        var category by remember { mutableStateOf("pantry") }
        var expDate by remember { mutableStateOf("") }

        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            title = { Text("Přidat zásobu do spíže") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text("Název potraviny") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = quantity,
                            onValueChange = { quantity = it },
                            label = { Text("Množství") },
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = unit,
                            onValueChange = { unit = it },
                            label = { Text("Jednotka") },
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    OutlinedTextField(
                        value = expDate,
                        onValueChange = { expDate = it },
                        label = { Text("Expirace (RRRR-MM-DD)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
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
                                        quantity = quantity.toDoubleOrNull() ?: 1.0,
                                        unit = unit.trim(),
                                        category = category,
                                        expiration_date = expDate.ifBlank { null }
                                    )
                                )
                                showAddDialog = false
                                refreshPantry()
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = HestiaOrange)
                ) {
                    Text("Uložit", color = Color.White)
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
