package com.example.hestia.ui.screens.medicines

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
fun MedicinesScreen(repository: HestiaRepository, currentUser: User?) {
    val scope = rememberCoroutineScope()
    var tab by remember { mutableStateOf(0) }
    var medicines by remember { mutableStateOf<List<Medicine>>(emptyList()) }
    var stats by remember { mutableStateOf<MedicineStats?>(null) }
    var schedules by remember { mutableStateOf<List<MedicationSchedule>>(emptyList()) }
    var logs by remember { mutableStateOf<List<MedicationLog>>(emptyList()) }
    var guides by remember { mutableStateOf<List<FirstAidGuide>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var search by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("") }
    var dialog by remember { mutableStateOf<String?>(null) }
    var editing by remember { mutableStateOf<Medicine?>(null) }
    var detail by remember { mutableStateOf<Medicine?>(null) }
    var deleteTarget by remember { mutableStateOf<Medicine?>(null) }

    suspend fun load() {
        loading = true
        repository.getMedicines(
            category = category.ifBlank { null },
            location = null,
            query = search.ifBlank { null }
        ).onSuccess { medicines = it; error = null }.onFailure { error = it.friendly() }
        repository.getMedicineStats().onSuccess { stats = it }
        repository.getMedicationSchedules(currentUser?.id, true).onSuccess { schedules = it }
        repository.getMedicationLogs(limit = 40).onSuccess { logs = it }
        repository.getFirstAidGuides().onSuccess { guides = it }
        loading = false
    }

    LaunchedEffect(search, category) { kotlinx.coroutines.delay(300); load() }

    Column(Modifier.fillMaxSize()) {
        ScrollableTabRow(selectedTabIndex = tab, edgePadding = 8.dp) {
            listOf("Lékárnička", "Plán", "Log", "První pomoc").forEachIndexed { i, label ->
                Tab(selected = tab == i, onClick = { tab = i }, text = { Text(label, fontSize = 12.sp) })
            }
        }
        ErrorBox(error, onRetry = { scope.launch { load() } })
        if (loading) {
            LoadingBox()
            return@Column
        }
        when (tab) {
            0 -> Box(Modifier.fillMaxSize()) {
                LazyColumn(contentPadding = PaddingValues(12.dp)) {
                    stats?.let { s ->
                        item {
                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                StatCard("Celkem", s.total_items.toString(), Icons.Default.Medication, HestiaOrange, Modifier.weight(1f))
                                StatCard("Prošlé", s.expired_count.toString(), Icons.Default.Error, StatusRed, Modifier.weight(1f))
                                StatCard("Brzy", s.expiring_soon_count.toString(), Icons.Default.Warning, StatusYellow, Modifier.weight(1f))
                                StatCard("Dochází", s.low_stock_count.toString(), Icons.Default.TrendingDown, StatusBlue, Modifier.weight(1f))
                            }
                            Spacer(Modifier.height(8.dp))
                        }
                    }
                    // Hledání a filtr musí být dostupné i když se statistiky nepodaří načíst.
                    item {
                        HestiaField(search, { search = it }, "Hledat lék")
                        Spacer(Modifier.height(6.dp))
                        ChipSelector(Labels.medicineCategories, category, { category = it })
                        Spacer(Modifier.height(6.dp))
                    }
                    if (medicines.isEmpty()) {
                        item { EmptyState(Icons.Default.Medication, "Prázdná lékárnička", "Přidejte léky a hlídejte expiraci i zásoby.") }
                    }
                    items(medicines, key = { it.id }) { m ->
                        MedicineCard(
                            medicine = m,
                            onOpen = { detail = m },
                            onEdit = { editing = m },
                            onDelete = { deleteTarget = m },
                            onAdjust = { delta ->
                                scope.launch { repository.adjustMedicineStock(m.id, delta).onSuccess { load() } }
                            },
                            onShopping = { scope.launch { repository.addMedicineToShopping(m.id) } }
                        )
                    }
                    item { Spacer(Modifier.height(80.dp)) }
                }
                ExtendedFloatingActionButton(
                    onClick = { dialog = "create" },
                    containerColor = HestiaOrange,
                    contentColor = Color.White,
                    modifier = Modifier.align(Alignment.BottomEnd).padding(20.dp),
                    icon = { Icon(Icons.Default.Add, null) },
                    text = { Text("Lék") }
                )
            }

            1 -> LazyColumn(contentPadding = PaddingValues(12.dp)) {
                item {
                    Button(onClick = { dialog = "schedule" }, shape = RoundedCornerShape(10.dp), modifier = Modifier.fillMaxWidth()) {
                        Text("+ Nový plán užívání")
                    }
                    Spacer(Modifier.height(8.dp))
                    if (schedules.isEmpty()) Text("Žádné aktivní plány.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                items(schedules, key = { it.id }) { s ->
                    Card(shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp)) {
                        Column(Modifier.padding(10.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Schedule, null, tint = StatusBlue, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(6.dp))
                                Text(s.medicine_name ?: "Lék", fontWeight = FontWeight.Medium, fontSize = 13.sp, modifier = Modifier.weight(1f))
                                if (s.is_taken_today) StatusPill("dnes splněno", StatusGreen)
                            }
                            Text(
                                "${s.user_name ?: ""} • ${s.dosage_per_take} • ${s.times_per_day}×/den",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                s.time_slots.joinToString(", ") { Labels.label(Labels.timeSlots, it) } +
                                    " • " + Labels.label(Labels.foodRelation, s.food_relation),
                                fontSize = 10.sp
                            )
                            Row {
                                val uid = s.user_id.takeIf { it > 0 } ?: currentUser?.id
                                TextButton(
                                    enabled = uid != null,
                                    onClick = {
                                        val userId = uid ?: return@TextButton
                                        scope.launch {
                                            repository.takeMedicineDose(s.medicine_id, userId, s.dosage_per_take, s.time_slots.firstOrNull())
                                                .onSuccess { load() }.onFailure { error = it.friendly() }
                                        }
                                    }
                                ) { Text("Vzato", fontSize = 11.sp) }
                                Spacer(Modifier.weight(1f))
                                TextButton(onClick = {
                                    scope.launch { repository.deleteMedicationSchedule(s.id).onSuccess { load() } }
                                }) { Text("Smazat", fontSize = 11.sp, color = StatusRed) }
                            }
                        }
                    }
                }
            }

            2 -> LazyColumn(contentPadding = PaddingValues(12.dp)) {
                if (logs.isEmpty()) item { Text("Žádné záznamy.", fontSize = 12.sp) }
                items(logs, key = { it.id }) { l ->
                    Card(shape = RoundedCornerShape(10.dp), modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp)) {
                        Row(Modifier.padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                if (l.status == "taken") Icons.Default.CheckCircle else Icons.Default.Cancel,
                                null,
                                tint = if (l.status == "taken") StatusGreen else StatusRed,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(Modifier.width(8.dp))
                            Column(Modifier.weight(1f)) {
                                Text(l.medicine_name ?: "Lék", fontSize = 12.sp, fontWeight = FontWeight.Medium)
                                Text(
                                    "${l.user_name ?: ""} • ${Fmt.dateTime(l.taken_at)}" +
                                        (l.time_slot?.let { " • ${Labels.label(Labels.timeSlots, it)}" } ?: ""),
                                    fontSize = 10.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            l.dose_taken?.let { StatusPill(it, StatusBlue) }
                        }
                    }
                }
            }

            else -> LazyColumn(contentPadding = PaddingValues(12.dp)) {
                item {
                    Card(
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = StatusRed.copy(alpha = 0.12f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(Modifier.padding(12.dp)) {
                            Text("Tísňové linky", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = StatusRed)
                            Text("155 – Záchranná služba", fontSize = 12.sp)
                            Text("112 – Integrovaný systém", fontSize = 12.sp)
                            Text("116 111 – Linka bezpečí", fontSize = 12.sp)
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                    Button(
                        onClick = { dialog = "pediatric" },
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Calculate, null, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Dávkování pro děti podle váhy")
                    }
                    Spacer(Modifier.height(8.dp))
                }
                items(guides, key = { it.id }) { g ->
                    ExpandableCard(
                        title = g.title,
                        subtitle = g.summary
                    ) {
                        g.emergency_call?.let { InfoRow("Linka", it) }
                        if (g.action_steps.isNotEmpty()) {
                            Text("Postup", fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
                            g.action_steps.forEachIndexed { i, s -> Text("${i + 1}. $s", fontSize = 12.sp) }
                        }
                        if (g.dont_do_steps.isNotEmpty()) {
                            Spacer(Modifier.height(4.dp))
                            Text("Nedělat", fontWeight = FontWeight.SemiBold, fontSize = 12.sp, color = StatusRed)
                            g.dont_do_steps.forEach { Text("• $it", fontSize = 12.sp) }
                        }
                        g.note?.let { Text(it, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                    }
                }
            }
        }
    }

    detail?.let { m ->
        MedicineDetailDialog(
            medicine = m,
            onDismiss = { detail = null },
            onOpened = {
                scope.launch { repository.markMedicineOpened(m.id).onSuccess { detail = it; load() } }
            },
            onAdjust = { d -> scope.launch { repository.adjustMedicineStock(m.id, d).onSuccess { detail = it; load() } } },
            onShopping = { scope.launch { repository.addMedicineToShopping(m.id) } }
        )
    }

    if (dialog == "create" || editing != null) {
        MedicineFormDialog(
            initial = editing,
            onDismiss = { dialog = null; editing = null },
            onSave = { body ->
                scope.launch {
                    val res = editing?.let { repository.updateMedicine(it.id, body.second) }
                        ?: repository.createMedicine(body.first)
                    res.onSuccess { dialog = null; editing = null; load() }.onFailure { error = it.friendly() }
                }
            }
        )
    }

    if (dialog == "schedule") {
        ScheduleFormDialog(
            medicines = medicines,
            users = listOfNotNull(currentUser).ifEmpty { emptyList() },
            repository = repository,
            defaultUserId = currentUser?.id ?: 1,
            onDismiss = { dialog = null },
            onSaved = { dialog = null; scope.launch { load() } }
        )
    }

    if (dialog == "pediatric") {
        PediatricDosageDialog(repository, onDismiss = { dialog = null })
    }

    deleteTarget?.let { m ->
        ConfirmDialog(
            title = "Smazat lék",
            message = "Smazat „${m.name}“?",
            onConfirm = { scope.launch { repository.deleteMedicine(m.id).onSuccess { load() } } },
            onDismiss = { deleteTarget = null }
        )
    }
}

@Composable
private fun MedicineCard(
    medicine: Medicine,
    onOpen: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
    onAdjust: (Double) -> Unit,
    onShopping: () -> Unit
) {
    val statusColor = when (medicine.expiration_status) {
        "expired" -> StatusRed
        "expiring_soon" -> StatusYellow
        else -> StatusGreen
    }
    Card(shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp)) {
        Column(Modifier.padding(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Medication, null, tint = HestiaOrange, modifier = Modifier.size(20.dp))
                Spacer(Modifier.width(8.dp))
                Column(Modifier.weight(1f)) {
                    Text(medicine.name, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    Text(
                        listOfNotNull(
                            Labels.label(Labels.medicineForms, medicine.form),
                            medicine.active_substance,
                            Labels.label(Labels.medicineCategories, medicine.category)
                        ).joinToString(" • "),
                        fontSize = 10.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                StatusPill(medicine.expiration_status, statusColor)
            }
            Spacer(Modifier.height(4.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                StatusPill("${Fmt.number(medicine.current_quantity)} ${medicine.unit}", if (medicine.is_low_stock) StatusYellow else StatusBlue)
                StatusPill(Labels.label(Labels.medicineLocations, medicine.location), MaterialTheme.colorScheme.onSurfaceVariant)
                if (medicine.is_prescription) StatusPill("Rx", StatusRed)
                if (medicine.requires_refrigeration) StatusPill("2–8 °C", StatusBlue)
            }
            medicine.expiration_date?.let {
                Text("Expirace: ${Fmt.date(it)}", fontSize = 10.sp, color = statusColor)
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                TextButton(onClick = onOpen) { Text("Detail", fontSize = 11.sp) }
                Spacer(Modifier.weight(1f))
                IconButton(onClick = { onAdjust(-1.0) }, modifier = Modifier.size(30.dp)) {
                    Icon(Icons.Default.Remove, "Ubrat", modifier = Modifier.size(15.dp))
                }
                IconButton(onClick = { onAdjust(1.0) }, modifier = Modifier.size(30.dp)) {
                    Icon(Icons.Default.Add, "Přidat", modifier = Modifier.size(15.dp))
                }
                IconButton(onClick = onShopping, modifier = Modifier.size(30.dp)) {
                    Icon(Icons.Default.ShoppingCart, "Do nákupu", modifier = Modifier.size(15.dp))
                }
                IconButton(onClick = onEdit, modifier = Modifier.size(30.dp)) {
                    Icon(Icons.Default.Edit, null, modifier = Modifier.size(15.dp))
                }
                IconButton(onClick = onDelete, modifier = Modifier.size(30.dp)) {
                    Icon(Icons.Default.Delete, null, tint = StatusRed, modifier = Modifier.size(15.dp))
                }
            }
        }
    }
}

@Composable
private fun MedicineDetailDialog(
    medicine: Medicine,
    onDismiss: () -> Unit,
    onOpened: () -> Unit,
    onAdjust: (Double) -> Unit,
    onShopping: () -> Unit
) {
    DialogScaffold(
        title = medicine.name,
        onDismiss = onDismiss,
        confirmText = "Zavřít",
        onConfirm = onDismiss
    ) {
        InfoRow("Účinná látka", medicine.active_substance)
        InfoRow("Forma", Labels.label(Labels.medicineForms, medicine.form))
        InfoRow("Kategorie", Labels.label(Labels.medicineCategories, medicine.category))
        InfoRow("Umístění", Labels.label(Labels.medicineLocations, medicine.location))
        InfoRow("Množství", "${Fmt.number(medicine.current_quantity)} ${medicine.unit}")
        InfoRow("Balení", medicine.package_size)
        InfoRow("Expirace", medicine.expiration_date?.let { Fmt.date(it) })
        InfoRow("Otevřeno", medicine.opened_date?.let { Fmt.date(it) })
        InfoRow("Trvanlivost po otevření", medicine.validity_months_after_opening?.let { "$it měsíců" })
        InfoRow("Pro koho", Labels.label(Labels.ageGroups, medicine.age_group))
        InfoRow("Dávkování", medicine.dosage_instructions)
        InfoRow("Skladování", medicine.storage_instructions)
        InfoRow("Poznámky", medicine.notes)
        if (medicine.after_opening_expired == true) {
            Text("Po otevření již expirováno!", color = StatusRed, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
        }
        Spacer(Modifier.height(10.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedButton(onClick = onOpened, modifier = Modifier.weight(1f)) { Text("Otevřít", fontSize = 11.sp) }
            OutlinedButton(onClick = { onAdjust(1.0) }, modifier = Modifier.weight(1f)) { Text("+1", fontSize = 11.sp) }
            OutlinedButton(onClick = onShopping, modifier = Modifier.weight(1f)) { Text("Do nákupu", fontSize = 11.sp) }
        }
    }
}

@Composable
private fun MedicineFormDialog(
    initial: Medicine?,
    onDismiss: () -> Unit,
    onSave: (Pair<MedicineCreate, MedicineUpdate>) -> Unit
) {
    var name by remember { mutableStateOf(initial?.name ?: "") }
    var substance by remember { mutableStateOf(initial?.active_substance ?: "") }
    var form by remember { mutableStateOf(initial?.form ?: "tablets") }
    var category by remember { mutableStateOf(initial?.category ?: "pain_fever") }
    var location by remember { mutableStateOf(initial?.location ?: "bathroom") }
    var packageSize by remember { mutableStateOf(initial?.package_size ?: "") }
    var quantity by remember { mutableStateOf(initial?.current_quantity?.let { Fmt.number(it) } ?: "1") }
    var unit by remember { mutableStateOf(initial?.unit ?: "ks") }
    var minQty by remember { mutableStateOf(initial?.min_quantity_warning?.let { Fmt.number(it) } ?: "0") }
    var expiration by remember { mutableStateOf(initial?.expiration_date) }
    var opened by remember { mutableStateOf(initial?.opened_date) }
    var validityAfter by remember { mutableStateOf(initial?.validity_months_after_opening?.toString() ?: "") }
    var prescription by remember { mutableStateOf(initial?.is_prescription ?: false) }
    var fridge by remember { mutableStateOf(initial?.requires_refrigeration ?: false) }
    var ageGroup by remember { mutableStateOf(initial?.age_group ?: "all") }
    var dosage by remember { mutableStateOf(initial?.dosage_instructions ?: "") }
    var storage by remember { mutableStateOf(initial?.storage_instructions ?: "") }
    var notes by remember { mutableStateOf(initial?.notes ?: "") }

    DialogScaffold(
        title = if (initial == null) "Nový lék" else "Upravit lék",
        onDismiss = onDismiss,
        confirmEnabled = name.isNotBlank(),
        onConfirm = {
            val q = quantity.toDoubleOrNull() ?: 1.0
            onSave(
                MedicineCreate(
                    name = name.trim(), active_substance = substance.ifBlank { null },
                    form = form, category = category, location = location,
                    package_size = packageSize.ifBlank { null }, current_quantity = q, unit = unit,
                    min_quantity_warning = minQty.toDoubleOrNull() ?: 0.0,
                    expiration_date = expiration, opened_date = opened,
                    validity_months_after_opening = validityAfter.toIntOrNull(),
                    is_prescription = prescription, requires_refrigeration = fridge,
                    age_group = ageGroup, dosage_instructions = dosage.ifBlank { null },
                    storage_instructions = storage.ifBlank { null }, notes = notes.ifBlank { null }
                ) to MedicineUpdate(
                    name = name.trim(), active_substance = substance.ifBlank { null },
                    form = form, category = category, location = location,
                    package_size = packageSize.ifBlank { null }, current_quantity = q, unit = unit,
                    min_quantity_warning = minQty.toDoubleOrNull() ?: 0.0,
                    expiration_date = expiration, opened_date = opened,
                    validity_months_after_opening = validityAfter.toIntOrNull(),
                    is_prescription = prescription, requires_refrigeration = fridge,
                    age_group = ageGroup, dosage_instructions = dosage.ifBlank { null },
                    storage_instructions = storage.ifBlank { null }, notes = notes.ifBlank { null }
                )
            )
        }
    ) {
        HestiaField(name, { name = it }, "Název")
        Spacer(Modifier.height(8.dp))
        HestiaField(substance, { substance = it }, "Účinná látka")
        Spacer(Modifier.height(8.dp))
        HestiaDropdown("Forma", Labels.medicineForms, form, { form = it })
        Spacer(Modifier.height(8.dp))
        HestiaDropdown("Kategorie", Labels.medicineCategories, category, { category = it })
        Spacer(Modifier.height(8.dp))
        HestiaDropdown("Umístění", Labels.medicineLocations, location, { location = it })
        Spacer(Modifier.height(8.dp))
        HestiaField(packageSize, { packageSize = it }, "Balení (např. 20 tablet)")
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            HestiaNumberField(quantity, { quantity = it }, "Množství", Modifier.weight(1f), decimal = true)
            HestiaDropdown("Jednotka", Labels.medicineUnits.map { it to it }, unit, { unit = it }, Modifier.weight(1f))
        }
        Spacer(Modifier.height(8.dp))
        HestiaNumberField(minQty, { minQty = it }, "Upozornit pod (množství)", decimal = true)
        Spacer(Modifier.height(8.dp))
        DateField("Expirace", expiration, { expiration = it })
        Spacer(Modifier.height(8.dp))
        DateField("Datum otevření", opened, { opened = it })
        Spacer(Modifier.height(8.dp))
        HestiaNumberField(validityAfter, { validityAfter = it }, "Platnost po otevření (měsíce)")
        Spacer(Modifier.height(8.dp))
        HestiaDropdown("Pro koho", Labels.ageGroups, ageGroup, { ageGroup = it })
        Spacer(Modifier.height(8.dp))
        ToggleRow("Na předpis", prescription, { prescription = it })
        ToggleRow("Skladovat v chladu", fridge, { fridge = it })
        Spacer(Modifier.height(8.dp))
        HestiaField(dosage, { dosage = it }, "Dávkování", singleLine = false, minLines = 2)
        Spacer(Modifier.height(8.dp))
        HestiaField(storage, { storage = it }, "Skladování", singleLine = false, minLines = 2)
        Spacer(Modifier.height(8.dp))
        HestiaField(notes, { notes = it }, "Poznámky", singleLine = false, minLines = 2)
    }
}

@Composable
private fun ScheduleFormDialog(
    medicines: List<Medicine>,
    users: List<User>,
    repository: HestiaRepository,
    defaultUserId: Int,
    onDismiss: () -> Unit,
    onSaved: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var medicineId by remember { mutableStateOf(medicines.firstOrNull()?.id?.toString()) }
    var userId by remember { mutableStateOf(defaultUserId.toString()) }
    var startDate by remember { mutableStateOf(Fmt.today()) }
    var endDate by remember { mutableStateOf<String?>(null) }
    var perDay by remember { mutableStateOf("1") }
    var slots by remember { mutableStateOf(setOf("morning")) }
    var food by remember { mutableStateOf("any") }
    var dosage by remember { mutableStateOf("1 tableta") }
    var notes by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }

    DialogScaffold(
        title = "Nový plán užívání",
        onDismiss = onDismiss,
        confirmEnabled = medicineId != null,
        onConfirm = {
            scope.launch {
                repository.createMedicationSchedule(
                    MedicationScheduleCreate(
                        medicine_id = medicineId!!.toInt(),
                        user_id = userId.toIntOrNull() ?: defaultUserId,
                        start_date = startDate,
                        end_date = endDate,
                        times_per_day = perDay.toIntOrNull() ?: 1,
                        time_slots = slots.toList(),
                        food_relation = food,
                        dosage_per_take = dosage,
                        notes = notes.ifBlank { null }
                    )
                ).onSuccess { onSaved() }.onFailure { error = it.friendly() }
            }
        }
    ) {
        HestiaDropdown("Lék", medicines.map { it.id.toString() to it.name }, medicineId, { medicineId = it })
        Spacer(Modifier.height(8.dp))
        HestiaField(userId, { userId = it }, "ID uživatele", keyboardType = androidx.compose.ui.text.input.KeyboardType.Number)
        Spacer(Modifier.height(8.dp))
        DateField("Začátek", startDate, { startDate = it ?: startDate })
        Spacer(Modifier.height(8.dp))
        DateField("Konec", endDate, { endDate = it }, allowClear = true)
        Spacer(Modifier.height(8.dp))
        HestiaNumberField(perDay, { perDay = it }, "Kolikrát denně")
        Spacer(Modifier.height(8.dp))
        Text("Časy", fontSize = 12.sp, fontWeight = FontWeight.Medium)
        MultiSelectChips(Labels.timeSlots, slots, { key ->
            slots = if (slots.contains(key)) slots - key else slots + key
        })
        Spacer(Modifier.height(8.dp))
        HestiaDropdown("Vztah k jídlu", Labels.foodRelation, food, { food = it })
        Spacer(Modifier.height(8.dp))
        HestiaField(dosage, { dosage = it }, "Dávka na jedno užití")
        Spacer(Modifier.height(8.dp))
        HestiaField(notes, { notes = it }, "Poznámky")
        ErrorBox(error)
    }
}

@Composable
private fun PediatricDosageDialog(repository: HestiaRepository, onDismiss: () -> Unit) {
    val scope = rememberCoroutineScope()
    var weight by remember { mutableStateOf("") }
    var drug by remember { mutableStateOf("paracetamol") }
    var result by remember { mutableStateOf<PediatricDosage?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }
    val drugs = listOf(
        "paracetamol" to "Paracetamol",
        "ibuprofen" to "Ibuprofen",
        "naproxen" to "Naproxen"
    )

    DialogScaffold(
        title = "Dávkování pro děti",
        onDismiss = onDismiss,
        confirmText = "Spočítat",
        loading = loading,
        confirmEnabled = weight.toDoubleOrNull() != null,
        onConfirm = {
            loading = true
            scope.launch {
                repository.getPediatricDosage(weight.toDouble(), drug)
                    .onSuccess { result = it; error = null }
                    .onFailure { error = it.friendly() }
                loading = false
            }
        }
    ) {
        HestiaNumberField(weight, { weight = it }, "Váha dítěte (kg)", decimal = true)
        Spacer(Modifier.height(8.dp))
        HestiaDropdown("Lék", drugs, drug, { drug = it })
        ErrorBox(error)
        result?.let { d ->
            Spacer(Modifier.height(10.dp))
            InfoRow("Lék", d.drug_name_cs.ifBlank { d.drug })
            InfoRow("Jednotlivá dávka", "${Fmt.number(d.single_dose_mg_min)}–${Fmt.number(d.single_dose_mg_max)} mg")
            InfoRow("Max za den", "${Fmt.number(d.daily_max_mg)} mg")
            InfoRow("Interval", "po ${d.interval_hours} h (max ${d.max_doses_per_day}×)")
            d.preparations.forEach { p ->
                Card(shape = RoundedCornerShape(10.dp), modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp)) {
                    Column(Modifier.padding(8.dp)) {
                        Text(p.brand_name, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                        Text(p.concentration, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text(p.amount_per_single_dose, fontSize = 12.sp, color = StatusBlue, fontWeight = FontWeight.SemiBold)
                        p.note?.let { Text(it, fontSize = 10.sp) }
                    }
                }
            }
            d.safety_warnings.forEach { Text("⚠ $it", fontSize = 11.sp, color = StatusYellow) }
        }
    }
}
