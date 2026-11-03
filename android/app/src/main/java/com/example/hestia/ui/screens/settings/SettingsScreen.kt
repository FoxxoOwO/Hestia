package com.example.hestia.ui.screens.settings

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
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
import com.example.hestia.data.local.PreferencesManager
import com.example.hestia.data.models.*
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.theme.HestiaOrange
import com.example.hestia.theme.StatusBlue
import com.example.hestia.theme.StatusGreen
import com.example.hestia.theme.StatusRed
import com.example.hestia.theme.StatusYellow
import com.example.hestia.ui.components.*
import com.example.hestia.util.Fmt
import com.example.hestia.util.friendly
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File

@Composable
fun SettingsScreen(
    repository: HestiaRepository,
    onLogout: () -> Unit,
    onNavigateServerConfig: () -> Unit,
    onSwitchUser: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var serverUrl by remember { mutableStateOf("") }
    var health by remember { mutableStateOf<HealthResponse?>(null) }
    var aiStatus by remember { mutableStateOf<AiStatus?>(null) }
    var me by remember { mutableStateOf<User?>(null) }
    var backups by remember { mutableStateOf<List<BackupItem>>(emptyList()) }
    var message by remember { mutableStateOf<String?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }
    var dialog by remember { mutableStateOf<String?>(null) }
    var pendingBackup by remember { mutableStateOf<BackupItem?>(null) }
    var pendingExport by remember { mutableStateOf<File?>(null) }
    var importMode by remember { mutableStateOf("merge") }
    var users by remember { mutableStateOf<List<User>>(emptyList()) }
    var theme by remember { mutableStateOf(PreferencesManager.THEME_SYSTEM) }
    var editingMember by remember { mutableStateOf<User?>(null) }
    var deleteMember by remember { mutableStateOf<User?>(null) }

    suspend fun reload() {
        serverUrl = repository.serverUrl()
        repository.checkHealth().onSuccess { health = it }
        repository.getAiStatus().onSuccess { aiStatus = it }
        repository.getMe().onSuccess { me = it }
        repository.getBackups().onSuccess { backups = it }
        repository.getUsers().onSuccess { users = it }
        theme = repository.preferences.themeFlow.first()
    }

    LaunchedEffect(Unit) { reload() }

    val exportPicker = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/json")) { uri: Uri? ->
        val file = pendingExport
        pendingExport = null
        if (uri != null && file != null) {
            scope.launch {
                val ok = withContext(Dispatchers.IO) {
                    runCatching {
                        context.contentResolver.openOutputStream(uri)?.use { out ->
                            file.inputStream().use { it.copyTo(out) }
                        }
                        file.delete()
                        true
                    }.getOrDefault(false)
                }
                message = if (ok) "Export uložen" else "Export se nepodařil"
            }
        }
    }

    val backupPicker = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/octet-stream")) { uri: Uri? ->
        val item = pendingBackup
        pendingBackup = null
        if (uri != null && item != null) {
            scope.launch {
                val tmp = File(context.cacheDir, item.filename)
                repository.downloadBackup(item.filename, tmp)
                    .onSuccess { f ->
                        val ok = withContext(Dispatchers.IO) {
                            runCatching {
                                context.contentResolver.openOutputStream(uri)?.use { out ->
                                    f.inputStream().use { it.copyTo(out) }
                                }
                                f.delete()
                                true
                            }.getOrDefault(false)
                        }
                        message = if (ok) "Záloha uložena" else "Uložení se nepodařilo"
                    }
                    .onFailure { error = it.friendly() }
            }
        }
    }

    val importPicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        if (uri != null) {
            scope.launch {
                busy = true
                val bytes = withContext(Dispatchers.IO) {
                    context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
                }
                val name = uri.lastPathSegment?.substringAfterLast('/') ?: "hestia-import.json"
                if (bytes != null) {
                    repository.importData(bytes, name, importMode)
                        .onSuccess { message = it.message; reload() }
                        .onFailure { error = it.friendly() }
                }
                busy = false
            }
        }
    }

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
    ) {
        item {
            ErrorBox(error, onRetry = { scope.launch { reload() } })
            if (message != null) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = StatusGreen.copy(alpha = 0.12f)),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)
                ) {
                    Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.CheckCircle, null, tint = StatusGreen, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(8.dp))
                        Text(message!!, fontSize = 12.sp, color = StatusGreen, modifier = Modifier.weight(1f))
                        TextButton(onClick = { message = null }) { Text("OK", fontSize = 11.sp) }
                    }
                }
            }

            SectionCard(title = "Účet") {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.AccountCircle, null, tint = HestiaOrange, modifier = Modifier.size(38.dp))
                    Spacer(Modifier.width(10.dp))
                    Column(Modifier.weight(1f)) {
                        Text(me?.display_name ?: "Nepřihlášen", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                        Text(
                            me?.let { "${it.username} • ${it.role}" } ?: "",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(onClick = onSwitchUser, modifier = Modifier.weight(1f)) { Text("Přepnout", fontSize = 12.sp) }
                    OutlinedButton(onClick = onLogout, modifier = Modifier.weight(1f)) {
                        Text("Odhlásit", fontSize = 12.sp, color = StatusRed)
                    }
                }
            }
            Spacer(Modifier.height(8.dp))

            SectionCard(title = "Vzhled") {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf(
                        PreferencesManager.THEME_SYSTEM to "Systém",
                        PreferencesManager.THEME_LIGHT to "Světlý",
                        PreferencesManager.THEME_DARK to "Tmavý"
                    ).forEach { (value, label) ->
                        FilterChip(
                            selected = theme == value,
                            onClick = {
                                theme = value
                                scope.launch { repository.preferences.setTheme(value) }
                            },
                            label = { Text(label, fontSize = 11.sp) }
                        )
                    }
                }
            }
            Spacer(Modifier.height(8.dp))

            SectionCard(
                title = "Členové domácnosti",
                actionText = "Přidat",
                onAction = { editingMember = null; dialog = "member" }
            ) {
                if (users.isEmpty()) {
                    Text("Zatím žádní členové.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                users.forEach { u ->
                    Row(
                        Modifier.fillMaxWidth().padding(vertical = 3.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .background(
                                    runCatching { Color(android.graphics.Color.parseColor(u.avatar_color ?: "#F97316")) }
                                        .getOrDefault(HestiaOrange),
                                    RoundedCornerShape(50)
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(u.initials, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                        Spacer(Modifier.width(8.dp))
                        Column(Modifier.weight(1f)) {
                            Text(u.display_name.ifBlank { u.username }, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                            Text(
                                "${u.username} • ${if (u.role == "admin") "správce" else "člen"}",
                                fontSize = 10.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        IconButton(onClick = { editingMember = u; dialog = "member" }, modifier = Modifier.size(28.dp)) {
                            Icon(Icons.Default.Edit, "Upravit", modifier = Modifier.size(15.dp))
                        }
                        IconButton(
                            onClick = { deleteMember = u },
                            enabled = u.id != me?.id,
                            modifier = Modifier.size(28.dp)
                        ) {
                            Icon(
                                Icons.Default.Delete,
                                "Smazat",
                                tint = if (u.id == me?.id) MaterialTheme.colorScheme.outline else StatusRed,
                                modifier = Modifier.size(15.dp)
                            )
                        }
                    }
                }
            }
            Spacer(Modifier.height(8.dp))

            SectionCard(title = "Server") {
                InfoRow("URL", serverUrl)
                InfoRow("Aplikace", health?.app)
                InfoRow("Verze", health?.version)
                InfoRow("Stav", health?.status)
                if (!health?.modules.isNullOrEmpty()) {
                    Text(
                        health!!.modules.joinToString(", "),
                        fontSize = 10.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Spacer(Modifier.height(6.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(onClick = onNavigateServerConfig, modifier = Modifier.weight(1f)) {
                        Text("Změnit server", fontSize = 12.sp)
                    }
                    OutlinedButton(onClick = { scope.launch { repository.checkHealth().onSuccess { health = it }.onFailure { error = it.friendly() } } }, modifier = Modifier.weight(1f)) {
                        Text("Otestovat", fontSize = 12.sp)
                    }
                }
            }
            Spacer(Modifier.height(8.dp))

            aiStatus?.let { ai ->
                SectionCard(title = "AI asistent") {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        StatusPill(
                            if (ai.configured) "Aktivní" else "Nenastaveno",
                            if (ai.configured) StatusGreen else StatusYellow
                        )
                        Spacer(Modifier.width(8.dp))
                        Text(ai.model, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    if (ai.message.isNotBlank()) {
                        Text(ai.message, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Text(
                        "AI se používá pro rozpoznávání dokumentů, receptů, diagnózu rostlin a mazlíčků.",
                        fontSize = 10.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Spacer(Modifier.height(8.dp))
            }

            SectionCard(
                title = "Zálohy na serveru",
                actionText = "Vytvořit",
                onAction = {
                    scope.launch {
                        busy = true
                        repository.createBackup()
                            .onSuccess { message = "Záloha vytvořena"; reload() }
                            .onFailure { error = it.friendly() }
                        busy = false
                    }
                }
            ) {
                if (backups.isEmpty()) {
                    Text("Zatím žádné zálohy.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                backups.take(6).forEach { b ->
                    Row(Modifier.fillMaxWidth().padding(vertical = 3.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Archive, null, tint = StatusBlue, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(8.dp))
                        Column(Modifier.weight(1f)) {
                            Text(b.filename, fontSize = 11.sp, fontWeight = FontWeight.Medium)
                            Text(
                                "${Fmt.dateTime(b.created_at)} • ${Fmt.fileSize((b.size_kb * 1024).toInt())} • ${b.items_count} položek",
                                fontSize = 9.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        IconButton(onClick = { pendingBackup = b; backupPicker.launch(b.filename) }, modifier = Modifier.size(28.dp)) {
                            Icon(Icons.Default.Download, "Stáhnout", modifier = Modifier.size(15.dp))
                        }
                        IconButton(onClick = {
                            scope.launch {
                                repository.restoreBackup(b.filename)
                                    .onSuccess { message = it.message.ifBlank { "Data obnovena" }; reload() }
                                    .onFailure { error = it.friendly() }
                            }
                        }, modifier = Modifier.size(28.dp)) {
                            Icon(Icons.Default.Restore, "Obnovit", modifier = Modifier.size(15.dp))
                        }
                        IconButton(onClick = {
                            scope.launch { repository.deleteBackup(b.filename).onSuccess { reload() } }
                        }, modifier = Modifier.size(28.dp)) {
                            Icon(Icons.Default.Delete, "Smazat", tint = StatusRed, modifier = Modifier.size(15.dp))
                        }
                    }
                }
            }
            Spacer(Modifier.height(8.dp))

            SectionCard(title = "Data") {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(
                        onClick = {
                            scope.launch {
                                busy = true
                                val tmp = File(context.cacheDir, "hestia-export.json")
                                repository.exportData(tmp)
                                    .onSuccess { pendingExport = it; exportPicker.launch("hestia-export-${Fmt.today()}.json") }
                                    .onFailure { error = it.friendly() }
                                busy = false
                            }
                        },
                        modifier = Modifier.weight(1f)
                    ) { Text("Export", fontSize = 12.sp) }
                    OutlinedButton(onClick = { importPicker.launch("application/json") }, modifier = Modifier.weight(1f)) {
                        Text("Import", fontSize = 12.sp)
                    }
                }
                Spacer(Modifier.height(6.dp))
                Text("Režim importu", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(selected = importMode == "merge", onClick = { importMode = "merge" }, label = { Text("Sloučit") })
                    FilterChip(selected = importMode == "replace", onClick = { importMode = "replace" }, label = { Text("Nahradit") })
                }
                Spacer(Modifier.height(10.dp))
                Button(
                    onClick = { dialog = "reset" },
                    colors = ButtonDefaults.buttonColors(containerColor = StatusRed),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.DeleteForever, null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("Smazat všechna data")
                }
            }
            Spacer(Modifier.height(8.dp))

            SectionCard(title = "O aplikaci") {
                InfoRow("Hestia pro Android", "nativní klient")
                InfoRow("Server", serverUrl)
                InfoRow("Verze serveru", health?.version)
                Text(
                    "Aplikace je plnohodnotný nativní klient Hestie – všechny moduly (recepty, jídelníček, spíž, nákup, úkoly, rostliny, mazlíčci, finance, dokumenty, vozidla, léky, spotřebiče, historie) běží přímo na telefonu.",
                    fontSize = 10.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Spacer(Modifier.height(24.dp))
        }
    }

    if (dialog == "reset") {
        var confirmText by remember { mutableStateOf("") }
        var password by remember { mutableStateOf("") }
        DialogScaffold(
            title = "Smazat všechna data",
            onDismiss = { dialog = null },
            confirmText = "Smazat vše",
            confirmEnabled = confirmText == "SMAZAT",
            loading = busy,
            onConfirm = {
                scope.launch {
                    busy = true
                    repository.resetAllData(password.ifBlank { null })
                        .onSuccess { dialog = null; message = "Data byla smazána"; reload() }
                        .onFailure { error = it.friendly() }
                    busy = false
                }
            }
        ) {
            Text(
                "Tato akce nevratně smaže všechna data domácnosti. Napište SMAZAT pro potvrzení.",
                fontSize = 12.sp,
                color = StatusRed
            )
            Spacer(Modifier.height(8.dp))
            HestiaField(confirmText, { confirmText = it }, "Potvrzení (SMAZAT)")
            Spacer(Modifier.height(8.dp))
            HestiaField(password, { password = it }, "Heslo (pokud je vyžadováno)")
        }
    }

    if (dialog == "member") {
        MemberFormDialog(
            initial = editingMember,
            loading = busy,
            onDismiss = { dialog = null; editingMember = null },
            onSave = { username, displayName, password, role, color ->
                scope.launch {
                    busy = true
                    val initial = editingMember
                    val res = if (initial == null) {
                        repository.createUser(
                            UserCreate(
                                username = username,
                                display_name = displayName,
                                password = password,
                                role = role,
                                avatar_color = color
                            )
                        )
                    } else {
                        repository.updateUser(
                            initial.id,
                            UserUpdate(
                                username = username.ifBlank { null },
                                display_name = displayName.ifBlank { null },
                                role = role,
                                avatar_color = color,
                                password = password.ifBlank { null }
                            )
                        )
                    }
                    res.onSuccess {
                        message = if (initial == null) "Člen přidán" else "Člen upraven"
                        dialog = null
                        editingMember = null
                        reload()
                    }.onFailure { error = it.friendly() }
                    busy = false
                }
            }
        )
    }

    deleteMember?.let { u ->
        ConfirmDialog(
            title = "Smazat člena",
            message = "Smazat „${u.display_name.ifBlank { u.username }}“? Jeho záznamy zůstanou zachovány.",
            onDismiss = { deleteMember = null },
            onConfirm = {
                scope.launch {
                    repository.deleteUser(u.id)
                        .onSuccess { message = "Člen smazán"; deleteMember = null; reload() }
                        .onFailure { error = it.friendly() }
                }
            }
        )
    }
}

@Composable
private fun MemberFormDialog(
    initial: User?,
    loading: Boolean,
    onDismiss: () -> Unit,
    onSave: (username: String, displayName: String, password: String, role: String, color: String) -> Unit
) {
    var username by remember { mutableStateOf(initial?.username ?: "") }
    var displayName by remember { mutableStateOf(initial?.display_name ?: "") }
    var password by remember { mutableStateOf("") }
    var role by remember { mutableStateOf(initial?.role ?: "member") }
    var color by remember { mutableStateOf(initial?.avatar_color ?: "#F97316") }

    DialogScaffold(
        title = if (initial == null) "Nový člen" else "Upravit člena",
        onDismiss = onDismiss,
        confirmEnabled = displayName.isNotBlank() &&
            (initial != null || (username.isNotBlank() && password.length >= 4)),
        loading = loading,
        onConfirm = { onSave(username, displayName, password, role, color) }
    ) {
        HestiaField(username, { username = it }, "Uživatelské jméno")
        Spacer(Modifier.height(8.dp))
        HestiaField(displayName, { displayName = it }, "Jméno a příjmení")
        Spacer(Modifier.height(8.dp))
        HestiaField(
            password,
            { password = it },
            if (initial == null) "Heslo" else "Nové heslo (nechte prázdné)"
        )
        Spacer(Modifier.height(8.dp))
        Text("Role", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilterChip(selected = role == "member", onClick = { role = "member" }, label = { Text("Člen", fontSize = 11.sp) })
            FilterChip(selected = role == "admin", onClick = { role = "admin" }, label = { Text("Správce", fontSize = 11.sp) })
        }
        Spacer(Modifier.height(8.dp))
        Text("Barva avatara", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("#F97316", "#EF4444", "#10B981", "#3B82F6", "#8B5CF6", "#F59E0B").forEach { c ->
                val selected = color == c
                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .background(
                            runCatching { Color(android.graphics.Color.parseColor(c)) }.getOrDefault(HestiaOrange),
                            RoundedCornerShape(50)
                        )
                        .clickable { color = c },
                    contentAlignment = Alignment.Center
                ) {
                    if (selected) {
                        Icon(Icons.Default.Check, null, tint = Color.White, modifier = Modifier.size(14.dp))
                    }
                }
            }
        }
    }
}
