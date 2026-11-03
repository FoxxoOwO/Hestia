package com.example.hestia.ui.screens.recipes

import android.net.Uri
import android.util.Base64
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.clickable
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
fun RecipesScreen(repository: HestiaRepository) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    var recipes by remember { mutableStateOf<List<Recipe>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var search by remember { mutableStateOf("") }
    var difficulty by remember { mutableStateOf<String?>(null) }
    var priceLevel by remember { mutableStateOf<String?>(null) }
    var favoriteOnly by remember { mutableStateOf(false) }
    var maxTime by remember { mutableStateOf("") }
    var showForm by remember { mutableStateOf(false) }
    var editing by remember { mutableStateOf<Recipe?>(null) }
    var detail by remember { mutableStateOf<Recipe?>(null) }
    var deleteTarget by remember { mutableStateOf<Recipe?>(null) }
    var showAi by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }

    suspend fun load() {
        loading = true
        repository.getRecipes(
            query = search.ifBlank { null },
            difficulty = difficulty,
            priceLevel = priceLevel,
            maxTime = maxTime.toIntOrNull(),
            favoriteOnly = favoriteOnly.takeIf { it }
        ).onSuccess { recipes = it; error = null }.onFailure { error = it.friendly() }
        loading = false
    }

    LaunchedEffect(difficulty, priceLevel, favoriteOnly, search, maxTime) {
        if (search.isNotBlank() || maxTime.isNotBlank()) kotlinx.coroutines.delay(350)
        load()
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
                    val name = uri.lastPathSegment ?: "recept.txt"
                    repository.aiImportRecipeFile(name, Base64.encodeToString(bytes, Base64.NO_WRAP))
                        .onSuccess {
                            message = "AI naimportovala ${it.total} receptů"
                            load()
                        }
                        .onFailure { error = it.friendly() }
                }
            }
        }
    }

    Column(Modifier.fillMaxSize()) {
        Column(Modifier.padding(horizontal = 12.dp, vertical = 8.dp)) {
            HestiaField(search, { search = it }, "Hledat recept")
            Spacer(Modifier.height(6.dp))
            ChipSelector(Labels.difficulty, difficulty, { difficulty = it.ifBlank { null } }, includeAll = true)
            Spacer(Modifier.height(4.dp))
            ChipSelector(Labels.priceLevel, priceLevel, { priceLevel = it.ifBlank { null } }, includeAll = true)
            Spacer(Modifier.height(6.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                HestiaNumberField(maxTime, { maxTime = it }, "Max minut", Modifier.width(110.dp))
                Spacer(Modifier.width(8.dp))
                FilterChip(
                    selected = favoriteOnly,
                    onClick = { favoriteOnly = !favoriteOnly },
                    label = { Text("Oblíbené", fontSize = 11.sp) },
                    leadingIcon = { Icon(Icons.Default.Favorite, null, modifier = Modifier.size(14.dp)) }
                )
                Spacer(Modifier.weight(1f))
                TextButton(onClick = { showAi = true }) {
                    Icon(Icons.Default.AutoAwesome, null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("AI import", fontSize = 11.sp)
                }
            }
        }

        message?.let {
            Card(
                colors = CardDefaults.cardColors(containerColor = StatusGreen.copy(alpha = 0.15f)),
                modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 2.dp)
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
            if (recipes.isEmpty()) {
                item { EmptyState(Icons.Default.RestaurantMenu, "Žádné recepty", "Přidejte recept nebo použijte AI import.") }
            }
            items(recipes, key = { it.id }) { r ->
                RecipeCard(
                    recipe = r,
                    onOpen = { detail = r },
                    onFavorite = {
                        scope.launch { repository.toggleRecipeFavorite(r.id).onSuccess { load() } }
                    },
                    onEdit = { editing = r },
                    onDelete = { deleteTarget = r },
                    onAddToShopping = {
                        scope.launch {
                            repository.addRecipeToShopping(
                                r.id,
                                r.ingredients.map {
                                    AddFromRecipeIngredient(
                                        name = it.name, amount = it.amount, unit = it.unit, category = it.category
                                    )
                                }
                            ).onSuccess { message = "Ingredience přidány do nákupu" }
                                .onFailure { error = it.friendly() }
                        }
                    }
                )
            }
            item { Spacer(Modifier.height(90.dp)) }
        }
    }

    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.BottomEnd) {
        ExtendedFloatingActionButton(
            onClick = { showForm = true },
            containerColor = HestiaOrange,
            contentColor = Color.White,
            modifier = Modifier.padding(20.dp),
            icon = { Icon(Icons.Default.Add, null) },
            text = { Text("Recept") }
        )
    }

    if (showForm || editing != null) {
        RecipeFormDialog(
            initial = editing,
            onDismiss = { showForm = false; editing = null },
            onSave = { create ->
                scope.launch {
                    val current = editing
                    val res = if (current == null) repository.createRecipe(create)
                    else repository.updateRecipe(
                        current.id,
                        RecipeUpdate(
                            title = create.title, description = create.description,
                            image_url = create.image_url, prep_time_minutes = create.prep_time_minutes,
                            cook_time_minutes = create.cook_time_minutes, difficulty = create.difficulty,
                            price_level = create.price_level, default_servings = create.default_servings,
                            tags = create.tags, utensils = create.utensils,
                            ingredients = create.ingredients, instructions = create.instructions,
                            source_url = create.source_url
                        )
                    )
                    res.onSuccess { showForm = false; editing = null; load() }
                        .onFailure { error = it.friendly() }
                }
            }
        )
    }

    detail?.let { recipe ->
        RecipeDetailDialog(
            repository = repository,
            recipe = recipe,
            onDismiss = { detail = null },
            onAddToShopping = {
                scope.launch {
                    repository.addRecipeToShopping(
                        recipe.id,
                        recipe.ingredients.map {
                            AddFromRecipeIngredient(name = it.name, amount = it.amount, unit = it.unit, category = it.category)
                        }
                    ).onSuccess { message = "Ingredience přidány do nákupu"; detail = null }
                        .onFailure { error = it.friendly() }
                }
            }
        )
    }

    if (showAi) {
        AiRecipeDialog(
            onDismiss = { showAi = false },
            onPickFile = { showAi = false; fileLauncher.launch("*/*") },
            onImportUrl = { url ->
                scope.launch {
                    repository.aiImportRecipe(url = url).onSuccess { message = "Recept importován"; showAi = false; load() }
                        .onFailure { error = it.friendly() }
                }
            },
            onImportText = { text ->
                scope.launch {
                    repository.aiImportRecipe(rawText = text).onSuccess { message = "Recept importován"; showAi = false; load() }
                        .onFailure { error = it.friendly() }
                }
            }
        )
    }

    deleteTarget?.let { r ->
        ConfirmDialog(
            title = "Smazat recept",
            message = "Opravdu smazat „${r.title}“?",
            onConfirm = { scope.launch { repository.deleteRecipe(r.id).onSuccess { load() } } },
            onDismiss = { deleteTarget = null }
        )
    }
}

@Composable
private fun RecipeCard(
    recipe: Recipe,
    onOpen: () -> Unit,
    onFavorite: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
    onAddToShopping: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(14.dp),
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp).clickable(onClick = onOpen)
    ) {
        Column(Modifier.padding(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(recipe.title, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                    recipe.description?.let {
                        Text(it, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 2)
                    }
                }
                IconButton(onClick = onFavorite) {
                    Icon(
                        if (recipe.is_favorite) Icons.Filled.Favorite else Icons.Filled.FavoriteBorder,
                        "Oblíbené",
                        tint = if (recipe.is_favorite) StatusRed else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                recipe.total_time_minutes?.let { StatusPill("$it min", StatusBlue) }
                StatusPill(Labels.label(Labels.difficulty, recipe.difficulty), StatusGreen)
                StatusPill(Labels.label(Labels.priceLevel, recipe.price_level), StatusYellow)
                StatusPill("${recipe.default_servings} porce", MaterialTheme.colorScheme.onSurfaceVariant)
            }
            if (recipe.tags.isNotEmpty()) {
                Text(
                    recipe.tags.joinToString(" • "),
                    fontSize = 10.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                TextButton(onClick = onAddToShopping) { Text("Do nákupu", fontSize = 11.sp) }
                Spacer(Modifier.weight(1f))
                IconButton(onClick = onEdit, modifier = Modifier.size(32.dp)) {
                    Icon(Icons.Default.Edit, "Upravit", modifier = Modifier.size(16.dp))
                }
                IconButton(onClick = onDelete, modifier = Modifier.size(32.dp)) {
                    Icon(Icons.Default.Delete, "Smazat", tint = StatusRed, modifier = Modifier.size(16.dp))
                }
            }
        }
    }
}

@Composable
private fun RecipeDetailDialog(
    repository: HestiaRepository,
    recipe: Recipe,
    onDismiss: () -> Unit,
    onAddToShopping: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var servings by remember { mutableStateOf(recipe.default_servings.coerceAtLeast(1)) }
    var scaled by remember { mutableStateOf<ScaledRecipeResponse?>(null) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(servings) {
        repository.scaleRecipe(recipe.id, servings).onSuccess { scaled = it }.onFailure { error = it.friendly() }
    }

    DialogScaffold(
        title = recipe.title,
        onDismiss = onDismiss,
        confirmText = "Do nákupu",
        onConfirm = onAddToShopping
    ) {
        ErrorBox(error)
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("Porce", fontSize = 12.sp)
            Spacer(Modifier.width(8.dp))
            IconButton(onClick = { if (servings > 1) servings-- }, modifier = Modifier.size(28.dp)) {
                Icon(Icons.Default.Remove, null, modifier = Modifier.size(16.dp))
            }
            Text("$servings", fontWeight = FontWeight.Bold)
            IconButton(onClick = { servings++ }, modifier = Modifier.size(28.dp)) {
                Icon(Icons.Default.Add, null, modifier = Modifier.size(16.dp))
            }
            scaled?.let { Spacer(Modifier.weight(1f)); StatusPill("×${Fmt.number(it.scale_factor)}", StatusBlue) }
        }

        HorizontalDivider(Modifier.padding(vertical = 6.dp))
        Text("Ingredience", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
        val ing = scaled?.scaled_ingredients
        if (ing.isNullOrEmpty()) {
            recipe.ingredients.forEach { i ->
                IngredientRow(i.name, "${Fmt.number(i.amount)} ${i.unit}", false)
            }
        } else {
            ing.forEach { i ->
                IngredientRow(i.name, "${Fmt.number(i.scaled_amount)} ${i.unit}", i.is_in_pantry)
            }
        }

        HorizontalDivider(Modifier.padding(vertical = 6.dp))
        Text("Postup", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
        recipe.instructions.sortedBy { it.step }.forEach { s ->
            Row(Modifier.padding(vertical = 3.dp)) {
                Text("${s.step}.", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = HestiaOrange)
                Spacer(Modifier.width(6.dp))
                Column {
                    Text(s.text, fontSize = 12.sp)
                    s.timer_minutes?.let { Text("⏱ $it min", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                }
            }
        }
        if (recipe.utensils.isNotEmpty()) {
            Text("Nářadí: ${recipe.utensils.joinToString(", ")}", fontSize = 11.sp, modifier = Modifier.padding(top = 6.dp))
        }
    }
}

@Composable
private fun IngredientRow(name: String, amount: String, inPantry: Boolean) {
    Row(Modifier.fillMaxWidth().padding(vertical = 2.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(
            if (inPantry) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
            null,
            tint = if (inPantry) StatusGreen else MaterialTheme.colorScheme.outline,
            modifier = Modifier.size(14.dp)
        )
        Spacer(Modifier.width(6.dp))
        Text(name, fontSize = 12.sp, modifier = Modifier.weight(1f))
        Text(amount, fontSize = 12.sp, fontWeight = FontWeight.Medium)
    }
}

@Composable
private fun RecipeFormDialog(
    initial: Recipe?,
    onDismiss: () -> Unit,
    onSave: (RecipeCreate) -> Unit
) {
    var title by remember { mutableStateOf(initial?.title ?: "") }
    var description by remember { mutableStateOf(initial?.description ?: "") }
    var prep by remember { mutableStateOf(initial?.prep_time_minutes?.toString() ?: "0") }
    var cook by remember { mutableStateOf(initial?.cook_time_minutes?.toString() ?: "0") }
    var difficulty by remember { mutableStateOf(initial?.difficulty ?: "easy") }
    var price by remember { mutableStateOf(initial?.price_level ?: "low") }
    var servings by remember { mutableStateOf(initial?.default_servings?.toString() ?: "2") }
    var tags by remember { mutableStateOf(initial?.tags?.joinToString(", ") ?: "") }
    var utensils by remember { mutableStateOf(initial?.utensils?.joinToString(", ") ?: "") }
    var sourceUrl by remember { mutableStateOf(initial?.source_url ?: "") }
    val ingredients = remember {
        mutableStateListOf<RecipeIngredient>().apply {
            initial?.ingredients?.forEach { add(it) }
            if (isEmpty()) add(RecipeIngredient(name = "", amount = 1.0, unit = "g", category = "other"))
        }
    }
    val steps = remember {
        mutableStateListOf<RecipeStep>().apply {
            initial?.instructions?.forEach { add(it) }
            if (isEmpty()) add(RecipeStep(step = 1, text = ""))
        }
    }

    DialogScaffold(
        title = if (initial == null) "Nový recept" else "Upravit recept",
        onDismiss = onDismiss,
        confirmEnabled = title.isNotBlank() && ingredients.any { it.name.isNotBlank() },
        onConfirm = {
            onSave(
                RecipeCreate(
                    title = title.trim(),
                    description = description.ifBlank { null },
                    prep_time_minutes = prep.toIntOrNull() ?: 0,
                    cook_time_minutes = cook.toIntOrNull() ?: 0,
                    difficulty = difficulty,
                    price_level = price,
                    default_servings = servings.toIntOrNull() ?: 2,
                    tags = tags.split(",").map { it.trim() }.filter { it.isNotEmpty() },
                    utensils = utensils.split(",").map { it.trim() }.filter { it.isNotEmpty() },
                    source_url = sourceUrl.ifBlank { null },
                    ingredients = ingredients.filter { it.name.isNotBlank() },
                    instructions = steps.filter { it.text.isNotBlank() }
                        .mapIndexed { i, s -> s.copy(step = i + 1) }
                )
            )
        }
    ) {
        HestiaField(title, { title = it }, "Název")
        Spacer(Modifier.height(8.dp))
        HestiaField(description, { description = it }, "Popis", singleLine = false, minLines = 2)
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            HestiaNumberField(prep, { prep = it }, "Příprava (min)", Modifier.weight(1f))
            HestiaNumberField(cook, { cook = it }, "Vaření (min)", Modifier.weight(1f))
        }
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Column(Modifier.weight(1f)) {
                HestiaDropdown("Obtížnost", Labels.difficulty, difficulty, { difficulty = it })
            }
            Column(Modifier.weight(1f)) {
                HestiaDropdown("Cena", Labels.priceLevel, price, { price = it })
            }
        }
        Spacer(Modifier.height(8.dp))
        HestiaNumberField(servings, { servings = it }, "Porce")
        Spacer(Modifier.height(8.dp))
        HestiaField(tags, { tags = it }, "Štítky (oddělené čárkou)")
        Spacer(Modifier.height(8.dp))
        HestiaField(utensils, { utensils = it }, "Nářadí")
        Spacer(Modifier.height(8.dp))
        HestiaField(sourceUrl, { sourceUrl = it }, "Zdrojová URL")

        HorizontalDivider(Modifier.padding(vertical = 8.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Ingredience", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
            TextButton(onClick = {
                ingredients.add(RecipeIngredient(name = "", amount = 1.0, unit = "g", category = "other"))
            }) { Text("+ Přidat", fontSize = 11.sp) }
        }
        ingredients.forEachIndexed { index, ing ->
            Row(Modifier.fillMaxWidth().padding(vertical = 3.dp), verticalAlignment = Alignment.CenterVertically) {
                HestiaField(
                    ing.name, { v -> ingredients[index] = ing.copy(name = v) }, "Název",
                    Modifier.weight(1.4f)
                )
                Spacer(Modifier.width(4.dp))
                HestiaField(
                    if (ing.amount == 0.0) "" else Fmt.number(ing.amount),
                    { v -> ingredients[index] = ing.copy(amount = v.replace(",", ".").toDoubleOrNull() ?: 0.0) },
                    "Množ.", Modifier.weight(0.7f)
                )
                Spacer(Modifier.width(4.dp))
                HestiaField(
                    ing.unit, { v -> ingredients[index] = ing.copy(unit = v) }, "Jedn.", Modifier.weight(0.6f)
                )
                IconButton(onClick = { if (ingredients.size > 1) ingredients.removeAt(index) }, modifier = Modifier.size(30.dp)) {
                    Icon(Icons.Default.Close, null, modifier = Modifier.size(14.dp))
                }
            }
        }

        HorizontalDivider(Modifier.padding(vertical = 8.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Postup", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
            TextButton(onClick = { steps.add(RecipeStep(step = steps.size + 1, text = "")) }) {
                Text("+ Krok", fontSize = 11.sp)
            }
        }
        steps.forEachIndexed { index, s ->
            Row(Modifier.fillMaxWidth().padding(vertical = 3.dp), verticalAlignment = Alignment.Top) {
                Text("${index + 1}.", fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.padding(top = 14.dp))
                Spacer(Modifier.width(6.dp))
                HestiaField(
                    s.text, { v -> steps[index] = s.copy(text = v) }, "Krok",
                    Modifier.weight(1f), singleLine = false, minLines = 2
                )
                IconButton(onClick = { if (steps.size > 1) steps.removeAt(index) }, modifier = Modifier.size(30.dp)) {
                    Icon(Icons.Default.Close, null, modifier = Modifier.size(14.dp))
                }
            }
        }
    }
}

@Composable
private fun AiRecipeDialog(
    onDismiss: () -> Unit,
    onPickFile: () -> Unit,
    onImportUrl: (String) -> Unit,
    onImportText: (String) -> Unit
) {
    var mode by remember { mutableStateOf(0) }
    var url by remember { mutableStateOf("") }
    var text by remember { mutableStateOf("") }

    DialogScaffold(
        title = "AI import receptu",
        onDismiss = onDismiss,
        confirmText = "Importovat",
        confirmEnabled = if (mode == 0) url.isNotBlank() else text.isNotBlank(),
        onConfirm = { if (mode == 0) onImportUrl(url.trim()) else onImportText(text) }
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilterChip(selected = mode == 0, onClick = { mode = 0 }, label = { Text("Z URL", fontSize = 11.sp) })
            FilterChip(selected = mode == 1, onClick = { mode = 1 }, label = { Text("Z textu", fontSize = 11.sp) })
        }
        Spacer(Modifier.height(8.dp))
        if (mode == 0) {
            HestiaField(url, { url = it }, "URL receptu")
        } else {
            HestiaField(text, { text = it }, "Vložte text receptu", singleLine = false, minLines = 6)
        }
        Spacer(Modifier.height(10.dp))
        OutlinedButton(onClick = onPickFile, shape = RoundedCornerShape(10.dp), modifier = Modifier.fillMaxWidth()) {
            Icon(Icons.Default.UploadFile, null, modifier = Modifier.size(16.dp))
            Spacer(Modifier.width(6.dp))
            Text("Nahrát soubor (PDF, obrázek)", fontSize = 12.sp)
        }
    }
}
