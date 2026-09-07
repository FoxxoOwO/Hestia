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
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.ui.platform.LocalContext
import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.provider.OpenableColumns
import android.util.Base64
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
    var showGeminiDialog by remember { mutableStateOf(false) }
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

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 6.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Kuchařka & Recepty (${filteredRecipes.size})",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold
                    )

                    FilledTonalButton(
                        onClick = { showGeminiDialog = true },
                        colors = ButtonDefaults.filledTonalButtonColors(
                            containerColor = HestiaOrange.copy(alpha = 0.15f),
                            contentColor = HestiaOrange
                        ),
                        shape = RoundedCornerShape(10.dp),
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Icon(Icons.Default.AutoAwesome, contentDescription = null, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Gemini AI", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }

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

    // Gemini AI Import Dialog
    if (showGeminiDialog) {
        val context = LocalContext.current
        var importUrl by remember { mutableStateOf("") }
        var importText by remember { mutableStateOf("") }
        var importType by remember { mutableStateOf("url") } // "url", "text", or "file"
        var selectedFileName by remember { mutableStateOf<String?>(null) }
        var selectedFileBase64 by remember { mutableStateOf<String?>(null) }
        var selectedFileSize by remember { mutableStateOf<Long?>(null) }
        var isAnalyzing by remember { mutableStateOf(false) }
        var isSaving by remember { mutableStateOf(false) }
        var extractedRecipes by remember { mutableStateOf<List<GeminiExtractedRecipe>>(emptyList()) }
        var selectedIndices by remember { mutableStateOf<Set<Int>>(emptySet()) }
        var importError by remember { mutableStateOf<String?>(null) }

        val filePickerLauncher = rememberLauncherForActivityResult(
            contract = ActivityResultContracts.StartActivityForResult()
        ) { result ->
            if (result.resultCode == Activity.RESULT_OK) {
                val uri: Uri? = result.data?.data
                uri?.let {
                    try {
                        var name = "recipe_file"
                        var size = 0L
                        context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                            val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                            val sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE)
                            if (cursor.moveToFirst()) {
                                if (nameIndex >= 0) name = cursor.getString(nameIndex)
                                if (sizeIndex >= 0) size = cursor.getLong(sizeIndex)
                            }
                        }
                        val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
                        if (bytes != null) {
                            selectedFileName = name
                            selectedFileSize = if (size > 0) size else bytes.size.toLong()
                            selectedFileBase64 = Base64.encodeToString(bytes, Base64.NO_WRAP)
                            importError = null
                        }
                    } catch (e: Exception) {
                        importError = "Chyba při čtení souboru: ${e.message}"
                    }
                }
            }
        }

        fun openFileSelector() {
            val openDocIntent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                type = "*/*"
            }
            try {
                filePickerLauncher.launch(openDocIntent)
            } catch (_: Exception) {
                val getContentIntent = Intent(Intent.ACTION_GET_CONTENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "*/*"
                }
                filePickerLauncher.launch(Intent.createChooser(getContentIntent, "Vyberte soubor receptu"))
            }
        }

        AlertDialog(
            onDismissRequest = {
                if (!isAnalyzing && !isSaving) showGeminiDialog = false
            },
            title = {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = HestiaOrange)
                    Text("Import s Gemini AI", fontWeight = FontWeight.Bold, fontSize = 17.sp)
                }
            },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    if (extractedRecipes.isEmpty()) {
                        Text(
                            "Vložte odkaz, text receptu nebo nahrajte soubor (PDF, CSV, HTML, RTF, obrázek, ZIP).",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            FilterChip(
                                selected = importType == "url",
                                onClick = { importType = "url" },
                                label = { Text("Z URL", fontSize = 11.sp) },
                                modifier = Modifier.weight(1f)
                            )
                            FilterChip(
                                selected = importType == "text",
                                onClick = { importType = "text" },
                                label = { Text("Z textu", fontSize = 11.sp) },
                                modifier = Modifier.weight(1f)
                            )
                            FilterChip(
                                selected = importType == "file",
                                onClick = { importType = "file" },
                                label = { Text("Ze souboru", fontSize = 11.sp) },
                                modifier = Modifier.weight(1f)
                            )
                        }

                        if (importType == "url") {
                            OutlinedTextField(
                                value = importUrl,
                                onValueChange = { importUrl = it; importError = null },
                                label = { Text("URL adresa receptu") },
                                placeholder = { Text("https://www.recepty.cz/...") },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth()
                            )
                        } else if (importType == "text") {
                            OutlinedTextField(
                                value = importText,
                                onValueChange = { importText = it; importError = null },
                                label = { Text("Text receptu") },
                                placeholder = { Text("Vložte text se surovinami a postupem...") },
                                minLines = 3,
                                maxLines = 6,
                                modifier = Modifier.fillMaxWidth()
                            )
                        } else {
                            Card(
                                onClick = { openFileSelector() },
                                colors = CardDefaults.cardColors(
                                    containerColor = if (selectedFileName != null) HestiaOrange.copy(alpha = 0.08f) else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                                ),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(
                                    modifier = Modifier.padding(14.dp).fillMaxWidth(),
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Icon(
                                        if (selectedFileName != null) Icons.Default.Description else Icons.Default.UploadFile,
                                        contentDescription = null,
                                        tint = HestiaOrange,
                                        modifier = Modifier.size(32.dp)
                                    )
                                    if (selectedFileName != null) {
                                        Text(
                                            text = selectedFileName!!,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.sp,
                                            color = HestiaOrange
                                        )
                                        val sizeKb = (selectedFileSize ?: 0L) / 1024
                                        Text(
                                            text = "$sizeKb KB • Klepnutím změnit",
                                            fontSize = 11.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    } else {
                                        Text(
                                            text = "Klepněte pro výběr souboru",
                                            fontWeight = FontWeight.Medium,
                                            fontSize = 13.sp
                                        )
                                        Text(
                                            text = "PDF, CSV, HTML, RTF, JPG/PNG, ZIP",
                                            fontSize = 10.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                            }
                        }

                        if (importError != null) {
                            Text(
                                text = importError!!,
                                color = MaterialTheme.colorScheme.error,
                                fontSize = 12.sp
                            )
                        }
                    } else if (extractedRecipes.size == 1) {
                        val ext = extractedRecipes.first()
                        Card(
                            colors = CardDefaults.cardColors(
                                containerColor = HestiaOrange.copy(alpha = 0.08f)
                            ),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text(
                                    text = "✨ ${ext.title}",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp,
                                    color = HestiaOrange
                                )
                                if (!ext.description.isNullOrBlank()) {
                                    Text(text = ext.description, fontSize = 12.sp, maxLines = 2)
                                }
                                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                    Text("⏱️ ${ext.prep_time_minutes + ext.cook_time_minutes} min", fontSize = 11.sp)
                                    Text("👥 ${ext.default_servings} porce", fontSize = 11.sp)
                                    Text("📊 ${ext.difficulty}", fontSize = 11.sp)
                                }
                                Text(
                                    text = "Rozpoznáno: ${ext.ingredients.size} surovin, ${ext.instructions.size} kroků.",
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    } else {
                        // Multiple recipes batch preview
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Nalezeno ${extractedRecipes.size} receptů (${selectedIndices.size} vybráno):",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp
                                )
                                TextButton(
                                    onClick = {
                                        selectedIndices = if (selectedIndices.size == extractedRecipes.size) emptySet() else extractedRecipes.indices.toSet()
                                    },
                                    contentPadding = PaddingValues(horizontal = 4.dp, vertical = 0.dp)
                                ) {
                                    Text(
                                        if (selectedIndices.size == extractedRecipes.size) "Zrušit výběr" else "Vybrat vše",
                                        fontSize = 11.sp,
                                        color = HestiaOrange
                                    )
                                }
                            }

                            Column(
                                modifier = Modifier.fillMaxWidth(),
                                verticalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                extractedRecipes.forEachIndexed { idx, ext ->
                                    val isChecked = selectedIndices.contains(idx)
                                    Card(
                                        onClick = {
                                            selectedIndices = if (isChecked) selectedIndices - idx else selectedIndices + idx
                                        },
                                        colors = CardDefaults.cardColors(
                                            containerColor = if (isChecked) HestiaOrange.copy(alpha = 0.08f) else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
                                        ),
                                        shape = RoundedCornerShape(10.dp),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(8.dp),
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            Checkbox(
                                                checked = isChecked,
                                                onCheckedChange = {
                                                    selectedIndices = if (it) selectedIndices + idx else selectedIndices - idx
                                                },
                                                colors = CheckboxDefaults.colors(checkedColor = HestiaOrange)
                                            )
                                            Column(modifier = Modifier.weight(1f)) {
                                                Text(
                                                    text = ext.title,
                                                    fontWeight = FontWeight.Bold,
                                                    fontSize = 13.sp,
                                                    maxLines = 1
                                                )
                                                Text(
                                                    text = "${ext.prep_time_minutes + ext.cook_time_minutes} min • ${ext.ingredients.size} surovin • ${ext.instructions.size} kroků",
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
            },
            confirmButton = {
                if (extractedRecipes.isEmpty()) {
                    Button(
                        onClick = {
                            val url = if (importType == "url") importUrl.trim().ifBlank { null } else null
                            val text = if (importType == "text") importText.trim().ifBlank { null } else null
                            val fileB64 = if (importType == "file") selectedFileBase64 else null

                            if (url == null && text == null && fileB64 == null) {
                                importError = if (importType == "file") "Vyberte prosím soubor k importu." else "Zadejte URL nebo vložte text receptu."
                                return@Button
                            }

                            coroutineScope.launch {
                                isAnalyzing = true
                                importError = null

                                if (importType == "file") {
                                    repository.aiImportRecipeFile(
                                        filename = selectedFileName ?: "soubor",
                                        fileBase64 = fileB64!!
                                    ).onSuccess { res ->
                                        if (res.recipes.isEmpty()) {
                                            importError = "V souboru nebyl nalezen žádný recept."
                                        } else {
                                            extractedRecipes = res.recipes
                                            selectedIndices = res.recipes.indices.toSet()
                                        }
                                        isAnalyzing = false
                                    }.onFailure { err ->
                                        isAnalyzing = false
                                        importError = err.message ?: "Chyba při analýze souboru."
                                    }
                                } else {
                                    repository.aiImportRecipe(url = url, rawText = text)
                                        .onSuccess {
                                            extractedRecipes = listOf(it)
                                            selectedIndices = setOf(0)
                                            isAnalyzing = false
                                        }
                                        .onFailure { err ->
                                            isAnalyzing = false
                                            importError = err.message ?: "Chyba při analýze receptu pomocí AI."
                                        }
                                }
                            }
                        },
                        enabled = !isAnalyzing && ((importType == "url" && importUrl.isNotBlank()) || (importType == "text" && importText.isNotBlank()) || (importType == "file" && selectedFileBase64 != null)),
                        colors = ButtonDefaults.buttonColors(containerColor = HestiaOrange)
                    ) {
                        if (isAnalyzing) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Analyzuji...")
                        } else {
                            Icon(Icons.Default.AutoAwesome, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Analyzovat")
                        }
                    }
                } else {
                    Button(
                        onClick = {
                            coroutineScope.launch {
                                isSaving = true
                                val toSave = extractedRecipes.filterIndexed { idx, _ -> selectedIndices.contains(idx) }
                                var savedCount = 0
                                for (ext in toSave) {
                                    repository.createRecipe(
                                        RecipeCreate(
                                            title = ext.title,
                                            description = ext.description?.ifBlank { null },
                                            image_url = ext.image_url?.ifBlank { null },
                                            prep_time_minutes = ext.prep_time_minutes,
                                            cook_time_minutes = ext.cook_time_minutes,
                                            difficulty = ext.difficulty,
                                            price_level = ext.price_level,
                                            default_servings = ext.default_servings,
                                            tags = ext.tags,
                                            ingredients = ext.ingredients,
                                            instructions = ext.instructions
                                        )
                                    )
                                    savedCount++
                                }
                                isSaving = false
                                showGeminiDialog = false
                                refreshRecipes()
                                snackbarMessage = if (savedCount == 1) {
                                    "Recept \"${toSave.first().title}\" byl úspěšně naimportován přes Gemini AI!"
                                } else {
                                    "Úspěšně naimportováno $savedCount receptů z celkových ${extractedRecipes.size}!"
                                }
                            }
                        },
                        enabled = !isSaving && selectedIndices.isNotEmpty(),
                        colors = ButtonDefaults.buttonColors(containerColor = HestiaOrange)
                    ) {
                        if (isSaving) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(16.dp))
                        } else {
                            Text(
                                if (extractedRecipes.size > 1) "Uložit vybrané (${selectedIndices.size})" else "Uložit do kuchařky"
                            )
                        }
                    }
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        if (extractedRecipes.isNotEmpty()) {
                            extractedRecipes = emptyList()
                            selectedIndices = emptySet()
                        } else {
                            showGeminiDialog = false
                        }
                    }
                ) {
                    Text(if (extractedRecipes.isNotEmpty()) "Zpět" else "Zrušit")
                }
            }
        )
    }
}
