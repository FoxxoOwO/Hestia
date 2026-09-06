package com.example.hestia.ui.screens.plants

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hestia.data.models.Plant
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
                Text(
                    text = "Pokojové květiny (${plants.size})",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(vertical = 8.dp)
                )

                if (plants.isEmpty()) {
                    EmptyStateCard(
                        message = "V domácnosti zatím nemáte zaevidované žádné květiny.",
                        icon = Icons.Default.LocalFlorist
                    )
                } else {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.fillMaxSize()
                    ) {
                        items(plants, key = { it.id }) { plant ->
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

                                    Button(
                                        onClick = {
                                            coroutineScope.launch {
                                                repository.waterPlant(plant.id)
                                                refreshPlants()
                                            }
                                        },
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = if (isThirsty) StatusGreen else HestiaOrange
                                        ),
                                        shape = RoundedCornerShape(10.dp),
                                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                                    ) {
                                        Icon(Icons.Default.WaterDrop, contentDescription = null, modifier = Modifier.size(14.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("Zalito", fontSize = 11.sp, fontWeight = FontWeight.Bold)
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
