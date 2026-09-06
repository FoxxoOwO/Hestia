package com.example.hestia.ui.screens.finance

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
import com.example.hestia.data.models.DebtSettlementItem
import com.example.hestia.data.models.DebtSettlementResponse
import com.example.hestia.data.models.FinanceSummary
import com.example.hestia.data.models.MemberBalance
import com.example.hestia.data.models.TransactionItem
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.theme.HestiaOrange
import com.example.hestia.ui.components.EmptyStateCard
import kotlinx.coroutines.launch
import java.util.Locale

@Composable
fun FinanceScreen(
    repository: HestiaRepository,
    modifier: Modifier = Modifier
) {
    val coroutineScope = rememberCoroutineScope()
    var summary by remember { mutableStateOf<FinanceSummary?>(null) }
    var settlements by remember { mutableStateOf<DebtSettlementResponse?>(null) }
    var transactions by remember { mutableStateOf<List<TransactionItem>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var selectedTab by remember { mutableIntStateOf(0) } // 0: Vyrovnání, 1: Transakce

    fun refreshData() {
        coroutineScope.launch {
            isLoading = true
            repository.getFinanceSummary().onSuccess { summary = it }
            repository.getDebtSettlements().onSuccess { settlements = it }
            repository.getTransactions(50).onSuccess { transactions = it }
            isLoading = false
        }
    }

    LaunchedEffect(Unit) {
        refreshData()
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background
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
                verticalArrangement = Arrangement.spacedBy(16.dp),
                contentPadding = PaddingValues(vertical = 16.dp)
            ) {
                // Summary header KPI cards
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            FinanceKpiCard(
                                title = "Měsíční výdaje",
                                amount = "${String.format(Locale.getDefault(), "%.0f", summary?.current_month_expenses ?: 0.0)} Kč",
                                icon = Icons.Default.TrendingDown,
                                iconColor = Color(0xFFEF4444),
                                modifier = Modifier.weight(1f)
                            )
                            FinanceKpiCard(
                                title = "Měsíční příjmy",
                                amount = "${String.format(Locale.getDefault(), "%.0f", summary?.current_month_income ?: 0.0)} Kč",
                                icon = Icons.Default.TrendingUp,
                                iconColor = Color(0xFF10B981),
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
                                    .padding(14.dp),
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
                                        color = if (netBalance >= 0) Color(0xFF10B981) else Color(0xFFEF4444)
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

                // Tabs for Settlement vs Transactions
                item {
                    TabRow(
                        selectedTabIndex = selectedTab,
                        containerColor = MaterialTheme.colorScheme.surface,
                        contentColor = HestiaOrange,
                        modifier = Modifier.clip(RoundedCornerShape(12.dp))
                    ) {
                        Tab(
                            selected = selectedTab == 0,
                            onClick = { selectedTab = 0 },
                            text = { Text("Vyrovnání dluhů") },
                            icon = { Icon(Icons.Default.SwapHoriz, contentDescription = null) }
                        )
                        Tab(
                            selected = selectedTab == 1,
                            onClick = { selectedTab = 1 },
                            text = { Text("Transakce (${transactions.size})") },
                            icon = { Icon(Icons.Default.ReceiptLong, contentDescription = null) }
                        )
                    }
                }

                if (selectedTab == 0) {
                    // DEBT SETTLEMENTS & MEMBER BALANCES
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
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Doporučené převody",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    if (settlementItems.isEmpty()) {
                        item {
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(
                                    containerColor = Color(0xFF10B981).copy(alpha = 0.1f)
                                ),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Row(
                                    modifier = Modifier.padding(16.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        Icons.Default.CheckCircle,
                                        contentDescription = null,
                                        tint = Color(0xFF10B981),
                                        modifier = Modifier.size(24.dp)
                                    )
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Text(
                                        text = "Všechny účty jsou vyrovnané! Nikdo nikomu nic nedluží.",
                                        style = MaterialTheme.typography.bodyMedium,
                                        fontWeight = FontWeight.Medium,
                                        color = Color(0xFF10B981)
                                    )
                                }
                            }
                        }
                    } else {
                        items(settlementItems) { item ->
                            DebtSettlementCard(settlement = item)
                        }
                    }
                } else {
                    // TRANSACTIONS LIST
                    if (transactions.isEmpty()) {
                        item {
                            EmptyStateCard(
                                message = "Nebyly nalezeny žádné finanční transakce.",
                                icon = Icons.Default.ReceiptLong
                            )
                        }
                    } else {
                        items(transactions) { tx ->
                            TransactionRow(tx = tx)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun FinanceKpiCard(
    title: String,
    amount: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    iconColor: Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier.padding(14.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .clip(CircleShape)
                        .background(iconColor.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        icon,
                        contentDescription = null,
                        tint = iconColor,
                        modifier = Modifier.size(16.dp)
                    )
                }
                Text(
                    text = title,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = amount,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun MemberBalanceRow(balance: MemberBalance) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        shape = RoundedCornerShape(10.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(HestiaOrange),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = balance.user_name.take(1).uppercase(),
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = balance.user_name,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = "Zaplaceno: ${String.format(Locale.getDefault(), "%.0f", balance.paid_total)} Kč",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            val isPositive = balance.net_balance >= 0
            Surface(
                color = if (isPositive) Color(0xFF10B981).copy(alpha = 0.15f) else Color(0xFFEF4444).copy(alpha = 0.15f),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text(
                    text = (if (isPositive) "+" else "") +
                            "${String.format(Locale.getDefault(), "%.0f", balance.net_balance)} Kč",
                    color = if (isPositive) Color(0xFF10B981) else Color(0xFFEF4444),
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                )
            }
        }
    }
}

@Composable
fun DebtSettlementCard(settlement: DebtSettlementItem) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(Color(0xFF3B82F6).copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Default.Send,
                    contentDescription = null,
                    tint = Color(0xFF3B82F6),
                    modifier = Modifier.size(20.dp)
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "${settlement.from_user_name} → ${settlement.to_user_name}",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold
                )
                if (settlement.spayd_string.isNotBlank()) {
                    Text(
                        text = "Podporuje QR platbu SPAYD",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFF10B981)
                    )
                }
            }

            Text(
                text = "${String.format(Locale.getDefault(), "%.0f", settlement.amount)} Kč",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = HestiaOrange
            )
        }
    }
}

@Composable
fun TransactionRow(tx: TransactionItem) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        shape = RoundedCornerShape(10.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            val isIncome = tx.transaction_type == "income"
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(
                        if (isIncome) Color(0xFF10B981).copy(alpha = 0.15f)
                        else Color(0xFFEF4444).copy(alpha = 0.15f)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    if (isIncome) Icons.Default.ArrowDownward else Icons.Default.ArrowUpward,
                    contentDescription = null,
                    tint = if (isIncome) Color(0xFF10B981) else Color(0xFFEF4444),
                    modifier = Modifier.size(18.dp)
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = tx.title,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold
                )
                Row(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    tx.payer?.let {
                        Text(
                            text = it.display_name,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "•",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Text(
                        text = tx.date.take(10),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Text(
                text = (if (isIncome) "+" else "-") +
                        "${String.format(Locale.getDefault(), "%.0f", tx.amount)} Kč",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Bold,
                color = if (isIncome) Color(0xFF10B981) else MaterialTheme.colorScheme.onSurface
            )
        }
    }
}
