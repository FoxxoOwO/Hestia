package com.example.hestia.ui.screens.recipes

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
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hestia.data.models.*
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.theme.HestiaOrange
import com.example.hestia.theme.StatusGreen
import com.example.hestia.ui.components.EmptyStateCard
import kotlinx.coroutines.launch
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RecipesScreen(
    repository: HestiaRepository,
    modifier: Modifier = Modifier
) {
    val coroutineScope = rememberCoroutineScope()
    var recipes by remember { mutableStateOf<List<Recipe>>(emptyList()) }
    var pantryItems by remember { mutableStateOf<List<PantryItem>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var searchQuery by remember { mutableStateOf("") }
    var selectedRecipe by remember { mutableStateOf<Recipe?>(null) }
    var activeFilter by remember { mutableStateOf("all") } // "all", "can_cook", "favorites"
    var showAddDialog by remember { mutableStateOf(false) }
    var snackbarMessage by remember { mutableStateOf<String?>(null) }

    fun refreshRecipes() {
        coroutineScope.launch {
            isLoading = true
            repository.getRecipes().onSuccess { recipes = it }
            repository.getPantryItems().onSuccess { pantryItems = it }
            isLoading = false
        }
    }

    LaunchedEffect(Unit) {
        refreshRecipes()
    }

    fun canCookRecipe(recipe: Recipe): Boolean {
        if (recipe.ingredients.isEmpty()) return true
        val pantryNames = pantryItems.map { it.name.lowercase().trim() }
        return recipe.ingredients.all { ing ->
            val ingClean = ing.name.lowercase().trim()
            pantryNames.any { p -> p.contains(ingClean) || ingClean.contains(p) }
        }
    }

    val filteredRecipes = recipes.filter { recipe ->
        val matchesQuery = searchQuery.isBlank() ||
                recipe.title.contains(searchQuery, ignoreCase = true) ||
                recipe.tags.any { tag -> tag.contains(searchQuery, ignoreCase = true) }

        val matchesFilter = when (activeFilter) {
            "can_cook" -> canCookRecipe(recipe)
            "favorites" -> recipe.is_favorite
            else -> true
        }
        matchesQuery && matchesFilter
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background,
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddDialog = true },
                containerColor = HestiaOrange,
                contentColor = Color.White,
                shape = CircleShape
            ) {
                Icon(Icons.Default.Add, contentDescription = "Přidat recept")
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
    ) { padding ->
        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = HestiaOrange)
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(horizontal = 16.dp)
            ) {
                // Search bar
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Hledat v kuchařce...") },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                    trailingIcon = {
                        if (searchQuery.isNotEmpty()) {
                            IconButton(onClick = { searchQuery = "" }) {
                                Icon(Icons.Default.Clear, contentDescription = "Vymazat")
                            }
                        }
                    },
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 6.dp),
                    singleLine = true
                )

                // Filter Pills
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(
                        selected = activeFilter == "all",
                        onClick = { activeFilter = "all" },
                        label = { Text("Vše (${recipes.size})", fontSize = 11.sp) }
                    )
                    FilterChip(
                        selected = activeFilter == "can_cook",
                        onClick = { activeFilter = "can_cook" },
                        leadingIcon = { Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(12.dp)) },
                        label = { Text("Co mohu uvařit", fontSize = 11.sp) }
                    )
                    FilterChip(
                        selected = activeFilter == "favorites",
                        onClick = { activeFilter = "favorites" },
                        leadingIcon = { Icon(Icons.Default.Favorite, contentDescription = null, modifier = Modifier.size(12.dp)) },
                        label = { Text("Oblíbené", fontSize = 11.sp) }
                    )
                }

                Text(
                    text = "Kuchařka & Recepty (${filteredRecipes.size})",
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(vertical = 6.dp)
                )

                if (filteredRecipes.isEmpty()) {
                    EmptyStateCard(
                        message = if (searchQuery.isBlank()) "Zatím nemáte v kuchařce žádné recepty." else "Nebyly nalezeny žádné recepty odpovídající hledání.",
                        icon = Icons.Default.Restaurant
                    )
                } else {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(bottom = 80.dp)
                    ) {
                        items(filteredRecipes, key = { it.id }) { recipe ->
                            val canCook = canCookRecipe(recipe)

                            Card(
                                shape = RoundedCornerShape(14.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { selectedRecipe = recipe }
                            ) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(14.dp)
                                ) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                                Text(
                                                    text = recipe.title,
                                                    fontWeight = FontWeight.Bold,
                                                    fontSize = 16.sp
                                                )
                                                if (canCook) {
                                                    Surface(
                                                        shape = RoundedCornerShape(4.dp),
                                                        color = StatusGreen.copy(alpha = 0.15f)
                                                    ) {
                                                        Text(
                                                            text = "Lze uvařit",
                                                            fontSize = 10.sp,
                                                            fontWeight = FontWeight.Bold,
                                                            color = StatusGreen,
                                                            modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                                        )
                                                    }
                                                }
                                            }
                                        }

                                        IconButton(
                                            onClick = {
                                                coroutineScope.launch {
                                                    repository.toggleRecipeFavorite(recipe.id).onSuccess {
                                                        refreshRecipes()
                                                    }
                                                }
                                            },
                                            modifier = Modifier.size(28.dp)
                                        ) {
                                            Icon(
                                                imageVector = if (recipe.is_favorite) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                                                contentDescription = "Oblíbené",
                                                tint = if (recipe.is_favorite) Color(0xFFEF4444) else MaterialTheme.colorScheme.onSurfaceVariant,
                                                modifier = Modifier.size(20.dp)
                                            )
                                        }
                                    }

                                    if (!recipe.description.isNullOrBlank()) {
                                        Text(
                                            text = recipe.description,
                                            fontSize = 12.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                            maxLines = 2,
                                            modifier = Modifier.padding(top = 4.dp)
                                        )
                                    }

                                    Spacer(modifier = Modifier.height(8.dp))

                                    Row(
                                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.Schedule,
                                                contentDescription = null,
                                                modifier = Modifier.size(14.dp),
                                                tint = HestiaOrange
                                            )
                                            Text(
                                                text = "${recipe.total_time_minutes} min",
                                                fontSize = 12.sp,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }

                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.People,
                                                contentDescription = null,
                                                modifier = Modifier.size(14.dp),
                                                tint = MaterialTheme.colorScheme.primary
                                            )
                                            Text(
                                                text = "${recipe.default_servings} porce",
                                                fontSize = 12.sp,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }

                                        Surface(
                                            shape = RoundedCornerShape(6.dp),
                                            color = MaterialTheme.colorScheme.surfaceVariant
                                        ) {
                                            Text(
                                                text = when (recipe.difficulty) {
                                                    "easy" -> "Snadné"
                                                    "hard" -> "Náročné"
                                                    else -> "Střední"
                                                },
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.SemiBold,
                                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                            )
                                        }
                                    }

                                    if (recipe.tags.isNotEmpty()) {
                                        Spacer(modifier = Modifier.height(6.dp))
                                        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                            items(recipe.tags) { tag ->
                                                Surface(
                                                    shape = RoundedCornerShape(4.dp),
                                                    color = HestiaOrange.copy(alpha = 0.12f)
                                                ) {
                                                    Text(
                                                        text = "#$tag",
                                                        fontSize = 10.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        color = HestiaOrange,
                                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
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
        }
    }

    // Recipe detail with interactive PORTION SCALER
    selectedRecipe?.let { recipe ->
        var currentServings by remember(recipe) { mutableIntStateOf(recipe.default_servings) }
        var isAddingToShopping by remember { mutableStateOf(false) }

        val scaleFactor = currentServings.toDouble() / recipe.default_servings.toDouble()

        AlertDialog(
            onDismissRequest = { selectedRecipe = null },
            title = {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = recipe.title,
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        modifier = Modifier.weight(1f)
                    )
                    IconButton(
                        onClick = {
                            coroutineScope.launch {
                                repository.deleteRecipe(recipe.id).onSuccess {
                                    selectedRecipe = null
                                    refreshRecipes()
                                    snackbarMessage = "Recept smazán"
                                }
                            }
                        }
                    ) {
                        Icon(Icons.Default.Delete, contentDescription = "Smazat", tint = Color(0xFFEF4444))
                    }
                }
            },
            text = {
                LazyColumn(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    if (!recipe.description.isNullOrBlank()) {
                        item {
                            Text(
                                text = recipe.description,
                                fontSize = 13.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    // Interactive Portion Scaler
                    item {
                        Card(
                            shape = RoundedCornerShape(10.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Přepočet porcí:",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold
                                )

                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    IconButton(
                                        onClick = { if (currentServings > 1) currentServings-- },
                                        modifier = Modifier.size(32.dp)
                                    ) {
                                        Icon(Icons.Default.RemoveCircleOutline, contentDescription = "Méně")
                                    }

                                    Text(
                                        text = "$currentServings porcí",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp,
                                        color = HestiaOrange
                                    )

                                    IconButton(
                                        onClick = { if (currentServings < 25) currentServings++ },
                                        modifier = Modifier.size(32.dp)
                                    ) {
                                        Icon(Icons.Default.AddCircleOutline, contentDescription = "Více")
                                    }
                                }
                            }
                        }
                    }

                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Ingredience (${recipe.ingredients.size}):",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )

                            TextButton(
                                onClick = {
                                    coroutineScope.launch {
                                        isAddingToShopping = true
                                        recipe.ingredients.forEach { ing ->
                                            val scaledAmt = (ing.amount * scaleFactor).let { String.format(Locale.US, "%.1f", it).toDouble() }
                                            repository.createShoppingItem(
                                                ShoppingItemCreate(
                                                    name = ing.name,
                                                    amount = scaledAmt,
                                                    unit = ing.unit,
                                                    notes = "Z receptu: ${recipe.title}"
                                                )
                                            )
                                        }
                                        isAddingToShopping = false
                                        snackbarMessage = "Suroviny přidány do nákupního seznamu!"
                                    }
                                },
                                enabled = !isAddingToShopping
                            ) {
                                Icon(Icons.Default.AddShoppingCart, contentDescription = null, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Do nákupu", fontSize = 11.sp)
                            }
                        }
                    }

                    items(recipe.ingredients) { ing ->
                        val scaledAmount = (ing.amount * scaleFactor).let {
                            if (it % 1.0 == 0.0) it.toInt().toString() else String.format(Locale.US, "%.1f", it)
                        }

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 2.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(text = "• ${ing.name}", fontSize = 13.sp)
                            Text(
                                text = "$scaledAmount ${ing.unit}",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = HestiaOrange
                            )
                        }
                    }

                    if (recipe.instructions.isNotEmpty()) {
                        item {
                            Text(
                                text = "Postup přípravy:",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp,
                                modifier = Modifier.padding(top = 8.dp)
                            )
                        }

                        items(recipe.instructions) { step ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(20.dp)
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(HestiaOrange),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = "${step.step}",
                                        color = Color.White,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                                Text(
                                    text = step.text,
                                    fontSize = 13.sp,
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { selectedRecipe = null }) {
                    Text("Zavřít", color = HestiaOrange)
                }
            }
        )
    }

    // Add Recipe Dialog
    if (showAddDialog) {
        var newTitle by remember { mutableStateOf("") }
        var newDesc by remember { mutableStateOf("") }
        var newPrepTime by remember { mutableStateOf("15") }
        var newCookTime by remember { mutableStateOf("30") }
        var newServings by remember { mutableStateOf("4") }
        var newDifficulty by remember { mutableStateOf("medium") }
        var ingName by remember { mutableStateOf("") }
        var ingAmount by remember { mutableStateOf("1") }
        var ingUnit by remember { mutableStateOf("ks") }
        val newIngredients = remember { mutableStateListOf<RecipeIngredient>() }
        var stepText by remember { mutableStateOf("") }
        val newSteps = remember { mutableStateListOf<RecipeStep>() }

        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            title = { Text("Přidat nový recept", fontWeight = FontWeight.Bold) },
            text = {
                LazyColumn(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    item {
                        OutlinedTextField(
                            value = newTitle,
                            onValueChange = { newTitle = it },
                            label = { Text("Název receptu *") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }
                    item {
                        OutlinedTextField(
                            value = newDesc,
                            onValueChange = { newDesc = it },
                            label = { Text("Popis receptu") },
                            modifier = Modifier.fillMaxWidth(),
                            maxLines = 2
                        )
                    }
                    item {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(
                                value = newPrepTime,
                                onValueChange = { newPrepTime = it },
                                label = { Text("Příprava (min)") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                modifier = Modifier.weight(1f)
                            )
                            OutlinedTextField(
                                value = newCookTime,
                                onValueChange = { newCookTime = it },
                                label = { Text("Vaření (min)") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                modifier = Modifier.weight(1f)
                            )
                            OutlinedTextField(
                                value = newServings,
                                onValueChange = { newServings = it },
                                label = { Text("Porce") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }

                    // Ingredients
                    item {
                        Text("Ingredience (${newIngredients.size}):", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }
                    items(newIngredients) { ing ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("• ${ing.name}: ${ing.amount} ${ing.unit}", fontSize = 12.sp)
                            IconButton(onClick = { newIngredients.remove(ing) }, modifier = Modifier.size(24.dp)) {
                                Icon(Icons.Default.Close, contentDescription = "Smazat", modifier = Modifier.size(16.dp))
                            }
                        }
                    }
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            OutlinedTextField(
                                value = ingName,
                                onValueChange = { ingName = it },
                                placeholder = { Text("Surovina") },
                                modifier = Modifier.weight(1.5f),
                                singleLine = true
                            )
                            OutlinedTextField(
                                value = ingAmount,
                                onValueChange = { ingAmount = it },
                                placeholder = { Text("Množství") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )
                            OutlinedTextField(
                                value = ingUnit,
                                onValueChange = { ingUnit = it },
                                placeholder = { Text("Jedn.") },
                                modifier = Modifier.weight(0.8f),
                                singleLine = true
                            )
                            IconButton(
                                onClick = {
                                    if (ingName.isNotBlank()) {
                                        newIngredients.add(
                                            RecipeIngredient(
                                                name = ingName.trim(),
                                                amount = ingAmount.toDoubleOrNull() ?: 1.0,
                                                unit = ingUnit.trim().ifBlank { "ks" }
                                            )
                                        )
                                        ingName = ""
                                        ingAmount = "1"
                                    }
                                }
                            ) {
                                Icon(Icons.Default.Add, contentDescription = "Přidat surovinu", tint = HestiaOrange)
                            }
                        }
                    }

                    // Steps
                    item {
                        Text("Kroky postupu (${newSteps.size}):", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }
                    items(newSteps) { step ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("${step.step}. ${step.text}", fontSize = 12.sp, modifier = Modifier.weight(1f))
                            IconButton(onClick = { newSteps.remove(step) }, modifier = Modifier.size(24.dp)) {
                                Icon(Icons.Default.Close, contentDescription = "Smazat", modifier = Modifier.size(16.dp))
                            }
                        }
                    }
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            OutlinedTextField(
                                value = stepText,
                                onValueChange = { stepText = it },
                                placeholder = { Text("Krok přípravy...") },
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )
                            IconButton(
                                onClick = {
                                    if (stepText.isNotBlank()) {
                                        newSteps.add(RecipeStep(step = newSteps.size + 1, text = stepText.trim()))
                                        stepText = ""
                                    }
                                }
                            ) {
                                Icon(Icons.Default.Add, contentDescription = "Přidat krok", tint = HestiaOrange)
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (newTitle.isNotBlank()) {
                            coroutineScope.launch {
                                repository.createRecipe(
                                    RecipeCreate(
                                        title = newTitle.trim(),
                                        description = newDesc.trim().ifBlank { null },
                                        prep_time_minutes = newPrepTime.toIntOrNull() ?: 15,
                                        cook_time_minutes = newCookTime.toIntOrNull() ?: 30,
                                        default_servings = newServings.toIntOrNull() ?: 4,
                                        difficulty = newDifficulty,
                                        ingredients = newIngredients.toList(),
                                        instructions = newSteps.toList()
                                    )
                                ).onSuccess {
                                    showAddDialog = false
                                    refreshRecipes()
                                    snackbarMessage = "Recept byl úspěšně vytvořen!"
                                }
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = HestiaOrange)
                ) {
                    Text("Vytvořit recept")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddDialog = false }) {
                    Text("Zrušit")
                }
            }
        )
    }
}
