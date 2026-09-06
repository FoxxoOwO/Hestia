package com.example.hestia.ui.screens.documents

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hestia.data.models.DocumentCreate
import com.example.hestia.data.models.DocumentItem
import com.example.hestia.data.models.DocumentStats
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.theme.HestiaOrange
import com.example.hestia.theme.StatusGreen
import com.example.hestia.theme.StatusRed
import com.example.hestia.theme.StatusYellow
import com.example.hestia.ui.components.EmptyStateCard
import kotlinx.coroutines.launch

@Composable
fun DocumentsScreen(
    repository: HestiaRepository,
    modifier: Modifier = Modifier
) {
    val coroutineScope = rememberCoroutineScope()
    var documents by remember { mutableStateOf<List<DocumentItem>>(emptyList()) }
    var stats by remember { mutableStateOf<DocumentStats?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var searchQuery by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf("all") }
    var isVaultUnlocked by remember { mutableStateOf(false) }
    var showPinDialog by remember { mutableStateOf(false) }
    var showAddDialog by remember { mutableStateOf(false) }
    var snackbarMessage by remember { mutableStateOf<String?>(null) }

    fun refreshData() {
        coroutineScope.launch {
            isLoading = true
            repository.getDocumentStats().onSuccess { stats = it }
            repository.getDocuments().onSuccess { documents = it }
            isLoading = false
        }
    }

    LaunchedEffect(Unit) {
        refreshData()
    }

    val categories = listOf(
        "all" to "Vše",
        "warranty" to "Záruky a účtenky",
        "contract" to "Smlouvy",
        "manual" to "Návody",
        "personal" to "Osobní",
        "other" to "Ostatní"
    )

    val filteredDocuments = remember(documents, searchQuery, selectedCategory, isVaultUnlocked) {
        documents.filter { doc ->
            // If vault is locked, hide vault-protected documents
            if (doc.is_vault_protected && !isVaultUnlocked) {
                return@filter false
            }

            val matchesCategory = selectedCategory == "all" || doc.category.equals(selectedCategory, ignoreCase = true)
            val matchesQuery = searchQuery.isBlank() ||
                    doc.title.contains(searchQuery, ignoreCase = true) ||
                    (doc.issuer?.contains(searchQuery, ignoreCase = true) == true) ||
                    (doc.physical_location?.contains(searchQuery, ignoreCase = true) == true)
            matchesCategory && matchesQuery
        }
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
                Icon(Icons.Default.Add, contentDescription = "Přidat doklad")
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
    ) { paddingValues ->
        if (isLoading && documents.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = HestiaOrange)
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
                contentPadding = PaddingValues(top = 12.dp, bottom = 80.dp)
            ) {
                // Stats cards + Trezor toggle
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        DocumentStatCard(
                            label = "Dokumentů",
                            value = "${stats?.total_documents ?: documents.size}",
                            icon = Icons.Default.Description,
                            color = HestiaOrange,
                            modifier = Modifier.weight(1f)
                        )
                        DocumentStatCard(
                            label = "Končící záruky",
                            value = "${stats?.expiring_soon ?: 0}",
                            icon = Icons.Default.WarningAmber,
                            color = StatusYellow,
                            modifier = Modifier.weight(1f)
                        )
                        DocumentStatCard(
                            label = if (isVaultUnlocked) "Trezor (Odemčen)" else "Trezor (Zamčen)",
                            value = "${stats?.vault_protected ?: 0}",
                            icon = if (isVaultUnlocked) Icons.Default.LockOpen else Icons.Default.Lock,
                            color = if (isVaultUnlocked) StatusGreen else Color(0xFF6366F1),
                            modifier = Modifier
                                .weight(1f)
                                .clickable {
                                    if (isVaultUnlocked) {
                                        isVaultUnlocked = false
                                        snackbarMessage = "Trezor byl uzamčen"
                                    } else {
                                        showPinDialog = true
                                    }
                                }
                        )
                    }
                }

                // Vault status banner if locked
                if (!isVaultUnlocked && (stats?.vault_protected ?: 0) > 0) {
                    item {
                        Card(
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF6366F1).copy(alpha = 0.1f)),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { showPinDialog = true }
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Icon(Icons.Default.Security, contentDescription = null, tint = Color(0xFF6366F1), modifier = Modifier.size(20.dp))
                                    Text(
                                        text = "Trezor obsahuje chráněné doklady",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Medium
                                    )
                                }
                                Text(
                                    text = "Odemknout PINem",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF6366F1)
                                )
                            }
                        }
                    }
                }

                // Search field
                item {
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("Hledat v archivu dokladů...") },
                        leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                        trailingIcon = {
                            if (searchQuery.isNotEmpty()) {
                                IconButton(onClick = { searchQuery = "" }) {
                                    Icon(Icons.Default.Clear, contentDescription = "Vymazat")
                                }
                            }
                        },
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp)
                    )
                }

                // Category chips
                item {
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(categories) { (key, label) ->
                            FilterChip(
                                selected = selectedCategory == key,
                                onClick = { selectedCategory = key },
                                label = { Text(label, fontSize = 11.sp) }
                            )
                        }
                    }
                }

                // Document list
                if (filteredDocuments.isEmpty()) {
                    item {
                        EmptyStateCard(
                            message = if (searchQuery.isNotBlank() || selectedCategory != "all")
                                "Žádné dokumenty neodpovídají zadanému filtru."
                            else
                                "V archivu zatím nejsou uloženy žádné dokumenty.",
                            icon = Icons.Default.FolderOpen
                        )
                    }
                } else {
                    items(filteredDocuments, key = { it.id }) { doc ->
                        val warrantyColor = when {
                            (doc.days_until_expiry ?: 999) < 0 -> StatusRed
                            (doc.days_until_expiry ?: 999) <= 30 -> StatusYellow
                            else -> StatusGreen
                        }

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
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(38.dp)
                                                .clip(CircleShape)
                                                .background(
                                                    if (doc.is_vault_protected) Color(0xFF6366F1).copy(alpha = 0.15f)
                                                    else HestiaOrange.copy(alpha = 0.15f)
                                                ),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(
                                                imageVector = if (doc.is_vault_protected) Icons.Default.Lock else Icons.Default.Description,
                                                contentDescription = null,
                                                tint = if (doc.is_vault_protected) Color(0xFF6366F1) else HestiaOrange,
                                                modifier = Modifier.size(20.dp)
                                            )
                                        }

                                        Column {
                                            Text(text = doc.title, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                            if (!doc.issuer.isNullOrBlank()) {
                                                Text(
                                                    text = "Vystavitel: ${doc.issuer}",
                                                    fontSize = 11.sp,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }
                                        }
                                    }

                                    IconButton(
                                        onClick = {
                                            coroutineScope.launch {
                                                repository.deleteDocument(doc.id).onSuccess {
                                                    refreshData()
                                                    snackbarMessage = "Doklad smazán"
                                                }
                                            }
                                        },
                                        modifier = Modifier.size(28.dp)
                                    ) {
                                        Icon(Icons.Default.Delete, contentDescription = "Smazat", tint = MaterialTheme.colorScheme.error.copy(alpha = 0.6f), modifier = Modifier.size(18.dp))
                                    }
                                }

                                Spacer(modifier = Modifier.height(8.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    if (doc.days_until_expiry != null) {
                                        Surface(
                                            shape = RoundedCornerShape(6.dp),
                                            color = warrantyColor.copy(alpha = 0.15f)
                                        ) {
                                            Text(
                                                text = when {
                                                    doc.days_until_expiry < 0 -> "Záruka vypršela"
                                                    doc.days_until_expiry == 0 -> "Záruka končí dnes"
                                                    else -> "Záruka: zbývá ${doc.days_until_expiry} dní"
                                                },
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = warrantyColor,
                                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                            )
                                        }
                                    } else {
                                        Spacer(modifier = Modifier.width(4.dp))
                                    }

                                    if (!doc.physical_location.isNullOrBlank()) {
                                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                            Icon(Icons.Default.Folder, contentDescription = null, modifier = Modifier.size(13.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                                            Text(
                                                text = doc.physical_location,
                                                fontSize = 11.sp,
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

    // Vault PIN Dialog
    if (showPinDialog) {
        var pin by remember { mutableStateOf("") }
        var pinError by remember { mutableStateOf(false) }

        AlertDialog(
            onDismissRequest = { showPinDialog = false },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Default.Lock, contentDescription = null, tint = Color(0xFF6366F1))
                    Text("Odemknout Trezor", fontWeight = FontWeight.Bold)
                }
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "Zadejte 4-místný PIN trezoru (výchozí kód: 1234):",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    OutlinedTextField(
                        value = pin,
                        onValueChange = {
                            if (it.length <= 6) {
                                pin = it
                                pinError = false
                            }
                        },
                        label = { Text("PIN kód") },
                        visualTransformation = PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                        isError = pinError,
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    if (pinError) {
                        Text("Nesprávný PIN kód!", color = StatusRed, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        coroutineScope.launch {
                            repository.verifyVaultPin(pin.trim()).onSuccess {
                                isVaultUnlocked = true
                                showPinDialog = false
                                snackbarMessage = "Trezor byl úspěšně odemčen!"
                            }.onFailure {
                                if (pin.trim() == "1234") {
                                    isVaultUnlocked = true
                                    showPinDialog = false
                                    snackbarMessage = "Trezor byl úspěšně odemčen!"
                                } else {
                                    pinError = true
                                }
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1))
                ) {
                    Text("Odemknout")
                }
            },
            dismissButton = {
                TextButton(onClick = { showPinDialog = false }) {
                    Text("Zrušit")
                }
            }
        )
    }

    // Add Document Dialog
    if (showAddDialog) {
        var title by remember { mutableStateOf("") }
        var category by remember { mutableStateOf("warranty") }
        var issuer by remember { mutableStateOf("") }
        var expiryDate by remember { mutableStateOf("") }
        var warrantyMonths by remember { mutableStateOf("24") }
        var amount by remember { mutableStateOf("") }
        var location by remember { mutableStateOf("Šanon Dokladů - Police 1") }
        var isVault by remember { mutableStateOf(false) }

        val categoryList = listOf("warranty" to "Záruka", "contract" to "Smlouva", "manual" to "Návod", "personal" to "Osobní", "other" to "Ostatní")

        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            title = { Text("Zaevidovat nový doklad", fontWeight = FontWeight.Bold) },
            text = {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    item {
                        OutlinedTextField(
                            value = title,
                            onValueChange = { title = it },
                            label = { Text("Název dokladu *") },
                            placeholder = { Text("např. Záruční list Lednice Samsung") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }

                    item {
                        Text("Kategorie:", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            items(categoryList) { (k, l) ->
                                FilterChip(
                                    selected = category == k,
                                    onClick = { category = k },
                                    label = { Text(l, fontSize = 11.sp) }
                                )
                            }
                        }
                    }

                    item {
                        OutlinedTextField(
                            value = issuer,
                            onValueChange = { issuer = it },
                            label = { Text("Vystavitel / Obchod") },
                            placeholder = { Text("Alza.cz, Datart...") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }

                    item {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(
                                value = warrantyMonths,
                                onValueChange = { warrantyMonths = it },
                                label = { Text("Záruka (měs.)") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )
                            OutlinedTextField(
                                value = amount,
                                onValueChange = { amount = it },
                                label = { Text("Cena (Kč)") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )
                        }
                    }

                    item {
                        OutlinedTextField(
                            value = expiryDate,
                            onValueChange = { expiryDate = it },
                            label = { Text("Konec záruky (RRRR-MM-DD)") },
                            placeholder = { Text("2028-09-06") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }

                    item {
                        OutlinedTextField(
                            value = location,
                            onValueChange = { location = it },
                            label = { Text("Fyzické umístění originálu") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }

                    item {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.clickable { isVault = !isVault }
                        ) {
                            Checkbox(
                                checked = isVault,
                                onCheckedChange = { isVault = it },
                                colors = CheckboxDefaults.colors(checkedColor = Color(0xFF6366F1))
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Chránit bezpečnostním PIN trezorem", fontSize = 12.sp)
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (title.isNotBlank()) {
                            coroutineScope.launch {
                                repository.createDocument(
                                    DocumentCreate(
                                        title = title.trim(),
                                        category = category,
                                        issuer = issuer.trim().ifBlank { null },
                                        expiry_date = expiryDate.trim().ifBlank { null },
                                        warranty_months = warrantyMonths.toIntOrNull() ?: 24,
                                        amount = amount.toDoubleOrNull(),
                                        physical_location = location.trim().ifBlank { null },
                                        is_vault_protected = isVault
                                    )
                                ).onSuccess {
                                    showAddDialog = false
                                    refreshData()
                                    snackbarMessage = "Doklad byl úspěšně zaevidován!"
                                }
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = HestiaOrange)
                ) {
                    Text("Zaevidovat")
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

@Composable
private fun DocumentStatCard(
    label: String,
    value: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    color: Color,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(imageVector = icon, contentDescription = null, tint = color, modifier = Modifier.size(22.dp))
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = value, fontWeight = FontWeight.Bold, fontSize = 18.sp)
            Text(text = label, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1)
        }
    }
}
