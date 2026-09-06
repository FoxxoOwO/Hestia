package com.example.hestia.ui.screens.shopping

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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hestia.data.models.ShoppingItem
import com.example.hestia.data.models.ShoppingItemCreate
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.theme.HestiaOrange
import com.example.hestia.theme.StatusRed
import com.example.hestia.ui.components.EmptyStateCard
import com.example.hestia.ui.components.SectionHeader
import kotlinx.coroutines.launch

@Composable
fun ShoppingScreen(
    repository: HestiaRepository,
    modifier: Modifier = Modifier
) {
    val coroutineScope = rememberCoroutineScope()
    var items by remember { mutableStateOf<List<ShoppingItem>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var showAddDialog by remember { mutableStateOf(false) }

    var newName by remember { mutableStateOf("") }
    var newAmount by remember { mutableStateOf("1") }
    var newUnit by remember { mutableStateOf("ks") }
    var isUrgent by remember { mutableStateOf(false) }

    fun refreshItems() {
        coroutineScope.launch {
            isLoading = true
            repository.getShoppingItems().onSuccess {
                items = it
            }
            isLoading = false
        }
    }

    LaunchedEffect(Unit) {
        refreshItems()
    }

    val uncheckedItems = items.filter { !it.is_checked }
    val checkedItems = items.filter { it.is_checked }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddDialog = true },
                containerColor = HestiaOrange,
                contentColor = Color.White,
                shape = CircleShape
            ) {
                Icon(Icons.Default.Add, contentDescription = "Přidat položku")
            }
        },
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
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                item {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Nákupní seznam (${uncheckedItems.size})",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )

                        if (checkedItems.isNotEmpty()) {
                            TextButton(
                                onClick = {
                                    coroutineScope.launch {
                                        repository.clearCheckedShoppingItems()
                                        refreshItems()
                                    }
                                }
                            ) {
                                Icon(Icons.Default.DeleteSweep, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Vymazat hotové", fontSize = 11.sp)
                            }
                        }
                    }
                }

                // Unchecked items (To Buy)
                if (uncheckedItems.isEmpty() && checkedItems.isEmpty()) {
                    item {
                        EmptyStateCard(
                            message = "V nákupním košíku nic není.",
                            icon = Icons.Default.ShoppingCart
                        )
                    }
                } else {
                    items(uncheckedItems, key = { it.id }) { item ->
                        Card(
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    coroutineScope.launch {
                                        repository.toggleShoppingItem(item)
                                        refreshItems()
                                    }
                                }
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Checkbox(
                                    checked = item.is_checked,
                                    onCheckedChange = {
                                        coroutineScope.launch {
                                            repository.toggleShoppingItem(item)
                                            refreshItems()
                                        }
                                    },
                                    colors = CheckboxDefaults.colors(checkedColor = HestiaOrange)
                                )

                                Spacer(modifier = Modifier.width(8.dp))

                                Column(modifier = Modifier.weight(1f)) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        Text(
                                            text = item.name,
                                            fontWeight = FontWeight.SemiBold,
                                            fontSize = 14.sp
                                        )
                                        if (item.urgent) {
                                            Badge(containerColor = StatusRed.copy(alpha = 0.15f), contentColor = StatusRed) {
                                                Text("Spěchá", fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                            }
                                        }
                                    }
                                    Text(
                                        text = "${item.amount} ${item.unit} • ${item.category}",
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }

                                IconButton(
                                    onClick = {
                                        coroutineScope.launch {
                                            repository.deleteShoppingItem(item.id)
                                            refreshItems()
                                        }
                                    }
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Close,
                                        contentDescription = "Smazat",
                                        tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f),
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                        }
                    }
                }

                // Checked items (Already bought)
                if (checkedItems.isNotEmpty()) {
                    item {
                        SectionHeader(title = "Již nakoupeno (${checkedItems.size})")
                    }

                    items(checkedItems, key = { it.id }) { item ->
                        Card(
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    coroutineScope.launch {
                                        repository.toggleShoppingItem(item)
                                        refreshItems()
                                    }
                                }
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Checkbox(
                                    checked = item.is_checked,
                                    onCheckedChange = {
                                        coroutineScope.launch {
                                            repository.toggleShoppingItem(item)
                                            refreshItems()
                                        }
                                    },
                                    colors = CheckboxDefaults.colors(checkedColor = HestiaOrange)
                                )

                                Spacer(modifier = Modifier.width(8.dp))

                                Text(
                                    text = "${item.name} (${item.amount} ${item.unit})",
                                    fontSize = 13.sp,
                                    textDecoration = TextDecoration.LineThrough,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.weight(1f)
                                )

                                IconButton(
                                    onClick = {
                                        coroutineScope.launch {
                                            repository.deleteShoppingItem(item.id)
                                            refreshItems()
                                        }
                                    }
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Close,
                                        contentDescription = "Smazat",
                                        tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f),
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            }
                        }
                    }
                }

                item { Spacer(modifier = Modifier.height(72.dp)) }
            }
        }
    }

    // Add Item Dialog
    if (showAddDialog) {
        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            title = { Text("Přidat položku do nákupu") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = newName,
                        onValueChange = { newName = it },
                        label = { Text("Název (např. Mléko, Rohlíky)") },
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    )

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = newAmount,
                            onValueChange = { newAmount = it },
                            label = { Text("Množství") },
                            singleLine = true,
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = newUnit,
                            onValueChange = { newUnit = it },
                            label = { Text("Jednotka") },
                            singleLine = true,
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.clickable { isUrgent = !isUrgent }
                    ) {
                        Checkbox(
                            checked = isUrgent,
                            onCheckedChange = { isUrgent = it },
                            colors = CheckboxDefaults.colors(checkedColor = HestiaOrange)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Spěchá / Prioritní", fontSize = 13.sp)
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (newName.isNotBlank()) {
                            coroutineScope.launch {
                                repository.createShoppingItem(
                                    ShoppingItemCreate(
                                        name = newName.trim(),
                                        amount = newAmount.toDoubleOrNull() ?: 1.0,
                                        unit = newUnit.trim(),
                                        urgent = isUrgent
                                    )
                                )
                                newName = ""
                                newAmount = "1"
                                newUnit = "ks"
                                isUrgent = false
                                showAddDialog = false
                                refreshItems()
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = HestiaOrange)
                ) {
                    Text("Přidat")
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
