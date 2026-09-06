package com.example.hestia.ui.screens.plants

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
import com.example.hestia.data.models.Plant
import com.example.hestia.data.models.PlantCreate
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.theme.*
import com.example.hestia.ui.components.EmptyStateCard
import kotlinx.coroutines.launch

@Composable
fun PlantsScreen(
    repository: HestiaRepository,
    modifier: Modifier = Modifier
) {
    val coroutineScope = rememberCoroutineScope()
    var plants by remember { mutableStateOf<List<Plant>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var selectedFilter by remember { mutableStateOf("all") } // "all", "thirsty", "pet_friendly"
    var showAddDialog by remember { mutableStateOf(false) }
    var showDoctorDialog by remember { mutableStateOf(false) }
    var showSitterDialog by remember { mutableStateOf(false) }
    var snackbarMessage by remember { mutableStateOf<String?>(null) }

    fun refreshPlants() {
        coroutineScope.launch {
            isLoading = true
            repository.getPlants().onSuccess { plants = it }
            isLoading = false
        }
    }

    LaunchedEffect(Unit) {
        refreshPlants()
    }

    val filteredPlants = plants.filter { plant ->
        when (selectedFilter) {
            "thirsty" -> plant.days_until_watering <= 0
            "pet_friendly" -> plant.is_pet_friendly
            else -> true
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
                Icon(Icons.Default.Add, contentDescription = "Přidat květinu")
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
                // Header & Action buttons
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Pokojové květiny (${plants.size})",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )

                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        FilledTonalButton(
                            onClick = { showDoctorDialog = true },
                            colors = ButtonDefaults.filledTonalButtonColors(
                                containerColor = StatusGreen.copy(alpha = 0.15f),
                                contentColor = StatusGreen
                            ),
                            shape = RoundedCornerShape(10.dp),
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Icon(Icons.Default.MedicalServices, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Lékař", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }

                        FilledTonalButton(
                            onClick = { showSitterDialog = true },
                            colors = ButtonDefaults.filledTonalButtonColors(
                                containerColor = HestiaOrange.copy(alpha = 0.15f),
                                contentColor = HestiaOrange
                            ),
                            shape = RoundedCornerShape(10.dp),
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Icon(Icons.Default.BeachAccess, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Dovolená", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                // Filter Pills
                Row(
                    modifier = Modifier.padding(bottom = 6.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(
                        selected = selectedFilter == "all",
                        onClick = { selectedFilter = "all" },
                        label = { Text("Vše (${plants.size})", fontSize = 11.sp) }
                    )
                    FilterChip(
                        selected = selectedFilter == "thirsty",
                        onClick = { selectedFilter = "thirsty" },
                        leadingIcon = { Icon(Icons.Default.WaterDrop, contentDescription = null, modifier = Modifier.size(12.dp)) },
                        label = { Text("Žíznivé (${plants.count { it.days_until_watering <= 0 }})", fontSize = 11.sp) }
                    )
                    FilterChip(
                        selected = selectedFilter == "pet_friendly",
                        onClick = { selectedFilter = "pet_friendly" },
                        leadingIcon = { Icon(Icons.Default.Pets, contentDescription = null, modifier = Modifier.size(12.dp)) },
                        label = { Text("Pet friendly", fontSize = 11.sp) }
                    )
                }

                if (filteredPlants.isEmpty()) {
                    EmptyStateCard(
                        message = if (selectedFilter == "thirsty") "Žádná květina dnes nepotřebuje zalít!" else "Nebyly nalezeny žádné květiny.",
                        icon = Icons.Default.LocalFlorist
                    )
                } else {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(bottom = 80.dp)
                    ) {
                        items(filteredPlants, key = { it.id }) { plant ->
                            val isThirsty = plant.days_until_watering <= 0
                            val statusColor = when {
                                plant.days_until_watering <= 0 -> StatusRed
                                plant.days_until_watering <= 2 -> StatusYellow
                                else -> StatusGreen
                            }

                            Card(
                                shape = RoundedCornerShape(14.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(14.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = plant.name,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 15.sp,
                                            color = MaterialTheme.colorScheme.onSurface
                                        )

                                        Text(
                                            text = "${plant.room} ${if (!plant.species.isNullOrBlank()) "• ${plant.species}" else ""}",
                                            fontSize = 12.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                            modifier = Modifier.padding(top = 2.dp)
                                        )

                                        Spacer(modifier = Modifier.height(6.dp))

                                        Row(
                                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Badge(
                                                containerColor = statusColor.copy(alpha = 0.15f),
                                                contentColor = statusColor
                                            ) {
                                                Text(
                                                    text = if (isThirsty) "Zalít dnes!" else "Zálivka za ${plant.days_until_watering} dní",
                                                    fontSize = 10.sp,
                                                    fontWeight = FontWeight.Bold
                                                )
                                            }

                                            if (plant.is_pet_friendly) {
                                                Badge(
                                                    containerColor = StatusGreen.copy(alpha = 0.15f),
                                                    contentColor = StatusGreen
                                                ) {
                                                    Text("Pet friendly", fontSize = 9.sp)
                                                }
                                            }
                                        }
                                    }

                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                        Button(
                                            onClick = {
                                                coroutineScope.launch {
                                                    repository.waterPlant(plant.id)
                                                    refreshPlants()
                                                    snackbarMessage = "${plant.name} byla označena jako zalitá!"
                                                }
                                            },
                                            colors = ButtonDefaults.buttonColors(
                                                containerColor = if (isThirsty) StatusGreen else HestiaOrange
                                            ),
                                            shape = RoundedCornerShape(10.dp),
                                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                                        ) {
                                            Icon(Icons.Default.WaterDrop, contentDescription = null, modifier = Modifier.size(14.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("Zalito", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        }

                                        IconButton(
                                            onClick = {
                                                coroutineScope.launch {
                                                    repository.deletePlant(plant.id)
                                                    refreshPlants()
                                                    snackbarMessage = "Květina odstraněna"
                                                }
                                            },
                                            modifier = Modifier.size(28.dp)
                                        ) {
                                            Icon(Icons.Default.Delete, contentDescription = "Smazat", tint = MaterialTheme.colorScheme.error.copy(alpha = 0.6f), modifier = Modifier.size(18.dp))
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

    // Add Plant Dialog
    if (showAddDialog) {
        var name by remember { mutableStateOf("") }
        var species by remember { mutableStateOf("") }
        var room by remember { mutableStateOf("Obývací pokoj") }
        var intervalDays by remember { mutableStateOf("7") }
        var isPetFriendly by remember { mutableStateOf(true) }
        var notes by remember { mutableStateOf("") }

        val rooms = listOf("Obývací pokoj", "Kuchyně", "Ložnice", "Chodba", "Koupelna", "Balkon / Terasa")

        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            title = { Text("Přidat novou květinu", fontWeight = FontWeight.Bold) },
            text = {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    item {
                        OutlinedTextField(
                            value = name,
                            onValueChange = { name = it },
                            label = { Text("Název květiny *") },
                            placeholder = { Text("např. Monstera deliciosa") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }

                    item {
                        OutlinedTextField(
                            value = species,
                            onValueChange = { species = it },
                            label = { Text("Druh / Odrůda") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }

                    item {
                        Text("Umístění:", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
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
                        OutlinedTextField(
                            value = intervalDays,
                            onValueChange = { intervalDays = it },
                            label = { Text("Interval zálivky (dny)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }

                    item {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Checkbox(
                                checked = isPetFriendly,
                                onCheckedChange = { isPetFriendly = it },
                                colors = CheckboxDefaults.colors(checkedColor = StatusGreen)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Bezpečná pro domácí mazlíčky (Pet friendly)", fontSize = 12.sp)
                        }
                    }

                    item {
                        OutlinedTextField(
                            value = notes,
                            onValueChange = { notes = it },
                            label = { Text("Poznámka / Péče") },
                            modifier = Modifier.fillMaxWidth(),
                            maxLines = 2
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (name.isNotBlank()) {
                            coroutineScope.launch {
                                repository.createPlant(
                                    PlantCreate(
                                        name = name.trim(),
                                        species_czech = species.trim().ifBlank { null },
                                        room = room,
                                        watering_interval_days = intervalDays.toIntOrNull() ?: 7,
                                        pet_toxicity = if (isPetFriendly) "safe" else "toxic",
                                        notes = notes.trim().ifBlank { null }
                                    )
                                ).onSuccess {
                                    showAddDialog = false
                                    refreshPlants()
                                    snackbarMessage = "Květina byla úspěšně přidána!"
                                }
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = HestiaOrange)
                ) {
                    Text("Přidat květinu")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddDialog = false }) {
                    Text("Zrušit")
                }
            }
        )
    }

    // Plant Doctor Dialog
    if (showDoctorDialog) {
        val diagnoses = listOf(
            Triple("Žloutnutí listů", "Často způsobeno přelitím nebo nedostatkem živin.", "Zkontrolujte vlhkost kořenového balu. Omezte zálivku a přihnojte hnojivem na pokojovky."),
            Triple("Suché hnědé konečky", "Nízká vzdušná vlhkost v místnosti nebo přímé polední slunce.", "Pravidelně roste listy vlažnou vodou a přesuňte rostlinu na rozptýlené světlo."),
            Triple("Padání listů", "Šok ze změny teploty, průvanu nebo přelití v zimním období.", "Udržujte stálou teplotu, chraňte před větráním v mrazech a zalévejte vlažnou vodou."),
            Triple("Škůdci (svilušky, třásněnky)", "Drobný hmyz nebo jemné pavučinky na spodní straně listů.", "Osprchujte celou rostlinu vlažnou vodou a aplikujte postřik z neemového oleje nebo mýdlový roztok.")
        )

        AlertDialog(
            onDismissRequest = { showDoctorDialog = false },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Default.MedicalServices, contentDescription = null, tint = StatusGreen)
                    Text("Rostlinný lékař & Diagnostika", fontWeight = FontWeight.Bold, fontSize = 17.sp)
                }
            },
            text = {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(diagnoses) { (title, cause, advice) ->
                        Card(
                            shape = RoundedCornerShape(10.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(10.dp)) {
                                Text(text = "🌿 $title", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = StatusGreen)
                                Text(text = cause, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 2.dp))
                                Text(text = "💡 Řešení: $advice", fontSize = 11.sp, fontWeight = FontWeight.Medium, modifier = Modifier.padding(top = 4.dp))
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showDoctorDialog = false }) {
                    Text("Rozumím", color = StatusGreen)
                }
            }
        )
    }

    // Plant Sitter Dialog
    if (showSitterDialog) {
        AlertDialog(
            onDismissRequest = { showSitterDialog = false },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Default.BeachAccess, contentDescription = null, tint = HestiaOrange)
                    Text("Plant Sitter Checklist", fontWeight = FontWeight.Bold, fontSize = 17.sp)
                }
            },
            text = {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    item {
                        Text(
                            text = "Přehled péče o rostliny pro opatrovníka během vaší dovolené:",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    items(plants) { plant ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(text = plant.name, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                Text(text = "${plant.room} • interval: ${plant.watering_interval_days} dní", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Text(
                                text = if (plant.days_until_watering <= 0) "Zalít ihned!" else "za ${plant.days_until_watering} d.",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (plant.days_until_watering <= 0) StatusRed else StatusGreen
                            )
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showSitterDialog = false }) {
                    Text("Zavřít", color = HestiaOrange)
                }
            }
        )
    }
}
