package com.example.hestia.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hestia.theme.HestiaOrange
import com.example.hestia.theme.StatusGreen
import com.example.hestia.theme.StatusRed
import com.example.hestia.theme.StatusYellow
import com.example.hestia.util.Fmt

@Composable
fun HestiaField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    keyboardType: KeyboardType = KeyboardType.Text,
    singleLine: Boolean = true,
    minLines: Int = 1,
    enabled: Boolean = true,
    trailingIcon: (@Composable () -> Unit)? = null,
    supportingText: String? = null
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        placeholder = placeholder?.let { { Text(it) } },
        modifier = modifier.fillMaxWidth(),
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
        singleLine = singleLine,
        minLines = minLines,
        enabled = enabled,
        shape = RoundedCornerShape(12.dp),
        trailingIcon = trailingIcon,
        supportingText = supportingText?.let { { Text(it) } }
    )
}

@Composable
fun HestiaNumberField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    decimal: Boolean = false
) {
    HestiaField(
        value = value,
        onValueChange = { input ->
            val filtered = input.filter { it.isDigit() || (decimal && (it == '.' || it == ',')) }
            onValueChange(filtered.replace(',', '.'))
        },
        label = label,
        modifier = modifier,
        keyboardType = if (decimal) KeyboardType.Decimal else KeyboardType.Number
    )
}

@Composable
fun HestiaDropdown(
    label: String,
    options: List<Pair<String, String>>,
    selected: String?,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    var expanded by remember { mutableStateOf(false) }
    val selectedLabel = options.firstOrNull { it.first == selected }?.second ?: selected ?: "Vyberte"

    Box(modifier = modifier.fillMaxWidth()) {
        OutlinedTextField(
            value = selectedLabel,
            onValueChange = {},
            readOnly = true,
            enabled = enabled,
            label = { Text(label) },
            trailingIcon = {
                Icon(Icons.Default.ExpandMore, contentDescription = null)
            },
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier
                .fillMaxWidth()
                .clickable(enabled = enabled) { expanded = true }
        )
        // Transparent overlay so taps anywhere open the menu.
        Box(
            modifier = Modifier
                .matchParentSize()
                .clickable(enabled = enabled) { expanded = true }
        )
        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false },
            modifier = Modifier.heightIn(max = 380.dp)
        ) {
            options.forEach { (key, text) ->
                DropdownMenuItem(
                    text = { Text(text) },
                    onClick = {
                        onSelect(key)
                        expanded = false
                    },
                    leadingIcon = {
                        if (key == selected) Icon(Icons.Default.Check, contentDescription = null)
                    }
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DateField(
    label: String,
    value: String?,
    onValueChange: (String?) -> Unit,
    modifier: Modifier = Modifier,
    allowClear: Boolean = true
) {
    var showPicker by remember { mutableStateOf(false) }
    val pickerState = rememberDatePickerState(
        initialSelectedDateMillis = Fmt.millisFromIso(value)
    )

    HestiaField(
        value = value ?: "",
        onValueChange = { /* read-only, use picker */ },
        label = label,
        modifier = modifier,
        placeholder = "RRRR-MM-DD",
        trailingIcon = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (allowClear && !value.isNullOrBlank()) {
                    TextButton(onClick = { onValueChange(null) }) { Text("×") }
                }
                IconButton(onClick = { showPicker = true }) {
                    Icon(Icons.Default.CalendarMonth, contentDescription = "Vybrat datum")
                }
            }
        }
    )

    if (showPicker) {
        DatePickerDialog(
            onDismissRequest = { showPicker = false },
            confirmButton = {
                TextButton(onClick = {
                    pickerState.selectedDateMillis?.let { onValueChange(Fmt.isoFromMillis(it)) }
                    showPicker = false
                }) { Text("Potvrdit") }
            },
            dismissButton = {
                TextButton(onClick = { showPicker = false }) { Text("Zrušit") }
            }
        ) {
            DatePicker(state = pickerState)
        }
    }
}

@Composable
fun ChipSelector(
    options: List<Pair<String, String>>,
    selected: String?,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
    includeAll: Boolean = false,
    allLabel: String = "Vše"
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        if (includeAll) {
            FilterChip(
                selected = selected == null,
                onClick = { onSelect("") },
                label = { Text(allLabel) }
            )
        }
        options.forEach { (key, text) ->
            FilterChip(
                selected = selected == key,
                onClick = { onSelect(key) },
                label = { Text(text) }
            )
        }
    }
}

@Composable
fun MultiSelectChips(
    options: List<Pair<String, String>>,
    selected: Set<String>,
    onToggle: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    FlowRowCompat(modifier = modifier) {
        options.forEach { (key, text) ->
            FilterChip(
                selected = key in selected,
                onClick = { onToggle(key) },
                label = { Text(text) },
                modifier = Modifier.padding(end = 6.dp, bottom = 6.dp)
            )
        }
    }
}

/** Simple wrap-row using FlowRow from foundation layout (stable). */
@Composable
fun FlowRowCompat(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    androidx.compose.foundation.layout.FlowRow(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(0.dp),
        verticalArrangement = Arrangement.spacedBy(0.dp)
    ) {
        content()
    }
}

@Composable
fun ToggleRow(
    title: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    subtitle: String? = null
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clickable { onCheckedChange(!checked) }
            .padding(vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(title, fontWeight = FontWeight.Medium, fontSize = 14.sp)
            if (subtitle != null) {
                Text(
                    subtitle,
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
        Switch(checked = checked, onCheckedChange = onCheckedChange)
    }
}

@Composable
fun StatusPill(
    text: String,
    color: Color = StatusGreen,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .background(color.copy(alpha = 0.14f), RoundedCornerShape(50))
            .padding(horizontal = 8.dp, vertical = 3.dp)
    ) {
        Text(text, color = color, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
    }
}

fun statusColor(status: String?): Color = when (status) {
    "ok", "fresh", "active", "valid", "healthy", "safe", "taken", "success", "approved" -> StatusGreen
    "warning", "expiring_soon", "needs_attention", "mildly_toxic", "caution", "low" -> StatusYellow
    "expired", "sick", "toxic", "overdue", "critical", "high", "emergency", "rejected" -> StatusRed
    "watered_today", "in_repair" -> HestiaOrange
    else -> HestiaOrange
}

@Composable
fun InfoRow(label: String, value: String?, modifier: Modifier = Modifier) {
    if (value.isNullOrBlank()) return
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 3.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(
            value,
            fontSize = 13.sp,
            fontWeight = FontWeight.Medium,
            modifier = Modifier.padding(start = 12.dp)
        )
    }
}

@Composable
fun SectionCard(
    title: String? = null,
    modifier: Modifier = Modifier,
    actionText: String? = null,
    onAction: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.55f)),
        modifier = modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            if (title != null) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(title, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    if (actionText != null && onAction != null) {
                        TextButton(onClick = onAction) { Text(actionText, fontSize = 12.sp) }
                    }
                }
                Spacer(Modifier.height(6.dp))
            }
            content()
        }
    }
}

@Composable
fun ConfirmDialog(
    title: String,
    message: String,
    confirmLabel: String = "Smazat",
    destructive: Boolean = true,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
        text = { Text(message) },
        confirmButton = {
            TextButton(onClick = {
                onConfirm()
                onDismiss()
            }) {
                Text(confirmLabel, color = if (destructive) StatusRed else HestiaOrange)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Zrušit") }
        }
    )
}

@Composable
fun LoadingBox(modifier: Modifier = Modifier) {
    Box(modifier = modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
        CircularProgressIndicator(color = HestiaOrange)
    }
}

@Composable
fun ErrorBox(message: String?, onRetry: (() -> Unit)? = null) {
    if (message.isNullOrBlank()) return
    Card(
        colors = CardDefaults.cardColors(containerColor = StatusRed.copy(alpha = 0.1f)),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp)
    ) {
        Column(Modifier.padding(12.dp)) {
            Text(message, fontSize = 12.sp, color = StatusRed)
            if (onRetry != null) {
                TextButton(onClick = onRetry, contentPadding = PaddingValues(0.dp)) {
                    Text("Zkusit znovu", fontSize = 12.sp)
                }
            }
        }
    }
}

@Composable
fun PrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    loading: Boolean = false
) {
    Button(
        onClick = onClick,
        modifier = modifier.fillMaxWidth().height(48.dp),
        enabled = enabled && !loading,
        shape = RoundedCornerShape(12.dp),
        colors = ButtonDefaults.buttonColors(containerColor = HestiaOrange)
    ) {
        if (loading) {
            CircularProgressIndicator(
                modifier = Modifier.size(20.dp),
                strokeWidth = 2.dp,
                color = Color.White
            )
        } else {
            Text(text, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
fun ProgressRow(
    label: String,
    value: Double,
    max: Double,
    modifier: Modifier = Modifier,
    color: Color = HestiaOrange,
    trailing: String? = null
) {
    val fraction = if (max <= 0) 0f else (value / max).coerceIn(0.0, 1.0).toFloat()
    Column(modifier = modifier.fillMaxWidth().padding(vertical = 4.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(label, fontSize = 12.sp, fontWeight = FontWeight.Medium)
            Text(trailing ?: Fmt.money(value), fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Spacer(Modifier.height(4.dp))
        LinearProgressIndicator(
            progress = { fraction },
            modifier = Modifier.fillMaxWidth().height(7.dp),
            color = color,
            trackColor = color.copy(alpha = 0.15f)
        )
    }
}

@Composable
fun DialogScaffold(
    title: String,
    onDismiss: () -> Unit,
    confirmText: String = "Uložit",
    confirmEnabled: Boolean = true,
    loading: Boolean = false,
    onConfirm: () -> Unit,
    content: @Composable ColumnScope.() -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title, fontWeight = FontWeight.Bold, fontSize = 18.sp) },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
            ) {
                content()
            }
        },
        confirmButton = {
            TextButton(onClick = onConfirm, enabled = confirmEnabled && !loading) {
                Text(confirmText, color = HestiaOrange, fontWeight = FontWeight.SemiBold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !loading) { Text("Zrušit") }
        }
    )
}

@Composable
fun ExpandableCard(
    title: String,
    subtitle: String? = null,
    initiallyExpanded: Boolean = false,
    content: @Composable ColumnScope.() -> Unit
) {
    var expanded by remember { mutableStateOf(initiallyExpanded) }
    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)
    ) {
        Column {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { expanded = !expanded }
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(Modifier.weight(1f)) {
                    Text(title, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    if (subtitle != null) {
                        Text(
                            subtitle,
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                Icon(Icons.Default.ExpandMore, contentDescription = null)
            }
            if (expanded) {
                Column(Modifier.padding(start = 12.dp, end = 12.dp, bottom = 12.dp)) {
                    content()
                }
            }
        }
    }
}

@Composable
fun EmptyState(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String? = null,
    action: (@Composable () -> Unit)? = null
) {
    Column(
        modifier = Modifier.fillMaxWidth().padding(36.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(icon, contentDescription = null, tint = HestiaOrange, modifier = Modifier.size(44.dp))
        Spacer(Modifier.height(10.dp))
        Text(title, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
        if (subtitle != null) {
            Spacer(Modifier.height(4.dp))
            Text(
                subtitle,
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )
        }
        if (action != null) {
            Spacer(Modifier.height(10.dp))
            action()
        }
    }
}
