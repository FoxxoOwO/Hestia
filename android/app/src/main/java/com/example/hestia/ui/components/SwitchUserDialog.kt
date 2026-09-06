package com.example.hestia.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForwardIos
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hestia.data.models.PublicMember
import com.example.hestia.data.models.User
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.theme.HestiaOrange
import com.example.hestia.theme.StatusRed
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

@Composable
fun SwitchUserDialog(
    repository: HestiaRepository,
    onDismiss: () -> Unit,
    onUserSwitched: (User) -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    var members by remember { mutableStateOf<List<PublicMember>>(emptyList()) }
    var currentUser by remember { mutableStateOf<User?>(null) }
    var selectedMember by remember { mutableStateOf<PublicMember?>(null) }
    var password by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        currentUser = repository.preferences.currentUserFlow.first()
        repository.getPublicMembers().onSuccess { members = it }
    }

    fun submitSwitch(member: PublicMember) {
        if (password.isBlank()) {
            errorMessage = "Zadejte heslo účtu."
            return
        }
        coroutineScope.launch {
            isLoading = true
            errorMessage = null
            repository.login(member.username, password)
                .onSuccess { tokenResponse ->
                    isLoading = false
                    onUserSwitched(tokenResponse.user)
                }
                .onFailure { _ ->
                    isLoading = false
                    errorMessage = "Nesprávné heslo pro účet ${member.display_name}."
                }
        }
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(Icons.Default.People, contentDescription = null, tint = HestiaOrange)
                Text(
                    text = if (selectedMember == null) "Přepnout člena rodiny" else "Přihlášení jako ${selectedMember!!.display_name}",
                    fontWeight = FontWeight.Bold,
                    fontSize = 17.sp
                )
            }
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                if (selectedMember == null) {
                    Text(
                        text = "Vyberte člena domácnosti, pod kterým chcete aplikaci používat:",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(max = 280.dp)
                    ) {
                        items(members) { member ->
                            val isCurrent = currentUser?.id == member.id
                            val avatarColor = try {
                                Color(android.graphics.Color.parseColor(member.avatar_color ?: "#F97316"))
                            } catch (_: Exception) {
                                HestiaOrange
                            }

                            Card(
                                shape = RoundedCornerShape(12.dp),
                                colors = CardDefaults.cardColors(
                                    containerColor = if (isCurrent) HestiaOrange.copy(alpha = 0.12f) else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
                                ),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        if (!isCurrent) {
                                            selectedMember = member
                                            password = ""
                                            errorMessage = null
                                        }
                                    }
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
                                                .size(38.dp)
                                                .clip(CircleShape)
                                                .background(avatarColor),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(
                                                text = member.display_name.take(1).uppercase(),
                                                color = Color.White,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 16.sp
                                            )
                                        }

                                        Column {
                                            Text(
                                                text = member.display_name,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 14.sp
                                            )
                                            Text(
                                                text = "@${member.username} • ${if (member.role == "admin") "Správce" else "Člen"}",
                                                fontSize = 11.sp,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                    }

                                    if (isCurrent) {
                                        Text(
                                            text = "Aktivní",
                                            color = HestiaOrange,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 11.sp
                                        )
                                    } else {
                                        Icon(
                                            Icons.AutoMirrored.Filled.ArrowForwardIos,
                                            contentDescription = null,
                                            modifier = Modifier.size(14.dp),
                                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                            }
                        }
                    }
                } else {
                    val member = selectedMember!!
                    val avatarColor = try {
                        Color(android.graphics.Color.parseColor(member.avatar_color ?: "#F97316"))
                    } catch (_: Exception) {
                        HestiaOrange
                    }

                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Box(
                            modifier = Modifier
                                .size(56.dp)
                                .clip(CircleShape)
                                .background(avatarColor),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = member.display_name.take(1).uppercase(),
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 24.sp
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = member.display_name,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                        Text(
                            text = "Zadejte heslo účtu pro rychlé přepnutí",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    if (errorMessage != null) {
                        Text(
                            text = errorMessage!!,
                            color = StatusRed,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }

                    OutlinedTextField(
                        value = password,
                        onValueChange = {
                            password = it
                            errorMessage = null
                        },
                        label = { Text("Heslo") },
                        leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null) },
                        trailingIcon = {
                            IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                Icon(
                                    if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                    contentDescription = "Zobrazit heslo"
                                )
                            }
                        },
                        visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Password,
                            imeAction = ImeAction.Done
                        ),
                        keyboardActions = KeyboardActions(onDone = { submitSwitch(member) }),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        },
        confirmButton = {
            if (selectedMember != null) {
                Button(
                    onClick = { submitSwitch(selectedMember!!) },
                    enabled = !isLoading && password.isNotBlank(),
                    colors = ButtonDefaults.buttonColors(containerColor = HestiaOrange)
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(16.dp))
                    } else {
                        Text("Přepnout účet")
                    }
                }
            }
        },
        dismissButton = {
            TextButton(
                onClick = {
                    if (selectedMember != null) {
                        selectedMember = null
                        password = ""
                        errorMessage = null
                    } else {
                        onDismiss()
                    }
                }
            ) {
                Text(if (selectedMember != null) "Zpět" else "Zrušit")
            }
        }
    )
}
