package com.example.hestia.ui.screens.pets

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hestia.data.models.*
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.theme.HestiaOrange
import com.example.hestia.theme.StatusGreen
import com.example.hestia.theme.StatusRed
import com.example.hestia.ui.components.EmptyStateCard
import kotlinx.coroutines.launch

@Composable
fun PetsScreen(
    repository: HestiaRepository,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    var pets by remember { mutableStateOf<List<Pet>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var actionMessage by remember { mutableStateOf<String?>(null) }

    var showAddPetDialog by remember { mutableStateOf(false) }
    var showFoodSafetyDialog by remember { mutableStateOf(false) }
    var showVetDoctorDialog by remember { mutableStateOf(false) }
    var selectedPetForSos by remember { mutableStateOf<Pet?>(null) }
    var selectedPetForRecord by remember { mutableStateOf<Pet?>(null) }

    fun refreshPets() {
        coroutineScope.launch {
            isLoading = true
            repository.getPets().onSuccess { pets = it }
            isLoading = false
        }
    }

    LaunchedEffect(Unit) {
        refreshPets()
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background,
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddPetDialog = true },
                containerColor = HestiaOrange,
                contentColor = Color.White,
                shape = CircleShape
            ) {
                Icon(Icons.Default.Add, contentDescription = "Přidat mazlíčka")
            }
        },
        snackbarHost = {
            actionMessage?.let { msg ->
                Snackbar(
                    modifier = Modifier.padding(16.dp),
                    action = {
                        TextButton(onClick = { actionMessage = null }) {
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
                        text = "Domácí mazlíčci (${pets.size})",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )

                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        FilledTonalButton(
                            onClick = { showVetDoctorDialog = true },
                            colors = ButtonDefaults.filledTonalButtonColors(
                                containerColor = StatusGreen.copy(alpha = 0.15f),
                                contentColor = StatusGreen
                            ),
                            shape = RoundedCornerShape(10.dp),
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Icon(Icons.Default.MedicalServices, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("AI Veterinář", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }

                        FilledTonalButton(
                            onClick = { showFoodSafetyDialog = true },
                            colors = ButtonDefaults.filledTonalButtonColors(
                                containerColor = StatusRed.copy(alpha = 0.15f),
                                contentColor = StatusRed
                            ),
                            shape = RoundedCornerShape(10.dp),
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Icon(Icons.Default.Warning, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Toxické potraviny", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                if (pets.isEmpty()) {
                    EmptyStateCard(
                        message = "V domácnosti zatím nemáte přidané žádné mazlíčky.",
                        icon = Icons.Default.Pets
                    )
                } else {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(bottom = 80.dp)
                    ) {
                        items(pets, key = { it.id }) { pet ->
                            var isMedicalExpanded by remember { mutableStateOf(false) }

                            Card(
                                shape = RoundedCornerShape(14.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(16.dp)
                                ) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                                        ) {
                                            Box(
                                                modifier = Modifier
                                                    .size(44.dp)
                                                    .clip(CircleShape)
                                                    .background(HestiaOrange.copy(alpha = 0.15f)),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Icon(
                                                    imageVector = Icons.Default.Pets,
                                                    contentDescription = null,
                                                    tint = HestiaOrange,
                                                    modifier = Modifier.size(24.dp)
                                                )
                                            }
                                            Column {
                                                Text(
                                                    text = pet.name,
                                                    fontWeight = FontWeight.Bold,
                                                    fontSize = 17.sp
                                                )
                                                Text(
                                                    text = buildString {
                                                        append(when (pet.species) {
                                                            "dog" -> "Pes"
                                                            "cat" -> "Kočka"
                                                            "rabbit" -> "Králík"
                                                            "rodent" -> "Hlodavec"
                                                            else -> pet.species
                                                        })
                                                        if (!pet.breed.isNullOrBlank()) {
                                                            append(" • ${pet.breed}")
                                                        }
                                                    },
                                                    fontSize = 12.sp,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }
                                        }

                                        // Feed button
                                        Button(
                                            onClick = {
                                                coroutineScope.launch {
                                                    repository.feedPet(pet.id)
                                                        .onSuccess {
                                                            actionMessage = "${pet.name} byl(a) úspěšně nakrmen(a)!"
                                                            refreshPets()
                                                        }
                                                        .onFailure {
                                                            actionMessage = "Krmení se nezdařilo: ${it.message}"
                                                        }
                                                }
                                            },
                                            shape = RoundedCornerShape(8.dp),
                                            colors = ButtonDefaults.buttonColors(containerColor = StatusGreen),
                                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.Restaurant,
                                                contentDescription = null,
                                                modifier = Modifier.size(16.dp)
                                            )
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("Nakrmit", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(10.dp))

                                    // Pet details row
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                                    ) {
                                        if (pet.age_formatted.isNotBlank()) {
                                            Column {
                                                Text("Věk", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                                Text(pet.age_formatted, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                                            }
                                        }
                                        if (pet.latest_weight_kg != null) {
                                            Column {
                                                Text("Váha", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                                Text("${pet.latest_weight_kg} kg", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                                            }
                                        }
                                        if (!pet.last_fed_at.isNullOrBlank()) {
                                            Column {
                                                Text("Poslední krmení", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                                Text(
                                                    text = buildString {
                                                        append(pet.last_fed_at)
                                                        if (!pet.last_fed_by_name.isNullOrBlank()) {
                                                            append(" (${pet.last_fed_by_name})")
                                                        }
                                                    },
                                                    fontSize = 12.sp,
                                                    fontWeight = FontWeight.Medium
                                                )
                                            }
                                        }
                                    }

                                    // Vet contact
                                    if (!pet.vet_name.isNullOrBlank()) {
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Text(
                                                text = "Veterinář: ${pet.vet_name}",
                                                fontSize = 12.sp,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )

                                            if (!pet.vet_phone.isNullOrBlank()) {
                                                TextButton(
                                                    onClick = {
                                                        val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${pet.vet_phone}"))
                                                        context.startActivity(intent)
                                                    },
                                                    contentPadding = PaddingValues(horizontal = 6.dp, vertical = 2.dp)
                                                ) {
                                                    Icon(Icons.Default.Phone, contentDescription = null, modifier = Modifier.size(14.dp), tint = HestiaOrange)
                                                    Spacer(modifier = Modifier.width(4.dp))
                                                    Text(pet.vet_phone!!, fontSize = 11.sp, color = HestiaOrange, fontWeight = FontWeight.Bold)
                                                }
                                            }
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(8.dp))

                                    // Action buttons for Pet (SOS flyer, Add Record, View Records)
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        OutlinedButton(
                                            onClick = { selectedPetForRecord = pet },
                                            shape = RoundedCornerShape(8.dp),
                                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                                            modifier = Modifier.weight(1f)
                                        ) {
                                            Icon(Icons.Default.MedicalServices, contentDescription = null, modifier = Modifier.size(13.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("+ Očkování", fontSize = 11.sp)
                                        }

                                        OutlinedButton(
                                            onClick = { selectedPetForSos = pet },
                                            shape = RoundedCornerShape(8.dp),
                                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                                            modifier = Modifier.weight(1f)
                                        ) {
                                            Icon(Icons.Default.Campaign, contentDescription = null, modifier = Modifier.size(13.dp), tint = StatusRed)
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("SOS Leták", fontSize = 11.sp, color = StatusRed)
                                        }

                                        if (pet.medical_records.isNotEmpty()) {
                                            TextButton(
                                                onClick = { isMedicalExpanded = !isMedicalExpanded },
                                                contentPadding = PaddingValues(horizontal = 6.dp, vertical = 4.dp)
                                            ) {
                                                Text(
                                                    text = if (isMedicalExpanded) "Skrýt (${pet.medical_records.size})" else "Záznamy (${pet.medical_records.size})",
                                                    fontSize = 11.sp
                                                )
                                            }
                                        }
                                    }

                                    // Expandable Medical Records
                                    if (isMedicalExpanded && pet.medical_records.isNotEmpty()) {
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Column(
                                            verticalArrangement = Arrangement.spacedBy(4.dp),
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                                                .padding(8.dp)
                                        ) {
                                            pet.medical_records.forEach { record ->
                                                Row(
                                                    modifier = Modifier.fillMaxWidth(),
                                                    horizontalArrangement = Arrangement.SpaceBetween
                                                ) {
                                                    Text("💉 ${record.title}", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                                                    Text(record.performed_date, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                                }
                                                if (!record.valid_until.isNullOrBlank()) {
                                                    Text("   Platnost do: ${record.valid_until}", fontSize = 10.sp, color = StatusGreen)
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
        }
    }

    // Add Pet Dialog
    if (showAddPetDialog) {
        var name by remember { mutableStateOf("") }
        var species by remember { mutableStateOf("dog") }
        var breed by remember { mutableStateOf("") }
        var birthDate by remember { mutableStateOf("") }
        var weight by remember { mutableStateOf("") }
        var vetName by remember { mutableStateOf("") }
        var vetPhone by remember { mutableStateOf("") }
        var notes by remember { mutableStateOf("") }

        val speciesOptions = listOf("dog" to "Pes", "cat" to "Kočka", "rabbit" to "Králík", "rodent" to "Hlodavec", "bird" to "Pták", "other" to "Jiné")

        AlertDialog(
            onDismissRequest = { showAddPetDialog = false },
            title = { Text("Přidat nového mazlíčka", fontWeight = FontWeight.Bold) },
            text = {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    item {
                        OutlinedTextField(
                            value = name,
                            onValueChange = { name = it },
                            label = { Text("Jméno zvířete *") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }

                    item {
                        Text("Druh:", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            items(speciesOptions) { (key, label) ->
                                FilterChip(
                                    selected = species == key,
                                    onClick = { species = key },
                                    label = { Text(label, fontSize = 11.sp) }
                                )
                            }
                        }
                    }

                    item {
                        OutlinedTextField(
                            value = breed,
                            onValueChange = { breed = it },
                            label = { Text("Plemeno / Rasa") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }

                    item {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(
                                value = birthDate,
                                onValueChange = { birthDate = it },
                                label = { Text("Narození (RRRR-MM)") },
                                placeholder = { Text("2022-05") },
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )

                            OutlinedTextField(
                                value = weight,
                                onValueChange = { weight = it },
                                label = { Text("Váha (kg)") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )
                        }
                    }

                    item {
                        OutlinedTextField(
                            value = vetName,
                            onValueChange = { vetName = it },
                            label = { Text("Jméno veterináře / Klinika") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }

                    item {
                        OutlinedTextField(
                            value = vetPhone,
                            onValueChange = { vetPhone = it },
                            label = { Text("Telefon na veterináře") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }

                    item {
                        OutlinedTextField(
                            value = notes,
                            onValueChange = { notes = it },
                            label = { Text("Poznámka / Alergie") },
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
                                repository.createPet(
                                    PetCreate(
                                        name = name.trim(),
                                        species = species,
                                        breed = breed.trim().ifBlank { null },
                                        birth_date = birthDate.trim().ifBlank { null },
                                        initial_weight_kg = weight.toDoubleOrNull(),
                                        vet_name = vetName.trim().ifBlank { null },
                                        vet_phone = vetPhone.trim().ifBlank { null },
                                        notes = notes.trim().ifBlank { null }
                                    )
                                ).onSuccess {
                                    showAddPetDialog = false
                                    refreshPets()
                                    actionMessage = "Mazlíček byl úspěšně přidán!"
                                }
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = HestiaOrange)
                ) {
                    Text("Přidat mazlíčka")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddPetDialog = false }) {
                    Text("Zrušit")
                }
            }
        )
    }

    // Add Medical Record Dialog
    selectedPetForRecord?.let { pet ->
        var recordTitle by remember { mutableStateOf("") }
        var recordDate by remember { mutableStateOf("") }
        var validUntil by remember { mutableStateOf("") }
        var veterinarian by remember { mutableStateOf(pet.vet_name ?: "") }

        AlertDialog(
            onDismissRequest = { selectedPetForRecord = null },
            title = { Text("Záznam očkování / lékaře pro ${pet.name}", fontWeight = FontWeight.Bold, fontSize = 16.sp) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = recordTitle,
                        onValueChange = { recordTitle = it },
                        label = { Text("Název vakcíny / Zákroku *") },
                        placeholder = { Text("např. Vzteklina (Nobivac)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = recordDate,
                        onValueChange = { recordDate = it },
                        label = { Text("Datum provedení (RRRR-MM-DD) *") },
                        placeholder = { Text("2026-09-06") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = validUntil,
                        onValueChange = { validUntil = it },
                        label = { Text("Platnost do (RRRR-MM-DD)") },
                        placeholder = { Text("2027-09-06") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = veterinarian,
                        onValueChange = { veterinarian = it },
                        label = { Text("Veterinář") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (recordTitle.isNotBlank() && recordDate.isNotBlank()) {
                            coroutineScope.launch {
                                repository.addPetMedicalRecord(
                                    pet.id,
                                    PetMedicalRecordCreate(
                                        title = recordTitle.trim(),
                                        performed_date = recordDate.trim(),
                                        valid_until = validUntil.trim().ifBlank { null },
                                        veterinarian = veterinarian.trim().ifBlank { null }
                                    )
                                ).onSuccess {
                                    selectedPetForRecord = null
                                    refreshPets()
                                    actionMessage = "Lékařský záznam byl úspěšně uložen!"
                                }
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = HestiaOrange)
                ) {
                    Text("Uložit záznam")
                }
            },
            dismissButton = {
                TextButton(onClick = { selectedPetForRecord = null }) {
                    Text("Zrušit")
                }
            }
        )
    }

    // Lost Pet SOS Poster Dialog
    selectedPetForSos?.let { pet ->
        AlertDialog(
            onDismissRequest = { selectedPetForSos = null },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Default.Campaign, contentDescription = null, tint = StatusRed)
                    Text("SOS Leták při ztrátě: ${pet.name}", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = StatusRed)
                }
            },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = StatusRed.copy(alpha = 0.08f)),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(14.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("🚨 POHŘEŠUJE SE MAZLÍČEK 🚨", fontWeight = FontWeight.Black, fontSize = 16.sp, color = StatusRed)
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(pet.name, fontWeight = FontWeight.Bold, fontSize = 20.sp)
                            Text("${pet.species} • ${pet.breed ?: "kříženec"}", fontSize = 13.sp)
                            if (pet.age_formatted.isNotBlank()) {
                                Text("Věk: ${pet.age_formatted}", fontSize = 12.sp)
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("Při nálezu prosím ihned volejte:", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            Text(pet.vet_phone ?: "Rodinný kontakt Hestia", fontSize = 15.sp, fontWeight = FontWeight.Black, color = HestiaOrange)
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val shareIntent = Intent(Intent.ACTION_SEND).apply {
                            type = "text/plain"
                            putExtra(Intent.EXTRA_SUBJECT, "POHŘEŠUJE SE MAZLÍČEK: ${pet.name}")
                            putExtra(Intent.EXTRA_TEXT, "POHŘEŠUJE SE: ${pet.name} (${pet.species}, ${pet.breed ?: ""}). Při nálezu prosím volejte na kontakt: ${pet.vet_phone ?: "domácnost"}.")
                        }
                        context.startActivity(Intent.createChooser(shareIntent, "Sdílet SOS Leták"))
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = StatusRed)
                ) {
                    Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Sdílet leták")
                }
            },
            dismissButton = {
                TextButton(onClick = { selectedPetForSos = null }) {
                    Text("Zavřít")
                }
            }
        )
    }

    // Food Safety Dialog (Toxic items + Gemini AI safety checker)
    if (showFoodSafetyDialog) {
        var queryFood by remember { mutableStateOf("") }
        var selectedSpecies by remember { mutableStateOf("dog") } // "dog" or "cat"
        var isCheckingFood by remember { mutableStateOf(false) }
        var foodSafetyResult by remember { mutableStateOf<PetFoodSafetyResponse?>(null) }
        var checkFoodError by remember { mutableStateOf<String?>(null) }

        val commonTestFoods = listOf("Čokoláda", "Hrozny", "Avokádo", "Cibule", "Jablko", "Vařené kuře")

        val toxicFoods = listOf(
            Triple("Čokoláda a kakao", "Obsahuje teobromin, který je pro psy a kočky prudce jedovatý.", "Způsobuje zvracení, křeče a selhání srdce."),
            Triple("Hrozny a rozinky", "I malé množství může způsobit akutní selhání ledvin.", "Nikdy nepodávat psům ani kočkám."),
            Triple("Cibule, česnek a pórek", "Ničí červené krvinky a způsobuje život ohrožující anémii.", "Toxické i ve vařeném stavu nebo vývaru."),
            Triple("Xylitol (umělé sladidlo)", "Ve žvýkačkách a dietních potravinách. Prudký pokles cukru a selhání jater.", "Okamžitě vyhledejte veterináře!"),
            Triple("Avokádo a kofein", "Persin v avokádu způsobuje trávicí potíže; kofein stimuluje srdce do arytmií.", "Držte mimo dosah zvířat.")
        )

        AlertDialog(
            onDismissRequest = { showFoodSafetyDialog = false },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Default.Warning, contentDescription = null, tint = StatusRed)
                    Text("Bezpečnost potravin (Gemini AI)", fontWeight = FontWeight.Bold, fontSize = 17.sp)
                }
            },
            text = {
                LazyColumn(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    item {
                        Text(
                            text = "Zadejte jakoukoliv surovinu a Gemini AI okamžitě ověří toxicitu, rizika a první pomoc.",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            FilterChip(
                                selected = selectedSpecies == "dog",
                                onClick = { selectedSpecies = "dog" },
                                label = { Text("🐶 Pes", fontSize = 12.sp) }
                            )
                            FilterChip(
                                selected = selectedSpecies == "cat",
                                onClick = { selectedSpecies = "cat" },
                                label = { Text("🐱 Kočka", fontSize = 12.sp) }
                            )
                        }
                    }

                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedTextField(
                                value = queryFood,
                                onValueChange = { queryFood = it },
                                label = { Text("Potravina k ověření") },
                                placeholder = { Text("např. hrozny, arašídy...") },
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )
                            Button(
                                onClick = {
                                    if (queryFood.isNotBlank()) {
                                        coroutineScope.launch {
                                            isCheckingFood = true
                                            checkFoodError = null
                                            repository.checkPetFoodSafety(foodName = queryFood.trim(), species = selectedSpecies)
                                                .onSuccess {
                                                    foodSafetyResult = it
                                                    isCheckingFood = false
                                                }
                                                .onFailure {
                                                    checkFoodError = it.localizedMessage ?: "Chyba při ověřování potraviny."
                                                    isCheckingFood = false
                                                }
                                        }
                                    }
                                },
                                enabled = queryFood.isNotBlank() && !isCheckingFood,
                                colors = ButtonDefaults.buttonColors(containerColor = HestiaOrange),
                                shape = RoundedCornerShape(10.dp),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 14.dp)
                            ) {
                                if (isCheckingFood) {
                                    CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                                } else {
                                    Icon(Icons.Default.Search, contentDescription = "Ověřit")
                                }
                            }
                        }
                    }

                    item {
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            items(commonTestFoods) { food ->
                                SuggestionChip(
                                    onClick = { queryFood = food },
                                    label = { Text(food, fontSize = 11.sp) }
                                )
                            }
                        }
                    }

                    if (checkFoodError != null) {
                        item {
                            Text("Chyba: $checkFoodError", color = StatusRed, fontSize = 12.sp)
                        }
                    }

                    foodSafetyResult?.let { res ->
                        item {
                            val isSafe = res.safety_level.equals("safe", ignoreCase = true)
                            val isCaution = res.safety_level.equals("caution", ignoreCase = true)
                            val badgeColor = if (isSafe) StatusGreen else if (isCaution) HestiaOrange else StatusRed

                            Card(
                                colors = CardDefaults.cardColors(containerColor = badgeColor.copy(alpha = 0.1f)),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(res.food_name, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                        Surface(
                                            color = badgeColor,
                                            shape = RoundedCornerShape(6.dp)
                                        ) {
                                            Text(
                                                text = if (isSafe) "BEZPEČNÉ" else if (isCaution) "OPATRNOST" else "TOXICKÉ",
                                                color = Color.White,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 11.sp,
                                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                            )
                                        }
                                    }
                                    Text(res.headline, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                                    if (res.risk_description.isNotBlank()) {
                                        Text(res.risk_description, fontSize = 12.sp)
                                    }
                                    res.toxic_dose_info?.let { dose ->
                                        if (dose.isNotBlank()) {
                                            Text("Dávka: $dose", fontSize = 11.sp, fontWeight = FontWeight.Medium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        }
                                    }
                                    if (res.first_aid_action.isNotBlank()) {
                                        Surface(
                                            color = StatusRed.copy(alpha = 0.12f),
                                            shape = RoundedCornerShape(8.dp),
                                            modifier = Modifier.fillMaxWidth()
                                        ) {
                                            Text(
                                                text = "První pomoc: ${res.first_aid_action}",
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = StatusRed,
                                                modifier = Modifier.padding(8.dp)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }

                    item {
                        HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))
                        Text("Nejčastější toxické potraviny:", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }

                    items(toxicFoods) { (food, why, effect) ->
                        Card(
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(10.dp)) {
                                Text("⛔ $food", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = StatusRed)
                                Text(why, fontSize = 11.sp, modifier = Modifier.padding(top = 2.dp))
                                Text("⚠️ $effect", fontSize = 11.sp, fontWeight = FontWeight.Medium, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 2.dp))
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showFoodSafetyDialog = false }) {
                    Text("Zavřít", color = HestiaOrange)
                }
            }
        )
    }

    // AI Veterinarian Dialog
    if (showVetDoctorDialog) {
        var selectedPetForVet by remember { mutableStateOf<Pet?>(pets.firstOrNull()) }
        var customSpecies by remember { mutableStateOf("dog") }
        var symptomsText by remember { mutableStateOf("") }
        var isDiagnosing by remember { mutableStateOf(false) }
        var diagnosisResult by remember { mutableStateOf<PetSymptomResponse?>(null) }
        var diagnosisError by remember { mutableStateOf<String?>(null) }

        val commonSymptoms = listOf("Zvracení", "Průjem", "Apatie a únava", "Kulhání", "Nechutenství", "Kašel", "Intenzivní drbání")

        AlertDialog(
            onDismissRequest = { showVetDoctorDialog = false },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Default.MedicalServices, contentDescription = null, tint = StatusGreen)
                    Text("AI Veterinář (Gemini)", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                }
            },
            text = {
                LazyColumn(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    item {
                        Text(
                            text = "Popište symptomy vašeho mazlíčka. Gemini AI zhodnotí závažnost, doporučí první pomoc a určí, zda je nutná okamžitá pohotovost.",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    if (pets.isNotEmpty()) {
                        item {
                            Text("Vyberte mazlíčka:", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                items(pets) { pet ->
                                    FilterChip(
                                        selected = selectedPetForVet?.id == pet.id,
                                        onClick = { selectedPetForVet = pet },
                                        label = { Text("${pet.name} (${pet.species})", fontSize = 11.sp) }
                                    )
                                }
                            }
                        }
                    } else {
                        item {
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                FilterChip(
                                    selected = customSpecies == "dog",
                                    onClick = { customSpecies = "dog" },
                                    label = { Text("🐶 Pes", fontSize = 12.sp) }
                                )
                                FilterChip(
                                    selected = customSpecies == "cat",
                                    onClick = { customSpecies = "cat" },
                                    label = { Text("🐱 Kočka", fontSize = 12.sp) }
                                )
                            }
                        }
                    }

                    item {
                        OutlinedTextField(
                            value = symptomsText,
                            onValueChange = { symptomsText = it },
                            label = { Text("Popis příznaků *") },
                            placeholder = { Text("např. Pes od rána zvrací bílou pěnu, odmítá pít vodu a leží...") },
                            modifier = Modifier.fillMaxWidth(),
                            minLines = 3,
                            maxLines = 5
                        )
                    }

                    item {
                        Text("Rychlé symptomy:", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            items(commonSymptoms) { sym ->
                                SuggestionChip(
                                    onClick = {
                                        symptomsText = if (symptomsText.isBlank()) sym else "$symptomsText, $sym"
                                    },
                                    label = { Text(sym, fontSize = 11.sp) }
                                )
                            }
                        }
                    }

                    item {
                        Button(
                            onClick = {
                                if (symptomsText.isNotBlank()) {
                                    coroutineScope.launch {
                                        isDiagnosing = true
                                        diagnosisError = null
                                        val pet = selectedPetForVet
                                        val species = pet?.species ?: customSpecies
                                        repository.diagnosePetSymptoms(
                                            petId = pet?.id,
                                            petName = pet?.name,
                                            petSpecies = species,
                                            symptoms = symptomsText.trim()
                                        ).onSuccess {
                                            diagnosisResult = it
                                            isDiagnosing = false
                                        }.onFailure {
                                            diagnosisError = it.localizedMessage ?: "Chyba při diagnostice symptomů."
                                            isDiagnosing = false
                                        }
                                    }
                                }
                            },
                            enabled = symptomsText.isNotBlank() && !isDiagnosing,
                            colors = ButtonDefaults.buttonColors(containerColor = StatusGreen),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            if (isDiagnosing) {
                                CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Vyhodnocuji zdravotní stav...")
                            } else {
                                Icon(Icons.Default.AutoAwesome, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Konzultovat s AI Veterinářem")
                            }
                        }
                    }

                    if (diagnosisError != null) {
                        item {
                            Text("Chyba: $diagnosisError", color = StatusRed, fontSize = 12.sp)
                        }
                    }

                    diagnosisResult?.let { res ->
                        item {
                            val isEmergency = res.severity.equals("emergency", ignoreCase = true) || res.severity.equals("high", ignoreCase = true)
                            val sevColor = if (isEmergency) StatusRed else if (res.severity.equals("medium", ignoreCase = true)) HestiaOrange else StatusGreen

                            Card(
                                colors = CardDefaults.cardColors(containerColor = sevColor.copy(alpha = 0.1f)),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = res.assessment_headline,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 15.sp,
                                            modifier = Modifier.weight(1f)
                                        )
                                        Surface(
                                            color = sevColor,
                                            shape = RoundedCornerShape(6.dp)
                                        ) {
                                            Text(
                                                text = if (isEmergency) "🚨 VÁŽNÉ" else "ℹ️ NORMÁLNÍ",
                                                color = Color.White,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 10.sp,
                                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                            )
                                        }
                                    }

                                    if (res.urgency_message.isNotBlank()) {
                                        Text(
                                            text = res.urgency_message,
                                            fontWeight = FontWeight.SemiBold,
                                            fontSize = 12.sp,
                                            color = if (isEmergency) StatusRed else MaterialTheme.colorScheme.onSurface
                                        )
                                    }

                                    if (res.possible_causes.isNotEmpty()) {
                                        Text("Možné příčiny:", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                        res.possible_causes.forEach { cause ->
                                            Text("• $cause", fontSize = 11.sp)
                                        }
                                    }

                                    if (res.action_steps.isNotEmpty()) {
                                        Text("Doporučené kroky:", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                        res.action_steps.forEach { step ->
                                            Text("👉 $step", fontSize = 11.sp)
                                        }
                                    }

                                    if (res.home_care_advice.isNotBlank()) {
                                        Text("Domácí péče: ${res.home_care_advice}", fontSize = 11.sp, fontStyle = androidx.compose.ui.text.font.FontStyle.Italic)
                                    }

                                    if (res.red_flag_symptoms.isNotEmpty()) {
                                        Surface(
                                            color = StatusRed.copy(alpha = 0.15f),
                                            shape = RoundedCornerShape(8.dp),
                                            modifier = Modifier.fillMaxWidth()
                                        ) {
                                            Column(modifier = Modifier.padding(8.dp)) {
                                                Text("⚠️ Okamžitě na veterinu při:", fontWeight = FontWeight.Bold, fontSize = 11.sp, color = StatusRed)
                                                res.red_flag_symptoms.forEach { rf ->
                                                    Text("• $rf", fontSize = 11.sp, color = StatusRed)
                                                }
                                            }
                                        }
                                    }

                                    selectedPetForVet?.vet_phone?.let { phone ->
                                        if (phone.isNotBlank()) {
                                            Button(
                                                onClick = {
                                                    val callIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone"))
                                                    context.startActivity(callIntent)
                                                },
                                                colors = ButtonDefaults.buttonColors(containerColor = StatusRed),
                                                shape = RoundedCornerShape(8.dp),
                                                modifier = Modifier.fillMaxWidth()
                                            ) {
                                                Icon(Icons.Default.Phone, contentDescription = null, modifier = Modifier.size(16.dp))
                                                Spacer(modifier = Modifier.width(6.dp))
                                                Text("Volat veterináře ($phone)")
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showVetDoctorDialog = false }) {
                    Text("Zavřít", color = StatusGreen)
                }
            }
        )
    }
}
