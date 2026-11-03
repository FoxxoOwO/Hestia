package com.example.hestia.ui.screens.mealplanner

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hestia.data.models.*
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.theme.HestiaOrange
import com.example.hestia.theme.StatusBlue
import com.example.hestia.theme.StatusGreen
import com.example.hestia.theme.StatusRed
import com.example.hestia.ui.components.*
import com.example.hestia.util.Fmt
import com.example.hestia.util.Labels
import com.example.hestia.util.friendly
import kotlinx.coroutines.launch

@Composable
fun MealPlannerScreen(repository: HestiaRepository) {
    val scope = rememberCoroutineScope()
    var weekStart by remember { mutableStateOf(Fmt.weekStart(Fmt.today())) }
    var items by remember { mutableStateOf<List<MealPlanItem>>(emptyList()) }
    var recipes by remember { mutableStateOf<List<Recipe>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var message by remember { mutableStateOf<String?>(null) }
    var addDialogDate by remember { mutableStateOf<String?>(null) }
    var editing by remember { mutableStateOf<MealPlanItem?>(null) }

    val weekDates = remember(weekStart) { Fmt.weekDates(weekStart) }
    val weekEnd = weekDates.lastOrNull() ?: weekStart

    suspend fun load() {
        loading = true
        repository.getMealPlans(weekStart, weekEnd)
            .onSuccess { items = it; error = null }
            .onFailure { error = it.friendly() }
        loading = false
    }

    LaunchedEffect(weekStart) { load() }
    LaunchedEffect(Unit) { repository.getRecipes().onSuccess { recipes = it } }

    Column(Modifier.fillMaxSize()) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = { weekStart = Fmt.addDays(weekStart, -7) }) {
                Icon(Icons.Default.ChevronLeft, "Předchozí")
            }
            Column(Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
                Text("Týden", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                Text(
                    "${Fmt.date(weekStart)} – ${Fmt.date(weekEnd)}",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            IconButton(onClick = { weekStart = Fmt.addDays(weekStart, 7) }) {
                Icon(Icons.Default.ChevronRight, "Další")
            }
            IconButton(onClick = { weekStart = Fmt.weekStart(Fmt.today()) }) {
                Icon(Icons.Default.Today, "Tento týden")
            }
        }

        Row(Modifier.padding(horizontal = 12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(
                onClick = {
                    scope.launch {
                        repository.generateShoppingFromMealPlan(weekStart, weekEnd, true)
                            .onSuccess { r ->
                                message = "Přidáno ${r.added_items_count} položek" +
                                    if (r.already_in_pantry_count > 0) " (${r.already_in_pantry_count} už ve spíži)" else ""
                            }
                            .onFailure { error = it.friendly() }
                    }
                },
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.weight(1f),
                contentPadding = PaddingValues(vertical = 6.dp)
            ) {
                Icon(Icons.Default.ShoppingCart, null, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(6.dp))
                Text("Nákup z jídelníčku", fontSize = 12.sp)
            }
        }

        message?.let {
            Card(
                colors = CardDefaults.cardColors(containerColor = StatusGreen.copy(alpha = 0.15f)),
                modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 4.dp)
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
            LazyColumn(
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                weekDates.forEach { date ->
                    item(key = "header-$date") {
                        val isToday = date == Fmt.today()
                        Row(
                            Modifier.fillMaxWidth().padding(top = 10.dp, bottom = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                "${Fmt.dayName(date)} ${Fmt.date(date)}",
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp,
                                color = if (isToday) HestiaOrange else MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(Modifier.weight(1f))
                            IconButton(onClick = { addDialogDate = date }, modifier = Modifier.size(26.dp)) {
                                Icon(Icons.Default.Add, "Přidat jídlo", tint = HestiaOrange, modifier = Modifier.size(16.dp))
                            }
                        }
                    }
                    val dayItems = items.filter { it.date == date }
                    if (dayItems.isEmpty()) {
                        item(key = "empty-$date") {
                            Text(
                                "Bez jídla",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(start = 4.dp, bottom = 6.dp)
                            )
                        }
                    }
                    items(dayItems.size, key = { idx -> "meal-$date-${dayItems[idx].id}" }) { idx ->
                        val meal = dayItems[idx]
                        MealCard(
                            meal = meal,
                            onToggleCooked = {
                                scope.launch {
                                    repository.toggleMealPlanCooked(meal.id).onSuccess { load() }
                                }
                            },
                            onEdit = { editing = meal },
                            onDelete = {
                                scope.launch { repository.deleteMealPlanItem(meal.id).onSuccess { load() } }
                            }
                        )
                    }
                }
                item { Spacer(Modifier.height(90.dp)) }
            }
        }
    }

    if (addDialogDate != null || editing != null) {
        MealFormDialog(
            initial = editing,
            date = addDialogDate ?: editing?.date ?: Fmt.today(),
            recipes = recipes,
            onDismiss = { addDialogDate = null; editing = null },
            onSave = { create ->
                scope.launch {
                    val current = editing
                    val res = if (current == null) repository.createMealPlanItem(create)
                    else repository.updateMealPlanItem(
                        current.id,
                        MealPlanItemUpdate(
                            date = create.date, meal_type = create.meal_type, recipe_id = create.recipe_id,
                            custom_title = create.custom_title, servings = create.servings,
                            notes = create.notes, is_cooked = create.is_cooked
                        )
                    )
                    res.onSuccess { addDialogDate = null; editing = null; load() }
                        .onFailure { error = it.friendly() }
                }
            }
        )
    }
}

@Composable
private fun MealCard(
    meal: MealPlanItem,
    onToggleCooked: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    Card(shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp)) {
        Row(Modifier.padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier
                    .size(width = 4.dp, height = 34.dp)
                    .background(
                        when (meal.meal_type) {
                            "breakfast" -> StatusBlue
                            "lunch" -> HestiaOrange
                            "dinner" -> StatusGreen
                            else -> MaterialTheme.colorScheme.outline
                        },
                        RoundedCornerShape(2.dp)
                    )
            )
            Spacer(Modifier.width(8.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    meal.displayTitle,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                    textDecoration = if (meal.is_cooked) androidx.compose.ui.text.style.TextDecoration.LineThrough else null
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        Labels.label(Labels.mealTypes, meal.meal_type),
                        fontSize = 10.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(" • ${meal.servings} porce", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    meal.recipe_prep_time?.let {
                        Text(" • ${(it + (meal.recipe_cook_time ?: 0))} min", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
                meal.notes?.takeIf { it.isNotBlank() }?.let {
                    Text(it, fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            IconButton(onClick = onToggleCooked, modifier = Modifier.size(30.dp)) {
                Icon(
                    if (meal.is_cooked) Icons.Filled.CheckCircle else Icons.Outlined.CheckCircle,
                    "Uvařeno",
                    tint = if (meal.is_cooked) StatusGreen else MaterialTheme.colorScheme.outline,
                    modifier = Modifier.size(18.dp)
                )
            }
            IconButton(onClick = onEdit, modifier = Modifier.size(30.dp)) {
                Icon(Icons.Default.Edit, "Upravit", modifier = Modifier.size(15.dp))
            }
            IconButton(onClick = onDelete, modifier = Modifier.size(30.dp)) {
                Icon(Icons.Default.Delete, "Smazat", tint = StatusRed, modifier = Modifier.size(15.dp))
            }
        }
    }
}

@Composable
private fun MealFormDialog(
    initial: MealPlanItem?,
    date: String,
    recipes: List<Recipe>,
    onDismiss: () -> Unit,
    onSave: (MealPlanItemCreate) -> Unit
) {
    var selectedDate by remember { mutableStateOf(initial?.date ?: date) }
    var mealType by remember { mutableStateOf(initial?.meal_type ?: "dinner") }
    var custom by remember { mutableStateOf(initial?.custom_title ?: "") }
    var recipeId by remember { mutableStateOf(initial?.recipe_id) }
    var servings by remember { mutableStateOf(initial?.servings?.toString() ?: "4") }
    var notes by remember { mutableStateOf(initial?.notes ?: "") }
    var recipePicker by remember { mutableStateOf(false) }

    val recipeTitle = recipes.firstOrNull { it.id == recipeId }?.title

    DialogScaffold(
        title = if (initial == null) "Přidat jídlo" else "Upravit jídlo",
        onDismiss = onDismiss,
        confirmEnabled = recipeId != null || custom.isNotBlank(),
        onConfirm = {
            onSave(
                MealPlanItemCreate(
                    date = selectedDate,
                    meal_type = mealType,
                    recipe_id = recipeId,
                    custom_title = custom.ifBlank { null },
                    servings = servings.toIntOrNull() ?: 4,
                    notes = notes.ifBlank { null },
                    is_cooked = initial?.is_cooked ?: false
                )
            )
        }
    ) {
        DateField("Datum", selectedDate, { selectedDate = it ?: selectedDate })
        Spacer(Modifier.height(8.dp))
        HestiaDropdown("Jídlo", Labels.mealTypes, mealType, { mealType = it })
        Spacer(Modifier.height(8.dp))
        OutlinedButton(onClick = { recipePicker = true }, shape = RoundedCornerShape(10.dp), modifier = Modifier.fillMaxWidth()) {
            Icon(Icons.Default.RestaurantMenu, null, modifier = Modifier.size(16.dp))
            Spacer(Modifier.width(6.dp))
            Text(recipeTitle ?: "Vybrat recept", fontSize = 12.sp)
        }
        if (recipeId != null) {
            TextButton(onClick = { recipeId = null }) { Text("Odebrat recept", fontSize = 11.sp) }
        }
        Spacer(Modifier.height(4.dp))
        HestiaField(custom, { custom = it }, "Vlastní název (nepovinné)")
        Spacer(Modifier.height(8.dp))
        HestiaNumberField(servings, { servings = it }, "Porce")
        Spacer(Modifier.height(8.dp))
        HestiaField(notes, { notes = it }, "Poznámky", singleLine = false, minLines = 2)
    }

    if (recipePicker) {
        var search by remember { mutableStateOf("") }
        val filtered = recipes.filter { search.isBlank() || it.title.contains(search, true) }
        AlertDialog(
            onDismissRequest = { recipePicker = false },
            title = { Text("Vybrat recept", fontSize = 15.sp) },
            text = {
                Column(Modifier.heightIn(max = 380.dp)) {
                    HestiaField(search, { search = it }, "Hledat")
                    Spacer(Modifier.height(6.dp))
                    LazyColumn {
                        items(filtered.size) { i ->
                            val r = filtered[i]
                            Row(
                                Modifier.fillMaxWidth().clickable { recipeId = r.id; recipePicker = false }
                                    .padding(vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(r.title, fontSize = 13.sp, modifier = Modifier.weight(1f))
                                if (r.is_favorite) Icon(Icons.Default.Favorite, null, tint = StatusRed, modifier = Modifier.size(14.dp))
                            }
                            HorizontalDivider()
                        }
                    }
                }
            },
            confirmButton = { TextButton(onClick = { recipePicker = false }) { Text("Zavřít") } }
        )
    }
}
