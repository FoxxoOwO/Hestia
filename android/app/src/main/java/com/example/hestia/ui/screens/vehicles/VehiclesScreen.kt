package com.example.hestia.ui.screens.vehicles

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.border
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hestia.data.models.RefuelingCreate
import com.example.hestia.data.models.Vehicle
import com.example.hestia.data.models.VehicleCreate
import com.example.hestia.data.models.VehicleServiceRecord
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.theme.*
import com.example.hestia.ui.components.EmptyStateCard
import kotlinx.coroutines.launch

@Composable
fun VehiclesScreen(
    repository: HestiaRepository,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    var vehicles by remember { mutableStateOf<List<Vehicle>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }

    var selectedVehicleForMileage by remember { mutableStateOf<Vehicle?>(null) }
    var newMileageText by remember { mutableStateOf("") }

    var selectedVehicleForRefuel by remember { mutableStateOf<Vehicle?>(null) }
    var refuelMileage by remember { mutableStateOf("") }
    var refuelLiters by remember { mutableStateOf("") }
    var refuelPrice by remember { mutableStateOf("") }
    var refuelStation by remember { mutableStateOf("Orlen") }

    var selectedVehicleForService by remember { mutableStateOf<Vehicle?>(null) }
    var serviceRecords by remember { mutableStateOf<List<VehicleServiceRecord>>(emptyList()) }

    var showAddVehicleDialog by remember { mutableStateOf(false) }
    var snackbarMessage by remember { mutableStateOf<String?>(null) }

    fun refreshVehicles() {
        coroutineScope.launch {
            isLoading = true
            repository.getVehicles().onSuccess { vehicles = it }
            isLoading = false
        }
    }

    LaunchedEffect(Unit) {
        refreshVehicles()
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background,
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddVehicleDialog = true },
                containerColor = HestiaOrange,
                contentColor = Color.White,
                shape = CircleShape
            ) {
                Icon(Icons.Default.Add, contentDescription = "Přidat vozidlo")
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
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Vozový park a garáž (${vehicles.size})",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )

                    Button(
                        onClick = {
                            val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:1224"))
                            context.startActivity(intent)
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = StatusYellow),
                        shape = RoundedCornerShape(10.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Icon(Icons.Default.Phone, contentDescription = null, modifier = Modifier.size(14.dp), tint = Color.Black)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("SOS 1224", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                    }
                }

                if (vehicles.isEmpty()) {
                    EmptyStateCard(
                        message = "V garáži zatím nemáte žádná vozidla.",
                        icon = Icons.Default.DirectionsCar
                    )
                } else {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(bottom = 80.dp)
                    ) {
                        items(vehicles, key = { it.id }) { vehicle ->
                            val stkColor = when (vehicle.stk_status) {
                                "expired" -> StatusRed
                                "warning" -> StatusYellow
                                else -> StatusGreen
                            }

                            Card(
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column {
                                            Text(
                                                text = vehicle.name,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 16.sp
                                            )
                                            Text(
                                                text = "${vehicle.brand} ${vehicle.model} • ${vehicle.fuel_type}",
                                                fontSize = 12.sp,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }

                                        // Czech SPZ Badge
                                        Surface(
                                            shape = RoundedCornerShape(6.dp),
                                            color = Color.White,
                                            modifier = Modifier.border(1.5.dp, Color.Black, RoundedCornerShape(6.dp))
                                        ) {
                                            Text(
                                                text = vehicle.plate_number,
                                                color = Color.Black,
                                                fontSize = 13.sp,
                                                fontWeight = FontWeight.Bold,
                                                fontFamily = FontFamily.Monospace,
                                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                            )
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(10.dp))

                                    // Status badges row
                                    Row(
                                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Badge(
                                            containerColor = stkColor.copy(alpha = 0.15f),
                                            contentColor = stkColor
                                        ) {
                                            Text(
                                                text = "STK: ${vehicle.days_until_stk ?: 0} dní",
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 11.sp,
                                                modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                            )
                                        }

                                        val vignetteColor = if (vehicle.vignette_status == "valid") StatusGreen else StatusYellow
                                        Badge(
                                            containerColor = vignetteColor.copy(alpha = 0.15f),
                                            contentColor = vignetteColor
                                        ) {
                                            Text(
                                                text = if (vehicle.vignette_status == "valid") "Dálniční známka OK" else "Bez dálniční známky",
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 11.sp,
                                                modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                            )
                                        }

                                        if (vehicle.average_consumption != null && vehicle.average_consumption > 0) {
                                            Badge(
                                                containerColor = MaterialTheme.colorScheme.surfaceVariant,
                                                contentColor = MaterialTheme.colorScheme.onSurfaceVariant
                                            ) {
                                                Text(
                                                    text = "Ø ${vehicle.average_consumption} l/100km",
                                                    fontSize = 11.sp,
                                                    fontWeight = FontWeight.SemiBold,
                                                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                                )
                                            }
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(12.dp))

                                    // Mileage and buttons
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column {
                                            Text(
                                                text = "Stav tachometru",
                                                fontSize = 11.sp,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                            Text(
                                                text = "${String.format("%,d", vehicle.current_mileage).replace(',', ' ')} km",
                                                fontSize = 15.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }

                                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                            OutlinedButton(
                                                onClick = {
                                                    selectedVehicleForMileage = vehicle
                                                    newMileageText = vehicle.current_mileage.toString()
                                                },
                                                shape = RoundedCornerShape(8.dp),
                                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                                            ) {
                                                Icon(Icons.Default.Speed, contentDescription = null, modifier = Modifier.size(13.dp))
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Text("Tachometr", fontSize = 11.sp)
                                            }

                                            Button(
                                                onClick = {
                                                    selectedVehicleForRefuel = vehicle
                                                    refuelMileage = vehicle.current_mileage.toString()
                                                    refuelLiters = ""
                                                    refuelPrice = ""
                                                },
                                                shape = RoundedCornerShape(8.dp),
                                                colors = ButtonDefaults.buttonColors(containerColor = HestiaOrange),
                                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                                            ) {
                                                Icon(Icons.Default.LocalGasStation, contentDescription = null, modifier = Modifier.size(13.dp))
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Text("Tankovat", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                            }

                                            IconButton(
                                                onClick = {
                                                    coroutineScope.launch {
                                                        repository.deleteVehicle(vehicle.id).onSuccess {
                                                            refreshVehicles()
                                                            snackbarMessage = "Vozidlo smazáno"
                                                        }
                                                    }
                                                },
                                                modifier = Modifier.size(32.dp)
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
        }
    }

    // Mileage Update Dialog
    selectedVehicleForMileage?.let { vehicle ->
        AlertDialog(
            onDismissRequest = { selectedVehicleForMileage = null },
            title = { Text("Aktualizovat tachometr", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Zadejte aktuální stav ujetých kilometrů pro ${vehicle.name}:", fontSize = 13.sp)
                    OutlinedTextField(
                        value = newMileageText,
                        onValueChange = { newMileageText = it },
                        label = { Text("Najeto (km)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val mileageInt = newMileageText.toIntOrNull()
                        if (mileageInt != null && mileageInt >= vehicle.current_mileage) {
                            coroutineScope.launch {
                                repository.updateVehicleMileage(vehicle.id, mileageInt)
                                selectedVehicleForMileage = null
                                refreshVehicles()
                                snackbarMessage = "Tachometr byl aktualizován!"
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = HestiaOrange)
                ) {
                    Text("Uložit")
                }
            },
            dismissButton = {
                TextButton(onClick = { selectedVehicleForMileage = null }) {
                    Text("Zrušit")
                }
            }
        )
    }

    // Refuel Dialog
    selectedVehicleForRefuel?.let { vehicle ->
        AlertDialog(
            onDismissRequest = { selectedVehicleForRefuel = null },
            title = { Text("Záznam tankování: ${vehicle.name}", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = refuelLiters,
                        onValueChange = { refuelLiters = it },
                        label = { Text("Natankováno litrů (l) *") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = refuelPrice,
                        onValueChange = { refuelPrice = it },
                        label = { Text("Celková cena (Kč) *") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = refuelMileage,
                        onValueChange = { refuelMileage = it },
                        label = { Text("Stav tachometru při tankování (km)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = refuelStation,
                        onValueChange = { refuelStation = it },
                        label = { Text("Čerpací stanice") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val l = refuelLiters.toDoubleOrNull()
                        val p = refuelPrice.toDoubleOrNull()
                        val m = refuelMileage.toIntOrNull() ?: vehicle.current_mileage
                        if (l != null && p != null) {
                            coroutineScope.launch {
                                repository.refuelVehicle(
                                    vehicle.id,
                                    RefuelingCreate(
                                        current_mileage = m,
                                        liters = l,
                                        total_price = p,
                                        gas_station = refuelStation.trim().ifBlank { null }
                                    )
                                )
                                selectedVehicleForRefuel = null
                                refreshVehicles()
                                snackbarMessage = "Tankování bylo úspěšně zaevidováno!"
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = HestiaOrange)
                ) {
                    Text("Uložit tankování")
                }
            },
            dismissButton = {
                TextButton(onClick = { selectedVehicleForRefuel = null }) {
                    Text("Zrušit")
                }
            }
        )
    }

    // Add Vehicle Dialog
    if (showAddVehicleDialog) {
        var name by remember { mutableStateOf("") }
        var make by remember { mutableStateOf("Škoda") }
        var model by remember { mutableStateOf("") }
        var plate by remember { mutableStateOf("") }
        var mileage by remember { mutableStateOf("50000") }
        var fuelType by remember { mutableStateOf("diesel") }
        var motDate by remember { mutableStateOf("") }
        var vignetteDate by remember { mutableStateOf("") }

        val fuels = listOf("diesel" to "Nafta", "petrol" to "Benzín", "hybrid" to "Hybrid", "electric" to "Elektro", "lpg" to "LPG")

        AlertDialog(
            onDismissRequest = { showAddVehicleDialog = false },
            title = { Text("Přidat nové vozidlo do garáže", fontWeight = FontWeight.Bold) },
            text = {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    item {
                        OutlinedTextField(
                            value = name,
                            onValueChange = { name = it },
                            label = { Text("Pojmenování vozu *") },
                            placeholder = { Text("Rodinný kombík") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }

                    item {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(
                                value = make,
                                onValueChange = { make = it },
                                label = { Text("Značka") },
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )
                            OutlinedTextField(
                                value = model,
                                onValueChange = { model = it },
                                label = { Text("Model") },
                                placeholder = { Text("Octavia") },
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )
                        }
                    }

                    item {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(
                                value = plate,
                                onValueChange = { plate = it },
                                label = { Text("SPZ *") },
                                placeholder = { Text("1AB 2345") },
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )
                            OutlinedTextField(
                                value = mileage,
                                onValueChange = { mileage = it },
                                label = { Text("Tachometr (km)") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )
                        }
                    }

                    item {
                        Text("Palivo:", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            items(fuels) { (k, l) ->
                                FilterChip(
                                    selected = fuelType == k,
                                    onClick = { fuelType = k },
                                    label = { Text(l, fontSize = 11.sp) }
                                )
                            }
                        }
                    }

                    item {
                        OutlinedTextField(
                            value = motDate,
                            onValueChange = { motDate = it },
                            label = { Text("Konec STK (RRRR-MM-DD)") },
                            placeholder = { Text("2027-05-15") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }

                    item {
                        OutlinedTextField(
                            value = vignetteDate,
                            onValueChange = { vignetteDate = it },
                            label = { Text("Platnost dálniční známky (RRRR-MM-DD)") },
                            placeholder = { Text("2027-01-31") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (name.isNotBlank() && plate.isNotBlank()) {
                            coroutineScope.launch {
                                repository.createVehicle(
                                    VehicleCreate(
                                        name = name.trim(),
                                        make = make.trim(),
                                        model = model.trim(),
                                        license_plate = plate.trim().uppercase(),
                                        current_mileage = mileage.toIntOrNull() ?: 0,
                                        fuel_type = fuelType,
                                        mot_expiry_date = motDate.trim().ifBlank { null },
                                        vignette_expiry_date = vignetteDate.trim().ifBlank { null }
                                    )
                                ).onSuccess {
                                    showAddVehicleDialog = false
                                    refreshVehicles()
                                    snackbarMessage = "Vozidlo bylo úspěšně přidáno!"
                                }
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = HestiaOrange)
                ) {
                    Text("Přidat vozidlo")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddVehicleDialog = false }) {
                    Text("Zrušit")
                }
            }
        )
    }
}
