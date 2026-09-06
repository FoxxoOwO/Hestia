package com.example.hestia.ui.screens.medicines

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hestia.data.models.FirstAidGuide
import com.example.hestia.data.models.Medicine
import com.example.hestia.data.models.MedicineStats
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
    var selectedTab by remember { mutableStateOf(0) } // 0 = Zásoby, 1 = Dětská kalkulačka, 2 = SOS První pomoc
    var isLoading by remember { mutableStateOf(true) }

    // Pediatric calculator weight state
    var childWeight by remember { mutableStateOf(14f) }

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

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background
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
                    text = { Text("Zásoby léků (${medicines.size})", fontSize = 12.sp) }
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
                    if (isLoading) {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(color = HestiaOrange)
                        }
                    } else if (medicines.isEmpty()) {
                        EmptyStateCard(
                            message = "V lékárničce zatím nejsou žádné léky.",
                            icon = Icons.Default.MedicalServices
                        )
                    } else {
                        LazyColumn(
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                            modifier = Modifier.fillMaxSize()
                        ) {
                            items(medicines, key = { it.id }) { med ->
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

                                            FilledTonalButton(
                                                onClick = {
                                                    coroutineScope.launch {
                                                        repository.takeMedicineDose(med.id)
                                                        refreshMedicines()
                                                    }
                                                },
                                                colors = ButtonDefaults.filledTonalButtonColors(
                                                    containerColor = HestiaOrange.copy(alpha = 0.15f),
                                                    contentColor = HestiaOrange
                                                ),
                                                shape = RoundedCornerShape(8.dp),
                                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                                            ) {
                                                Icon(Icons.Default.Medication, contentDescription = null, modifier = Modifier.size(14.dp))
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Text("Vzít dávku", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                            }
                                        }
                                    }
                                }
                            }
                            item { Spacer(modifier = Modifier.height(24.dp)) }
                        }
                    }
                }

                // TAB 1: Pediatric antipyretic calculator
                1 -> {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(14.dp),
                        modifier = Modifier.fillMaxSize()
                    ) {
                        item {
                            Card(
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text(
                                        text = "Hmotnost dítěte: ${childWeight.roundToInt()} kg",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 16.sp
                                    )
                                    Slider(
                                        value = childWeight,
                                        onValueChange = { childWeight = it },
                                        valueRange = 4f..45f,
                                        steps = 40,
                                        colors = SliderDefaults.colors(
                                            thumbColor = HestiaOrange,
                                            activeTrackColor = HestiaOrange
                                        )
                                    )
                                }
                            }
                        }

                        // Paracetamol dose
                        val w = childWeight.toDouble()
                        val paracetamolMinMg = (w * 10).roundToInt()
                        val paracetamolMaxMg = (w * 15).roundToInt()
                        val paracetamolSirupMinMl = String.format("%.1f", paracetamolMinMg / 24.0)
                        val paracetamolSirupMaxMl = String.format("%.1f", paracetamolMaxMg / 24.0)

                        item {
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
                                        Icon(Icons.Default.Thermostat, contentDescription = null, tint = StatusBlue)
                                        Text("Paracetamol (Paralen, Panadol)", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                    }
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = "Dávka: $paracetamolMinMg – $paracetamolMaxMg mg (10–15 mg/kg)",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    Text(
                                        text = "Paralen sirup (24 mg/ml): $paracetamolSirupMinMl – $paracetamolSirupMaxMl ml",
                                        fontSize = 12.sp,
                                        color = HestiaOrange,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "Interval: minimálně 6 hodin mezi stejnou látkou.",
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }

                        // Ibuprofen dose
                        val ibuminMg = (w * 5).roundToInt()
                        val ibumaxMg = (w * 10).roundToInt()
                        val ibuSirupMinMl = String.format("%.1f", ibuminMg / 20.0)
                        val ibuSirupMaxMl = String.format("%.1f", ibumaxMg / 20.0)

                        item {
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
                                        Icon(Icons.Default.Thermostat, contentDescription = null, tint = HestiaOrange)
                                        Text("Ibuprofen (Nurofen, Ibalgin)", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                    }
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = "Dávka: $ibuminMg – $ibumaxMg mg (5–10 mg/kg)",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    Text(
                                        text = "Nurofen sirup 20 mg/ml (2%): $ibuSirupMinMl – $ibuSirupMaxMl ml",
                                        fontSize = 12.sp,
                                        color = HestiaOrange,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "Pozor: Nurofen 4% (40 mg/ml) vyžaduje poloviční dávku!",
                                        fontSize = 11.sp,
                                        color = StatusRed,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                            }
                        }

                        item { Spacer(modifier = Modifier.height(24.dp)) }
                    }
                }

                // TAB 2: SOS First Aid Guides
                2 -> {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier.fillMaxSize()
                    ) {
                        // Emergency Call Buttons
                        item {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Button(
                                    onClick = {
                                        val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:155"))
                                        context.startActivity(intent)
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = StatusRed),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(Icons.Default.Call, contentDescription = null)
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("ZZS 155", fontWeight = FontWeight.Bold)
                                }

                                Button(
                                    onClick = {
                                        val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:224919293"))
                                        context.startActivity(intent)
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = HestiaAmber),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.weight(1.3f)
                                ) {
                                    Icon(Icons.Default.PhoneInTalk, contentDescription = null)
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("TIS Toxikologie", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }

                        // SOS Guides
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
                                        color = MaterialTheme.colorScheme.onSurface
                                    )

                                    Spacer(modifier = Modifier.height(6.dp))

                                    Text(
                                        text = "Co ihned udělat:",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = StatusGreen
                                    )
                                    guide.immediate_actions.forEach { action ->
                                        Text("• $action", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface)
                                    }

                                    if (guide.do_nots.isNotEmpty()) {
                                        Spacer(modifier = Modifier.height(6.dp))
                                        Text(
                                            text = "Co NIKDY nedělat:",
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = StatusRed
                                        )
                                        guide.do_nots.forEach { doNot ->
                                            Text("✗ $doNot", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface)
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
}
