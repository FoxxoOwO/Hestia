package com.example.hestia.ui.screens.vehicles

import androidx.activity.compose.BackHandler
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
fun VehiclesScreen(repository: HestiaRepository) {
    val scope = rememberCoroutineScope()
    var vehicles by remember { mutableStateOf<List<Vehicle>>(emptyList()) }
    var stats by remember { mutableStateOf<VehicleFleetStats?>(null) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var search by remember { mutableStateOf("") }
    var showForm by remember { mutableStateOf(false) }
    var editing by remember { mutableStateOf<Vehicle?>(null) }
    var deleteTarget by remember { mutableStateOf<Vehicle?>(null) }
    var selectedId by remember { mutableStateOf<Int?>(null) }

    suspend fun load() {
        loading = true
        repository.getVehicles(query = search.ifBlank { null })
            .onSuccess { vehicles = it; error = null }
            .onFailure { error = it.friendly() }
        repository.getVehicleStats().onSuccess { stats = it }
        loading = false
    }

    LaunchedEffect(search) { kotlinx.coroutines.delay(350); load() }

    val id = selectedId
    if (id != null) {
        BackHandler { selectedId = null }
        VehicleDetailScreen(repository, id) { selectedId = null; scope.launch { load() } }
        return
    }

    Column(Modifier.fillMaxSize()) {
        Column(Modifier.padding(horizontal = 12.dp, vertical = 6.dp)) {
            HestiaField(search, { search = it }, "Hledat vozidlo")
        }
        stats?.let { s ->
            Row(Modifier.fillMaxWidth().padding(horizontal = 12.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                StatCard("Vozidla", s.total_vehicles.toString(), Icons.Default.DirectionsCar, StatusBlue, Modifier.weight(1f))
                StatCard("Varování", s.warning_deadlines_count.toString(), Icons.Default.Warning, StatusYellow, Modifier.weight(1f))
                StatCard("Prošlé", s.expired_deadlines_count.toString(), Icons.Default.Error, StatusRed, Modifier.weight(1f))
            }
            Spacer(Modifier.height(4.dp))
            Row(Modifier.fillMaxWidth().padding(horizontal = 12.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                StatCard("Palivo", Fmt.money(s.total_spent_fuel_all), Icons.Default.LocalGasStation, HestiaOrange, Modifier.weight(1f))
                StatCard("Servis", Fmt.money(s.total_spent_service_all), Icons.Default.Build, MaterialTheme.colorScheme.onSurfaceVariant, Modifier.weight(1f))
                s.fleet_average_consumption?.let {
                    StatCard("Ø spotřeba", "${Fmt.number(it)} l", Icons.Default.Speed, StatusGreen, Modifier.weight(1f))
                }
            }
        }
        ErrorBox(error, onRetry = { scope.launch { load() } })
        if (loading) LoadingBox() else LazyColumn(
            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
            modifier = Modifier.fillMaxSize()
        ) {
            if (vehicles.isEmpty()) {
                item { EmptyState(Icons.Default.DirectionsCar, "Žádná vozidla", "Přidejte auto a hlídejte STK, dálniční známku i servis.") }
            }
            items(vehicles, key = { it.id }) { v ->
                VehicleCard(
                    vehicle = v,
                    onOpen = { selectedId = v.id },
                    onEdit = { editing = v },
                    onDelete = { deleteTarget = v }
                )
            }
            item { Spacer(Modifier.height(90.dp)) }
        }
    }

    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.BottomEnd) {
        ExtendedFloatingActionButton(
            onClick = { showForm = true },
            containerColor = HestiaOrange,
            contentColor = Color.White,
            modifier = Modifier.padding(20.dp),
            icon = { Icon(Icons.Default.Add, null) },
            text = { Text("Vozidlo") }
        )
    }

    if (showForm || editing != null) {
        VehicleFormDialog(
            initial = editing,
            onDismiss = { showForm = false; editing = null },
            onSave = { create ->
                scope.launch {
                    val current = editing
                    val res = if (current == null) repository.createVehicle(create)
                    else repository.updateVehicle(
                        current.id,
                        VehicleUpdate(
                            name = create.name, make = create.make, model = create.model, year = create.year,
                            color = create.color, license_plate = create.license_plate, vin = create.vin,
                            fuel_type = create.fuel_type, tank_capacity_l = create.tank_capacity_l,
                            engine_power_kw = create.engine_power_kw,
                            engine_displacement_cc = create.engine_displacement_cc,
                            transmission = create.transmission, current_mileage = create.current_mileage,
                            mot_expiry_date = create.mot_expiry_date,
                            vignette_expiry_date = create.vignette_expiry_date,
                            vignette_type = create.vignette_type, insurance_company = create.insurance_company,
                            insurance_policy_number = create.insurance_policy_number,
                            insurance_expiry_date = create.insurance_expiry_date,
                            insurance_assistance_phone = create.insurance_assistance_phone,
                            first_aid_kit_expiry_date = create.first_aid_kit_expiry_date,
                            tire_type = create.tire_type, tire_dimension = create.tire_dimension,
                            tire_tread_depth_mm = create.tire_tread_depth_mm,
                            tire_storage_location = create.tire_storage_location,
                            oil_change_interval_km = create.oil_change_interval_km,
                            oil_change_interval_months = create.oil_change_interval_months,
                            last_oil_change_mileage = create.last_oil_change_mileage,
                            last_oil_change_date = create.last_oil_change_date,
                            notes = create.notes
                        )
                    )
                    res.onSuccess { showForm = false; editing = null; load() }
                        .onFailure { error = it.friendly() }
                }
            }
        )
    }

    deleteTarget?.let { v ->
        ConfirmDialog(
            title = "Smazat vozidlo",
            message = "Smazat „${v.name}“ včetně historie?",
            onConfirm = { scope.launch { repository.deleteVehicle(v.id).onSuccess { load() } } },
            onDismiss = { deleteTarget = null }
        )
    }
}

private fun statusColorOf(status: String): Color = when (status) {
    "ok", "valid" -> StatusGreen
    "warning", "expiring" -> StatusYellow
    "expired", "overdue" -> StatusRed
    else -> StatusBlue
}

@Composable
private fun VehicleCard(vehicle: Vehicle, onOpen: () -> Unit, onEdit: () -> Unit, onDelete: () -> Unit) {
    Card(shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
        Column(Modifier.padding(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.DirectionsCar, null, tint = HestiaOrange, modifier = Modifier.size(24.dp))
                Spacer(Modifier.width(8.dp))
                Column(Modifier.weight(1f)) {
                    Text(vehicle.name, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                    Text(
                        "${vehicle.make} ${vehicle.model} • ${vehicle.license_plate}",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                StatusPill(vehicle.overall_status, statusColorOf(vehicle.overall_status))
            }
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.padding(top = 4.dp)) {
                StatusPill("${Fmt.number(vehicle.current_mileage.toDouble(), 0)} km", StatusBlue)
                vehicle.average_consumption?.let { StatusPill("${Fmt.number(it)} l/100", StatusGreen) }
                vehicle.mot_days_remaining?.let { StatusPill("STK $it dní", statusColorOf(vehicle.mot_status)) }
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                TextButton(onClick = onOpen) { Text("Detail", fontSize = 11.sp) }
                Spacer(Modifier.weight(1f))
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
private fun VehicleDetailScreen(repository: HestiaRepository, vehicleId: Int, onBack: () -> Unit) {
    val scope = rememberCoroutineScope()
    var vehicle by remember { mutableStateOf<Vehicle?>(null) }
    var tab by remember { mutableStateOf(0) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var dialog by remember { mutableStateOf<String?>(null) }

    suspend fun reload() {
        repository.getVehicle(vehicleId).onSuccess { vehicle = it }.onFailure { error = it.friendly() }
    }

    LaunchedEffect(vehicleId) { loading = true; reload(); loading = false }

    Column(Modifier.fillMaxSize()) {
        Row(Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, "Zpět") }
            Text(vehicle?.name ?: "Vozidlo", fontWeight = FontWeight.Bold, fontSize = 18.sp, modifier = Modifier.weight(1f))
            IconButton(onClick = { scope.launch { reload() } }) { Icon(Icons.Default.Refresh, "Obnovit") }
        }
        ScrollableTabRow(selectedTabIndex = tab, edgePadding = 8.dp) {
            listOf("Přehled", "Tankování", "Servis").forEachIndexed { i, label ->
                Tab(selected = tab == i, onClick = { tab = i }, text = { Text(label, fontSize = 12.sp) })
            }
        }
        ErrorBox(error, onRetry = { scope.launch { reload() } })
        if (loading) {
            LoadingBox()
        } else {
            val v = vehicle ?: return@Column
            Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(12.dp)) {
                when (tab) {
                    0 -> {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            StatCard("Nájezd", "${Fmt.number(v.current_mileage.toDouble(), 0)} km", Icons.Default.Speed, StatusBlue, Modifier.weight(1f))
                            StatCard("Ø spotřeba", v.average_consumption?.let { "${Fmt.number(it)} l" } ?: "–", Icons.Default.LocalGasStation, HestiaOrange, Modifier.weight(1f))
                        }
                        Spacer(Modifier.height(6.dp))
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            StatCard("Palivo", Fmt.money(v.total_spent_fuel), Icons.Default.Payments, StatusGreen, Modifier.weight(1f))
                            StatCard("Servis", Fmt.money(v.total_spent_service), Icons.Default.Build, StatusYellow, Modifier.weight(1f))
                            v.cost_per_km?.let { StatCard("Kč/km", Fmt.number(it), Icons.Default.Calculate, MaterialTheme.colorScheme.onSurfaceVariant, Modifier.weight(1f)) }
                        }

                        Spacer(Modifier.height(10.dp))
                        Button(
                            onClick = { dialog = "mileage" },
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.Default.Speed, null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Aktualizovat nájezd")
                        }

                        Spacer(Modifier.height(10.dp))
                        Text("Lhůty", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                        DeadlineRow("STK", v.mot_expiry_date, v.mot_days_remaining, v.mot_status)
                        DeadlineRow("Dálniční známka", v.vignette_expiry_date, v.vignette_days_remaining, v.vignette_status)
                        DeadlineRow("Pojištění", v.insurance_expiry_date, v.insurance_days_remaining, v.insurance_status)
                        DeadlineRow("Lékárnička", v.first_aid_kit_expiry_date, v.first_aid_days_remaining, "ok")
                        DeadlineRow("Olej", v.last_oil_change_date, v.oil_change_days_remaining, v.oil_status)
                        v.oil_change_km_remaining?.let {
                            Text("Do výměny oleje: ${Fmt.number(it.toDouble(), 0)} km", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }

                        HorizontalDivider(Modifier.padding(vertical = 8.dp))
                        Text("Technické údaje", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                        InfoRow("Značka", "${v.make} ${v.model}")
                        InfoRow("Rok", v.year?.toString())
                        InfoRow("SPZ", v.license_plate)
                        InfoRow("VIN", v.vin)
                        InfoRow("Palivo", Labels.label(Labels.vehicleFuelTypes, v.fuel_type))
                        InfoRow("Převodovka", Labels.label(Labels.transmissions, v.transmission))
                        InfoRow("Objem nádrže", v.tank_capacity_l?.let { "${Fmt.number(it)} l" })
                        InfoRow("Výkon", v.engine_power_kw?.let { "$it kW" })
                        InfoRow("Pneumatiky", "${Labels.label(Labels.tireTypes, v.tire_type ?: "summer")} ${v.tire_dimension ?: ""}")
                        InfoRow("Vzorek", v.tire_tread_depth_mm?.let { "${Fmt.number(it)} mm" })
                        InfoRow("Pojišťovna", v.insurance_company)
                        InfoRow("Pojistka", v.insurance_policy_number)
                        InfoRow("Asistence", v.insurance_assistance_phone)
                        InfoRow("Poznámky", v.notes)
                    }

                    1 -> {
                        Button(onClick = { dialog = "refuel" }, shape = RoundedCornerShape(10.dp), modifier = Modifier.fillMaxWidth()) {
                            Text("+ Tankování")
                        }
                        Spacer(Modifier.height(8.dp))
                        if (v.refuelings.isEmpty()) Text("Žádné tankování.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        v.refuelings.sortedByDescending { it.date }.forEach { r ->
                            Card(shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp)) {
                                Row(Modifier.padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Column(Modifier.weight(1f)) {
                                        Text("${Fmt.number(r.fuel_amount_l)} l • ${Fmt.money(r.total_price)}", fontSize = 13.sp, fontWeight = FontWeight.Medium)
                                        Text(
                                            "${Fmt.date(r.date)} • ${Fmt.number(r.mileage.toDouble(), 0)} km" +
                                                (r.fuel_brand?.let { " • $it" } ?: ""),
                                            fontSize = 10.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                        r.calculated_consumption?.let {
                                            Text("Spotřeba ${Fmt.number(it)} l/100 km", fontSize = 10.sp, color = StatusGreen)
                                        }
                                    }
                                    IconButton(onClick = {
                                        scope.launch { repository.deleteRefueling(vehicleId, r.id).onSuccess { reload() } }
                                    }, modifier = Modifier.size(28.dp)) {
                                        Icon(Icons.Default.Delete, null, tint = StatusRed, modifier = Modifier.size(14.dp))
                                    }
                                }
                            }
                        }
                    }

                    else -> {
                        Button(onClick = { dialog = "service" }, shape = RoundedCornerShape(10.dp), modifier = Modifier.fillMaxWidth()) {
                            Text("+ Servisní záznam")
                        }
                        Spacer(Modifier.height(8.dp))
                        if (v.service_records.isEmpty()) Text("Žádné servisní záznamy.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        v.service_records.sortedByDescending { it.date }.forEach { s ->
                            Card(shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp)) {
                                Row(Modifier.padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Column(Modifier.weight(1f)) {
                                        Text(s.title, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                                        Text(
                                            "${Fmt.date(s.date)} • ${Fmt.number(s.mileage.toDouble(), 0)} km • ${Fmt.money(s.cost)}",
                                            fontSize = 10.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                        s.service_shop?.let { Text(it, fontSize = 10.sp) }
                                        s.performed_operations?.let { Text(it, fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                                    }
                                    IconButton(onClick = {
                                        scope.launch { repository.deleteServiceRecord(vehicleId, s.id).onSuccess { reload() } }
                                    }, modifier = Modifier.size(28.dp)) {
                                        Icon(Icons.Default.Delete, null, tint = StatusRed, modifier = Modifier.size(14.dp))
                                    }
                                }
                            }
                        }
                    }
                }
                Spacer(Modifier.height(30.dp))
            }
        }
    }

    when (dialog) {
        "mileage" -> {
            var mileage by remember { mutableStateOf(vehicle?.current_mileage?.toString() ?: "") }
            DialogScaffold(
                title = "Aktualizovat nájezd",
                onDismiss = { dialog = null },
                confirmEnabled = mileage.toIntOrNull() != null,
                onConfirm = {
                    scope.launch {
                        repository.updateVehicleMileage(vehicleId, mileage.toInt())
                            .onSuccess { dialog = null; reload() }.onFailure { error = it.friendly() }
                    }
                }
            ) { HestiaNumberField(mileage, { mileage = it }, "Nájezd (km)") }
        }
        "refuel" -> {
            var date by remember { mutableStateOf(Fmt.today()) }
            var mileage by remember { mutableStateOf(vehicle?.current_mileage?.toString() ?: "") }
            var liters by remember { mutableStateOf("") }
            var pricePerL by remember { mutableStateOf("") }
            var total by remember { mutableStateOf("") }
            var full by remember { mutableStateOf(true) }
            var brand by remember { mutableStateOf("") }
            var toFinance by remember { mutableStateOf(false) }
            DialogScaffold(
                title = "Nové tankování",
                onDismiss = { dialog = null },
                confirmEnabled = mileage.toIntOrNull() != null && liters.toDoubleOrNull() != null,
                onConfirm = {
                    val l = liters.toDouble()
                    val ppl = pricePerL.toDoubleOrNull()
                    scope.launch {
                        repository.addRefueling(
                            vehicleId,
                            VehicleRefuelingCreate(
                                date = date, mileage = mileage.toInt(), fuel_amount_l = l,
                                price_per_l = ppl, total_price = total.toDoubleOrNull() ?: (ppl?.let { it * l } ?: 0.0),
                                is_full_tank = full, fuel_brand = brand.ifBlank { null },
                                record_to_finance = toFinance
                            )
                        ).onSuccess { dialog = null; reload() }.onFailure { error = it.friendly() }
                    }
                }
            ) {
                DateField("Datum", date, { date = it ?: date })
                Spacer(Modifier.height(8.dp))
                HestiaNumberField(mileage, { mileage = it }, "Nájezd (km)")
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    HestiaNumberField(liters, { liters = it }, "Litry", Modifier.weight(1f), decimal = true)
                    HestiaNumberField(pricePerL, { pricePerL = it }, "Kč/l", Modifier.weight(1f), decimal = true)
                }
                Spacer(Modifier.height(8.dp))
                HestiaNumberField(total, { total = it }, "Celkem Kč", decimal = true)
                Spacer(Modifier.height(8.dp))
                HestiaField(brand, { brand = it }, "Značka čerpačky")
                Spacer(Modifier.height(8.dp))
                ToggleRow("Plná nádrž", full, { full = it })
                ToggleRow("Zapsat do financí", toFinance, { toFinance = it })
            }
        }
        "service" -> {
            var type by remember { mutableStateOf("regular_service") }
            var title by remember { mutableStateOf("") }
            var date by remember { mutableStateOf(Fmt.today()) }
            var mileage by remember { mutableStateOf(vehicle?.current_mileage?.toString() ?: "") }
            var cost by remember { mutableStateOf("") }
            var shop by remember { mutableStateOf("") }
            var operations by remember { mutableStateOf("") }
            var toFinance by remember { mutableStateOf(false) }
            DialogScaffold(
                title = "Nový servis",
                onDismiss = { dialog = null },
                confirmEnabled = title.isNotBlank() && mileage.toIntOrNull() != null,
                onConfirm = {
                    scope.launch {
                        repository.addServiceRecord(
                            vehicleId,
                            VehicleServiceRecordCreate(
                                service_type = type, title = title, date = date,
                                mileage = mileage.toInt(), cost = cost.toDoubleOrNull() ?: 0.0,
                                service_shop = shop.ifBlank { null },
                                performed_operations = operations.ifBlank { null },
                                record_to_finance = toFinance
                            )
                        ).onSuccess { dialog = null; reload() }.onFailure { error = it.friendly() }
                    }
                }
            ) {
                HestiaDropdown("Typ", Labels.serviceTypes, type, { type = it })
                Spacer(Modifier.height(8.dp))
                HestiaField(title, { title = it }, "Název")
                Spacer(Modifier.height(8.dp))
                DateField("Datum", date, { date = it ?: date })
                Spacer(Modifier.height(8.dp))
                HestiaNumberField(mileage, { mileage = it }, "Nájezd (km)")
                Spacer(Modifier.height(8.dp))
                HestiaNumberField(cost, { cost = it }, "Cena (Kč)", decimal = true)
                Spacer(Modifier.height(8.dp))
                HestiaField(shop, { shop = it }, "Servis")
                Spacer(Modifier.height(8.dp))
                HestiaField(operations, { operations = it }, "Provedené práce", singleLine = false, minLines = 2)
                Spacer(Modifier.height(8.dp))
                ToggleRow("Zapsat do financí", toFinance, { toFinance = it })
            }
        }
    }
}

@Composable
private fun DeadlineRow(label: String, date: String?, days: Int?, status: String) {
    if (date == null) return
    Row(Modifier.fillMaxWidth().padding(vertical = 3.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(label, fontSize = 12.sp, modifier = Modifier.weight(1f))
        Text(Fmt.date(date), fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.width(6.dp))
        StatusPill(days?.let { if (it < 0) "prošlé" else "$it dní" } ?: status, statusColorOf(status))
    }
}

@Composable
private fun VehicleFormDialog(
    initial: Vehicle?,
    onDismiss: () -> Unit,
    onSave: (VehicleCreate) -> Unit
) {
    var name by remember { mutableStateOf(initial?.name ?: "") }
    var make by remember { mutableStateOf(initial?.make ?: "") }
    var model by remember { mutableStateOf(initial?.model ?: "") }
    var year by remember { mutableStateOf(initial?.year?.toString() ?: "") }
    var plate by remember { mutableStateOf(initial?.license_plate ?: "") }
    var vin by remember { mutableStateOf(initial?.vin ?: "") }
    var fuel by remember { mutableStateOf(initial?.fuel_type ?: "petrol") }
    var transmission by remember { mutableStateOf(initial?.transmission ?: "manual") }
    var mileage by remember { mutableStateOf(initial?.current_mileage?.toString() ?: "0") }
    var tank by remember { mutableStateOf(initial?.tank_capacity_l?.let { Fmt.number(it) } ?: "") }
    var power by remember { mutableStateOf(initial?.engine_power_kw?.toString() ?: "") }
    var mot by remember { mutableStateOf(initial?.mot_expiry_date) }
    var vignette by remember { mutableStateOf(initial?.vignette_expiry_date) }
    var insurance by remember { mutableStateOf(initial?.insurance_expiry_date) }
    var insuranceCompany by remember { mutableStateOf(initial?.insurance_company ?: "") }
    var firstAid by remember { mutableStateOf(initial?.first_aid_kit_expiry_date) }
    var tireType by remember { mutableStateOf(initial?.tire_type ?: "summer") }
    var tireDim by remember { mutableStateOf(initial?.tire_dimension ?: "") }
    var oilKm by remember { mutableStateOf(initial?.oil_change_interval_km?.toString() ?: "15000") }
    var lastOilDate by remember { mutableStateOf(initial?.last_oil_change_date) }
    var notes by remember { mutableStateOf(initial?.notes ?: "") }

    DialogScaffold(
        title = if (initial == null) "Nové vozidlo" else "Upravit vozidlo",
        onDismiss = onDismiss,
        confirmEnabled = name.isNotBlank() && make.isNotBlank() && plate.isNotBlank(),
        onConfirm = {
            onSave(
                VehicleCreate(
                    name = name.trim(), make = make.trim(), model = model.trim(),
                    year = year.toIntOrNull(), license_plate = plate.trim(), vin = vin.ifBlank { null },
                    fuel_type = fuel, tank_capacity_l = tank.toDoubleOrNull(),
                    engine_power_kw = power.toIntOrNull(), transmission = transmission,
                    current_mileage = mileage.toIntOrNull() ?: 0,
                    mot_expiry_date = mot, vignette_expiry_date = vignette,
                    insurance_expiry_date = insurance,
                    insurance_company = insuranceCompany.ifBlank { null },
                    first_aid_kit_expiry_date = firstAid, tire_type = tireType,
                    tire_dimension = tireDim.ifBlank { null },
                    oil_change_interval_km = oilKm.toIntOrNull(),
                    last_oil_change_date = lastOilDate,
                    notes = notes.ifBlank { null }
                )
            )
        }
    ) {
        HestiaField(name, { name = it }, "Název (např. Rodinné auto)")
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            HestiaField(make, { make = it }, "Značka", Modifier.weight(1f))
            HestiaField(model, { model = it }, "Model", Modifier.weight(1f))
        }
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            HestiaNumberField(year, { year = it }, "Rok", Modifier.weight(1f))
            HestiaField(plate, { plate = it }, "SPZ", Modifier.weight(1f))
        }
        Spacer(Modifier.height(8.dp))
        HestiaField(vin, { vin = it }, "VIN")
        Spacer(Modifier.height(8.dp))
        HestiaDropdown("Palivo", Labels.vehicleFuelTypes, fuel, { fuel = it })
        Spacer(Modifier.height(8.dp))
        HestiaDropdown("Převodovka", Labels.transmissions, transmission, { transmission = it })
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            HestiaNumberField(mileage, { mileage = it }, "Nájezd (km)", Modifier.weight(1f))
            HestiaNumberField(power, { power = it }, "kW", Modifier.weight(1f))
        }
        Spacer(Modifier.height(8.dp))
        HestiaNumberField(tank, { tank = it }, "Nádrž (l)", decimal = true)
        Spacer(Modifier.height(8.dp))
        DateField("STK do", mot, { mot = it })
        Spacer(Modifier.height(8.dp))
        DateField("Dálniční známka do", vignette, { vignette = it })
        Spacer(Modifier.height(8.dp))
        DateField("Pojištění do", insurance, { insurance = it })
        Spacer(Modifier.height(8.dp))
        HestiaField(insuranceCompany, { insuranceCompany = it }, "Pojišťovna")
        Spacer(Modifier.height(8.dp))
        DateField("Lékárnička do", firstAid, { firstAid = it })
        Spacer(Modifier.height(8.dp))
        HestiaDropdown("Pneumatiky", Labels.tireTypes, tireType, { tireType = it })
        Spacer(Modifier.height(8.dp))
        HestiaField(tireDim, { tireDim = it }, "Rozměr pneumatik")
        Spacer(Modifier.height(8.dp))
        HestiaNumberField(oilKm, { oilKm = it }, "Interval výměny oleje (km)")
        Spacer(Modifier.height(8.dp))
        DateField("Poslední výměna oleje", lastOilDate, { lastOilDate = it })
        Spacer(Modifier.height(8.dp))
        HestiaField(notes, { notes = it }, "Poznámky", singleLine = false, minLines = 2)
    }
}
