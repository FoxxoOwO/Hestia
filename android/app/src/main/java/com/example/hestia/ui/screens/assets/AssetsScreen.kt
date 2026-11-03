package com.example.hestia.ui.screens.assets

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
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
fun AssetsScreen(repository: HestiaRepository) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var assets by remember { mutableStateOf<List<Asset>>(emptyList()) }
    var stats by remember { mutableStateOf<AssetStats?>(null) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var search by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("") }
    var warrantyOnly by remember { mutableStateOf(false) }
    var dialog by remember { mutableStateOf<String?>(null) }
    var editing by remember { mutableStateOf<Asset?>(null) }
    var detail by remember { mutableStateOf<Asset?>(null) }
    var deleteTarget by remember { mutableStateOf<Asset?>(null) }
    var uploadTarget by remember { mutableStateOf<Asset?>(null) }
    var uploadType by remember { mutableStateOf("invoice") }

    suspend fun load() {
        loading = true
        repository.getAssets(
            category = category.ifBlank { null },
            query = search.ifBlank { null },
            warrantyStatus = if (warrantyOnly) "expiring_soon" else null
        ).onSuccess { assets = it; error = null }.onFailure { error = it.friendly() }
        repository.getAssetStats().onSuccess { stats = it }
        loading = false
    }

    LaunchedEffect(search, category, warrantyOnly) { kotlinx.coroutines.delay(300); load() }

    val picker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        val asset = uploadTarget
        if (uri != null && asset != null) {
            scope.launch {
                val bytes = withContext(Dispatchers.IO) {
                    context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
                } ?: return@launch
                val name = uri.lastPathSegment?.substringAfterLast('/') ?: "file.pdf"
                val mime = context.contentResolver.getType(uri) ?: "application/pdf"
                repository.uploadAssetFile(asset.id, bytes, name, mime, uploadType)
                    .onSuccess { load() }
                    .onFailure { error = it.friendly() }
            }
        }
        uploadTarget = null
    }

    Column(Modifier.fillMaxSize()) {
        Column(Modifier.padding(horizontal = 12.dp, vertical = 6.dp)) {
            HestiaField(search, { search = it }, "Hledat spotřebič")
            Spacer(Modifier.height(6.dp))
            ChipSelector(Labels.assetCategories, category, { category = it }, includeAll = true)
            ToggleRow("Jen se zárukou končící", warrantyOnly, { warrantyOnly = it })
        }
        stats?.let { s ->
            Row(Modifier.fillMaxWidth().padding(horizontal = 12.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                StatCard("Položek", s.total_assets.toString(), Icons.Default.DevicesOther, HestiaOrange, Modifier.weight(1f))
                StatCard("Hodnota", Fmt.money(s.total_value), Icons.Default.Payments, StatusBlue, Modifier.weight(1f))
            }
            Spacer(Modifier.height(4.dp))
            Row(Modifier.fillMaxWidth().padding(horizontal = 12.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                StatCard("V záruce", s.active_warranties.toString(), Icons.Default.Verified, StatusGreen, Modifier.weight(1f))
                StatCard("Končí", s.expiring_soon_warranties.toString(), Icons.Default.Warning, StatusYellow, Modifier.weight(1f))
                StatCard("Po záruce", s.expired_warranties.toString(), Icons.Default.GppBad, StatusRed, Modifier.weight(1f))
            }
        }
        ErrorBox(error, onRetry = { scope.launch { load() } })
        if (loading) {
            LoadingBox()
        } else {
            Box(Modifier.fillMaxSize()) {
                LazyColumn(contentPadding = PaddingValues(12.dp)) {
                    if (assets.isEmpty()) {
                        item { EmptyState(Icons.Default.DevicesOther, "Žádné spotřebiče", "Zapište si záruky, servis a manuály na jednom místě.") }
                    }
                    items(assets, key = { it.id }) { a ->
                        AssetCard(
                            asset = a,
                            onOpen = { detail = a },
                            onEdit = { editing = a },
                            onDelete = { deleteTarget = a },
                            onUpload = { type -> uploadTarget = a; uploadType = type; picker.launch("*/*") },
                            onOpenFile = { path ->
                                scope.launch {
                                    val base = repository.serverUrl().trimEnd('/')
                                    runCatching {
                                        context.startActivity(
                                            android.content.Intent(
                                                android.content.Intent.ACTION_VIEW,
                                                Uri.parse(base + path)
                                            )
                                        )
                                    }.onFailure { error = "Nelze otevřít soubor" }
                                }
                            }
                        )
                    }
                    item { Spacer(Modifier.height(80.dp)) }
                }
                ExtendedFloatingActionButton(
                    onClick = { dialog = "create" },
                    containerColor = HestiaOrange,
                    contentColor = Color.White,
                    modifier = Modifier.align(Alignment.BottomEnd).padding(20.dp),
                    icon = { Icon(Icons.Default.Add, null) },
                    text = { Text("Přidat") }
                )
            }
        }
    }

    detail?.let { a ->
        DialogScaffold(title = a.name, onDismiss = { detail = null }, confirmText = "Zavřít", onConfirm = { detail = null }) {
            InfoRow("Kategorie", Labels.label(Labels.assetCategories, a.category))
            InfoRow("Místnost", Labels.label(Labels.rooms, a.room))
            InfoRow("Značka", a.brand)
            InfoRow("Model", a.model_number)
            InfoRow("Sériové číslo", a.serial_number)
            InfoRow("Datum koupě", a.purchase_date?.let { Fmt.date(it) })
            InfoRow("Cena", a.purchase_price?.let { Fmt.money(it) })
            InfoRow("Obchod", a.store_or_vendor)
            InfoRow("Záruka do", a.warranty_expiry_date?.let { Fmt.date(it) })
            InfoRow("Záruka", a.warranty_months.let { "$it měsíců" })
            InfoRow("Servis", a.contact_service)
            InfoRow("Stav", Labels.label(Labels.assetStatuses, a.status))
            InfoRow("Poznámky", a.notes)
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (!a.invoice_url.isNullOrBlank()) {
                    OutlinedButton(onClick = {
                        scope.launch {
                            val base = repository.serverUrl().trimEnd('/')
                            runCatching {
                                context.startActivity(
                                    android.content.Intent(android.content.Intent.ACTION_VIEW, Uri.parse(base + a.invoice_url))
                                )
                            }
                        }
                    }, modifier = Modifier.weight(1f)) { Text("Faktura", fontSize = 11.sp) }
                }
                if (!a.manual_url.isNullOrBlank()) {
                    OutlinedButton(onClick = {
                        scope.launch {
                            val base = repository.serverUrl().trimEnd('/')
                            runCatching {
                                context.startActivity(
                                    android.content.Intent(android.content.Intent.ACTION_VIEW, Uri.parse(base + a.manual_url))
                                )
                            }
                        }
                    }, modifier = Modifier.weight(1f)) { Text("Manuál", fontSize = 11.sp) }
                }
            }
        }
    }

    if (dialog == "create" || editing != null) {
        AssetFormDialog(
            initial = editing,
            onDismiss = { dialog = null; editing = null },
            onSave = { create, update ->
                scope.launch {
                    val res = editing?.let { repository.updateAsset(it.id, update) } ?: repository.createAsset(create)
                    res.onSuccess { dialog = null; editing = null; load() }.onFailure { error = it.friendly() }
                }
            }
        )
    }

    deleteTarget?.let { a ->
        ConfirmDialog(
            title = "Smazat položku",
            message = "Smazat „${a.name}“?",
            onConfirm = { scope.launch { repository.deleteAsset(a.id).onSuccess { load() } } },
            onDismiss = { deleteTarget = null }
        )
    }
}

@Composable
private fun AssetCard(
    asset: Asset,
    onOpen: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
    onUpload: (String) -> Unit,
    onOpenFile: (String) -> Unit
) {
    val warrantyColor = when (asset.warranty_status) {
        "active" -> StatusGreen
        "expiring_soon" -> StatusYellow
        "expired" -> StatusRed
        else -> MaterialTheme.colorScheme.onSurfaceVariant
    }
    Card(shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp)) {
        Column(Modifier.padding(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.DevicesOther, null, tint = HestiaOrange, modifier = Modifier.size(20.dp))
                Spacer(Modifier.width(8.dp))
                Column(Modifier.weight(1f)) {
                    Text(asset.name, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    Text(
                        listOfNotNull(
                            asset.brand,
                            Labels.label(Labels.assetCategories, asset.category),
                            Labels.label(Labels.rooms, asset.room)
                        ).joinToString(" • "),
                        fontSize = 10.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                StatusPill(Labels.label(Labels.assetStatuses, asset.status), statusColor(asset.status))
            }
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.padding(top = 4.dp)) {
                if (asset.warranty_expiry_date != null) {
                    StatusPill(
                        asset.days_until_warranty_expiry?.let {
                            if (it < 0) "po záruce" else "záruka $it dní"
                        } ?: "záruka",
                        warrantyColor
                    )
                }
                asset.purchase_price?.let { StatusPill(Fmt.money(it), StatusBlue) }
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                TextButton(onClick = onOpen) { Text("Detail", fontSize = 11.sp) }
                if (!asset.invoice_url.isNullOrBlank()) {
                    TextButton(onClick = { onOpenFile(asset.invoice_url!!) }) { Text("Faktura", fontSize = 11.sp) }
                } else {
                    TextButton(onClick = { onUpload("invoice") }) { Text("+ Faktura", fontSize = 11.sp) }
                }
                if (!asset.manual_url.isNullOrBlank()) {
                    TextButton(onClick = { onOpenFile(asset.manual_url!!) }) { Text("Manuál", fontSize = 11.sp) }
                } else {
                    TextButton(onClick = { onUpload("manual") }) { Text("+ Manuál", fontSize = 11.sp) }
                }
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
private fun AssetFormDialog(
    initial: Asset?,
    onDismiss: () -> Unit,
    onSave: (AssetCreate, AssetUpdate) -> Unit
) {
    var name by remember { mutableStateOf(initial?.name ?: "") }
    var category by remember { mutableStateOf(initial?.category ?: "large_appliance") }
    var room by remember { mutableStateOf(initial?.room ?: "kitchen") }
    var brand by remember { mutableStateOf(initial?.brand ?: "") }
    var model by remember { mutableStateOf(initial?.model_number ?: "") }
    var serial by remember { mutableStateOf(initial?.serial_number ?: "") }
    var purchaseDate by remember { mutableStateOf(initial?.purchase_date) }
    var warranty by remember { mutableStateOf(initial?.warranty_months?.toString() ?: "24") }
    var price by remember { mutableStateOf(initial?.purchase_price?.let { Fmt.number(it) } ?: "") }
    var vendor by remember { mutableStateOf(initial?.store_or_vendor ?: "") }
    var status by remember { mutableStateOf(initial?.status ?: "active") }
    var service by remember { mutableStateOf(initial?.contact_service ?: "") }
    var notes by remember { mutableStateOf(initial?.notes ?: "") }

    DialogScaffold(
        title = if (initial == null) "Nový spotřebič" else "Upravit položku",
        onDismiss = onDismiss,
        confirmEnabled = name.isNotBlank(),
        onConfirm = {
            val create = AssetCreate(
                name = name.trim(), category = category, room = room,
                brand = brand.ifBlank { null }, model_number = model.ifBlank { null },
                serial_number = serial.ifBlank { null }, purchase_date = purchaseDate,
                warranty_months = warranty.toIntOrNull() ?: 24,
                purchase_price = price.toDoubleOrNull(),
                store_or_vendor = vendor.ifBlank { null }, status = status,
                notes = notes.ifBlank { null }, contact_service = service.ifBlank { null }
            )
            onSave(
                create,
                AssetUpdate(
                    name = create.name, category = category, room = room, brand = create.brand,
                    model_number = create.model_number, serial_number = create.serial_number,
                    purchase_date = purchaseDate, warranty_months = create.warranty_months,
                    purchase_price = create.purchase_price, store_or_vendor = create.store_or_vendor,
                    status = status, notes = create.notes, contact_service = create.contact_service
                )
            )
        }
    ) {
        HestiaField(name, { name = it }, "Název")
        Spacer(Modifier.height(8.dp))
        HestiaDropdown("Kategorie", Labels.assetCategories, category, { category = it })
        Spacer(Modifier.height(8.dp))
        HestiaDropdown("Místnost", Labels.rooms, room, { room = it })
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            HestiaField(brand, { brand = it }, "Značka", Modifier.weight(1f))
            HestiaField(model, { model = it }, "Model", Modifier.weight(1f))
        }
        Spacer(Modifier.height(8.dp))
        HestiaField(serial, { serial = it }, "Sériové číslo")
        Spacer(Modifier.height(8.dp))
        DateField("Datum koupě", purchaseDate, { purchaseDate = it })
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            HestiaNumberField(warranty, { warranty = it }, "Záruka (měsíce)", Modifier.weight(1f))
            HestiaNumberField(price, { price = it }, "Cena (Kč)", Modifier.weight(1f), decimal = true)
        }
        Spacer(Modifier.height(8.dp))
        HestiaField(vendor, { vendor = it }, "Obchod")
        Spacer(Modifier.height(8.dp))
        HestiaDropdown("Stav", Labels.assetStatuses, status, { status = it })
        Spacer(Modifier.height(8.dp))
        HestiaField(service, { service = it }, "Kontakt na servis")
        Spacer(Modifier.height(8.dp))
        HestiaField(notes, { notes = it }, "Poznámky", singleLine = false, minLines = 2)
    }
}
