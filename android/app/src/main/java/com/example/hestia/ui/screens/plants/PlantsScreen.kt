package com.example.hestia.ui.screens.plants

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
import com.example.hestia.theme.StatusBlue
import com.example.hestia.theme.StatusGreen
import com.example.hestia.theme.StatusRed
import com.example.hestia.theme.StatusYellow
import com.example.hestia.ui.components.*
import com.example.hestia.util.Fmt
import com.example.hestia.util.Labels
import com.example.hestia.util.friendly
import kotlinx.coroutines.launch

@Composable
fun PlantsScreen(repository: HestiaRepository) {
    val scope = rememberCoroutineScope()
    var plants by remember { mutableStateOf<List<Plant>>(emptyList()) }
    var sitter by remember { mutableStateOf<List<PlantSitterItem>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var tab by remember { mutableStateOf(0) }
    var onlyThirsty by remember { mutableStateOf(false) }
    var search by remember { mutableStateOf("") }
    var detail by remember { mutableStateOf<Plant?>(null) }
    var showCreate by remember { mutableStateOf(false) }
    var editing by remember { mutableStateOf<Plant?>(null) }
    var deleteTarget by remember { mutableStateOf<Plant?>(null) }
    var showAiIdentify by remember { mutableStateOf(false) }

    suspend fun load() {
        loading = true
        repository.getPlants(query = search.ifBlank { null }, needsWatering = onlyThirsty.takeIf { it })
            .onSuccess { plants = it; error = null }
            .onFailure { error = it.friendly() }
        loading = false
    }

    suspend fun loadSitter() {
        repository.getPlantSitterSchedule().onSuccess { sitter = it }.onFailure { error = it.friendly() }
    }

    LaunchedEffect(onlyThirsty, search) {
        if (search.isNotBlank()) kotlinx.coroutines.delay(350)
        load()
    }
    LaunchedEffect(tab) { if (tab == 1) loadSitter() }

    Column(Modifier.fillMaxSize()) {
        TabRow(selectedTabIndex = tab, containerColor = MaterialTheme.colorScheme.surface) {
            Tab(selected = tab == 0, onClick = { tab = 0 }, text = { Text("Květiny (${plants.size})") })
            Tab(selected = tab == 1, onClick = { tab = 1 }, text = { Text("Zálivka / Hlídač") })
        }

        ErrorBox(error, onRetry = { scope.launch { load() } })

        if (tab == 0) {
            Column(Modifier.padding(horizontal = 12.dp, vertical = 8.dp)) {
                HestiaField(search, { search = it }, "Hledat rostlinu")
                Row(verticalAlignment = Alignment.CenterVertically) {
                    FilterChip(
                        selected = onlyThirsty,
                        onClick = { onlyThirsty = !onlyThirsty },
                        label = { Text("Jen žíznivé") },
                        leadingIcon = { Icon(Icons.Default.WaterDrop, null, modifier = Modifier.size(14.dp)) }
                    )
                    Spacer(Modifier.width(8.dp))
                    AssistChip(
                        onClick = { showAiIdentify = true },
                        label = { Text("AI určení") },
                        leadingIcon = { Icon(Icons.Default.AutoAwesome, null, modifier = Modifier.size(16.dp)) }
                    )
                }
            }

            if (loading) LoadingBox() else LazyColumn(
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                if (plants.isEmpty()) {
                    item { EmptyState(Icons.Default.LocalFlorist, "Žádné rostliny", "Přidejte květiny a Hestia pohlídá zálivku.") }
                }
                items(plants, key = { it.id }) { plant ->
                    PlantCard(
                        plant = plant,
                        onOpen = { detail = plant },
                        onWater = {
                            scope.launch {
                                repository.waterPlant(plant.id)
                                    .onSuccess { load() }
                                    .onFailure { error = it.friendly() }
                            }
                        },
                        onToggleWinter = {
                            scope.launch {
                                repository.togglePlantWinterMode(plant.id).onSuccess { load() }.onFailure { error = it.friendly() }
                            }
                        },
                        onToggleFavorite = {
                            scope.launch {
                                repository.togglePlantFavorite(plant.id).onSuccess { load() }.onFailure { error = it.friendly() }
                            }
                        },
                        onEdit = { editing = plant },
                        onDelete = { deleteTarget = plant }
                    )
                }
                item { Spacer(Modifier.height(90.dp)) }
            }
        } else {
            LazyColumn(contentPadding = PaddingValues(12.dp)) {
                if (sitter.isEmpty()) {
                    item { EmptyState(Icons.Default.EventAvailable, "Nic k zalití", "Všechny rostliny jsou zalité.") }
                }
                items(sitter) { item ->
                    Card(shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                        Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.LocalFlorist, null, tint = StatusGreen)
                            Spacer(Modifier.width(10.dp))
                            Column(Modifier.weight(1f)) {
                                Text(item.plant_name, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                                Text(
                                    "${Labels.label(Labels.rooms, item.room)} • ${Labels.label(Labels.plantTaskTypes, item.action_required)}",
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                if (item.recommended_water_amount.isNotBlank()) {
                                    Text(item.recommended_water_amount, fontSize = 11.sp, color = StatusBlue)
                                }
                                if (item.instructions.isNotBlank()) {
                                    Text(item.instructions, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }
                    }
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
                text = { Text("Rostlina") }
            )
        }
    }

    detail?.let { plant ->
        PlantDetailDialog(
            repository = repository,
            plantId = plant.id,
            onDismiss = { detail = null },
            onChanged = { scope.launch { load() } }
        )
    }

    if (showCreate || editing != null) {
        PlantFormDialog(
            initial = editing,
            onDismiss = { showCreate = false; editing = null },
            onSave = { create ->
                scope.launch {
                    val initial = editing
                    val res = if (initial == null) repository.createPlant(create)
                    else repository.updatePlant(
                        initial.id,
                        PlantUpdate(
                            name = create.name, species_latin = create.species_latin, species_czech = create.species_czech,
                            room = create.room, light_requirement = create.light_requirement,
                            watering_interval_days = create.watering_interval_days,
                            winter_watering_interval_days = create.winter_watering_interval_days,
                            fertilizing_interval_days = create.fertilizing_interval_days,
                            misting_required = create.misting_required, pot_diameter_cm = create.pot_diameter_cm,
                            substrate_type = create.substrate_type, pet_toxicity = create.pet_toxicity,
                            pet_toxicity_notes = create.pet_toxicity_notes, health_status = create.health_status,
                            health_notes = create.health_notes, last_watered_date = create.last_watered_date,
                            next_watering_date = create.next_watering_date, is_winter_mode = create.is_winter_mode,
                            is_favorite = create.is_favorite, notes = create.notes
                        )
                    )
                    res.onSuccess { showCreate = false; editing = null; load() }.onFailure { error = it.friendly() }
                }
            }
        )
    }

    deleteTarget?.let { plant ->
        ConfirmDialog(
            title = "Smazat rostlinu",
            message = "Smazat „${plant.name}“?",
            onConfirm = { scope.launch { repository.deletePlant(plant.id).onSuccess { load() } } },
            onDismiss = { deleteTarget = null }
        )
    }

    if (showAiIdentify) {
        AiPlantDialog(
            repository = repository,
            onDismiss = { showAiIdentify = false },
            onResult = { extracted ->
                showAiIdentify = false
                editing = null
                scope.launch {
                    repository.createPlant(
                        PlantCreate(
                            name = extracted.common_name.ifBlank { "Nová rostlina" },
                            species_latin = extracted.species_latin.ifBlank { null },
                            species_czech = extracted.species_czech.ifBlank { null },
                            room = "living_room",
                            light_requirement = extracted.light_requirement,
                            watering_interval_days = extracted.watering_interval_days,
                            winter_watering_interval_days = extracted.winter_watering_interval_days,
                            fertilizing_interval_days = extracted.fertilizing_interval_days,
                            misting_required = extracted.misting_required,
                            pet_toxicity = extracted.pet_toxicity,
                            pet_toxicity_notes = extracted.pet_toxicity_details.ifBlank { null },
                            notes = extracted.description.ifBlank { null }
                        )
                    ).onSuccess { load() }.onFailure { error = it.friendly() }
                }
            }
        )
    }
}

@Composable
private fun PlantCard(
    plant: Plant,
    onOpen: () -> Unit,
    onWater: () -> Unit,
    onToggleWinter: () -> Unit,
    onToggleFavorite: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    val statusColor = when (plant.watering_status) {
        "overdue", "thirsty" -> StatusRed
        "soon" -> StatusYellow
        else -> StatusGreen
    }
    Card(
        shape = RoundedCornerShape(14.dp),
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)
    ) {
        Column(Modifier.padding(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(plant.name, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                        if (plant.is_winter_mode) {
                            Spacer(Modifier.width(6.dp))
                            StatusPill("Zima", StatusBlue)
                        }
                        if (plant.pet_toxicity != "safe") {
                            Spacer(Modifier.width(6.dp))
                            StatusPill("Pro zvířata", StatusRed)
                        }
                    }
                    Text(
                        listOfNotNull(plant.species_czech, Labels.label(Labels.rooms, plant.room)).joinToString(" • "),
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        if (plant.days_until_watering <= 0) "Zalít hned!" else "Zalít za ${plant.days_until_watering} dní",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = statusColor
                    )
                }
                IconButton(onClick = onToggleFavorite) {
                    Icon(
                        if (plant.is_favorite) Icons.Filled.Favorite else Icons.Filled.FavoriteBorder,
                        "Oblíbená",
                        tint = if (plant.is_favorite) StatusRed else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                FilledTonalButton(
                    onClick = onWater,
                    shape = RoundedCornerShape(10.dp),
                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Icon(Icons.Default.WaterDrop, null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Zalít", fontSize = 12.sp)
                }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(2.dp), verticalAlignment = Alignment.CenterVertically) {
                TextButton(onClick = onOpen) { Text("Detail", fontSize = 12.sp) }
                TextButton(onClick = onToggleWinter) {
                    Text(if (plant.is_winter_mode) "Vypnout zimu" else "Zimní režim", fontSize = 12.sp)
                }
                Spacer(Modifier.weight(1f))
                IconButton(onClick = onEdit, modifier = Modifier.size(32.dp)) {
                    Icon(Icons.Default.Edit, "Upravit", modifier = Modifier.size(16.dp))
                }
                IconButton(onClick = onDelete, modifier = Modifier.size(32.dp)) {
                    Icon(Icons.Default.Delete, "Smazat", tint = StatusRed, modifier = Modifier.size(16.dp))
                }
            }
        }
    }
}

@Composable
private fun PlantDetailDialog(
    repository: HestiaRepository,
    plantId: Int,
    onDismiss: () -> Unit,
    onChanged: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var plant by remember { mutableStateOf<Plant?>(null) }
    var loading by remember { mutableStateOf(true) }
    var diagnosis by remember { mutableStateOf<PlantDiagnosisResponse?>(null) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(plantId) {
        repository.getPlant(plantId).onSuccess { plant = it }.onFailure { error = it.friendly() }
        loading = false
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(plant?.name ?: "Rostlina") },
        text = {
            Column(Modifier.heightIn(max = 460.dp).verticalScroll(androidx.compose.foundation.rememberScrollState())) {
                if (loading) {
                    LinearProgressIndicator(Modifier.fillMaxWidth(), color = HestiaOrange)
                } else plant?.let { p ->
                    Text("${p.species_czech ?: "-"} (${p.species_latin ?: "-"})", fontSize = 12.sp)
                    Spacer(Modifier.height(6.dp))
                    Text("Zálivka: každých ${p.watering_interval_days} dní (zima ${p.winter_watering_interval_days})", fontSize = 12.sp)
                    Text("Hnojení: každých ${p.fertilizing_interval_days} dní", fontSize = 12.sp)
                    Text("Světlo: ${Labels.label(Labels.lightRequirements, p.light_requirement)}", fontSize = 12.sp)
                    Text("Poslední zálivka: ${p.last_watered_date?.let { Fmt.date(it) } ?: "—"}", fontSize = 12.sp)
                    Text("Toxicita: ${Labels.label(Labels.petToxicity, p.pet_toxicity)}", fontSize = 12.sp)
                    if (!p.notes.isNullOrBlank()) {
                        Spacer(Modifier.height(6.dp))
                        Text(p.notes, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }

                    HorizontalDivider(Modifier.padding(vertical = 8.dp))
                    Text("Úkoly", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                    p.tasks.filter { !it.is_completed }.forEach { task ->
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                "${Labels.label(Labels.plantTaskTypes, task.task_type)} • ${Fmt.date(task.due_date)}",
                                fontSize = 12.sp,
                                modifier = Modifier.weight(1f)
                            )
                            TextButton(onClick = {
                                scope.launch {
                                    repository.completePlantTask(p.id, task.id).onSuccess {
                                        repository.getPlant(plantId).onSuccess { plant = it }
                                        onChanged()
                                    }
                                }
                            }) { Text("Splnit", fontSize = 11.sp) }
                        }
                    }

                    HorizontalDivider(Modifier.padding(vertical = 8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(
                            onClick = {
                                scope.launch {
                                    repository.aiDiagnosePlant(
                                        PlantDiagnosisRequest(
                                            plant_id = p.id,
                                            plant_name = p.name,
                                            symptoms_description = p.health_notes ?: "Žloutnoucí listy, opadávání",
                                            image_url = p.primary_image_url
                                        )
                                    ).onSuccess { diagnosis = it }.onFailure { error = it.friendly() }
                                }
                            },
                            shape = RoundedCornerShape(10.dp)
                        ) { Text("AI diagnóza", fontSize = 11.sp) }
                    }
                    diagnosis?.let { d ->
                        Spacer(Modifier.height(8.dp))
                        Card(colors = CardDefaults.cardColors(containerColor = StatusGreen.copy(alpha = 0.1f))) {
                            Column(Modifier.padding(10.dp)) {
                                Text(d.diagnosis, fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
                                if (d.cause.isNotBlank()) Text("Příčina: ${d.cause}", fontSize = 11.sp)
                                d.action_steps.forEach { Text("• $it", fontSize = 11.sp) }
                                if (d.prevention_tips.isNotBlank()) Text("Prevence: ${d.prevention_tips}", fontSize = 11.sp)
                                Text("Naléhavost: ${d.severity}", fontSize = 11.sp)
                            }
                        }
                    }
                }
                error?.let { Text(it, color = StatusRed, fontSize = 12.sp) }
            }
        },
        confirmButton = { TextButton(onClick = onDismiss) { Text("Zavřít") } }
    )
}

@Composable
private fun PlantFormDialog(
    initial: Plant?,
    onDismiss: () -> Unit,
    onSave: (PlantCreate) -> Unit
) {
    var name by remember { mutableStateOf(initial?.name ?: "") }
    var speciesCzech by remember { mutableStateOf(initial?.species_czech ?: "") }
    var speciesLatin by remember { mutableStateOf(initial?.species_latin ?: "") }
    var room by remember { mutableStateOf(initial?.room ?: "living_room") }
    var light by remember { mutableStateOf(initial?.light_requirement ?: "bright_indirect") }
    var watering by remember { mutableStateOf((initial?.watering_interval_days ?: 7).toString()) }
    var winterWatering by remember { mutableStateOf((initial?.winter_watering_interval_days ?: 14).toString()) }
    var fertilizing by remember { mutableStateOf((initial?.fertilizing_interval_days ?: 14).toString()) }
    var misting by remember { mutableStateOf(initial?.misting_required ?: false) }
    var potSize by remember { mutableStateOf(initial?.pot_diameter_cm?.let { Fmt.number(it) } ?: "") }
    var toxicity by remember { mutableStateOf(initial?.pet_toxicity ?: "safe") }
    var health by remember { mutableStateOf(initial?.health_status ?: "healthy") }
    var notes by remember { mutableStateOf(initial?.notes ?: "") }
    var winterMode by remember { mutableStateOf(initial?.is_winter_mode ?: false) }

    DialogScaffold(
        title = if (initial == null) "Nová rostlina" else "Upravit rostlinu",
        onDismiss = onDismiss,
        confirmEnabled = name.isNotBlank(),
        onConfirm = {
            onSave(
                PlantCreate(
                    name = name.trim(),
                    species_czech = speciesCzech.ifBlank { null },
                    species_latin = speciesLatin.ifBlank { null },
                    room = room,
                    light_requirement = light,
                    watering_interval_days = watering.toIntOrNull() ?: 7,
                    winter_watering_interval_days = winterWatering.toIntOrNull() ?: 14,
                    fertilizing_interval_days = fertilizing.toIntOrNull() ?: 14,
                    misting_required = misting,
                    pot_diameter_cm = potSize.toDoubleOrNull(),
                    pet_toxicity = toxicity,
                    health_status = health,
                    notes = notes.ifBlank { null },
                    is_winter_mode = winterMode
                )
            )
        }
    ) {
        HestiaField(name, { name = it }, "Název")
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            HestiaField(speciesCzech, { speciesCzech = it }, "Druh (CZ)", Modifier.weight(1f))
            HestiaField(speciesLatin, { speciesLatin = it }, "Latinsky", Modifier.weight(1f))
        }
        Spacer(Modifier.height(8.dp))
        HestiaDropdown("Místnost", Labels.rooms, room, { room = it })
        Spacer(Modifier.height(8.dp))
        HestiaDropdown("Světlo", Labels.lightRequirements, light, { light = it })
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            HestiaNumberField(watering, { watering = it }, "Zálivka (dny)", Modifier.weight(1f))
            HestiaNumberField(winterWatering, { winterWatering = it }, "Zima (dny)", Modifier.weight(1f))
        }
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            HestiaNumberField(fertilizing, { fertilizing = it }, "Hnojení (dny)", Modifier.weight(1f))
            HestiaNumberField(potSize, { potSize = it }, "Květináč (cm)", Modifier.weight(1f), decimal = true)
        }
        Spacer(Modifier.height(8.dp))
        HestiaDropdown("Toxicita pro zvířata", Labels.petToxicity, toxicity, { toxicity = it })
        Spacer(Modifier.height(8.dp))
        HestiaDropdown("Zdraví", Labels.healthStatus, health, { health = it })
        Spacer(Modifier.height(8.dp))
        ToggleRow("Vyžaduje rosení", misting, { misting = it })
        ToggleRow("Zimní režim", winterMode, { winterMode = it })
        Spacer(Modifier.height(8.dp))
        HestiaField(notes, { notes = it }, "Poznámky", singleLine = false, minLines = 2)
    }
}

@Composable
private fun AiPlantDialog(
    repository: HestiaRepository,
    onDismiss: () -> Unit,
    onResult: (PlantAiExtracted) -> Unit
) {
    val scope = rememberCoroutineScope()
    var name by remember { mutableStateOf("") }
    var photoUrl by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    DialogScaffold(
        title = "AI určení rostliny",
        onDismiss = onDismiss,
        confirmText = if (busy) "Analyzuji…" else "Zjistit",
        confirmEnabled = !busy && (name.isNotBlank() || photoUrl.isNotBlank()),
        onConfirm = {
            busy = true
            scope.launch {
                repository.aiAnalyzePlant(
                    PlantAiRequest(
                        plant_name = name.ifBlank { null },
                        image_url = photoUrl.ifBlank { null }
                    )
                ).onSuccess { onResult(it) }.onFailure { error = it.friendly() }
                busy = false
            }
        }
    ) {
        Text("Zadejte název nebo odkaz na fotografii rostliny. AI doplní druh, nároky na světlo, zálivku a toxicitu.", fontSize = 12.sp)
        Spacer(Modifier.height(8.dp))
        HestiaField(name, { name = it }, "Název / popis")
        Spacer(Modifier.height(8.dp))
        HestiaField(photoUrl, { photoUrl = it }, "URL fotografie")
        if (busy) {
            Spacer(Modifier.height(8.dp))
            LinearProgressIndicator(Modifier.fillMaxWidth(), color = HestiaOrange)
        }
        error?.let { Text(it, color = StatusRed, fontSize = 12.sp) }
    }
}
