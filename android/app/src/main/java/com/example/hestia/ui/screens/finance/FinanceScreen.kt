package com.example.hestia.ui.screens.finance

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.TrendingDown
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hestia.data.models.*
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.theme.HestiaOrange
import com.example.hestia.theme.StatusGreen
import com.example.hestia.theme.StatusRed
import com.example.hestia.ui.components.EmptyStateCard
import com.example.hestia.ui.components.QrCodeImage
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.io.ByteArrayOutputStream
import java.util.Locale

@Composable
fun FinanceScreen(
    repository: HestiaRepository,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    var summary by remember { mutableStateOf<FinanceSummary?>(null) }
    var settlements by remember { mutableStateOf<DebtSettlementResponse?>(null) }
    var transactions by remember { mutableStateOf<List<TransactionItem>>(emptyList()) }
    var savingsGoals by remember { mutableStateOf<List<SavingsGoal>>(emptyList()) }
    var subscriptions by remember { mutableStateOf<List<Subscription>>(emptyList()) }
    var members by remember { mutableStateOf<List<PublicMember>>(emptyList()) }
    var currentUser by remember { mutableStateOf<User?>(null) }

    var isLoading by remember { mutableStateOf(true) }
    var selectedTab by remember { mutableIntStateOf(0) } // 0: Vyrovnání, 1: Transakce, 2: Prasátka, 3: Předplatná

    var selectedSettlementForQr by remember { mutableStateOf<DebtSettlementItem?>(null) }
    var showAddTransactionDialog by remember { mutableStateOf(false) }
    var selectedGoalForDeposit by remember { mutableStateOf<SavingsGoal?>(null) }
    var snackbarMessage by remember { mutableStateOf<String?>(null) }

    fun refreshData() {
        coroutineScope.launch {
            isLoading = true
            currentUser = repository.preferences.currentUserFlow.first()
            repository.getFinanceSummary().onSuccess { summary = it }
            repository.getDebtSettlements().onSuccess { settlements = it }
            repository.getTransactions(50).onSuccess { transactions = it }
            repository.getSavingsGoals().onSuccess { savingsGoals = it }
            repository.getSubscriptions().onSuccess { subscriptions = it }
            repository.getPublicMembers().onSuccess { members = it }
            isLoading = false
        }
    }

    LaunchedEffect(Unit) {
        refreshData()
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background,
        floatingActionButton = {
            if (selectedTab == 1) {
                FloatingActionButton(
                    onClick = { showAddTransactionDialog = true },
                    containerColor = HestiaOrange,
                    contentColor = Color.White,
                    shape = CircleShape
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Přidat platbu")
                }
            }
        },
        snackbarHost = {
            snackbarMessage?.let { msg ->
                Snackbar(
                    modifier = Modifier.padding(16.dp),
                    action = {
                        TextButton(onClick = { snackbarMessage = null }) {
                            Text("OK", color = HestiaOrange)
                        }
                    }
                ) {
                    Text(msg)
                }
            }
        }
    ) { paddingValues ->
        if (isLoading && summary == null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = HestiaOrange)
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
                contentPadding = PaddingValues(top = 12.dp, bottom = 80.dp)
            ) {
                // Summary header KPI cards
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            FinanceKpiCard(
                                title = "Měsíční výdaje",
                                amount = "${String.format(Locale.getDefault(), "%.0f", summary?.current_month_expenses ?: 0.0)} Kč",
                                icon = Icons.AutoMirrored.Filled.TrendingDown,
                                iconColor = StatusRed,
                                modifier = Modifier.weight(1f)
                            )
                            FinanceKpiCard(
                                title = "Měsíční příjmy",
                                amount = "${String.format(Locale.getDefault(), "%.0f", summary?.current_month_income ?: 0.0)} Kč",
                                icon = Icons.AutoMirrored.Filled.TrendingUp,
                                iconColor = StatusGreen,
                                modifier = Modifier.weight(1f)
                            )
                        }

                        val netBalance = summary?.current_month_net ?: 0.0
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                            ),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(
                                        text = "Čistá bilance měsíce",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    Text(
                                        text = (if (netBalance >= 0) "+" else "") +
                                                "${String.format(Locale.getDefault(), "%.0f", netBalance)} Kč",
                                        style = MaterialTheme.typography.titleLarge,
                                        fontWeight = FontWeight.Bold,
                                        color = if (netBalance >= 0) StatusGreen else StatusRed
                                    )
                                }

                                summary?.historical_average_monthly_expense?.let { avg ->
                                    Column(horizontalAlignment = Alignment.End) {
                                        Text(
                                            text = "Průměrný měsíc",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                        Text(
                                            text = "${String.format(Locale.getDefault(), "%.0f", avg)} Kč",
                                            style = MaterialTheme.typography.bodyMedium,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // 4 Navigation Tabs
                item {
                    PrimaryTabRow(
                        selectedTabIndex = selectedTab,
                        containerColor = Color.Transparent,
                        contentColor = HestiaOrange,
                        divider = {}
                    ) {
                        Tab(
                            selected = selectedTab == 0,
                            onClick = { selectedTab = 0 },
                            text = { Text("Vyrovnání", fontSize = 11.sp) }
                        )
                        Tab(
                            selected = selectedTab == 1,
                            onClick = { selectedTab = 1 },
                            text = { Text("Transakce (${transactions.size})", fontSize = 11.sp) }
                        )
                        Tab(
                            selected = selectedTab == 2,
                            onClick = { selectedTab = 2 },
                            text = { Text("Prasátka (${savingsGoals.size})", fontSize = 11.sp) }
                        )
                        Tab(
                            selected = selectedTab == 3,
                            onClick = { selectedTab = 3 },
                            text = { Text("Předplatná (${subscriptions.size})", fontSize = 11.sp) }
                        )
                    }
                }

                when (selectedTab) {
                    // TAB 0: DEBT SETTLEMENT & MEMBER BALANCES
                    0 -> {
                        val balances = settlements?.balances ?: emptyList()
                        val settlementItems = settlements?.settlements ?: emptyList()

                        item {
                            Text(
                                text = "Bilance členů domácnosti",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        if (balances.isEmpty()) {
                            item {
                                EmptyStateCard(
                                    message = "Zatím nejsou zaznamenány žádné sdílené výdaje.",
                                    icon = Icons.Default.AccountBalanceWallet
                                )
                            }
                        } else {
                            items(balances) { balance ->
                                MemberBalanceRow(balance = balance)
                            }
                        }

                        item {
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "Návrh optimálního vyrovnání (SPAYD QR)",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        if (settlementItems.isEmpty()) {
                            item {
                                Card(
                                    shape = RoundedCornerShape(12.dp),
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        modifier = Modifier.padding(16.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                                    ) {
                                        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = StatusGreen)
                                        Text("Všechny rodinné dluhy jsou srovnané!", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                    }
                                }
                            }
                        } else {
                            items(settlementItems) { item ->
                                Card(
                                    shape = RoundedCornerShape(14.dp),
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { selectedSettlementForQr = item }
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(14.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                                Text(text = item.from_user_name, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                                Icon(Icons.Default.ArrowForward, contentDescription = null, modifier = Modifier.size(14.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                                                Text(text = item.to_user_name, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                            }
                                            Text(
                                                text = "Klepnutím zobrazíte bankovní QR kód",
                                                fontSize = 11.sp,
                                                color = HestiaOrange,
                                                modifier = Modifier.padding(top = 2.dp)
                                            )
                                        }

                                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                            Text(
                                                text = "${String.format(Locale.getDefault(), "%.0f", item.amount)} Kč",
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 16.sp,
                                                color = HestiaOrange
                                            )
                                            Icon(Icons.Default.QrCode2, contentDescription = "QR kód", tint = HestiaOrange, modifier = Modifier.size(24.dp))
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // TAB 1: TRANSACTIONS LIST
                    1 -> {
                        item {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Transakce (${transactions.size})", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    FilledTonalButton(
                                        onClick = { showAddTransactionDialog = true },
                                        colors = ButtonDefaults.filledTonalButtonColors(
                                            containerColor = HestiaOrange.copy(alpha = 0.15f),
                                            contentColor = HestiaOrange
                                        ),
                                        shape = RoundedCornerShape(10.dp),
                                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                                    ) {
                                        Icon(Icons.Default.DocumentScanner, contentDescription = null, modifier = Modifier.size(14.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("AI Účtenka", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }

                        if (transactions.isEmpty()) {
                            item {
                                EmptyStateCard(
                                    message = "V historii zatím nejsou žádné transakce.",
                                    icon = Icons.Default.Receipt
                                )
                            }
                        } else {
                            items(transactions, key = { it.id }) { tx ->
                                Card(
                                    shape = RoundedCornerShape(12.dp),
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(12.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                                            modifier = Modifier.weight(1f)
                                        ) {
                                            val isExpense = tx.transaction_type == "expense"
                                            val txColor = if (isExpense) StatusRed else StatusGreen

                                            Box(
                                                modifier = Modifier
                                                    .size(36.dp)
                                                    .clip(CircleShape)
                                                    .background(txColor.copy(alpha = 0.12f)),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Icon(
                                                    imageVector = if (isExpense) Icons.AutoMirrored.Filled.TrendingDown else Icons.AutoMirrored.Filled.TrendingUp,
                                                    contentDescription = null,
                                                    tint = txColor,
                                                    modifier = Modifier.size(18.dp)
                                                )
                                            }

                                            Column {
                                                Text(text = tx.title, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                                Text(
                                                    text = "${tx.date} • ${tx.payer?.display_name ?: "Člen"} • ${tx.category}",
                                                    fontSize = 11.sp,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }
                                        }

                                        Text(
                                            text = "${if (tx.transaction_type == "expense") "-" else "+"}${String.format(Locale.getDefault(), "%.0f", tx.amount)} Kč",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 15.sp,
                                            color = if (tx.transaction_type == "expense") StatusRed else StatusGreen
                                        )
                                    }
                                }
                            }
                        }
                    }

                    // TAB 2: SAVINGS GOALS (PRASÁTKA)
                    2 -> {
                        if (savingsGoals.isEmpty()) {
                            item {
                                EmptyStateCard(
                                    message = "Zatím nemáte vytvořené žádné spořicí cíle.",
                                    icon = Icons.Default.Savings
                                )
                            }
                        } else {
                            items(savingsGoals, key = { it.id }) { goal ->
                                val progress = if (goal.target_amount > 0) (goal.current_amount / goal.target_amount).toFloat().coerceIn(0f, 1f) else 0f
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
                                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                                Icon(Icons.Default.Savings, contentDescription = null, tint = StatusGreen)
                                                Text(text = goal.title, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                            }

                                            Button(
                                                onClick = { selectedGoalForDeposit = goal },
                                                shape = RoundedCornerShape(8.dp),
                                                colors = ButtonDefaults.buttonColors(containerColor = StatusGreen),
                                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                                            ) {
                                                Text("+ Vložit", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                            }
                                        }

                                        Spacer(modifier = Modifier.height(8.dp))
                                        LinearProgressIndicator(
                                            progress = { progress },
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .height(8.dp)
                                                .clip(RoundedCornerShape(4.dp)),
                                            color = StatusGreen
                                        )

                                        Spacer(modifier = Modifier.height(6.dp))
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Text(
                                                text = "${String.format(Locale.getDefault(), "%.0f", goal.current_amount)} Kč",
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 13.sp,
                                                color = StatusGreen
                                            )
                                            Text(
                                                text = "Cíl: ${String.format(Locale.getDefault(), "%.0f", goal.target_amount)} Kč (${(progress * 100).toInt()}%)",
                                                fontSize = 12.sp,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // TAB 3: SUBSCRIPTIONS
                    3 -> {
                        val totalMonthly = subscriptions.filter { it.is_active }.sumOf { it.monthly_equivalent }
                        item {
                            Card(
                                shape = RoundedCornerShape(12.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier.padding(14.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text("Celkem za předplatná:", fontWeight = FontWeight.Medium, fontSize = 13.sp)
                                    Text("${String.format(Locale.getDefault(), "%.0f", totalMonthly)} Kč / měsíc", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = HestiaOrange)
                                }
                            }
                        }

                        if (subscriptions.isEmpty()) {
                            item {
                                EmptyStateCard(
                                    message = "Zatím nemáte zaevidovaná žádná předplatná.",
                                    icon = Icons.Default.CreditCard
                                )
                            }
                        } else {
                            items(subscriptions, key = { it.id }) { sub ->
                                Card(
                                    shape = RoundedCornerShape(12.dp),
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(14.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column {
                                            Text(text = sub.name, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                            Text(
                                                text = "Platba: ${sub.next_billing_date} (${sub.billing_cycle})",
                                                fontSize = 11.sp,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }

                                        Column(horizontalAlignment = Alignment.End) {
                                            Text(
                                                text = "${String.format(Locale.getDefault(), "%.0f", sub.amount)} Kč",
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 15.sp,
                                                color = HestiaOrange
                                            )
                                            Text(
                                                text = "cca ${String.format(Locale.getDefault(), "%.0f", sub.monthly_equivalent)} Kč/měs",
                                                fontSize = 10.sp,
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

    // SPAYD QR CODE MODAL DIALOG
    selectedSettlementForQr?.let { settlement ->
        AlertDialog(
            onDismissRequest = { selectedSettlementForQr = null },
            title = {
                Text("SPAYD Platba pro bankovnictví", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        text = "${settlement.from_user_name} zaplatí ${settlement.to_user_name}:",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "${String.format(Locale.getDefault(), "%.2f", settlement.amount)} Kč",
                        fontWeight = FontWeight.Black,
                        fontSize = 22.sp,
                        color = HestiaOrange
                    )

                    // Rendered QR Code
                    QrCodeImage(
                        data = settlement.spayd_string,
                        modifier = Modifier.size(220.dp)
                    )

                    Text(
                        text = "Naskenujte v aplikaci své banky (Air Bank, KB, ČSOB, Česká spořitelna...)",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = { selectedSettlementForQr = null }) {
                    Text("Zavřít", color = HestiaOrange)
                }
            }
        )
    }

    // Add Transaction Dialog
    if (showAddTransactionDialog) {
        var title by remember { mutableStateOf("") }
        var amount by remember { mutableStateOf("") }
        var type by remember { mutableStateOf("expense") }
        var category by remember { mutableStateOf("groceries") }
        var payerId by remember { mutableStateOf<Int?>(currentUser?.id) }
        var isShared by remember { mutableStateOf(true) }

        var isScanningReceipt by remember { mutableStateOf(false) }
        var scanError by remember { mutableStateOf<String?>(null) }
        var scannedItemsSummary by remember { mutableStateOf<String?>(null) }
        var isReceiptSuccess by remember { mutableStateOf(false) }

        val categories = listOf("groceries" to "Potraviny", "household" to "Domácnost", "entertainment" to "Zábava", "transport" to "Doprava", "other" to "Ostatní")

        val receiptPickerLauncher = rememberLauncherForActivityResult(
            contract = ActivityResultContracts.GetContent()
        ) { uri: Uri? ->
            uri?.let {
                coroutineScope.launch {
                    isScanningReceipt = true
                    scanError = null
                    isReceiptSuccess = false
                    try {
                        val inputStream = context.contentResolver.openInputStream(uri)
                        val originalBitmap = BitmapFactory.decodeStream(inputStream)
                        inputStream?.close()

                        if (originalBitmap != null) {
                            val maxDim = 1600
                            val width = originalBitmap.width
                            val height = originalBitmap.height
                            val scaledBitmap = if (width > maxDim || height > maxDim) {
                                val ratio = width.toFloat() / height.toFloat()
                                val (newW, newH) = if (ratio > 1f) maxDim to (maxDim / ratio).toInt() else (maxDim * ratio).toInt() to maxDim
                                Bitmap.createScaledBitmap(originalBitmap, newW, newH, true)
                            } else {
                                originalBitmap
                            }
                            val baos = ByteArrayOutputStream()
                            scaledBitmap.compress(Bitmap.CompressFormat.JPEG, 85, baos)
                            val base64 = Base64.encodeToString(baos.toByteArray(), Base64.NO_WRAP)

                            repository.scanReceipt(imageBase64 = base64)
                                .onSuccess { scanRes ->
                                    scanRes.store_name?.let { if (it.isNotBlank()) title = it }
                                    scanRes.total_amount?.let { amount = String.format(Locale.US, "%.2f", it) }
                                    scanRes.category?.let { cat ->
                                        if (categories.any { it.first == cat }) {
                                            category = cat
                                        }
                                    }
                                    scannedItemsSummary = scanRes.items_summary
                                    isReceiptSuccess = true
                                }
                                .onFailure { err ->
                                    scanError = err.localizedMessage ?: "Nepodařilo se rozpoznat účtenku."
                                }
                        } else {
                            scanError = "Nepodařilo se načíst soubor obrázku."
                        }
                    } catch (e: Exception) {
                        scanError = e.localizedMessage ?: "Chyba při zpracování obrázku."
                    } finally {
                        isScanningReceipt = false
                    }
                }
            }
        }

        AlertDialog(
            onDismissRequest = { showAddTransactionDialog = false },
            title = { Text("Přidat transakci", fontWeight = FontWeight.Bold) },
            text = {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    // Receipt scanner banner
                    item {
                        OutlinedCard(
                            onClick = {
                                if (!isScanningReceipt) {
                                    receiptPickerLauncher.launch("image/*")
                                }
                            },
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.outlinedCardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                if (isScanningReceipt) {
                                    CircularProgressIndicator(modifier = Modifier.size(22.dp), strokeWidth = 2.dp, color = HestiaOrange)
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text("Gemini OCR čte účtenku...", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                        Text("Rozpoznávám obchod, částku a položky...", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    }
                                } else {
                                    Icon(Icons.Default.DocumentScanner, contentDescription = null, tint = HestiaOrange, modifier = Modifier.size(24.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text("Skenovat účtenku (Gemini AI)", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = HestiaOrange)
                                        Text("Nahrajte fotku účtenky pro automatické vyplnění", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    }
                                    Icon(Icons.Default.ArrowForwardIos, contentDescription = null, modifier = Modifier.size(12.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }
                    }

                    if (isReceiptSuccess) {
                        item {
                            Surface(
                                color = StatusGreen.copy(alpha = 0.12f),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(8.dp)) {
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = StatusGreen, modifier = Modifier.size(14.dp))
                                        Text("Účtenka byla úspěšně načtena!", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = StatusGreen)
                                    }
                                    scannedItemsSummary?.let { summary ->
                                        if (summary.isNotBlank()) {
                                            Text(summary, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 2.dp))
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (scanError != null) {
                        item {
                            Text("Chyba při skenování: $scanError", color = StatusRed, fontSize = 11.sp)
                        }
                    }

                    // Type toggle (Výdaj / Příjem)
                    item {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            FilterChip(
                                selected = type == "expense",
                                onClick = { type = "expense" },
                                label = { Text("Výdaj (-)", fontSize = 12.sp) },
                                modifier = Modifier.weight(1f)
                            )
                            FilterChip(
                                selected = type == "income",
                                onClick = { type = "income" },
                                label = { Text("Příjem (+)", fontSize = 12.sp) },
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }

                    item {
                        OutlinedTextField(
                            value = title,
                            onValueChange = { title = it },
                            label = { Text("Název transakce *") },
                            placeholder = { Text("např. Velký nákup Lidl") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }

                    item {
                        OutlinedTextField(
                            value = amount,
                            onValueChange = { amount = it },
                            label = { Text("Částka v Kč *") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }

                    item {
                        Text("Kategorie:", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            items(categories) { (k, l) ->
                                FilterChip(
                                    selected = category == k,
                                    onClick = { category = k },
                                    label = { Text(l, fontSize = 11.sp) }
                                )
                            }
                        }
                    }

                    if (members.isNotEmpty()) {
                        item {
                            Text("Kdo platil:", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                items(members) { m ->
                                    FilterChip(
                                        selected = payerId == m.id,
                                        onClick = { payerId = m.id },
                                        label = { Text(m.display_name, fontSize = 11.sp) }
                                    )
                                }
                            }
                        }
                    }

                    item {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.clickable { isShared = !isShared }
                        ) {
                            Checkbox(
                                checked = isShared,
                                onCheckedChange = { isShared = it },
                                colors = CheckboxDefaults.colors(checkedColor = HestiaOrange)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Sdílený náklad domácnosti (do vyrovnání)", fontSize = 12.sp)
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val parsedAmount = amount.toDoubleOrNull()
                        if (title.isNotBlank() && parsedAmount != null && payerId != null) {
                            coroutineScope.launch {
                                val today = java.text.SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(java.util.Date())
                                repository.createTransaction(
                                    TransactionCreate(
                                        title = title.trim(),
                                        amount = parsedAmount,
                                        transaction_type = type,
                                        category = category,
                                        date = today,
                                        payer_id = payerId!!,
                                        is_shared = isShared
                                    )
                                ).onSuccess {
                                    showAddTransactionDialog = false
                                    refreshData()
                                    snackbarMessage = "Transakce byla úspěšně zaznamenána!"
                                }
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = HestiaOrange)
                ) {
                    Text("Uložit")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddTransactionDialog = false }) {
                    Text("Zrušit")
                }
            }
        )
    }

    // Add Deposit to Savings Goal Dialog
    selectedGoalForDeposit?.let { goal ->
        var depositAmount by remember { mutableStateOf("500") }

        AlertDialog(
            onDismissRequest = { selectedGoalForDeposit = null },
            title = { Text("Vložit úspory do prasátka: ${goal.title}", fontWeight = FontWeight.Bold, fontSize = 15.sp) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = depositAmount,
                        onValueChange = { depositAmount = it },
                        label = { Text("Částka vkladu v Kč") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        listOf("200", "500", "1000", "2000").forEach { quick ->
                            OutlinedButton(
                                onClick = { depositAmount = quick },
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                            ) {
                                Text("+$quick Kč", fontSize = 11.sp)
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val amt = depositAmount.toDoubleOrNull()
                        if (amt != null && amt > 0) {
                            coroutineScope.launch {
                                repository.addSavingsDeposit(goal.id, amt).onSuccess {
                                    selectedGoalForDeposit = null
                                    refreshData()
                                    snackbarMessage = "Úspory byly úspěšně vloženy!"
                                }
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = StatusGreen)
                ) {
                    Text("Vložit úspory")
                }
            },
            dismissButton = {
                TextButton(onClick = { selectedGoalForDeposit = null }) {
                    Text("Zrušit")
                }
            }
        )
    }
}

@Composable
private fun FinanceKpiCard(
    title: String,
    amount: String,
    icon: ImageVector,
    iconColor: Color,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = modifier
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = iconColor,
                    modifier = Modifier.size(18.dp)
                )
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = amount,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}

@Composable
private fun MemberBalanceRow(balance: MemberBalance) {
    val isPositive = balance.net_balance >= 0
    val balanceColor = if (isPositive) StatusGreen else StatusRed

    val avatarColor = try {
        Color(android.graphics.Color.parseColor(balance.avatar_color))
    } catch (_: Exception) {
        HestiaOrange
    }

    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(avatarColor),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = balance.user_name.take(1).uppercase(),
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp
                    )
                }

                Column {
                    Text(text = balance.user_name, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text(
                        text = "Zaplaceno celkem: ${String.format(Locale.getDefault(), "%.0f", balance.paid_total)} Kč",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = "${if (isPositive) "+" else ""}${String.format(Locale.getDefault(), "%.0f", balance.net_balance)} Kč",
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    color = balanceColor
                )
                Text(
                    text = if (isPositive) "má dostat" else "má doplatit",
                    fontSize = 10.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
