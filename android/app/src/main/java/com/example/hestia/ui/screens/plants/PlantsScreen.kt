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
import com.example.hestia.data.models.*
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
    var showAiBotanikDialog by remember { mutableStateOf(false) }
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
                            onClick = { showAiBotanikDialog = true },
                            colors = ButtonDefaults.filledTonalButtonColors(
                                containerColor = StatusGreen.copy(alpha = 0.15f),
                                contentColor = StatusGreen
                            ),
                            shape = RoundedCornerShape(10.dp),
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Icon(Icons.Default.AutoAwesome, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("AI Botanik", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }

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

    // AI Botanik Dialog
    if (showAiBotanikDialog) {
        var queryPlant by remember { mutableStateOf("") }
        var isAnalyzing by remember { mutableStateOf(false) }
        var analysisResult by remember { mutableStateOf<PlantAiExtracted?>(null) }
        var analysisError by remember { mutableStateOf<String?>(null) }
        var selectedRoom by remember { mutableStateOf("Obývací pokoj") }
        val rooms = listOf("Obývací pokoj", "Kuchyně", "Ložnice", "Chodba", "Koupelna", "Balkon / Terasa")
        val suggestions = listOf("Monstera Deliciosa", "Ficus Elastica", "Pothos (Šplhavnice)", "Sansevieria", "Zamioculcas", "Calathea")

        AlertDialog(
            onDismissRequest = { showAiBotanikDialog = false },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = StatusGreen)
                    Text("AI Botanik (Gemini)", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                }
            },
            text = {
                LazyColumn(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    item {
                        Text(
                            text = "Zadejte název pokojové rostliny a Gemini AI automaticky vygeneruje harmonogram zálivky, nároky na světlo, substrát i toxicitu pro zvířata.",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    item {
                        OutlinedTextField(
                            value = queryPlant,
                            onValueChange = { queryPlant = it },
                            label = { Text("Název rostliny") },
                            placeholder = { Text("např. Monstera deliciosa") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }

                    item {
                        Text("Populární rostliny:", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            items(suggestions) { sugg ->
                                SuggestionChip(
                                    onClick = { queryPlant = sugg },
                                    label = { Text(sugg, fontSize = 11.sp) }
                                )
                            }
                        }
                    }

                    item {
                        Button(
                            onClick = {
                                if (queryPlant.isNotBlank()) {
                                    coroutineScope.launch {
                                        isAnalyzing = true
                                        analysisError = null
                                        repository.aiAnalyzePlant(plantName = queryPlant.trim())
                                            .onSuccess {
                                                analysisResult = it
                                                isAnalyzing = false
                                            }
                                            .onFailure {
                                                analysisError = it.localizedMessage ?: "Nepodařilo se analyzovat rostlinu."
                                                isAnalyzing = false
                                            }
                                    }
                                }
                            },
                            enabled = queryPlant.isNotBlank() && !isAnalyzing,
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = StatusGreen),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            if (isAnalyzing) {
                                CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Analyzuji botanická data...")
                            } else {
                                Icon(Icons.Default.AutoAwesome, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Analyzovat s Gemini")
                            }
                        }
                    }

                    if (analysisError != null) {
                        item {
                            Text(
                                text = "Chyba: $analysisError",
                                color = StatusRed,
                                fontSize = 12.sp
                            )
                        }
                    }

                    analysisResult?.let { res ->
                        item {
                            Card(
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Text(
                                        text = res.common_name,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 16.sp
                                    )
                                    if (res.species_latin.isNotBlank()) {
                                        Text(
                                            text = res.species_latin,
                                            fontStyle = androidx.compose.ui.text.font.FontStyle.Italic,
                                            fontSize = 12.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                    if (res.description.isNotBlank()) {
                                        Text(text = res.description, fontSize = 12.sp)
                                    }

                                    HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))

                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text("💧 Zálivka v létě:", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                                        Text("každých ${res.watering_interval_days} dní", fontSize = 12.sp)
                                    }
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text("❄️ Zálivka v zimě:", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                                        Text("každých ${res.winter_watering_interval_days} dní", fontSize = 12.sp)
                                    }
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text("🌿 Substrát:", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                                        Text(res.substrate_recommendation, fontSize = 11.sp)
                                    }
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text("🐾 Pro zvířata:", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                                        Text(
                                            text = if (res.pet_toxicity == "safe") "Bezpečná (Pet Friendly) ✅" else "Pozor: Toxická ⚠️",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = if (res.pet_toxicity == "safe") StatusGreen else StatusRed
                                        )
                                    }
                                    if (res.pet_toxicity_details.isNotBlank()) {
                                        Text(
                                            text = res.pet_toxicity_details,
                                            fontSize = 11.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                            }
                        }

                        item {
                            Text("Vyberte umístění:", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                items(rooms) { r ->
                                    FilterChip(
                                        selected = selectedRoom == r,
                                        onClick = { selectedRoom = r },
                                        label = { Text(r, fontSize = 11.sp) }
                                    )
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                if (analysisResult != null) {
                    Button(
                        onClick = {
                            val res = analysisResult ?: return@Button
                            coroutineScope.launch {
                                repository.createPlant(
                                    PlantCreate(
                                        name = res.common_name,
                                        species_latin = res.species_latin.ifBlank { null },
                                        species_czech = res.species_czech.ifBlank { null },
                                        room = selectedRoom,
                                        light_requirement = res.light_requirement,
                                        watering_interval_days = res.watering_interval_days,
                                        winter_watering_interval_days = res.winter_watering_interval_days,
                                        fertilizing_interval_days = res.fertilizing_interval_days,
                                        misting_required = res.misting_required,
                                        substrate_type = res.substrate_recommendation,
                                        pet_toxicity = res.pet_toxicity,
                                        pet_toxicity_notes = res.pet_toxicity_details.ifBlank { null },
                                        health_notes = res.initial_health_assessment.ifBlank { null },
                                        notes = res.description.ifBlank { null }
                                    )
                                ).onSuccess {
                                    showAiBotanikDialog = false
                                    refreshPlants()
                                    snackbarMessage = "Květina '${res.common_name}' byla uložena s AI péčí!"
                                }
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = StatusGreen)
                    ) {
                        Text("Uložit do rostlin")
                    }
                }
            },
            dismissButton = {
                TextButton(onClick = { showAiBotanikDialog = false }) {
                    Text("Zavřít")
                }
            }
        )
    }
}
