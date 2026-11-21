package com.example.hestia.ui.screens.dashboard

import androidx.lifecycle.viewmodel.compose.viewModel
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hestia.data.models.*
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.theme.HestiaAmber
import com.example.hestia.theme.HestiaOrange
import com.example.hestia.theme.StatusBlue
import com.example.hestia.theme.StatusGreen
import com.example.hestia.theme.StatusPurple
import com.example.hestia.theme.StatusRed
import com.example.hestia.theme.StatusYellow
import com.example.hestia.ui.components.*
import com.example.hestia.ui.navigation.Screen
import com.example.hestia.util.Fmt
import com.example.hestia.util.Labels
import com.example.hestia.util.friendly
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch

@Composable
fun DashboardScreen(
    repository: HestiaRepository,
    currentUser: User?,
    onNavigate: (Screen) -> Unit,
    modifier: Modifier = Modifier
) {
    val viewModel: DashboardViewModel = viewModel(
        factory = DashboardViewModelFactory(repository)
    )
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(currentUser?.id) { if (currentUser != null) viewModel.load(currentUser) }

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
    ) {
        item {
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = HestiaOrange),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(Modifier.padding(16.dp)) {
                    Text(
                        "Dobrý den, ${currentUser?.display_name ?: currentUser?.username ?: "Hestie"}",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                    Text(
                        "${Fmt.dayName(Fmt.today())} • ${Fmt.date(Fmt.today())}",
                        color = Color.White.copy(alpha = 0.85f),
                        fontSize = 12.sp
                    )
                    Spacer(Modifier.height(6.dp))
                    Text(
                        "Domácnost pod kontrolou na jednom místě.",
                        color = Color.White.copy(alpha = 0.9f),
                        fontSize = 12.sp
                    )
                }
            }
            Spacer(Modifier.height(8.dp))
        }

        if (uiState.error != null) {
            item { ErrorBox(uiState.error, onRetry = { viewModel.load(currentUser) }) }
        }

        if (uiState.loading) {
            item { LoadingBox() }
        } else {
            item {
                SectionTitle("Rychlý přehled")
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    StatCard(
                        "Nákup", uiState.pendingShopping.toString(), Icons.Default.ShoppingCart, HestiaOrange,
                        Modifier.weight(1f), "položek") { onNavigate(Screen.Shopping) }
                    StatCard(
                        "Úkoly", uiState.choresDue.toString(), Icons.Default.CleaningServices, StatusBlue,
                        Modifier.weight(1f), if (uiState.choresOverdue > 0) "$uiState.choresOverdue po termínu" else "do termínu") { onNavigate(Screen.Chores) }
                    StatCard(
                        "Kytky", uiState.thirstyPlants.toString(), Icons.Default.LocalFlorist, StatusGreen,
                        Modifier.weight(1f), "k zálivce") { onNavigate(Screen.Plants) }
                }
                Spacer(Modifier.height(6.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    StatCard(
                        "Mazlíčci", uiState.petTasks.toString(), Icons.Default.Pets, StatusPurple,
                        Modifier.weight(1f), "úkolů") { onNavigate(Screen.Pets) }
                    StatCard(
                        "Léky", (uiState.medicineStats?.expiring_soon_count ?: 0).toString(), Icons.Default.Medication, StatusYellow,
                        Modifier.weight(1f), "brzy expiruje") { onNavigate(Screen.Medicines) }
                    StatCard(
                        "Vozidla", (uiState.fleet?.warning_deadlines_count ?: 0).toString(), Icons.Default.DirectionsCar, StatusRed,
                        Modifier.weight(1f), "lhůt") { onNavigate(Screen.Vehicles) }
                }
            }

            uiState.finance?.let { f ->
                item {
                    Spacer(Modifier.height(10.dp))
                    SectionCard(title = "Finance – ${Fmt.monthLabel(f.month)}") {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Column {
                                Text("Příjmy", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text(Fmt.money(f.total_income), fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = StatusGreen)
                            }
                            Column {
                                Text("Výdaje", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text(Fmt.money(f.total_expense), fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = StatusRed)
                            }
                            Column {
                                Text("Bilance", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text(
                                    Fmt.money(f.net_balance), fontSize = 15.sp, fontWeight = FontWeight.Bold,
                                    color = if (f.net_balance >= 0) StatusGreen else StatusRed
                                )
                            }
                        }
                        Spacer(Modifier.height(6.dp))
                        TextButton(onClick = { onNavigate(Screen.Finance) }) { Text("Otevřít uiState.finance", fontSize = 12.sp) }
                    }
                }
            }

            if (uiState.myChores.isNotEmpty()) {
                item {
                    Spacer(Modifier.height(10.dp))
                    SectionTitle("Moje úkoly")
                }
                items(uiState.myChores, key = { "chore-${it.id}" }) { chore ->
                    Card(shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp)) {
                        Row(Modifier.padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.CheckCircleOutline, null, tint = HestiaOrange, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(8.dp))
                            Column(Modifier.weight(1f)) {
                                Text(chore.title, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                                Text(
                                    "${Labels.label(Labels.rooms, chore.room)} • ${chore.points} b" +
                                        (chore.due_date?.let { " • ${Fmt.date(it)}" } ?: ""),
                                    fontSize = 10.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            if (chore.is_overdue) StatusPill("po termínu", StatusRed)
                        }
                    }
                }
            }

            if (uiState.panicTasks.isNotEmpty()) {
                item {
                    Spacer(Modifier.height(10.dp))
                    Card(
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = StatusRed.copy(alpha = 0.1f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(Modifier.padding(12.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Bolt, null, tint = StatusRed, modifier = Modifier.size(18.dp))
                                Spacer(Modifier.width(6.dp))
                                Text("Panic mode – přijde návštěva", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = StatusRed)
                            }
                            uiState.panicTasks.take(4).forEach {
                                Text("• ${it.title} (${Labels.label(Labels.rooms, it.room)})", fontSize = 12.sp)
                            }
                        }
                    }
                }
            }

            if (uiState.pets.isNotEmpty()) {
                item {
                    Spacer(Modifier.height(10.dp))
                    SectionTitle("Mazlíčci")
                }
                item {
                    Row(
                        Modifier.fillMaxWidth().padding(vertical = 2.dp),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        uiState.pets.forEach { p ->
                            Card(
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Column(Modifier.padding(8.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                    Icon(Icons.Default.Pets, null, tint = StatusPurple, modifier = Modifier.size(20.dp))
                                    Text(p.name, fontSize = 11.sp, fontWeight = FontWeight.Medium)
                                    Text(
                                        p.latest_weight_kg?.let { "${Fmt.number(it)} kg" } ?: p.age_formatted,
                                        fontSize = 9.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }
                }
            }

            if (uiState.leaderboard.isNotEmpty()) {
                item {
                    Spacer(Modifier.height(10.dp))
                    SectionCard(title = "Žebříček týdne", actionText = "Vše", onAction = { onNavigate(Screen.Chores) }) {
                        uiState.leaderboard.sortedByDescending { it.weekly_points }.take(4).forEachIndexed { i, m ->
                            Row(Modifier.fillMaxWidth().padding(vertical = 3.dp), verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    "${i + 1}.",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (i == 0) HestiaAmber else MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Spacer(Modifier.width(8.dp))
                                Text(m.display_name, fontSize = 13.sp, modifier = Modifier.weight(1f))
                                Text("${m.weekly_points} b", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }
                }
            }

            if (uiState.expiringDocs > 0) {
                item {
                    Spacer(Modifier.height(10.dp))
                    Card(
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = StatusYellow.copy(alpha = 0.12f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Description, null, tint = StatusYellow, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(8.dp))
                            Text("$uiState.expiringDocs dokumentů brzy expiruje", fontSize = 12.sp, modifier = Modifier.weight(1f))
                            TextButton(onClick = { onNavigate(Screen.Documents) }) { Text("Zobrazit", fontSize = 11.sp) }
                        }
                    }
                }
            }

            item {
                Spacer(Modifier.height(10.dp))
                SectionTitle("Poslední aktivita")
            }
            if (uiState.activities.isEmpty()) {
                item {
                    Text(
                        "Zatím žádná aktivita.",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(vertical = 6.dp)
                    )
                }
            }
            items(uiState.activities, key = { "act-${it.id}" }) { log ->
                Row(Modifier.fillMaxWidth().padding(vertical = 3.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Circle, null, tint = HestiaOrange, modifier = Modifier.size(6.dp))
                    Spacer(Modifier.width(8.dp))
                    Column(Modifier.weight(1f)) {
                        Text(log.title, fontSize = 12.sp)
                        Text(
                            "${log.user_name} • ${Labels.moduleLabel(log.module)}",
                            fontSize = 10.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Text(Fmt.relative(log.created_at), fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }

            uiState.aiStatus?.let { ai ->
                item {
                    Spacer(Modifier.height(10.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        StatusPill(
                            if (ai.configured) "AI aktivní" else "AI vypnutá",
                            if (ai.configured) StatusGreen else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(Modifier.width(8.dp))
                        Text(ai.model, fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
        }

        item { Spacer(Modifier.height(24.dp)) }
    }
}

@Composable
private fun SectionTitle(text: String) {
    Text(
        text,
        fontWeight = FontWeight.Bold,
        fontSize = 14.sp,
        modifier = Modifier.padding(top = 8.dp, bottom = 4.dp)
    )
}
