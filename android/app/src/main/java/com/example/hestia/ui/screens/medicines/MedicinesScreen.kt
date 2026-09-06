package com.example.hestia.ui.screens.medicines

import android.content.Intent
import android.net.Uri
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.util.Locale
import com.example.hestia.data.models.*
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.theme.*
import com.example.hestia.ui.components.EmptyStateCard
import kotlinx.coroutines.launch
import kotlin.math.roundToInt

@Composable
fun MedicinesScreen(
    repository: HestiaRepository,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    var medicines by remember { mutableStateOf<List<Medicine>>(emptyList()) }
    var stats by remember { mutableStateOf(MedicineStats()) }
    var guides by remember { mutableStateOf<List<FirstAidGuide>>(emptyList()) }
    var selectedTab by remember { mutableIntStateOf(0) } // 0 = Zásoby, 1 = Dětská kalkulačka, 2 = SOS První pomoc
    var isLoading by remember { mutableStateOf(true) }
    var searchQuery by remember { mutableStateOf("") }
    var showAddDialog by remember { mutableStateOf(false) }
    var snackbarMessage by remember { mutableStateOf<String?>(null) }

    // Pediatric calculator weight state
    var childWeight by remember { mutableFloatStateOf(14f) }

    fun refreshMedicines() {
        coroutineScope.launch {
            isLoading = true
            repository.getMedicines().onSuccess { medicines = it }
            repository.getMedicineStats().onSuccess { stats = it }
            repository.getFirstAidGuides().onSuccess { guides = it }
            isLoading = false
        }
    }

    LaunchedEffect(Unit) {
        refreshMedicines()
    }

    val filteredMedicines = medicines.filter {
        searchQuery.isBlank() ||
                it.name.contains(searchQuery, ignoreCase = true) ||
                (it.active_ingredient?.contains(searchQuery, ignoreCase = true) == true)
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background,
        floatingActionButton = {
            if (selectedTab == 0) {
                FloatingActionButton(
                    onClick = { showAddDialog = true },
                    containerColor = HestiaOrange,
                    contentColor = Color.White,
                    shape = CircleShape
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Přidat lék")
                }
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
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
        ) {
            Text(
                text = "Domácí lékárnička",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(vertical = 8.dp)
            )

            // Tabs
            PrimaryTabRow(
                selectedTabIndex = selectedTab,
                containerColor = Color.Transparent,
                contentColor = HestiaOrange,
                divider = {}
            ) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = { Text("Zásoby (${medicines.size})", fontSize = 12.sp) }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = { Text("Kalkulačka", fontSize = 12.sp) }
                )
                Tab(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    text = { Text("SOS Pomoc", fontSize = 12.sp) }
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            when (selectedTab) {
                // TAB 0: Medicine Inventory
                0 -> {
                    // Search bar
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        placeholder = { Text("Hledat v lékárničce...") },
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
                            .padding(bottom = 8.dp),
                        singleLine = true
                    )

                    if (isLoading) {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(color = HestiaOrange)
                        }
                    } else if (filteredMedicines.isEmpty()) {
                        EmptyStateCard(
                            message = if (searchQuery.isBlank()) "V lékárničce zatím nejsou žádné léky." else "Nenalezeny žádné odpovídající léky.",
                            icon = Icons.Default.MedicalServices
                        )
                    } else {
                        LazyColumn(
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(bottom = 80.dp)
                        ) {
                            items(filteredMedicines, key = { it.id }) { med ->
                                val statusBadgeColor = when (med.status) {
                                    "expired" -> StatusRed
                                    "expiring_soon" -> StatusYellow
                                    else -> StatusGreen
                                }
                                val statusLabel = when (med.status) {
                                    "expired" -> "Expirováno"
                                    "expiring_soon" -> "Expiruje brzy"
                                    else -> "V pořádku"
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
                                            Column(modifier = Modifier.weight(1f)) {
                                                Text(
                                                    text = med.name,
                                                    fontWeight = FontWeight.Bold,
                                                    fontSize = 15.sp
                                                )
                                                if (!med.active_ingredient.isNullOrBlank()) {
                                                    Text(
                                                        text = med.active_ingredient,
                                                        fontSize = 11.sp,
                                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                                    )
                                                }
                                            }

                                            Badge(
                                                containerColor = statusBadgeColor.copy(alpha = 0.15f),
                                                contentColor = statusBadgeColor
                                            ) {
                                                Text(
                                                    text = statusLabel,
                                                    fontWeight = FontWeight.Bold,
                                                    fontSize = 10.sp,
                                                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                                )
                                            }
                                        }

                                        Spacer(modifier = Modifier.height(8.dp))

                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Text(
                                                text = "Skladem: ${med.current_quantity} ${med.unit}  •  Expirace: ${med.expiry_date ?: "Neuvedeno"}",
                                                fontSize = 11.sp,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )

                                            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                                // Add to shopping
                                                IconButton(
                                                    onClick = {
                                                        coroutineScope.launch {
                                                            repository.createShoppingItem(
                                                                ShoppingItemCreate(
                                                                    name = med.name,
                                                                    amount = 1.0,
                                                                    unit = "balení",
                                                                    category = "drogerie",
                                                                    notes = "Do lékárničky"
                                                                )
                                                            ).onSuccess {
                                                                snackbarMessage = "${med.name} přidáno do nákupu!"
                                                            }
                                                        }
                                                    },
                                                    modifier = Modifier.size(30.dp)
                                                ) {
                                                    Icon(Icons.Default.AddShoppingCart, contentDescription = "Do nákupu", modifier = Modifier.size(16.dp), tint = HestiaOrange)
                                                }

                                                // Take dose
                                                FilledTonalButton(
                                                    onClick = {
                                                        coroutineScope.launch {
                                                            repository.takeMedicineDose(med.id)
                                                            refreshMedicines()
                                                            snackbarMessage = "Dávka léku ${med.name} byla zaznamenána!"
                                                        }
                                                    },
                                                    colors = ButtonDefaults.filledTonalButtonColors(
                                                        containerColor = HestiaOrange.copy(alpha = 0.15f),
                                                        contentColor = HestiaOrange
                                                    ),
                                                    shape = RoundedCornerShape(8.dp),
                                                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                                                ) {
                                                    Icon(Icons.Default.Medication, contentDescription = null, modifier = Modifier.size(13.dp))
                                                    Spacer(modifier = Modifier.width(4.dp))
                                                    Text("Vzít", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                                }

                                                // Delete
                                                IconButton(
                                                    onClick = {
                                                        coroutineScope.launch {
                                                            repository.deleteMedicine(med.id)
                                                            refreshMedicines()
                                                            snackbarMessage = "Lék smazán"
                                                        }
                                                    },
                                                    modifier = Modifier.size(30.dp)
                                                ) {
                                                    Icon(Icons.Default.Delete, contentDescription = "Smazat", tint = MaterialTheme.colorScheme.error.copy(alpha = 0.6f), modifier = Modifier.size(16.dp))
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // TAB 1: Pediatric antipyretic calculator
                1 -> {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(14.dp),
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(bottom = 30.dp)
                    ) {
                        item {
                            Card(
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text(
                                        text = "Kalkulačka dětského dávkování",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 16.sp
                                    )
                                    Text(
                                        text = "Přesný výpočet antipyretik (Paracetamol & Ibuprofen) podle aktuální hmotnosti dítěte.",
                                        fontSize = 12.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier.padding(top = 2.dp)
                                    )

                                    Spacer(modifier = Modifier.height(16.dp))

                                    // Weight slider
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text("Hmotnost dítěte:", fontWeight = FontWeight.Medium, fontSize = 14.sp)
                                        Text(
                                            text = "${childWeight.roundToInt()} kg",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 20.sp,
                                            color = HestiaOrange
                                        )
                                    }

                                    Slider(
                                        value = childWeight,
                                        onValueChange = { childWeight = it },
                                        valueRange = 5f..50f,
                                        steps = 44,
                                        colors = SliderDefaults.colors(
                                            thumbColor = HestiaOrange,
                                            activeTrackColor = HestiaOrange
                                        )
                                    )

                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text("5 kg (kojenec)", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        Text("25 kg (školák)", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        Text("50 kg", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    }
                                }
                            }
                        }

                        // Paracetamol Card (10-15 mg/kg per dose)
                        item {
                            val w = childWeight.roundToInt()
                            val minDose = w * 10
                            val maxDose = w * 15
                            val syrupMl = String.format(Locale.US, "%.1f", minDose / 24.0)

                            Card(
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(10.dp)
                                                .clip(CircleShape)
                                                .background(StatusBlue)
                                        )
                                        Text(
                                            text = "PARACETAMOL (Paralen, Panadol)",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 14.sp,
                                            color = StatusBlue
                                        )
                                    }

                                    Spacer(modifier = Modifier.height(10.dp))

                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Column {
                                            Text("Jednotlivá dávka", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                            Text("$minDose – $maxDose mg", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                        }
                                        Column(horizontalAlignment = Alignment.End) {
                                            Text("Sirup 24 mg/ml", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                            Text("cca $syrupMl ml", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = StatusBlue)
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = "• Interval podávání: minimálně 6 hodin (max. 4× denně)\n• Maximální denní dávka: 60 mg/kg/den",
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }

                        // Ibuprofen Card (5-10 mg/kg per dose)
                        item {
                            val w = childWeight.roundToInt()
                            val minDose = w * 5
                            val maxDose = w * 10
                            val syrupMl = String.format(Locale.US, "%.1f", minDose / 20.0)

                            Card(
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(10.dp)
                                                .clip(CircleShape)
                                                .background(HestiaOrange)
                                        )
                                        Text(
                                            text = "IBUPROFEN (Nurofen, Ibalgin)",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 14.sp,
                                            color = HestiaOrange
                                        )
                                    }

                                    Spacer(modifier = Modifier.height(10.dp))

                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Column {
                                            Text("Jednotlivá dávka", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                            Text("$minDose – $maxDose mg", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                        }
                                        Column(horizontalAlignment = Alignment.End) {
                                            Text("Sirup 20 mg/ml", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                            Text("cca $syrupMl ml", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = HestiaOrange)
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = "• Interval podávání: minimálně 8 hodin (max. 3× denně)\n• Vhodné od 3 měsíců věku (nad 5 kg)\n• Podávat vždy s jídlem nebo mlékem",
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }
                }

                // TAB 2: First aid guides & SOS 155
                2 -> {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(bottom = 30.dp)
                    ) {
                        // Emergency Call 155 Banner
                        item {
                            Card(
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = StatusRed),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:155"))
                                        context.startActivity(intent)
                                    }
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(16.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                        Icon(Icons.Default.PhoneInTalk, contentDescription = null, tint = Color.White, modifier = Modifier.size(32.dp))
                                        Column {
                                            Text("Záchranná služba", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color.White)
                                            Text("Klepnutím vytočíte linku 155", fontSize = 12.sp, color = Color.White.copy(alpha = 0.8f))
                                        }
                                    }
                                    Text("155", fontWeight = FontWeight.Black, fontSize = 28.sp, color = Color.White)
                                }
                            }
                        }

                        items(guides) { guide ->
                            Card(
                                shape = RoundedCornerShape(14.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Text(
                                        text = guide.title,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp,
                                        color = StatusRed
                                    )

                                    if (guide.immediate_actions.isNotEmpty()) {
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Text("Okamžité kroky:", fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
                                        guide.immediate_actions.forEach { action ->
                                            Text("• $action", fontSize = 12.sp, modifier = Modifier.padding(vertical = 1.dp))
                                        }
                                    }

                                    if (guide.do_nots.isNotEmpty()) {
                                        Spacer(modifier = Modifier.height(6.dp))
                                        Text("Co nedělat:", fontWeight = FontWeight.SemiBold, fontSize = 12.sp, color = StatusRed)
                                        guide.do_nots.forEach { donot ->
                                            Text("⛔ $donot", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        }
                                    }

                                    if (guide.when_to_call_155.isNotBlank()) {
                                        Spacer(modifier = Modifier.height(6.dp))
                                        Surface(
                                            shape = RoundedCornerShape(6.dp),
                                            color = StatusRed.copy(alpha = 0.1f)
                                        ) {
                                            Text(
                                                text = "Kdy volat 155: ${guide.when_to_call_155}",
                                                fontSize = 11.sp,
                                                color = StatusRed,
                                                fontWeight = FontWeight.Bold,
                                                modifier = Modifier.padding(6.dp)
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

    // Add Medicine Dialog
    if (showAddDialog) {
        var name by remember { mutableStateOf("") }
        var activeSubstance by remember { mutableStateOf("") }
        var form by remember { mutableStateOf("tablets") }
        var category by remember { mutableStateOf("pain_fever") }
        var quantity by remember { mutableStateOf("1") }
        var unit by remember { mutableStateOf("ks") }
        var expiryDate by remember { mutableStateOf("") }
        var location by remember { mutableStateOf("Koupelna - horní police") }
        var isPrescription by remember { mutableStateOf(false) }

        val forms = listOf("tablets" to "Tablety", "syrup" to "Sirup", "drops" to "Kapky", "spray" to "Sprej", "ointment" to "Mast")
        val categories = listOf("pain_fever" to "Horečka / Bolest", "cold_cough" to "Rýma / Kašel", "digestion" to "Zažívání", "allergy" to "Alergie", "other" to "Ostatní")

        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            title = { Text("Přidat nový lék", fontWeight = FontWeight.Bold) },
            text = {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    item {
                        OutlinedTextField(
                            value = name,
                            onValueChange = { name = it },
                            label = { Text("Název léku *") },
                            placeholder = { Text("např. Ibalgin 400") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }

                    item {
                        OutlinedTextField(
                            value = activeSubstance,
                            onValueChange = { activeSubstance = it },
                            label = { Text("Účinná látka") },
                            placeholder = { Text("Ibuprofenum") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }

                    item {
                        Text("Forma léku:", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            items(forms) { (k, l) ->
                                FilterChip(
                                    selected = form == k,
                                    onClick = { form = k },
                                    label = { Text(l, fontSize = 11.sp) }
                                )
                            }
                        }
                    }

                    item {
                        Text("Kategorie:", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            items(categories) { (k, l) ->
                                FilterChip(
                                    selected = category == k,
                                    onClick = { category = k },
                                    label = { Text(l, fontSize = 11.sp) }
                                )
                            }
                        }
                    }

                    item {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
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
                    }

                    item {
                        OutlinedTextField(
                            value = expiryDate,
                            onValueChange = { expiryDate = it },
                            label = { Text("Datum expirace (RRRR-MM-DD)") },
                            placeholder = { Text("2027-12-31") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }

                    item {
                        OutlinedTextField(
                            value = location,
                            onValueChange = { location = it },
                            label = { Text("Umístění v domácnosti") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (name.isNotBlank()) {
                            coroutineScope.launch {
                                repository.createMedicine(
                                    MedicineCreate(
                                        name = name.trim(),
                                        active_substance = activeSubstance.trim().ifBlank { null },
                                        form = form,
                                        category = category,
                                        location = location,
                                        current_quantity = quantity.toDoubleOrNull() ?: 1.0,
                                        unit = unit.trim().ifBlank { "ks" },
                                        expiration_date = expiryDate.trim().ifBlank { null },
                                        is_prescription = isPrescription
                                    )
                                ).onSuccess {
                                    showAddDialog = false
                                    refreshMedicines()
                                    snackbarMessage = "Lék byl úspěšně přidán do lékárničky!"
                                }
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = HestiaOrange)
                ) {
                    Text("Přidat lék")
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
