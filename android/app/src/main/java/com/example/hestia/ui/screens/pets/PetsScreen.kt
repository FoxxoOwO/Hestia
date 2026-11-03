package com.example.hestia.ui.screens.pets

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
fun PetsScreen(repository: HestiaRepository) {
    val scope = rememberCoroutineScope()
    var pets by remember { mutableStateOf<List<Pet>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var search by remember { mutableStateOf("") }
    var speciesFilter by remember { mutableStateOf<String?>(null) }
    var favOnly by remember { mutableStateOf(false) }
    var showCreate by remember { mutableStateOf(false) }
    var editing by remember { mutableStateOf<Pet?>(null) }
    var deleteTarget by remember { mutableStateOf<Pet?>(null) }
    var selectedPetId by remember { mutableStateOf<Int?>(null) }
    var baseUrl by remember { mutableStateOf("") }

    LaunchedEffect(Unit) { baseUrl = repository.serverUrl() }

    suspend fun load() {
        loading = true
        repository.getPets(species = speciesFilter, favoriteOnly = favOnly.takeIf { it }, query = search.ifBlank { null })
            .onSuccess { pets = it; error = null }
            .onFailure { error = it.friendly() }
        loading = false
    }

    LaunchedEffect(speciesFilter, favOnly, search) {
        if (search.isNotBlank()) kotlinx.coroutines.delay(350)
        load()
    }

    val petId = selectedPetId
    if (petId != null) {
        BackHandler { selectedPetId = null }
        PetDetailScreen(
            repository = repository,
            petId = petId,
            onBack = { selectedPetId = null; scope.launch { load() } }
        )
        return
    }

    Column(Modifier.fillMaxSize()) {
        Column(Modifier.padding(horizontal = 12.dp, vertical = 8.dp)) {
            HestiaField(search, { search = it }, "Hledat mazlíčka")
            Spacer(Modifier.height(6.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                ChipSelector(
                    options = Labels.petSpecies,
                    selected = speciesFilter,
                    onSelect = { speciesFilter = it.ifBlank { null } },
                    includeAll = true,
                    modifier = Modifier.weight(1f)
                )
                IconButton(onClick = { favOnly = !favOnly }) {
                    Icon(
                        if (favOnly) Icons.Filled.Favorite else Icons.Filled.FavoriteBorder,
                        "Oblíbení",
                        tint = if (favOnly) StatusRed else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        ErrorBox(error, onRetry = { scope.launch { load() } })

        if (loading) LoadingBox() else LazyColumn(
            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
            modifier = Modifier.fillMaxSize()
        ) {
            if (pets.isEmpty()) {
                item { EmptyState(Icons.Default.Pets, "Žádní mazlíčci", "Přidejte psa, kočku nebo jiného parťáka.") }
            }
            items(pets, key = { it.id }) { pet ->
                PetCard(
                    pet = pet,
                    baseUrl = baseUrl,
                    onOpen = { selectedPetId = pet.id },
                    onFeed = {
                        scope.launch {
                            repository.feedPet(pet.id).onSuccess { load() }.onFailure { error = it.friendly() }
                        }
                    },
                    onToggleFavorite = {
                        scope.launch {
                            repository.togglePetFavorite(pet.id).onSuccess { load() }.onFailure { error = it.friendly() }
                        }
                    },
                    onEdit = { editing = pet },
                    onDelete = { deleteTarget = pet }
                )
            }
            item { Spacer(Modifier.height(90.dp)) }
        }
    }

    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.BottomEnd) {
        ExtendedFloatingActionButton(
            onClick = { showCreate = true },
            containerColor = HestiaOrange,
            contentColor = Color.White,
            modifier = Modifier.padding(20.dp),
            icon = { Icon(Icons.Default.Add, null) },
            text = { Text("Mazlíček") }
        )
    }

    if (showCreate || editing != null) {
        PetFormDialog(
            initial = editing,
            onDismiss = { showCreate = false; editing = null },
            onSave = { create ->
                scope.launch {
                    val initial = editing
                    val res = if (initial == null) repository.createPet(create)
                    else repository.updatePet(
                        initial.id,
                        PetUpdate(
                            name = create.name, species = create.species, breed = create.breed,
                            birth_date = create.birth_date, gender = create.gender, is_neutered = create.is_neutered,
                            color = create.color, microchip_number = create.microchip_number,
                            passport_number = create.passport_number, primary_image_url = create.primary_image_url,
                            dietary_needs = create.dietary_needs,
                            allergies_and_intolerances = create.allergies_and_intolerances,
                            vet_name = create.vet_name, vet_clinic = create.vet_clinic, vet_phone = create.vet_phone,
                            vet_address = create.vet_address, emergency_vet_phone = create.emergency_vet_phone,
                            emergency_vet_clinic = create.emergency_vet_clinic, notes = create.notes
                        )
                    )
                    res.onSuccess { showCreate = false; editing = null; load() }.onFailure { error = it.friendly() }
                }
            }
        )
    }

    deleteTarget?.let { pet ->
        ConfirmDialog(
            title = "Smazat mazlíčka",
            message = "Smazat „${pet.name}“ včetně záznamů?",
            onConfirm = { scope.launch { repository.deletePet(pet.id).onSuccess { load() } } },
            onDismiss = { deleteTarget = null }
        )
    }
}

@Composable
private fun PetCard(
    pet: Pet,
    baseUrl: String,
    onOpen: () -> Unit,
    onFeed: () -> Unit,
    onToggleFavorite: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    Card(shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
        Column(Modifier.padding(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(52.dp)
                        .clip(RoundedCornerShape(14.dp))
                ) {
                    RemoteImage(
                        url = resolveImageUrl(pet.primary_image_url, baseUrl),
                        contentDescription = pet.name,
                        modifier = Modifier.fillMaxSize(),
                        placeholder = {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(HestiaOrange.copy(alpha = 0.12f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.Pets, null, tint = HestiaOrange, modifier = Modifier.size(24.dp))
                            }
                        }
                    )
                }
                Spacer(Modifier.width(10.dp))
                Column(Modifier.weight(1f)) {
                    Text(pet.name, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                    Text(
                        listOfNotNull(
                            Labels.label(Labels.petSpecies, pet.species),
                            pet.breed,
                            pet.age_formatted.ifBlank { null }
                        ).joinToString(" • "),
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        pet.latest_weight_kg?.let { StatusPill("${Fmt.number(it)} kg", StatusBlue) }
                        if (pet.has_upcoming_vet_task) StatusPill("Vet", StatusYellow)
                        pet.last_fed_at?.let { StatusPill("Krmeno ${Fmt.relative(it)}", StatusGreen) }
                    }
                }
                IconButton(onClick = onToggleFavorite) {
                    Icon(
                        if (pet.is_favorite) Icons.Filled.Favorite else Icons.Filled.FavoriteBorder,
                        "Oblíbený",
                        tint = if (pet.is_favorite) StatusRed else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                FilledTonalButton(
                    onClick = onFeed,
                    shape = RoundedCornerShape(10.dp),
                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Icon(Icons.Default.Restaurant, null, modifier = Modifier.size(15.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Krmeno", fontSize = 12.sp)
                }
                TextButton(onClick = onOpen) { Text("Detail", fontSize = 12.sp) }
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
private fun PetHero(pet: Pet?, baseUrl: String) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 6.dp)
            .height(180.dp)
            .clip(RoundedCornerShape(18.dp))
    ) {
        RemoteImage(
            url = resolveImageUrl(pet?.primary_image_url, baseUrl),
            contentDescription = pet?.name,
            modifier = Modifier.fillMaxSize(),
            placeholder = {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(HestiaOrange.copy(alpha = 0.10f)),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.Pets, null, tint = HestiaOrange, modifier = Modifier.size(44.dp))
                        Text(
                            "Hestia mazlíček",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        )
        Row(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(10.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            pet?.let { p ->
                Surface(shape = RoundedCornerShape(8.dp), color = Color.Black.copy(alpha = 0.45f)) {
                    Text(
                        Labels.label(Labels.petSpecies, p.species),
                        color = Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                    )
                }
                if (p.age_formatted.isNotBlank()) {
                    Surface(shape = RoundedCornerShape(8.dp), color = HestiaOrange.copy(alpha = 0.85f)) {
                        Text(
                            p.age_formatted,
                            color = Color.White,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun PetDetailScreen(
    repository: HestiaRepository,
    petId: Int,
    onBack: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var pet by remember { mutableStateOf<Pet?>(null) }
    var sitter by remember { mutableStateOf<PetSitterProfile?>(null) }
    var flyer by remember { mutableStateOf<PetSosFlyer?>(null) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var message by remember { mutableStateOf<String?>(null) }
    var tab by remember { mutableStateOf(0) }
    var dialog by remember { mutableStateOf<String?>(null) }
    var baseUrl by remember { mutableStateOf("") }

    suspend fun reload() {
        repository.getPet(petId).onSuccess { pet = it }.onFailure { error = it.friendly() }
    }

    LaunchedEffect(petId) {
        loading = true
        baseUrl = repository.serverUrl()
        reload()
        repository.getPetSitterProfile(petId).onSuccess { sitter = it }
        repository.getPetSosFlyer(petId).onSuccess { flyer = it }
        loading = false
    }

    Column(Modifier.fillMaxSize()) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, "Zpět") }
            Text(pet?.name ?: "Mazlíček", fontWeight = FontWeight.Bold, fontSize = 18.sp, modifier = Modifier.weight(1f))
            IconButton(onClick = { scope.launch { reload() } }) { Icon(Icons.Default.Refresh, "Obnovit") }
        }

        PetHero(pet = pet, baseUrl = baseUrl)

        ScrollableTabRow(selectedTabIndex = tab, edgePadding = 8.dp) {
            listOf("Info", "Zdraví", "Léky", "Váhy", "Úkoly", "Deník").forEachIndexed { i, label ->
                Tab(selected = tab == i, onClick = { tab = i }, text = { Text(label, fontSize = 12.sp) })
            }
        }

        ErrorBox(error, onRetry = { scope.launch { reload() } })
        message?.let {
            SectionCard(title = "Výsledek") {
                Text(it, fontSize = 12.sp)
                TextButton(onClick = { message = null }) { Text("Zavřít", fontSize = 11.sp) }
            }
        }

        if (loading) {
            LoadingBox()
        } else {
            Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(12.dp)) {
                val p = pet ?: return@Column

                when (tab) {
                    0 -> {
                        InfoRow("Druh", Labels.label(Labels.petSpecies, p.species))
                        InfoRow("Plemeno", p.breed)
                        InfoRow("Narozen", p.birth_date?.let { Fmt.date(it) })
                        InfoRow("Pohlaví", p.gender)
                        InfoRow("Kastrovaný", if (p.is_neutered) "Ano" else "Ne")
                        InfoRow("Čip", p.microchip_number)
                        InfoRow("Pas", p.passport_number)
                        InfoRow("Váha", p.latest_weight_kg?.let { "${Fmt.number(it)} kg" })
                        InfoRow("Krmeno", p.last_fed_at?.let { "${Fmt.relative(it)} (${p.last_fed_by_name ?: "-"})" })
                        HorizontalDivider(Modifier.padding(vertical = 8.dp))
                        Text("Veterinář", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                        InfoRow("Jméno", p.vet_name)
                        InfoRow("Klinika", p.vet_clinic)
                        InfoRow("Telefon", p.vet_phone)
                        InfoRow("Pohotovost", p.emergency_vet_phone)
                        InfoRow("Klinika pohotovosti", p.emergency_vet_clinic)
                        if (!p.dietary_needs.isNullOrBlank()) InfoRow("Strava", p.dietary_needs)
                        if (!p.allergies_and_intolerances.isNullOrBlank()) InfoRow("Alergie", p.allergies_and_intolerances)
                        if (!p.notes.isNullOrBlank()) InfoRow("Poznámky", p.notes)

                        Spacer(Modifier.height(10.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedButton(onClick = { dialog = "food" }, shape = RoundedCornerShape(10.dp)) {
                                Text("AI: smí to jíst?", fontSize = 11.sp)
                            }
                            OutlinedButton(onClick = { dialog = "symptom" }, shape = RoundedCornerShape(10.dp)) {
                                Text("AI: příznaky", fontSize = 11.sp)
                            }
                        }

                        sitter?.let { s ->
                            HorizontalDivider(Modifier.padding(vertical = 8.dp))
                            Text("Hlídač / sitter", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                            InfoRow("Krmení", s.feeding_routine)
                            InfoRow("Alergie", s.allergies_warning)
                            InfoRow("Režim", s.daily_routine_notes)
                            s.active_medications.forEach { m -> InfoRow("Lék: ${m.name}", "${m.dosage} — ${m.frequency}") }
                            s.vet_contacts?.let { vc ->
                                InfoRow("Veterinář", vc.vet_name)
                                InfoRow("Klinika", vc.vet_clinic)
                                InfoRow("Telefon", vc.vet_phone)
                                InfoRow("Pohotovost", vc.emergency_vet_phone)
                            }
                        }

                        flyer?.let { f ->
                            HorizontalDivider(Modifier.padding(vertical = 8.dp))
                            Text("SOS leták", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                            Card(colors = CardDefaults.cardColors(containerColor = StatusRed.copy(alpha = 0.08f))) {
                                Column(Modifier.padding(10.dp)) {
                                    Text(f.name, fontWeight = FontWeight.Bold)
                                    Text("${f.owner_contact_name} • ${f.owner_contact_phone}", fontSize = 12.sp)
                                    if (!f.last_seen_date.isNullOrBlank()) Text("Naposledy viděn: ${Fmt.date(f.last_seen_date)}", fontSize = 12.sp)
                                    if (!f.distinctive_features.isNullOrBlank()) Text(f.distinctive_features, fontSize = 12.sp)
                                    if (!f.reward_note.isNullOrBlank()) Text(f.reward_note, fontSize = 12.sp, color = StatusRed)
                                }
                            }
                        }

                        Spacer(Modifier.height(10.dp))
                        OutlinedButton(
                            onClick = {
                                scope.launch {
                                    repository.addPetSupplyToShopping(petId, null)
                                        .onSuccess { message = "Potřeby přidány do nákupu" }
                                        .onFailure { error = it.friendly() }
                                }
                            },
                            shape = RoundedCornerShape(10.dp)
                        ) { Text("Potřeby do nákupu", fontSize = 12.sp) }
                    }

                    1 -> {
                        Row(
                            Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Zdravotní záznamy", fontWeight = FontWeight.SemiBold)
                            TextButton(onClick = { dialog = "record" }) { Text("+ Přidat") }
                        }
                        if (p.medical_records.isEmpty()) Text("Žádné záznamy.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        p.medical_records.forEach { r ->
                            Card(shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp)) {
                                Column(Modifier.padding(10.dp)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(r.title, fontWeight = FontWeight.Medium, fontSize = 13.sp, modifier = Modifier.weight(1f))
                                        StatusPill(
                                            r.record_type,
                                            if (r.valid_until != null && (Fmt.daysUntil(r.valid_until) ?: 1) < 0) StatusRed else StatusGreen
                                        )
                                    }
                                    Text(Fmt.date(r.performed_date), fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    r.valid_until?.let { Text("Platí do ${Fmt.date(it)}", fontSize = 11.sp) }
                                    r.veterinarian?.let { Text(it, fontSize = 11.sp) }
                                    r.notes?.let { Text(it, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                                }
                            }
                        }
                    }

                    2 -> {
                        Row(
                            Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Léky", fontWeight = FontWeight.SemiBold)
                            TextButton(onClick = { dialog = "med" }) { Text("+ Přidat") }
                        }
                        if (p.medications.isEmpty()) Text("Žádné léky.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        p.medications.forEach { m ->
                            Card(shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp)) {
                                Row(Modifier.padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Column(Modifier.weight(1f)) {
                                        Text(m.name, fontWeight = FontWeight.Medium, fontSize = 13.sp)
                                        Text("${m.dosage} • ${m.frequency}", fontSize = 11.sp)
                                        m.end_date?.let { Text("do ${Fmt.date(it)}", fontSize = 11.sp) }
                                    }
                                    if (m.is_active) StatusPill("Aktivní", StatusGreen) else StatusPill("Ukončeno", MaterialTheme.colorScheme.onSurfaceVariant)
                                    IconButton(onClick = {
                                        scope.launch {
                                            repository.deletePetMedication(petId, m.id).onSuccess { reload() }
                                        }
                                    }) { Icon(Icons.Default.Delete, "Smazat", tint = StatusRed, modifier = Modifier.size(16.dp)) }
                                }
                            }
                        }
                    }

                    3 -> {
                        Row(
                            Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Vážení", fontWeight = FontWeight.SemiBold)
                            TextButton(onClick = { dialog = "weight" }) { Text("+ Přidat") }
                        }
                        if (p.weight_logs.isEmpty()) Text("Žádná měření.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        p.weight_logs.sortedByDescending { it.recorded_date }.forEach { w ->
                            Row(Modifier.fillMaxWidth().padding(vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                                Text(Fmt.date(w.recorded_date), fontSize = 12.sp, modifier = Modifier.weight(1f))
                                Text("${Fmt.number(w.weight_kg)} kg", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                            }
                        }
                    }

                    4 -> {
                        Row(
                            Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Úkoly", fontWeight = FontWeight.SemiBold)
                            TextButton(onClick = { dialog = "task" }) { Text("+ Přidat") }
                        }
                        if (p.tasks.isEmpty()) Text("Žádné úkoly.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        p.tasks.sortedBy { it.due_date }.forEach { t ->
                            Row(Modifier.fillMaxWidth().padding(vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                                Column(Modifier.weight(1f)) {
                                    Text(t.title, fontSize = 13.sp, fontWeight = if (t.is_completed) FontWeight.Normal else FontWeight.Medium)
                                    Text(
                                        "${Fmt.date(t.due_date)} • ${Labels.label(Labels.petTaskTypes, t.task_type)}",
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                if (t.is_completed) {
                                    Icon(Icons.Default.CheckCircle, null, tint = StatusGreen, modifier = Modifier.size(18.dp))
                                } else {
                                    TextButton(onClick = {
                                        scope.launch {
                                            repository.completePetTask(petId, t.id).onSuccess { reload() }
                                        }
                                    }) { Text("Splnit", fontSize = 11.sp) }
                                }
                            }
                        }
                    }

                    else -> {
                        Row(
                            Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Deník", fontWeight = FontWeight.SemiBold)
                            TextButton(onClick = { dialog = "log" }) { Text("+ Zápis") }
                        }
                        if (p.log_entries.isEmpty()) Text("Zatím žádné zápisy.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        p.log_entries.forEach { l ->
                            Card(shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp)) {
                                Column(Modifier.padding(10.dp)) {
                                    Text(l.title, fontWeight = FontWeight.Medium, fontSize = 13.sp)
                                    Text(Fmt.relative(l.created_at), fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    l.notes?.let { Text(it, fontSize = 12.sp) }
                                }
                            }
                        }
                    }
                }
                Spacer(Modifier.height(40.dp))
            }
        }
    }

    when (dialog) {
        "food" -> {
            var food by remember { mutableStateOf("") }
            DialogScaffold(
                title = "Smí to jíst?",
                onDismiss = { dialog = null },
                confirmEnabled = food.isNotBlank(),
                onConfirm = {
                    scope.launch {
                        repository.checkPetFoodSafety(PetFoodSafetyRequest(species = pet?.species ?: "dog", food_name = food))
                            .onSuccess { r -> message = r.headline + "\n" + r.risk_description }
                            .onFailure { error = it.friendly() }
                        dialog = null
                    }
                }
            ) {
                HestiaField(food, { food = it }, "Potravina")
            }
        }
        "symptom" -> {
            var symptoms by remember { mutableStateOf("") }
            DialogScaffold(
                title = "AI analýza příznaků",
                onDismiss = { dialog = null },
                confirmEnabled = symptoms.isNotBlank(),
                onConfirm = {
                    scope.launch {
                        repository.diagnosePetSymptoms(
                            PetSymptomRequest(pet_id = petId, pet_name = pet?.name, pet_species = pet?.species ?: "dog", symptoms_description = symptoms)
                        ).onSuccess { r ->
                            message = r.assessment_headline + "\n" + r.urgency_message + "\n" +
                                r.action_steps.joinToString("\n")
                        }.onFailure { error = it.friendly() }
                        dialog = null
                    }
                }
            ) {
                HestiaField(symptoms, { symptoms = it }, "Popište příznaky", singleLine = false, minLines = 3)
            }
        }
        "record" -> {
            var type by remember { mutableStateOf("checkup") }
            var title by remember { mutableStateOf("") }
            var date by remember { mutableStateOf(Fmt.today()) }
            var validUntil by remember { mutableStateOf<String?>(null) }
            var vet by remember { mutableStateOf("") }
            var notes by remember { mutableStateOf("") }
            DialogScaffold(
                title = "Nový zdravotní záznam",
                onDismiss = { dialog = null },
                confirmEnabled = title.isNotBlank(),
                onConfirm = {
                    scope.launch {
                        repository.addPetMedicalRecord(
                            petId,
                            PetMedicalRecordCreate(
                                record_type = type, title = title, performed_date = date,
                                valid_until = validUntil, veterinarian = vet.ifBlank { null },
                                notes = notes.ifBlank { null }
                            )
                        ).onSuccess { reload(); dialog = null }.onFailure { error = it.friendly() }
                    }
                }
            ) {
                HestiaDropdown("Typ", listOf(
                    "checkup" to "Prohlídka", "vaccination" to "Očkování", "surgery" to "Operace",
                    "deworming" to "Odčervení", "injury" to "Úraz", "other" to "Jiné"
                ), type, { type = it })
                Spacer(Modifier.height(8.dp))
                HestiaField(title, { title = it }, "Název")
                Spacer(Modifier.height(8.dp))
                DateField("Datum", date, { date = it ?: Fmt.today() })
                Spacer(Modifier.height(8.dp))
                DateField("Platí do", validUntil, { validUntil = it })
                Spacer(Modifier.height(8.dp))
                HestiaField(vet, { vet = it }, "Veterinář")
                Spacer(Modifier.height(8.dp))
                HestiaField(notes, { notes = it }, "Poznámky", singleLine = false, minLines = 2)
            }
        }
        "med" -> {
            var name by remember { mutableStateOf("") }
            var dosage by remember { mutableStateOf("") }
            var frequency by remember { mutableStateOf("") }
            var notes by remember { mutableStateOf("") }
            DialogScaffold(
                title = "Nový lék",
                onDismiss = { dialog = null },
                confirmEnabled = name.isNotBlank(),
                onConfirm = {
                    scope.launch {
                        repository.addPetMedication(
                            petId,
                            PetMedicationCreate(
                                name = name, dosage = dosage, frequency = frequency,
                                start_date = Fmt.today(), notes = notes.ifBlank { null }
                            )
                        ).onSuccess { reload(); dialog = null }.onFailure { error = it.friendly() }
                    }
                }
            ) {
                HestiaField(name, { name = it }, "Název")
                Spacer(Modifier.height(8.dp))
                HestiaField(dosage, { dosage = it }, "Dávkování")
                Spacer(Modifier.height(8.dp))
                HestiaField(frequency, { frequency = it }, "Frekvence")
                Spacer(Modifier.height(8.dp))
                HestiaField(notes, { notes = it }, "Poznámky", singleLine = false, minLines = 2)
            }
        }
        "weight" -> {
            var weight by remember { mutableStateOf("") }
            var date by remember { mutableStateOf(Fmt.today()) }
            DialogScaffold(
                title = "Nové vážení",
                onDismiss = { dialog = null },
                confirmEnabled = weight.toDoubleOrNull() != null,
                onConfirm = {
                    scope.launch {
                        repository.addPetWeight(
                            petId,
                            PetWeightLogCreate(weight_kg = weight.toDouble(), recorded_date = date)
                        ).onSuccess { reload(); dialog = null }.onFailure { error = it.friendly() }
                    }
                }
            ) {
                HestiaNumberField(weight, { weight = it }, "Váha (kg)", decimal = true)
                Spacer(Modifier.height(8.dp))
                DateField("Datum", date, { date = it ?: Fmt.today() })
            }
        }
        "task" -> {
            var type by remember { mutableStateOf("vet_visit") }
            var title by remember { mutableStateOf("") }
            var date by remember { mutableStateOf(Fmt.today()) }
            var interval by remember { mutableStateOf("0") }
            DialogScaffold(
                title = "Nový úkol",
                onDismiss = { dialog = null },
                confirmEnabled = title.isNotBlank(),
                onConfirm = {
                    scope.launch {
                        repository.addPetTask(
                            petId,
                            PetTaskCreate(
                                task_type = type, title = title, due_date = date,
                                interval_days = interval.toIntOrNull() ?: 0
                            )
                        ).onSuccess { reload(); dialog = null }.onFailure { error = it.friendly() }
                    }
                }
            ) {
                HestiaDropdown("Typ", Labels.petTaskTypes, type, { type = it })
                Spacer(Modifier.height(8.dp))
                HestiaField(title, { title = it }, "Název")
                Spacer(Modifier.height(8.dp))
                DateField("Termín", date, { date = it ?: Fmt.today() })
                Spacer(Modifier.height(8.dp))
                HestiaNumberField(interval, { interval = it }, "Opakovat po dnech (0 = jednorázově)")
            }
        }
        "log" -> {
            var entryType by remember { mutableStateOf("note") }
            var title by remember { mutableStateOf("") }
            var notes by remember { mutableStateOf("") }
            DialogScaffold(
                title = "Nový zápis",
                onDismiss = { dialog = null },
                confirmEnabled = title.isNotBlank(),
                onConfirm = {
                    scope.launch {
                        repository.addPetLog(
                            petId,
                            PetLogEntryCreate(entry_type = entryType, title = title, notes = notes.ifBlank { null })
                        ).onSuccess { reload(); dialog = null }.onFailure { error = it.friendly() }
                    }
                }
            ) {
                HestiaDropdown("Typ", listOf(
                    "note" to "Poznámka", "feeding" to "Krmení", "walk" to "Procházka",
                    "play" to "Hraní", "grooming" to "Úprava srsti", "vet" to "Veterinář", "weight" to "Vážení"
                ), entryType, { entryType = it })
                Spacer(Modifier.height(8.dp))
                HestiaField(title, { title = it }, "Název")
                Spacer(Modifier.height(8.dp))
                HestiaField(notes, { notes = it }, "Poznámky", singleLine = false, minLines = 3)
            }
        }
    }
}

@Composable
private fun PetFormDialog(
    initial: Pet?,
    onDismiss: () -> Unit,
    onSave: (PetCreate) -> Unit
) {
    var name by remember { mutableStateOf(initial?.name ?: "") }
    var species by remember { mutableStateOf(initial?.species ?: "dog") }
    var breed by remember { mutableStateOf(initial?.breed ?: "") }
    var birthDate by remember { mutableStateOf(initial?.birth_date) }
    var gender by remember { mutableStateOf(initial?.gender ?: "unknown") }
    var neutered by remember { mutableStateOf(initial?.is_neutered ?: false) }
    var color by remember { mutableStateOf(initial?.color ?: "") }
    var chip by remember { mutableStateOf(initial?.microchip_number ?: "") }
    var passport by remember { mutableStateOf(initial?.passport_number ?: "") }
    var dietary by remember { mutableStateOf(initial?.dietary_needs ?: "") }
    var allergies by remember { mutableStateOf(initial?.allergies_and_intolerances ?: "") }
    var vetName by remember { mutableStateOf(initial?.vet_name ?: "") }
    var vetClinic by remember { mutableStateOf(initial?.vet_clinic ?: "") }
    var vetPhone by remember { mutableStateOf(initial?.vet_phone ?: "") }
    var emergencyPhone by remember { mutableStateOf(initial?.emergency_vet_phone ?: "") }
    var notes by remember { mutableStateOf(initial?.notes ?: "") }
    var imageUrl by remember { mutableStateOf(initial?.primary_image_url ?: "") }
    var weight by remember { mutableStateOf("") }

    DialogScaffold(
        title = if (initial == null) "Nový mazlíček" else "Upravit mazlíčka",
        onDismiss = onDismiss,
        confirmEnabled = name.isNotBlank(),
        onConfirm = {
            onSave(
                PetCreate(
                    name = name.trim(), species = species, breed = breed.ifBlank { null },
                    birth_date = birthDate, gender = gender, is_neutered = neutered,
                    color = color.ifBlank { null }, microchip_number = chip.ifBlank { null },
                    passport_number = passport.ifBlank { null },
                    primary_image_url = imageUrl.trim().ifBlank { null },
                    dietary_needs = dietary.ifBlank { null },
                    allergies_and_intolerances = allergies.ifBlank { null },
                    vet_name = vetName.ifBlank { null }, vet_clinic = vetClinic.ifBlank { null },
                    vet_phone = vetPhone.ifBlank { null },
                    emergency_vet_phone = emergencyPhone.ifBlank { null },
                    initial_weight_kg = weight.toDoubleOrNull(),
                    notes = notes.ifBlank { null }
                )
            )
        }
    ) {
        HestiaField(name, { name = it }, "Jméno")
        Spacer(Modifier.height(8.dp))
        HestiaDropdown("Druh", Labels.petSpecies, species, { species = it })
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            HestiaField(breed, { breed = it }, "Plemeno", Modifier.weight(1f))
            HestiaField(color, { color = it }, "Barva", Modifier.weight(1f))
        }
        Spacer(Modifier.height(8.dp))
        DateField("Datum narození", birthDate, { birthDate = it })
        Spacer(Modifier.height(8.dp))
        HestiaDropdown("Pohlaví", listOf("male" to "Pes", "female" to "Fena", "unknown" to "Neznámé"), gender, { gender = it })
        Spacer(Modifier.height(8.dp))
        ToggleRow("Kastrovaný/á", neutered, { neutered = it })
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            HestiaField(chip, { chip = it }, "Číslo čipu", Modifier.weight(1f))
            HestiaField(passport, { passport = it }, "Číslo pasu", Modifier.weight(1f))
        }
        Spacer(Modifier.height(8.dp))
        HestiaNumberField(weight, { weight = it }, "Počáteční váha (kg)", decimal = true)
        Spacer(Modifier.height(8.dp))
        HestiaField(imageUrl, { imageUrl = it }, "Fotka (URL)")
        if (imageUrl.startsWith("http")) {
            Spacer(Modifier.height(6.dp))
            RemoteImage(
                url = imageUrl.trim(),
                contentDescription = "Náhled fotky",
                modifier = Modifier
                    .size(96.dp)
                    .clip(RoundedCornerShape(12.dp))
            )
        }
        Spacer(Modifier.height(8.dp))
        HestiaField(dietary, { dietary = it }, "Strava / dieta", singleLine = false, minLines = 2)
        Spacer(Modifier.height(8.dp))
        HestiaField(allergies, { allergies = it }, "Alergie a intolerance", singleLine = false, minLines = 2)
        Spacer(Modifier.height(8.dp))
        HestiaField(vetName, { vetName = it }, "Veterinář")
        Spacer(Modifier.height(8.dp))
        HestiaField(vetClinic, { vetClinic = it }, "Klinika")
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            HestiaField(vetPhone, { vetPhone = it }, "Telefon", Modifier.weight(1f))
            HestiaField(emergencyPhone, { emergencyPhone = it }, "Pohotovost", Modifier.weight(1f))
        }
        Spacer(Modifier.height(8.dp))
        HestiaField(notes, { notes = it }, "Poznámky", singleLine = false, minLines = 2)
    }
}
