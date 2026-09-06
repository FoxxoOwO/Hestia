package com.example.hestia.ui.screens.recipes

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
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
import com.example.hestia.data.models.Recipe
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.theme.HestiaOrange
import com.example.hestia.ui.components.EmptyStateCard
import kotlinx.coroutines.launch

@Composable
fun RecipesScreen(
    repository: HestiaRepository,
    modifier: Modifier = Modifier
) {
    val coroutineScope = rememberCoroutineScope()
    var recipes by remember { mutableStateOf<List<Recipe>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var searchQuery by remember { mutableStateOf("") }
    var selectedRecipe by remember { mutableStateOf<Recipe?>(null) }

    fun refreshRecipes() {
        coroutineScope.launch {
            isLoading = true
            repository.getRecipes().onSuccess { recipes = it }
            isLoading = false
        }
    }

    LaunchedEffect(Unit) {
        refreshRecipes()
    }

    val filteredRecipes = recipes.filter {
        searchQuery.isBlank() ||
                it.title.contains(searchQuery, ignoreCase = true) ||
                it.tags.any { tag -> tag.contains(searchQuery, ignoreCase = true) }
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background
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
                        .padding(vertical = 8.dp),
                    singleLine = true
                )

                Text(
                    text = "Kuchařka & Recepty (${filteredRecipes.size})",
                    fontSize = 18.sp,
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
                        modifier = Modifier.fillMaxSize()
                    ) {
                        items(filteredRecipes, key = { it.id }) { recipe ->
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
                                        Text(
                                            text = recipe.title,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 16.sp,
                                            modifier = Modifier.weight(1f)
                                        )
                                        if (recipe.is_favorite) {
                                            Icon(
                                                imageVector = Icons.Default.Favorite,
                                                contentDescription = "Oblíbené",
                                                tint = Color(0xFFEF4444),
                                                modifier = Modifier.size(18.dp)
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

    // Recipe detail bottom sheet / modal
    selectedRecipe?.let { recipe ->
        AlertDialog(
            onDismissRequest = { selectedRecipe = null },
            title = {
                Text(
                    text = recipe.title,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
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

                    item {
                        Text(
                            text = "Ingredience (${recipe.ingredients.size}):",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            modifier = Modifier.padding(top = 8.dp)
                        )
                    }

                    items(recipe.ingredients) { ing ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 2.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(text = "• ${ing.name}", fontSize = 13.sp)
                            Text(
                                text = "${ing.amount} ${ing.unit}",
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
}
