package com.example.hestia.ui.screens.documents

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
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
import androidx.compose.ui.platform.LocalContext
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
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun DocumentsScreen(repository: HestiaRepository) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    var documents by remember { mutableStateOf<List<DocumentItem>>(emptyList()) }
    var stats by remember { mutableStateOf<DocumentStats?>(null) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var message by remember { mutableStateOf<String?>(null) }
    var search by remember { mutableStateOf("") }
    var category by remember { mutableStateOf<String?>(null) }
    var statusFilter by remember { mutableStateOf<String?>(null) }
    var showForm by remember { mutableStateOf(false) }
    var editing by remember { mutableStateOf<DocumentItem?>(null) }
    var deleteTarget by remember { mutableStateOf<DocumentItem?>(null) }
    var uploadPreview by remember { mutableStateOf<DocumentUploadResult?>(null) }
    var vaultTarget by remember { mutableStateOf<DocumentItem?>(null) }
    var showPinSetup by remember { mutableStateOf(false) }
    var pendingFile by remember { mutableStateOf<Pair<ByteArray, String>?>(null) }
    var vaultUnlocked by remember { mutableStateOf(false) }

    suspend fun load() {
        loading = true
        repository.getDocuments(
            category = category,
            query = search.ifBlank { null },
            status = statusFilter,
            vaultUnlocked = vaultUnlocked
        )
            .onSuccess { documents = it; error = null }
            .onFailure { error = it.friendly() }
        repository.getDocumentStats().onSuccess { stats = it }
        loading = false
    }

    LaunchedEffect(category, statusFilter, vaultUnlocked, search) {
        if (search.isNotBlank()) kotlinx.coroutines.delay(350)
        load()
    }

    suspend fun openFile(path: String) {
        val base = repository.serverUrl().trimEnd('/')
        val normalized = if (path.startsWith("/uploads/") || path.startsWith("http")) path
        else "/uploads/" + path.trimStart('/')
        val url = if (normalized.startsWith("http")) normalized else base + normalized
        runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) }
            .onFailure { error = "Nelze otevřít soubor – chybí aplikace pro tento typ" }
    }

    fun upload(bytes: ByteArray, name: String, mime: String, meta: DocumentUploadResult?) {
        scope.launch {
            repository.uploadDocument(bytes, name, mime, autoAnalyze = true)
                .onSuccess { result ->
                    if (meta == null && result.ai_metadata != null) {
                        uploadPreview = result
                    } else {
                        message = "Dokument nahrán"
                        load()
                    }
                }
                .onFailure { error = it.friendly() }
        }
    }

    val fileLauncher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        if (uri != null) {
            scope.launch {
                val bytes = withContext(Dispatchers.IO) {
                    runCatching { context.contentResolver.openInputStream(uri)?.use { it.readBytes() } }.getOrNull()
                }
                if (bytes == null) {
                    error = "Soubor nelze přečíst"
                } else {
                    val name = uri.lastPathSegment?.substringAfterLast('/') ?: "dokument.pdf"
                    val mime = context.contentResolver.getType(uri) ?: "application/octet-stream"
                    pendingFile = bytes to name
                    upload(bytes, name, mime, null)
                }
            }
        }
    }

    Column(Modifier.fillMaxSize()) {
        Column(Modifier.padding(horizontal = 12.dp, vertical = 6.dp)) {
            HestiaField(search, { search = it }, "Hledat dokument")
            Spacer(Modifier.height(6.dp))
            ChipSelector(Labels.documentCategories, category, { category = it.ifBlank { null } }, includeAll = true)
            Spacer(Modifier.height(4.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                FilterChip(
                    selected = statusFilter == "expiring_soon",
                    onClick = { statusFilter = if (statusFilter == "expiring_soon") null else "expiring_soon" },
                    label = { Text("Brzy expiruje", fontSize = 10.sp) }
                )
                FilterChip(
                    selected = statusFilter == "expired",
                    onClick = { statusFilter = if (statusFilter == "expired") null else "expired" },
                    label = { Text("Expirované", fontSize = 10.sp) }
                )
                Spacer(Modifier.weight(1f))
                IconButton(onClick = { showPinSetup = true }) {
                    Icon(Icons.Default.Lock, "Trezor PIN", modifier = Modifier.size(18.dp))
                }
            }
        }

        stats?.let { s ->
            Row(Modifier.fillMaxWidth().padding(horizontal = 12.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                StatCard("Celkem", s.total_documents.toString(), Icons.Default.Description, StatusBlue, Modifier.weight(1f))
                StatCard("Brzy", s.expiring_soon_count.toString(), Icons.Default.Schedule, StatusYellow, Modifier.weight(1f))
                StatCard("Expirované", s.expired_count.toString(), Icons.Default.Error, StatusRed, Modifier.weight(1f))
                StatCard("Trezor", s.vault_count.toString(), Icons.Default.Lock, HestiaOrange, Modifier.weight(1f))
            }
        }

        message?.let {
            Card(
                colors = CardDefaults.cardColors(containerColor = StatusGreen.copy(alpha = 0.15f)),
                modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 3.dp)
            ) {
                Row(Modifier.padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(it, fontSize = 11.sp, modifier = Modifier.weight(1f))
                    IconButton(onClick = { message = null }, modifier = Modifier.size(20.dp)) {
                        Icon(Icons.Default.Close, null, modifier = Modifier.size(14.dp))
                    }
                }
            }
        }
        ErrorBox(error, onRetry = { scope.launch { load() } })

        if (loading) LoadingBox() else LazyColumn(
            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
            modifier = Modifier.fillMaxSize()
        ) {
            if (documents.isEmpty()) {
                item { EmptyState(Icons.Default.FolderOpen, "Žádné dokumenty", "Nahrajte fakturu, smlouvu nebo záruční list.") }
            }
            items(documents, key = { it.id }) { doc ->
                DocumentCard(
                    doc = doc,
                    onOpen = {
                        if (doc.is_vault_protected) {
                            vaultTarget = doc
                        } else {
                            scope.launch { openFile(doc.file_path) }
                        }
                    },
                    onEdit = { editing = doc },
                    onDelete = { deleteTarget = doc }
                )
            }
            item { Spacer(Modifier.height(90.dp)) }
        }
    }

    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.BottomEnd) {
        Column(Modifier.padding(16.dp), horizontalAlignment = Alignment.End) {
            SmallFloatingActionButton(
                onClick = { showForm = true },
                containerColor = MaterialTheme.colorScheme.surfaceVariant,
                contentColor = MaterialTheme.colorScheme.onSurfaceVariant
            ) { Icon(Icons.Default.Edit, "Ručně") }
            Spacer(Modifier.height(10.dp))
            ExtendedFloatingActionButton(
                onClick = { fileLauncher.launch("*/*") },
                containerColor = HestiaOrange,
                contentColor = Color.White,
                icon = { Icon(Icons.Default.CloudUpload, null) },
                text = { Text("Nahrát") }
            )
        }
    }

    uploadPreview?.let { result ->
        val meta = result.ai_metadata
        var title by remember { mutableStateOf(meta?.title ?: result.file_name) }
        var cat by remember { mutableStateOf(meta?.category ?: "other") }
        var issuer by remember { mutableStateOf(meta?.issuer ?: "") }
        var docDate by remember { mutableStateOf(meta?.document_date) }
        var expiry by remember { mutableStateOf(meta?.expiry_date) }
        var amount by remember { mutableStateOf(meta?.amount?.let { Fmt.number(it) } ?: "") }
        var vault by remember { mutableStateOf(false) }
        DialogScaffold(
            title = "AI rozpoznala dokument",
            onDismiss = { uploadPreview = null },
            confirmEnabled = title.isNotBlank(),
            onConfirm = {
                scope.launch {
                    repository.createDocument(
                        DocumentCreate(
                            title = title, category = cat,
                            file_path = result.file_path, file_name = result.file_name,
                            file_size = result.file_size, file_type = result.file_type,
                            issuer = issuer.ifBlank { null }, document_date = docDate,
                            expiry_date = expiry, amount = amount.toDoubleOrNull(),
                            is_vault_protected = vault, tags = meta?.tags,
                            summary = meta?.summary
                        )
                    ).onSuccess { uploadPreview = null; message = "Dokument uložen"; load() }
                        .onFailure { error = it.friendly() }
                }
            }
        ) {
            HestiaField(title, { title = it }, "Název")
            Spacer(Modifier.height(8.dp))
            HestiaDropdown("Kategorie", Labels.documentCategories, cat, { cat = it })
            Spacer(Modifier.height(8.dp))
            HestiaField(issuer, { issuer = it }, "Vystavitel")
            Spacer(Modifier.height(8.dp))
            DateField("Datum dokumentu", docDate, { docDate = it })
            Spacer(Modifier.height(8.dp))
            DateField("Platnost do", expiry, { expiry = it })
            Spacer(Modifier.height(8.dp))
            HestiaNumberField(amount, { amount = it }, "Částka", decimal = true)
            Spacer(Modifier.height(8.dp))
            ToggleRow("Uzamknout do trezoru", vault, { vault = it })
            meta?.summary?.let {
                Spacer(Modifier.height(8.dp))
                Text(it, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }

    if (showForm || editing != null) {
        DocumentFormDialog(
            initial = editing,
            onDismiss = { showForm = false; editing = null },
            onSave = { create ->
                scope.launch {
                    val current = editing
                    val res = if (current == null) repository.createDocument(create)
                    else repository.updateDocument(
                        current.id,
                        DocumentUpdate(
                            title = create.title, category = create.category, issuer = create.issuer,
                            document_date = create.document_date, expiry_date = create.expiry_date,
                            warranty_months = create.warranty_months, contract_number = create.contract_number,
                            amount = create.amount, physical_location = create.physical_location,
                            is_vault_protected = create.is_vault_protected, tags = create.tags,
                            summary = create.summary
                        )
                    )
                    res.onSuccess { showForm = false; editing = null; load() }
                        .onFailure { error = it.friendly() }
                }
            }
        )
    }

    vaultTarget?.let { doc ->
        var pin by remember { mutableStateOf("") }
        DialogScaffold(
            title = "Trezor",
            onDismiss = { vaultTarget = null },
            confirmText = "Odemknout",
            confirmEnabled = pin.length >= 4,
            onConfirm = {
                scope.launch {
                    repository.verifyVaultPin(pin).onSuccess { r ->
                        if (r.success) {
                            vaultUnlocked = true
                            openFile(doc.file_path)
                            vaultTarget = null
                        } else {
                            error = r.message.ifBlank { "Nesprávný PIN" }
                        }
                    }.onFailure { error = it.friendly() }
                }
            }
        ) {
            HestiaField(pin, { pin = it }, "PIN", keyboardType = androidx.compose.ui.text.input.KeyboardType.NumberPassword)
        }
    }

    if (showPinSetup) {
        var oldPin by remember { mutableStateOf("") }
        var newPin by remember { mutableStateOf("") }
        DialogScaffold(
            title = "Nastavit PIN trezoru",
            onDismiss = { showPinSetup = false },
            confirmEnabled = newPin.length >= 4,
            onConfirm = {
                scope.launch {
                    repository.setVaultPin(oldPin.ifBlank { null }, newPin)
                        .onSuccess { showPinSetup = false; message = "PIN nastaven" }
                        .onFailure { error = it.friendly() }
                }
            }
        ) {
            HestiaField(oldPin, { oldPin = it }, "Starý PIN (pokud existuje)", keyboardType = androidx.compose.ui.text.input.KeyboardType.NumberPassword)
            Spacer(Modifier.height(8.dp))
            HestiaField(newPin, { newPin = it }, "Nový PIN", keyboardType = androidx.compose.ui.text.input.KeyboardType.NumberPassword)
        }
    }

    deleteTarget?.let { doc ->
        ConfirmDialog(
            title = "Smazat dokument",
            message = "Smazat „${doc.title}“?",
            onConfirm = { scope.launch { repository.deleteDocument(doc.id).onSuccess { load() } } },
            onDismiss = { deleteTarget = null }
        )
    }
}

@Composable
private fun DocumentCard(doc: DocumentItem, onOpen: () -> Unit, onEdit: () -> Unit, onDelete: () -> Unit) {
    Card(shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
        Column(Modifier.padding(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    when {
                        doc.file_type.contains("pdf") -> Icons.Default.PictureAsPdf
                        doc.file_type.contains("image") -> Icons.Default.Image
                        else -> Icons.Default.Description
                    },
                    null,
                    tint = HestiaOrange,
                    modifier = Modifier.size(22.dp)
                )
                Spacer(Modifier.width(8.dp))
                Column(Modifier.weight(1f)) {
                    Text(doc.title, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    Text(
                        Labels.label(Labels.documentCategories, doc.category) +
                            (doc.issuer?.let { " • $it" } ?: ""),
                        fontSize = 10.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                if (doc.is_vault_protected) {
                    Icon(Icons.Default.Lock, "Trezor", tint = HestiaOrange, modifier = Modifier.size(16.dp))
                }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.padding(top = 4.dp)) {
                doc.document_date?.let { StatusPill(Fmt.date(it), StatusBlue) }
                doc.expiry_date?.let {
                    val d = doc.days_until_expiry ?: Fmt.daysUntil(it) ?: 0
                    StatusPill(
                        if (d < 0) "Expirováno" else "za $d dní",
                        if (d < 0) StatusRed else if (d < 30) StatusYellow else StatusGreen
                    )
                }
                doc.amount?.let { StatusPill(Fmt.money(it), StatusGreen) }
            }
            doc.summary?.takeIf { it.isNotBlank() }?.let {
                Text(it, fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 2)
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                TextButton(onClick = onOpen) { Text("Otevřít", fontSize = 11.sp) }
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
private fun DocumentFormDialog(
    initial: DocumentItem?,
    onDismiss: () -> Unit,
    onSave: (DocumentCreate) -> Unit
) {
    var title by remember { mutableStateOf(initial?.title ?: "") }
    var category by remember { mutableStateOf(initial?.category ?: "warranty") }
    var issuer by remember { mutableStateOf(initial?.issuer ?: "") }
    var docDate by remember { mutableStateOf(initial?.document_date) }
    var expiry by remember { mutableStateOf(initial?.expiry_date) }
    var warranty by remember { mutableStateOf(initial?.warranty_months?.toString() ?: "") }
    var contract by remember { mutableStateOf(initial?.contract_number ?: "") }
    var amount by remember { mutableStateOf(initial?.amount?.let { Fmt.number(it) } ?: "") }
    var location by remember { mutableStateOf(initial?.physical_location ?: "") }
    var vault by remember { mutableStateOf(initial?.is_vault_protected ?: false) }
    var tags by remember { mutableStateOf(initial?.tags ?: "") }
    var summary by remember { mutableStateOf(initial?.summary ?: "") }

    DialogScaffold(
        title = if (initial == null) "Nový dokument" else "Upravit dokument",
        onDismiss = onDismiss,
        confirmEnabled = title.isNotBlank(),
        onConfirm = {
            onSave(
                DocumentCreate(
                    title = title.trim(), category = category, issuer = issuer.ifBlank { null },
                    document_date = docDate, expiry_date = expiry,
                    warranty_months = warranty.toIntOrNull(), contract_number = contract.ifBlank { null },
                    amount = amount.toDoubleOrNull(), physical_location = location.ifBlank { null },
                    is_vault_protected = vault, tags = tags.ifBlank { null },
                    summary = summary.ifBlank { null }
                )
            )
        }
    ) {
        HestiaField(title, { title = it }, "Název")
        Spacer(Modifier.height(8.dp))
        HestiaDropdown("Kategorie", Labels.documentCategories, category, { category = it })
        Spacer(Modifier.height(8.dp))
        HestiaField(issuer, { issuer = it }, "Vystavitel")
        Spacer(Modifier.height(8.dp))
        DateField("Datum dokumentu", docDate, { docDate = it })
        Spacer(Modifier.height(8.dp))
        DateField("Platnost do", expiry, { expiry = it })
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            HestiaNumberField(warranty, { warranty = it }, "Záruka (měs.)", Modifier.weight(1f))
            HestiaNumberField(amount, { amount = it }, "Částka", Modifier.weight(1f), decimal = true)
        }
        Spacer(Modifier.height(8.dp))
        HestiaField(contract, { contract = it }, "Číslo smlouvy")
        Spacer(Modifier.height(8.dp))
        HestiaField(location, { location = it }, "Fyzické umístění")
        Spacer(Modifier.height(8.dp))
        HestiaField(tags, { tags = it }, "Štítky")
        Spacer(Modifier.height(8.dp))
        HestiaField(summary, { summary = it }, "Poznámka", singleLine = false, minLines = 2)
        Spacer(Modifier.height(8.dp))
        ToggleRow("Trezor (PIN)", vault, { vault = it })
    }
}
