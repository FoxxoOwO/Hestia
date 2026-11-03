package com.example.hestia.ui.screens.dashboard

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
    val scope = rememberCoroutineScope()
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    var pendingShopping by remember { mutableStateOf(0) }
    var choresDue by remember { mutableStateOf(0) }
    var choresOverdue by remember { mutableStateOf(0) }
    var myChores by remember { mutableStateOf<List<Chore>>(emptyList()) }
    var panicTasks by remember { mutableStateOf<List<Chore>>(emptyList()) }
    var leaderboard by remember { mutableStateOf<List<LeaderboardMember>>(emptyList()) }
    var thirstyPlants by remember { mutableStateOf(0) }
    var petTasks by remember { mutableStateOf(0) }
    var pets by remember { mutableStateOf<List<Pet>>(emptyList()) }
    var medicineStats by remember { mutableStateOf<MedicineStats?>(null) }
    var finance by remember { mutableStateOf<FinanceSummary?>(null) }
    var fleet by remember { mutableStateOf<VehicleFleetStats?>(null) }
    var expiringDocs by remember { mutableStateOf(0) }
    var activities by remember { mutableStateOf<List<ActivityLog>>(emptyList()) }
    var aiStatus by remember { mutableStateOf<AiStatus?>(null) }

    suspend fun load() {
        loading = true
        coroutineScope {
            val jobs = listOf(
                async { repository.getShoppingItems().onSuccess { list -> pendingShopping = list.count { !it.is_checked } } },
                async {
                    repository.getChores().onSuccess { list ->
                        choresDue = list.count { it.days_until_due != null && it.days_until_due!! <= 0 && it.days_until_due!! > -1 }
                        choresOverdue = list.count { it.is_overdue }
                        myChores = list.filter { it.current_assignee_id == currentUser?.id && (it.is_overdue || (it.days_until_due ?: 99) <= 1) }
                            .sortedBy { it.days_until_due ?: 99 }
                    }
                },
                async { repository.getPanicModeTasks().onSuccess { panicTasks = it } },
                async { repository.getLeaderboard().onSuccess { leaderboard = it } },
                async { repository.getPlants(needsWatering = true).onSuccess { thirstyPlants = it.size } },
                async {
                    repository.getPets().onSuccess { list ->
                        pets = list.take(4)
                        petTasks = list.sumOf { p -> p.tasks.count { !it.is_completed } }
                    }
                },
                async { repository.getMedicineStats().onSuccess { medicineStats = it } },
                async { repository.getFinanceSummary().onSuccess { finance = it } },
                async { repository.getVehicleStats().onSuccess { fleet = it } },
                async { repository.getDocuments(status = "expiring_soon").onSuccess { expiringDocs = it.size } },
                async { repository.getActivities(limit = 6).onSuccess { activities = it.items } },
                async { repository.getAiStatus().onSuccess { aiStatus = it } }
            )
            val results = jobs.awaitAll()
            error = results.firstNotNullOfOrNull { it.exceptionOrNull()?.friendly() }
        }
        loading = false
    }

    LaunchedEffect(currentUser?.id) { if (currentUser != null) load() }

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

        if (error != null) {
            item { ErrorBox(error, onRetry = { scope.launch { load() } }) }
        }

        if (loading) {
            item { LoadingBox() }
        } else {
            item {
                SectionTitle("Rychlý přehled")
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    StatCard(
                        "Nákup", pendingShopping.toString(), Icons.Default.ShoppingCart, HestiaOrange,
                        Modifier.weight(1f), "položek") { onNavigate(Screen.Shopping) }
                    StatCard(
                        "Úkoly", choresDue.toString(), Icons.Default.CleaningServices, StatusBlue,
                        Modifier.weight(1f), if (choresOverdue > 0) "$choresOverdue po termínu" else "do termínu") { onNavigate(Screen.Chores) }
                    StatCard(
                        "Kytky", thirstyPlants.toString(), Icons.Default.LocalFlorist, StatusGreen,
                        Modifier.weight(1f), "k zálivce") { onNavigate(Screen.Plants) }
                }
                Spacer(Modifier.height(6.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    StatCard(
                        "Mazlíčci", petTasks.toString(), Icons.Default.Pets, StatusPurple,
                        Modifier.weight(1f), "úkolů") { onNavigate(Screen.Pets) }
                    StatCard(
                        "Léky", (medicineStats?.expiring_soon_count ?: 0).toString(), Icons.Default.Medication, StatusYellow,
                        Modifier.weight(1f), "brzy expiruje") { onNavigate(Screen.Medicines) }
                    StatCard(
                        "Vozidla", (fleet?.warning_deadlines_count ?: 0).toString(), Icons.Default.DirectionsCar, StatusRed,
                        Modifier.weight(1f), "lhůt") { onNavigate(Screen.Vehicles) }
                }
            }

            finance?.let { f ->
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
                        TextButton(onClick = { onNavigate(Screen.Finance) }) { Text("Otevřít finance", fontSize = 12.sp) }
                    }
                }
            }

            if (myChores.isNotEmpty()) {
                item {
                    Spacer(Modifier.height(10.dp))
                    SectionTitle("Moje úkoly")
                }
                items(myChores, key = { "chore-${it.id}" }) { chore ->
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

            if (panicTasks.isNotEmpty()) {
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
                            panicTasks.take(4).forEach {
                                Text("• ${it.title} (${Labels.label(Labels.rooms, it.room)})", fontSize = 12.sp)
                            }
                        }
                    }
                }
            }

            if (pets.isNotEmpty()) {
                item {
                    Spacer(Modifier.height(10.dp))
                    SectionTitle("Mazlíčci")
                }
                item {
                    Row(
                        Modifier.fillMaxWidth().padding(vertical = 2.dp),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        pets.forEach { p ->
                            Card(
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Column(Modifier.padding(8.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                    Icon(Icons.Default.Pets, null, tint = StatusPurple, modifier = Modifier.size(20.dp))
                                    Text(p.name, fontSize = 11.sp, fontWeight = FontWeight.Medium)
                                    Text(
                                        p.latest_weight_kg?.let { "${Fmt.number(it)} kg" } ?: (p.age_formatted ?: ""),
                                        fontSize = 9.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }
                }
            }

            if (leaderboard.isNotEmpty()) {
                item {
                    Spacer(Modifier.height(10.dp))
                    SectionCard(title = "Žebříček týdne", actionText = "Vše", onAction = { onNavigate(Screen.Chores) }) {
                        leaderboard.sortedByDescending { it.weekly_points }.take(4).forEachIndexed { i, m ->
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

            if (expiringDocs > 0) {
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
                            Text("$expiringDocs dokumentů brzy expiruje", fontSize = 12.sp, modifier = Modifier.weight(1f))
                            TextButton(onClick = { onNavigate(Screen.Documents) }) { Text("Zobrazit", fontSize = 11.sp) }
                        }
                    }
                }
            }

            item {
                Spacer(Modifier.height(10.dp))
                SectionTitle("Poslední aktivita")
            }
            if (activities.isEmpty()) {
                item {
                    Text(
                        "Zatím žádná aktivita.",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(vertical = 6.dp)
                    )
                }
            }
            items(activities, key = { "act-${it.id}" }) { log ->
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

            aiStatus?.let { ai ->
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
