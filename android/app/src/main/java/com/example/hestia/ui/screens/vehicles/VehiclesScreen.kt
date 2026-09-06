package com.example.hestia.ui.screens.vehicles

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
        containerColor = MaterialTheme.colorScheme.background
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
                        text = "Vozový park a garáž",
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
                        Icon(Icons.Default.Phone, contentDescription = null, modifier = Modifier.size(14.dp))
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
                        modifier = Modifier.fillMaxSize()
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

                                        // Czech License Plate (SPZ) Style Badge
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

                                    Spacer(modifier = Modifier.height(12.dp))

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
                                    }

                                    Spacer(modifier = Modifier.height(12.dp))

                                    // Mileage and buttons
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = "Tachometr: ${String.format("%,d", vehicle.current_mileage)} km",
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.SemiBold
                                        )

                                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                            FilledTonalButton(
                                                onClick = {
                                                    selectedVehicleForMileage = vehicle
                                                    newMileageText = vehicle.current_mileage.toString()
                                                },
                                                shape = RoundedCornerShape(8.dp),
                                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                                            ) {
                                                Text("Tachometr", fontSize = 11.sp)
                                            }

                                            Button(
                                                onClick = {
                                                    selectedVehicleForRefuel = vehicle
                                                    refuelMileage = (vehicle.current_mileage + 450).toString()
                                                    refuelLiters = "42.5"
                                                    refuelPrice = "1650"
                                                },
                                                colors = ButtonDefaults.buttonColors(containerColor = HestiaOrange),
                                                shape = RoundedCornerShape(8.dp),
                                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                                            ) {
                                                Icon(Icons.Default.LocalGasStation, contentDescription = null, modifier = Modifier.size(14.dp))
                                                Spacer(modifier = Modifier.width(3.dp))
                                                Text("Tankování", fontSize = 11.sp)
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        item { Spacer(modifier = Modifier.height(24.dp)) }
                    }
                }
            }
        }
    }

    // Mileage Update Dialog
    if (selectedVehicleForMileage != null) {
        AlertDialog(
            onDismissRequest = { selectedVehicleForMileage = null },
            title = { Text("Zapsat stav tachometru") },
            text = {
                OutlinedTextField(
                    value = newMileageText,
                    onValueChange = { newMileageText = it },
                    label = { Text("Stav v kilometrech") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    shape = RoundedCornerShape(10.dp)
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        val m = newMileageText.toIntOrNull()
                        if (m != null) {
                            coroutineScope.launch {
                                repository.updateVehicleMileage(selectedVehicleForMileage!!.id, m)
                                selectedVehicleForMileage = null
                                refreshVehicles()
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
    if (selectedVehicleForRefuel != null) {
        AlertDialog(
            onDismissRequest = { selectedVehicleForRefuel = null },
            title = { Text("Záznam tankování paliva") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = refuelMileage,
                        onValueChange = { refuelMileage = it },
                        label = { Text("Stav tachometru (km)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp)
                    )
                    OutlinedTextField(
                        value = refuelLiters,
                        onValueChange = { refuelLiters = it },
                        label = { Text("Natankováno litrů") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp)
                    )
                    OutlinedTextField(
                        value = refuelPrice,
                        onValueChange = { refuelPrice = it },
                        label = { Text("Celková cena (Kč)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp)
                    )
                    OutlinedTextField(
                        value = refuelStation,
                        onValueChange = { refuelStation = it },
                        label = { Text("Čerpací stanice") },
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp)
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val km = refuelMileage.toIntOrNull() ?: 0
                        val l = refuelLiters.toDoubleOrNull() ?: 0.0
                        val czk = refuelPrice.toDoubleOrNull() ?: 0.0
                        coroutineScope.launch {
                            repository.refuelVehicle(
                                selectedVehicleForRefuel!!.id,
                                RefuelingCreate(km, l, czk, refuelStation)
                            )
                            selectedVehicleForRefuel = null
                            refreshVehicles()
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = HestiaOrange)
                ) {
                    Text("Zapsat")
                }
            },
            dismissButton = {
                TextButton(onClick = { selectedVehicleForRefuel = null }) {
                    Text("Zrušit")
                }
            }
        )
    }
}
