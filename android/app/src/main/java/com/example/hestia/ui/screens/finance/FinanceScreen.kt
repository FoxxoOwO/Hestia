package com.example.hestia.ui.screens.finance

import android.net.Uri
import android.util.Base64
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
fun FinanceScreen(repository: HestiaRepository, currentUserId: Int?) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    var month by remember { mutableStateOf(Fmt.monthKey(Fmt.today())) }
    var tab by remember { mutableStateOf(0) }
    var summary by remember { mutableStateOf<FinanceSummary?>(null) }
    var transactions by remember { mutableStateOf<List<TransactionItem>>(emptyList()) }
    var budgets by remember { mutableStateOf<List<CategoryBudget>>(emptyList()) }
    var settlement by remember { mutableStateOf<DebtSettlementResponse?>(null) }
    var subscriptions by remember { mutableStateOf<List<Subscription>>(emptyList()) }
    var goals by remember { mutableStateOf<List<SavingsGoal>>(emptyList()) }
    var profile by remember { mutableStateOf<UserFinanceProfile?>(null) }
    var users by remember { mutableStateOf<List<User>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var message by remember { mutableStateOf<String?>(null) }

    var showTxForm by remember { mutableStateOf(false) }
    var editingTx by remember { mutableStateOf<TransactionItem?>(null) }
    var showBudgetForm by remember { mutableStateOf(false) }
    var showSubForm by remember { mutableStateOf(false) }
    var editingSub by remember { mutableStateOf<Subscription?>(null) }
    var showGoalForm by remember { mutableStateOf(false) }
    var editingGoal by remember { mutableStateOf<SavingsGoal?>(null) }
    var depositGoal by remember { mutableStateOf<SavingsGoal?>(null) }
    var settleDialog by remember { mutableStateOf<DebtSettlementItem?>(null) }
    var csvPreview by remember { mutableStateOf<CsvImportPreview?>(null) }
    var scanResult by remember { mutableStateOf<ReceiptScanResponse?>(null) }

    suspend fun load() {
        loading = true
        repository.getFinanceSummary(month).onSuccess { summary = it }.onFailure { error = it.friendly() }
        repository.getTransactions(month)
            .onSuccess { transactions = it }
            .onFailure { error = error ?: it.friendly() }
        repository.getBudgets().onSuccess { budgets = it }.onFailure { error = error ?: it.friendly() }
        repository.getDebtSettlements().onSuccess { settlement = it }
        repository.getSubscriptions().onSuccess { subscriptions = it }
        repository.getSavingsGoals().onSuccess { goals = it }
        repository.getFinanceProfile().onSuccess { profile = it }
        loading = false
    }

    LaunchedEffect(month) { load() }
    LaunchedEffect(Unit) {
        repository.getUsers().onSuccess { users = it }
    }

    val csvLauncher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        if (uri != null) {
            scope.launch {
                val text = withContext(Dispatchers.IO) {
                    runCatching {
                        context.contentResolver.openInputStream(uri)?.bufferedReader()?.use { it.readText() }
                    }.getOrNull()
                }
                if (text == null) error = "CSV nelze přečíst"
                else repository.previewCsvImport(text)
                    .onSuccess { csvPreview = it }
                    .onFailure { error = it.friendly() }
            }
        }
    }

    val receiptLauncher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        if (uri != null) {
            scope.launch {
                val bytes = withContext(Dispatchers.IO) {
                    runCatching { context.contentResolver.openInputStream(uri)?.use { it.readBytes() } }.getOrNull()
                }
                if (bytes == null) error = "Obrázek nelze přečíst"
                else repository.scanReceipt(Base64.encodeToString(bytes, Base64.NO_WRAP))
                    .onSuccess { scanResult = it }
                    .onFailure { error = it.friendly() }
            }
        }
    }

    Column(Modifier.fillMaxSize()) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 2.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = { month = Fmt.monthKeyShift(month, -1) }) { Icon(Icons.Default.ChevronLeft, "Předchozí") }
            Text(
                Fmt.monthLabel(month),
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp,
                modifier = Modifier.weight(1f),
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )
            IconButton(onClick = { month = Fmt.monthKeyShift(month, 1) }) { Icon(Icons.Default.ChevronRight, "Další") }
            IconButton(onClick = { scope.launch { load() } }) { Icon(Icons.Default.Refresh, "Obnovit") }
        }

        ScrollableTabRow(selectedTabIndex = tab, edgePadding = 6.dp) {
            listOf("Přehled", "Transakce", "Vyrovnání", "Předplatné", "Cíle", "Profil").forEachIndexed { i, label ->
                Tab(selected = tab == i, onClick = { tab = i }, text = { Text(label, fontSize = 11.sp) })
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

        if (loading) {
            LoadingBox()
        } else {
            Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(12.dp)) {
                when (tab) {
                    0 -> FinanceOverview(
                        summary = summary,
                        budgets = budgets,
                        onAddBudget = { showBudgetForm = true },
                        onExportCsv = { csvLauncher.launch("text/*") },
                        onScanReceipt = { receiptLauncher.launch("image/*") }
                    )

                    1 -> {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Button(
                                onClick = { showTxForm = true },
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.weight(1f)
                            ) { Text("+ Transakce", fontSize = 12.sp) }
                            OutlinedButton(
                                onClick = { csvLauncher.launch("text/*") },
                                shape = RoundedCornerShape(10.dp)
                            ) { Text("CSV", fontSize = 12.sp) }
                            OutlinedButton(
                                onClick = { receiptLauncher.launch("image/*") },
                                shape = RoundedCornerShape(10.dp)
                            ) { Icon(Icons.Default.PhotoCamera, null, modifier = Modifier.size(14.dp)) }
                        }
                        Spacer(Modifier.height(8.dp))
                        if (transactions.isEmpty()) {
                            EmptyState(Icons.Default.ReceiptLong, "Žádné transakce", "Za tento měsíc nejsou žádné transakce.")
                        }
                        transactions.forEach { tx ->
                            TransactionCard(
                                tx = tx,
                                onEdit = { editingTx = tx },
                                onDelete = { scope.launch { repository.deleteTransaction(tx.id).onSuccess { load() } } }
                            )
                        }
                    }

                    2 -> {
                        settlement?.balances?.forEach { b ->
                            Card(shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp)) {
                                Row(Modifier.padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Column(Modifier.weight(1f)) {
                                        Text(b.user_name, fontWeight = FontWeight.Medium, fontSize = 13.sp)
                                        Text(
                                            "Zaplaceno ${Fmt.money(b.paid_total)} • podíl ${Fmt.money(b.share_total)}",
                                            fontSize = 10.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                    Text(
                                        Fmt.money(b.net_balance),
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp,
                                        color = if (b.net_balance >= 0) StatusGreen else StatusRed
                                    )
                                }
                            }
                        }
                        Spacer(Modifier.height(8.dp))
                        Text("Vyrovnání", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                        if (settlement?.settlements.isNullOrEmpty()) {
                            Text("Vše vyrovnáno 🎉", fontSize = 12.sp, color = StatusGreen)
                        }
                        settlement?.settlements?.forEach { s ->
                            Card(shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp)) {
                                Row(Modifier.padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Column(Modifier.weight(1f)) {
                                        Text("${s.from_user_name} → ${s.to_user_name}", fontSize = 12.sp)
                                        Text(Fmt.money(s.amount), fontWeight = FontWeight.Bold, fontSize = 14.sp, color = HestiaOrange)
                                        s.to_user_account?.let { Text("Účet: $it", fontSize = 10.sp) }
                                    }
                                    TextButton(onClick = { settleDialog = s }) { Text("Vyrovnat", fontSize = 11.sp) }
                                }
                            }
                        }
                    }

                    3 -> {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text("Předplatné", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                            TextButton(onClick = { showSubForm = true }) { Text("+ Přidat", fontSize = 11.sp) }
                        }
                        subscriptions.forEach { sub ->
                            Card(shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp)) {
                                Row(Modifier.padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Column(Modifier.weight(1f)) {
                                        Text(sub.name, fontWeight = FontWeight.Medium, fontSize = 13.sp)
                                        Text(
                                            "${Fmt.money(sub.amount)} / ${Labels.label(Labels.billingCycles, sub.billing_cycle)} • ${Fmt.date(sub.next_billing_date)}",
                                            fontSize = 10.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                        Text("Měsíčně ${Fmt.money(sub.monthly_equivalent)}", fontSize = 10.sp)
                                    }
                                    sub.days_until_billing?.let { d ->
                                        StatusPill(
                                            if (d < 0) "po splatnosti" else "za $d dní",
                                            if (d < 3) StatusRed else if (d < 7) StatusYellow else StatusGreen
                                        )
                                    }
                                    IconButton(onClick = { editingSub = sub }, modifier = Modifier.size(28.dp)) {
                                        Icon(Icons.Default.Edit, null, modifier = Modifier.size(14.dp))
                                    }
                                    IconButton(onClick = {
                                        scope.launch { repository.deleteSubscription(sub.id).onSuccess { load() } }
                                    }, modifier = Modifier.size(28.dp)) {
                                        Icon(Icons.Default.Delete, null, tint = StatusRed, modifier = Modifier.size(14.dp))
                                    }
                                }
                            }
                        }
                    }

                    4 -> {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text("Spořicí cíle", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                            TextButton(onClick = { showGoalForm = true }) { Text("+ Přidat", fontSize = 11.sp) }
                        }
                        goals.forEach { g ->
                            Card(shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                                Column(Modifier.padding(10.dp)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(g.title, fontWeight = FontWeight.Medium, fontSize = 13.sp, modifier = Modifier.weight(1f))
                                        if (g.is_completed) StatusPill("Splněno", StatusGreen)
                                    }
                                    Text(
                                        "${Fmt.money(g.current_amount)} z ${Fmt.money(g.target_amount)}",
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    LinearProgressIndicator(
                                        progress = { (g.progress_percentage / 100.0).toFloat().coerceIn(0f, 1f) },
                                        modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
                                        color = StatusGreen
                                    )
                                    Row {
                                        TextButton(onClick = { depositGoal = g }) { Text("Vložit", fontSize = 11.sp) }
                                        TextButton(onClick = { editingGoal = g }) { Text("Upravit", fontSize = 11.sp) }
                                        TextButton(onClick = {
                                            scope.launch { repository.deleteSavingsGoal(g.id).onSuccess { load() } }
                                        }) { Text("Smazat", fontSize = 11.sp, color = StatusRed) }
                                    }
                                }
                            }
                        }
                    }

                    else -> {
                        Text("Můj platební profil", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                        var bank by remember(profile) { mutableStateOf(profile?.bank_account ?: "") }
                        var iban by remember(profile) { mutableStateOf(profile?.iban ?: "") }
                        Spacer(Modifier.height(8.dp))
                        HestiaField(bank, { bank = it }, "Číslo účtu")
                        Spacer(Modifier.height(8.dp))
                        HestiaField(iban, { iban = it }, "IBAN")
                        Spacer(Modifier.height(8.dp))
                        Button(
                            onClick = {
                                scope.launch {
                                    repository.updateFinanceProfile(
                                        UserFinanceProfileUpdate(bank.ifBlank { null }, iban.ifBlank { null })
                                    ).onSuccess { profile = it; message = "Profil uložen" }
                                        .onFailure { error = it.friendly() }
                                }
                            },
                            shape = RoundedCornerShape(10.dp)
                        ) { Text("Uložit") }
                    }
                }
                Spacer(Modifier.height(40.dp))
            }
        }
    }

    if (showTxForm || editingTx != null) {
        TransactionFormDialog(
            initial = editingTx,
            users = users,
            currentUserId = currentUserId,
            defaultDate = if (month == Fmt.monthKey(Fmt.today())) Fmt.today() else "$month-01",
            onDismiss = { showTxForm = false; editingTx = null },
            onSave = { body ->
                scope.launch {
                    val current = editingTx
                    val res = if (current == null) repository.createTransaction(body)
                    else repository.updateTransaction(
                        current.id,
                        TransactionUpdate(
                            title = body.title, amount = body.amount, transaction_type = body.transaction_type,
                            category = body.category, date = body.date, payer_id = body.payer_id,
                            is_shared = body.is_shared, split_type = body.split_type,
                            receipt_url = body.receipt_url, notes = body.notes
                        )
                    )
                    res.onSuccess { showTxForm = false; editingTx = null; load() }
                        .onFailure { error = it.friendly() }
                }
            }
        )
    }

    if (showBudgetForm) {
        var category by remember { mutableStateOf("groceries") }
        var limit by remember { mutableStateOf("") }
        DialogScaffold(
            title = "Nový rozpočet",
            onDismiss = { showBudgetForm = false },
            confirmEnabled = limit.toDoubleOrNull() != null,
            onConfirm = {
                scope.launch {
                    repository.createBudget(CategoryBudgetCreate(category = category, monthly_limit = limit.toDouble()))
                        .onSuccess { showBudgetForm = false; load() }.onFailure { error = it.friendly() }
                }
            }
        ) {
            HestiaDropdown("Kategorie", Labels.financeCategories, category, { category = it })
            Spacer(Modifier.height(8.dp))
            HestiaNumberField(limit, { limit = it }, "Měsíční limit (Kč)", decimal = true)
        }
    }

    if (showSubForm || editingSub != null) {
        val init = editingSub
        var name by remember { mutableStateOf(init?.name ?: "") }
        var amount by remember { mutableStateOf(init?.amount?.let { Fmt.number(it) } ?: "") }
        var cycle by remember { mutableStateOf(init?.billing_cycle ?: "monthly") }
        var nextDate by remember { mutableStateOf(init?.next_billing_date ?: Fmt.today()) }
        var category by remember { mutableStateOf(init?.category ?: "entertainment") }
        var payerId by remember { mutableStateOf(init?.payer_id ?: currentUserId) }
        DialogScaffold(
            title = if (init == null) "Nové předplatné" else "Upravit předplatné",
            onDismiss = { showSubForm = false; editingSub = null },
            confirmEnabled = name.isNotBlank() && amount.toDoubleOrNull() != null,
            onConfirm = {
                scope.launch {
                    val res = if (init == null) repository.createSubscription(
                        SubscriptionCreate(
                            name = name, amount = amount.toDouble(), billing_cycle = cycle,
                            next_billing_date = nextDate, category = category, payer_id = payerId
                        )
                    ) else repository.updateSubscription(
                        init.id,
                        SubscriptionUpdate(
                            name = name, amount = amount.toDouble(), billing_cycle = cycle,
                            next_billing_date = nextDate, category = category, payer_id = payerId
                        )
                    )
                    res.onSuccess { showSubForm = false; editingSub = null; load() }
                        .onFailure { error = it.friendly() }
                }
            }
        ) {
            HestiaField(name, { name = it }, "Název")
            Spacer(Modifier.height(8.dp))
            HestiaNumberField(amount, { amount = it }, "Částka (Kč)", decimal = true)
            Spacer(Modifier.height(8.dp))
            HestiaDropdown("Cyklus", Labels.billingCycles, cycle, { cycle = it })
            Spacer(Modifier.height(8.dp))
            DateField("Další platba", nextDate, { nextDate = it ?: nextDate })
            Spacer(Modifier.height(8.dp))
            HestiaDropdown("Kategorie", Labels.financeCategories, category, { category = it })
            Spacer(Modifier.height(8.dp))
            UserDropdown(users, payerId, { payerId = it })
        }
    }

    if (showGoalForm || editingGoal != null) {
        val init = editingGoal
        var title by remember { mutableStateOf(init?.title ?: "") }
        var target by remember { mutableStateOf(init?.target_amount?.let { Fmt.number(it) } ?: "") }
        var current by remember { mutableStateOf(init?.current_amount?.let { Fmt.number(it) } ?: "0") }
        var targetDate by remember { mutableStateOf(init?.target_date) }
        DialogScaffold(
            title = if (init == null) "Nový cíl" else "Upravit cíl",
            onDismiss = { showGoalForm = false; editingGoal = null },
            confirmEnabled = title.isNotBlank() && target.toDoubleOrNull() != null,
            onConfirm = {
                scope.launch {
                    val res = if (init == null) repository.createSavingsGoal(
                        SavingsGoalCreate(
                            title = title, target_amount = target.toDouble(),
                            current_amount = current.toDoubleOrNull() ?: 0.0, target_date = targetDate
                        )
                    ) else repository.updateSavingsGoal(
                        init.id,
                        SavingsGoalUpdate(
                            title = title, target_amount = target.toDouble(),
                            current_amount = current.toDoubleOrNull() ?: 0.0, target_date = targetDate
                        )
                    )
                    res.onSuccess { showGoalForm = false; editingGoal = null; load() }
                        .onFailure { error = it.friendly() }
                }
            }
        ) {
            HestiaField(title, { title = it }, "Název cíle")
            Spacer(Modifier.height(8.dp))
            HestiaNumberField(target, { target = it }, "Cílová částka", decimal = true)
            Spacer(Modifier.height(8.dp))
            HestiaNumberField(current, { current = it }, "Už naspořeno", decimal = true)
            Spacer(Modifier.height(8.dp))
            DateField("Cílové datum", targetDate, { targetDate = it })
        }
    }

    depositGoal?.let { g ->
        var amount by remember { mutableStateOf("") }
        DialogScaffold(
            title = "Vložit do ${g.title}",
            onDismiss = { depositGoal = null },
            confirmEnabled = amount.toDoubleOrNull() != null,
            onConfirm = {
                scope.launch {
                    repository.addSavingsDeposit(g.id, amount.toDouble())
                        .onSuccess { depositGoal = null; load() }.onFailure { error = it.friendly() }
                }
            }
        ) {
            HestiaNumberField(amount, { amount = it }, "Částka", decimal = true)
        }
    }

    settleDialog?.let { s ->
        var amount by remember { mutableStateOf(Fmt.number(s.amount)) }
        var note by remember { mutableStateOf("") }
        DialogScaffold(
            title = "Vyrovnat dluh",
            onDismiss = { settleDialog = null },
            confirmText = "Vyrovnat",
            confirmEnabled = amount.toDoubleOrNull() != null,
            onConfirm = {
                scope.launch {
                    repository.settleDebt(s.from_user_id, s.to_user_id, amount.toDouble(), note.ifBlank { null })
                        .onSuccess { settleDialog = null; message = "Dluh vyrovnán"; load() }
                        .onFailure { error = it.friendly() }
                }
            }
        ) {
            Text("${s.from_user_name} → ${s.to_user_name}", fontSize = 12.sp)
            Spacer(Modifier.height(8.dp))
            HestiaNumberField(amount, { amount = it }, "Částka", decimal = true)
            Spacer(Modifier.height(8.dp))
            HestiaField(note, { note = it }, "Poznámka")
        }
    }

    csvPreview?.let { preview ->
        AlertDialog(
            onDismissRequest = { csvPreview = null },
            title = { Text("Import CSV", fontSize = 15.sp) },
            text = {
                Column {
                    Text("${preview.total_count} řádků", fontSize = 12.sp)
                    Text("Příjmy: ${Fmt.money(preview.total_income)}", fontSize = 12.sp, color = StatusGreen)
                    Text("Výdaje: ${Fmt.money(preview.total_expense)}", fontSize = 12.sp, color = StatusRed)
                    Spacer(Modifier.height(6.dp))
                    LazyColumn(Modifier.heightIn(max = 200.dp)) {
                        items(preview.rows.size) { i ->
                            val r = preview.rows[i]
                            Text(
                                "${r.date} • ${r.title} • ${Fmt.money(r.amount)}",
                                fontSize = 11.sp,
                                modifier = Modifier.padding(vertical = 2.dp)
                            )
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    scope.launch {
                        repository.confirmCsvImport(preview.rows, currentUserId ?: 1, true)
                            .onSuccess { message = "Importováno ${preview.total_count} transakcí"; csvPreview = null; load() }
                            .onFailure { error = it.friendly() }
                    }
                }) { Text("Importovat") }
            },
            dismissButton = { TextButton(onClick = { csvPreview = null }) { Text("Zrušit") } }
        )
    }

    scanResult?.let { r ->
        var title by remember { mutableStateOf(r.store_name ?: "Nákup") }
        var amount by remember { mutableStateOf(r.total_amount?.let { Fmt.number(it) } ?: "") }
        var date by remember { mutableStateOf(r.date ?: Fmt.today()) }
        var category by remember { mutableStateOf(r.category ?: "groceries") }
        DialogScaffold(
            title = "Účtenka",
            onDismiss = { scanResult = null },
            confirmText = "Vytvořit",
            confirmEnabled = title.isNotBlank() && amount.toDoubleOrNull() != null,
            onConfirm = {
                scope.launch {
                    repository.createTransaction(
                        TransactionCreate(
                            title = title, amount = amount.toDouble(), date = date,
                            category = category, payer_id = currentUserId ?: 1, notes = r.items_summary
                        )
                    ).onSuccess { scanResult = null; message = "Transakce vytvořena"; load() }
                        .onFailure { error = it.friendly() }
                }
            }
        ) {
            HestiaField(title, { title = it }, "Obchod")
            Spacer(Modifier.height(8.dp))
            HestiaNumberField(amount, { amount = it }, "Částka", decimal = true)
            Spacer(Modifier.height(8.dp))
            DateField("Datum", date, { date = it ?: date })
            Spacer(Modifier.height(8.dp))
            HestiaDropdown("Kategorie", Labels.financeCategories, category, { category = it })
            r.items_summary?.let {
                Spacer(Modifier.height(8.dp))
                Text(it, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@Composable
private fun FinanceOverview(
    summary: FinanceSummary?,
    budgets: List<CategoryBudget>,
    onAddBudget: () -> Unit,
    onExportCsv: () -> Unit,
    onScanReceipt: () -> Unit
) {
    if (summary == null) {
        EmptyState(Icons.Default.Savings, "Žádná data", "Za tento měsíc nejsou data.")
        return
    }
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        StatCard(
            title = "Příjmy",
            value = Fmt.money(summary.total_income),
            icon = Icons.Default.TrendingUp,
            iconColor = StatusGreen,
            modifier = Modifier.weight(1f)
        )
        StatCard(
            title = "Výdaje",
            value = Fmt.money(summary.total_expense),
            icon = Icons.Default.TrendingDown,
            iconColor = StatusRed,
            modifier = Modifier.weight(1f)
        )
    }
    Spacer(Modifier.height(8.dp))
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        StatCard(
            title = "Bilance",
            value = Fmt.money(summary.net_balance),
            icon = Icons.Default.AccountBalanceWallet,
            iconColor = if (summary.net_balance >= 0) StatusGreen else StatusRed,
            modifier = Modifier.weight(1f)
        )
        StatCard(
            title = "Ø výdaje",
            value = Fmt.money(summary.all_months_average_expense),
            icon = Icons.Default.Insights,
            iconColor = StatusBlue,
            modifier = Modifier.weight(1f),
            subtitle = "${summary.distinct_months_count} měsíců"
        )
    }

    Spacer(Modifier.height(12.dp))
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        Text("Kategorie", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
        TextButton(onClick = onAddBudget) { Text("+ Rozpočet", fontSize = 11.sp) }
    }
    summary.categories.sortedByDescending { it.current_month_amount }.forEach { c ->
        val limit = c.budget_limit ?: budgets.firstOrNull { it.category == c.category }?.monthly_limit
        val progress = if (limit != null && limit > 0) (c.current_month_amount / limit).toFloat() else 0f
        Column(Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(Labels.label(Labels.financeCategories, c.category), fontSize = 12.sp, modifier = Modifier.weight(1f))
                Text(Fmt.money(c.current_month_amount), fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                limit?.let {
                    Text(" / ${Fmt.money(it)}", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            if (limit != null) {
                LinearProgressIndicator(
                    progress = { progress.coerceIn(0f, 1f) },
                    modifier = Modifier.fillMaxWidth().padding(top = 3.dp),
                    color = if (progress > 1f) StatusRed else if (progress > 0.85f) StatusYellow else StatusGreen
                )
            }
            val diff = c.difference_from_average_percent
            if (diff != null && diff != 0.0) {
                Text(
                    (if (diff > 0) "+" else "") + "${Fmt.number(diff, 0)} % oproti průměru",
                    fontSize = 9.sp,
                    color = if (diff > 0) StatusRed else StatusGreen
                )
            }
        }
    }

    Spacer(Modifier.height(12.dp))
    Text("Poslední transakce", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
    summary.recent_transactions.take(5).forEach { tx ->
        Row(Modifier.fillMaxWidth().padding(vertical = 3.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(tx.title, fontSize = 12.sp)
                Text(Fmt.date(tx.date), fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Text(
                (if (tx.transaction_type == "income") "+" else "-") + Fmt.money(tx.amount),
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = if (tx.transaction_type == "income") StatusGreen else StatusRed
            )
        }
    }

    Spacer(Modifier.height(12.dp))
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        OutlinedButton(onClick = onExportCsv, shape = RoundedCornerShape(10.dp), modifier = Modifier.weight(1f)) {
            Icon(Icons.Default.UploadFile, null, modifier = Modifier.size(14.dp))
            Spacer(Modifier.width(4.dp))
            Text("Import CSV", fontSize = 11.sp)
        }
        OutlinedButton(onClick = onScanReceipt, shape = RoundedCornerShape(10.dp), modifier = Modifier.weight(1f)) {
            Icon(Icons.Default.PhotoCamera, null, modifier = Modifier.size(14.dp))
            Spacer(Modifier.width(4.dp))
            Text("Skenovat účtenku", fontSize = 11.sp)
        }
    }
}

@Composable
private fun TransactionCard(
    tx: TransactionItem,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    Card(shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp)) {
        Row(Modifier.padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(tx.title, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                Text(
                    "${Fmt.date(tx.date)} • ${Labels.label(Labels.financeCategories, tx.category)}" +
                        (tx.payer?.display_name?.let { " • $it" } ?: ""),
                    fontSize = 10.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                if (tx.is_shared) StatusPill("Sdíleno", StatusBlue)
            }
            Text(
                (if (tx.transaction_type == "income") "+" else "-") + Fmt.money(tx.amount),
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                color = if (tx.transaction_type == "income") StatusGreen else StatusRed
            )
            IconButton(onClick = onEdit, modifier = Modifier.size(28.dp)) {
                Icon(Icons.Default.Edit, null, modifier = Modifier.size(14.dp))
            }
            IconButton(onClick = onDelete, modifier = Modifier.size(28.dp)) {
                Icon(Icons.Default.Delete, null, tint = StatusRed, modifier = Modifier.size(14.dp))
            }
        }
    }
}

@Composable
private fun TransactionFormDialog(
    initial: TransactionItem?,
    users: List<User>,
    currentUserId: Int?,
    defaultDate: String,
    onDismiss: () -> Unit,
    onSave: (TransactionCreate) -> Unit
) {
    var type by remember { mutableStateOf(initial?.transaction_type ?: "expense") }
    var title by remember { mutableStateOf(initial?.title ?: "") }
    var amount by remember { mutableStateOf(initial?.amount?.let { Fmt.number(it) } ?: "") }
    var category by remember { mutableStateOf(initial?.category ?: "groceries") }
    var date by remember { mutableStateOf(initial?.date ?: defaultDate) }
    var payerId by remember { mutableStateOf(initial?.payer_id ?: currentUserId) }
    var shared by remember { mutableStateOf(initial?.is_shared ?: true) }
    var notes by remember { mutableStateOf(initial?.notes ?: "") }

    DialogScaffold(
        title = if (initial == null) "Nová transakce" else "Upravit transakci",
        onDismiss = onDismiss,
        confirmEnabled = title.isNotBlank() && amount.toDoubleOrNull() != null && payerId != null,
        onConfirm = {
            onSave(
                TransactionCreate(
                    title = title.trim(), amount = amount.toDouble(), transaction_type = type,
                    category = category, date = date, payer_id = payerId ?: 1,
                    is_shared = shared, split_type = "equal",
                    notes = notes.ifBlank { null }
                )
            )
        }
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilterChip(selected = type == "expense", onClick = { type = "expense" }, label = { Text("Výdaj", fontSize = 11.sp) })
            FilterChip(selected = type == "income", onClick = { type = "income" }, label = { Text("Příjem", fontSize = 11.sp) })
        }
        Spacer(Modifier.height(8.dp))
        HestiaField(title, { title = it }, "Název")
        Spacer(Modifier.height(8.dp))
        HestiaNumberField(amount, { amount = it }, "Částka (Kč)", decimal = true)
        Spacer(Modifier.height(8.dp))
        HestiaDropdown("Kategorie", Labels.financeCategories, category, { category = it })
        Spacer(Modifier.height(8.dp))
        DateField("Datum", date, { date = it ?: date })
        Spacer(Modifier.height(8.dp))
        UserDropdown(users, payerId, { payerId = it })
        Spacer(Modifier.height(8.dp))
        ToggleRow("Sdílený výdaj", shared, { shared = it })
        Spacer(Modifier.height(8.dp))
        HestiaField(notes, { notes = it }, "Poznámky", singleLine = false, minLines = 2)
    }
}

@Composable
fun UserDropdown(users: List<User>, selectedId: Int?, onSelect: (Int) -> Unit) {
    val label = users.firstOrNull { it.id == selectedId }?.display_name ?: "Vybrat člena"
    HestiaDropdown(
        "Plátce",
        users.map { it.id.toString() to it.display_name },
        selectedId?.toString(),
        { v -> v.toIntOrNull()?.let(onSelect) }
    )
    if (selectedId == null) Text(label, fontSize = 10.sp, color = StatusRed)
}
