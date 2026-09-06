package com.example.hestia.ui.screens.documents

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
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
import com.example.hestia.data.models.DocumentItem
import com.example.hestia.data.models.DocumentStats
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.theme.HestiaOrange
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

    val filteredDocuments = remember(documents, searchQuery, selectedCategory) {
        documents.filter { doc ->
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
        containerColor = MaterialTheme.colorScheme.background
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
                contentPadding = PaddingValues(vertical = 16.dp)
            ) {
                // Stats cards
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
                            color = Color(0xFFF59E0B),
                            modifier = Modifier.weight(1f)
                        )
                        DocumentStatCard(
                            label = "Trezor",
                            value = "${stats?.vault_protected ?: 0}",
                            icon = Icons.Default.Lock,
                            color = Color(0xFF6366F1),
                            modifier = Modifier.weight(1f)
                        )
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
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = HestiaOrange,
                            unfocusedBorderColor = MaterialTheme.colorScheme.outlineVariant
                        )
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
                                label = { Text(label) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = HestiaOrange.copy(alpha = 0.2f),
                                    selectedLabelColor = HestiaOrange
                                )
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
                        DocumentItemCard(doc = doc)
                    }
                }
            }
        }
    }
}

@Composable
fun DocumentStatCard(
    label: String,
    value: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    color: Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(color.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    icon,
                    contentDescription = null,
                    tint = color,
                    modifier = Modifier.size(18.dp)
                )
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
fun DocumentItemCard(doc: DocumentItem) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            val isVault = doc.is_vault_protected
            val iconBg = if (isVault) Color(0xFF6366F1).copy(alpha = 0.15f) else HestiaOrange.copy(alpha = 0.15f)
            val iconTint = if (isVault) Color(0xFF6366F1) else HestiaOrange

            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(iconBg),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    if (isVault) Icons.Default.Lock else Icons.Default.Description,
                    contentDescription = null,
                    tint = iconTint,
                    modifier = Modifier.size(24.dp)
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = doc.title,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.weight(1f, fill = false)
                    )
                    if (doc.is_vault_protected) {
                        Surface(
                            color = Color(0xFF6366F1).copy(alpha = 0.15f),
                            shape = RoundedCornerShape(4.dp)
                        ) {
                            Text(
                                text = "Trezor",
                                color = Color(0xFF6366F1),
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(3.dp))

                doc.issuer?.let {
                    Text(
                        text = "Vystavitel: $it",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Row(
                    modifier = Modifier.padding(top = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Expiry badge
                    doc.days_until_expiry?.let { days ->
                        val (badgeText, badgeColor) = when {
                            days < 0 -> "Platnost vypršela" to Color(0xFFEF4444)
                            days <= 30 -> "Zbývá $days dní záruky" to Color(0xFFF59E0B)
                            else -> "Záruka aktivní ($days d)" to Color(0xFF10B981)
                        }
                        Surface(
                            color = badgeColor.copy(alpha = 0.15f),
                            shape = RoundedCornerShape(4.dp)
                        ) {
                            Text(
                                text = badgeText,
                                color = badgeColor,
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Medium,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }

                    // Physical location tag
                    doc.physical_location?.let { loc ->
                        Surface(
                            color = MaterialTheme.colorScheme.surfaceVariant,
                            shape = RoundedCornerShape(4.dp)
                        ) {
                            Text(
                                text = "📍 $loc",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}
