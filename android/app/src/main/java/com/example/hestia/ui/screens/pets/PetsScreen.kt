package com.example.hestia.ui.screens.pets

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.example.hestia.data.models.Pet
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.theme.HestiaOrange
import com.example.hestia.ui.components.EmptyStateCard
import kotlinx.coroutines.launch

@Composable
fun PetsScreen(
    repository: HestiaRepository,
    modifier: Modifier = Modifier
) {
    val coroutineScope = rememberCoroutineScope()
    var pets by remember { mutableStateOf<List<Pet>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var actionMessage by remember { mutableStateOf<String?>(null) }

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
                Text(
                    text = "Domácí mazlíčci (${pets.size})",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(vertical = 12.dp)
                )

                if (pets.isEmpty()) {
                    EmptyStateCard(
                        message = "V domácnosti zatím nemáte přidané žádné mazlíčky.",
                        icon = Icons.Default.Pets
                    )
                } else {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier.fillMaxSize()
                    ) {
                        items(pets, key = { it.id }) { pet ->
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
                                            colors = ButtonDefaults.buttonColors(containerColor = HestiaOrange),
                                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.Restaurant,
                                                contentDescription = null,
                                                modifier = Modifier.size(16.dp)
                                            )
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("Nakrmit", fontSize = 12.sp)
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

                                    if (!pet.vet_name.isNullOrBlank()) {
                                        Spacer(modifier = Modifier.height(6.dp))
                                        Text(
                                            text = "Veterinář: ${pet.vet_name}${if (!pet.vet_phone.isNullOrBlank()) " (${pet.vet_phone})" else ""}",
                                            fontSize = 11.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
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
