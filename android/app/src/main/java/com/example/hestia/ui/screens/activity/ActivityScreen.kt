package com.example.hestia.ui.screens.activity

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
fun ActivityScreen(repository: HestiaRepository) {
    val scope = rememberCoroutineScope()
    var items by remember { mutableStateOf<List<ActivityLog>>(emptyList()) }
    var stats by remember { mutableStateOf<ActivityStats?>(null) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var module by remember { mutableStateOf("") }
    var search by remember { mutableStateOf("") }
    var total by remember { mutableStateOf(0) }
    var showClear by remember { mutableStateOf(false) }
    var clearDays by remember { mutableStateOf("30") }

    suspend fun load(limit: Int = 100) {
        loading = true
        repository.getActivities(limit = limit, module = module.ifBlank { null }, search = search.ifBlank { null })
            .onSuccess { items = it.items; total = it.total; error = null }
            .onFailure { error = it.friendly() }
        repository.getActivityStats().onSuccess { stats = it }
        loading = false
    }

    LaunchedEffect(module, search) {
        if (search.isNotBlank()) kotlinx.coroutines.delay(300)
        load()
    }

    Column(Modifier.fillMaxSize()) {
        Column(Modifier.padding(horizontal = 12.dp, vertical = 6.dp)) {
            HestiaField(search, { search = it }, "Hledat v historii")
            Spacer(Modifier.height(6.dp))
            ChipSelector(Labels.activityModules, module, { module = it }, includeAll = true)
        }
        stats?.let { s ->
            Row(Modifier.fillMaxWidth().padding(horizontal = 12.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                StatCard("Celkem", s.total_activities.toString(), Icons.Default.History, HestiaOrange, Modifier.weight(1f))
                StatCard("Dnes", s.activities_today.toString(), Icons.Default.Today, StatusBlue, Modifier.weight(1f))
                s.most_active_member?.let {
                    StatCard("Nejaktivnější", it, Icons.Default.EmojiEvents, StatusYellow, Modifier.weight(1f))
                }
            }
            Spacer(Modifier.height(4.dp))
            Row(
                Modifier.fillMaxWidth().padding(horizontal = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("$total záznamů", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(Modifier.weight(1f))
                TextButton(onClick = { showClear = true }) { Text("Vyčistit historii", fontSize = 11.sp, color = StatusRed) }
            }
        }
        ErrorBox(error, onRetry = { scope.launch { load() } })
        if (loading) {
            LoadingBox()
        } else {
            LazyColumn(contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)) {
                if (items.isEmpty()) {
                    item { EmptyState(Icons.Default.History, "Žádná aktivita", "Jakmile začnete používat Hestii, objeví se tu historie.") }
                }
                items(items, key = { it.id }) { log -> ActivityRow(log) }
                if (items.size < total) {
                    item {
                        TextButton(onClick = { scope.launch { load(items.size + 100) } }, modifier = Modifier.fillMaxWidth()) {
                            Text("Načíst další")
                        }
                    }
                }
                item { Spacer(Modifier.height(20.dp)) }
            }
        }
    }

    if (showClear) {
        DialogScaffold(
            title = "Vyčistit historii",
            onDismiss = { showClear = false },
            confirmText = "Vyčistit",
            onConfirm = {
                scope.launch {
                    repository.clearActivities(clearDays.toIntOrNull()).onSuccess { showClear = false; load() }
                }
            }
        ) {
            Text("Smazat záznamy starší než:", fontSize = 13.sp)
            Spacer(Modifier.height(8.dp))
            HestiaNumberField(clearDays, { clearDays = it }, "Dní (prázdné = vše)")
        }
    }
}

@Composable
private fun ActivityRow(log: ActivityLog) {
    val color = runCatching { Color(android.graphics.Color.parseColor(log.user_avatar_color ?: "#F97316")) }
        .getOrDefault(HestiaOrange)
    Row(Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
        Box(
            Modifier.size(30.dp).background(color.copy(alpha = 0.18f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Text(
                log.user_name.take(1).uppercase(),
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = color
            )
        }
        Spacer(Modifier.width(10.dp))
        Column(Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(log.title, fontSize = 13.sp, fontWeight = FontWeight.Medium, modifier = Modifier.weight(1f))
                StatusPill(Labels.moduleLabel(log.module), StatusBlue)
            }
            Text(
                listOfNotNull(log.user_name, log.description).joinToString(" • "),
                fontSize = 11.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(Fmt.relative(log.created_at), fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
