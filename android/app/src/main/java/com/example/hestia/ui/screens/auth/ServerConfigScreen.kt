package com.example.hestia.ui.screens.auth

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.Lan
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hestia.data.repository.HestiaRepository
import com.example.hestia.theme.HestiaOrange
import com.example.hestia.theme.StatusGreen
import com.example.hestia.theme.StatusRed
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

@Composable
fun ServerConfigScreen(
    repository: HestiaRepository,
    onConfigured: () -> Unit,
    modifier: Modifier = Modifier
) {
    val coroutineScope = rememberCoroutineScope()
    var serverUrl by remember { mutableStateOf("http://10.0.2.2:8000") }
    var isChecking by remember { mutableStateOf(false) }
    var testResult by remember { mutableStateOf<String?>(null) }
    var isSuccess by remember { mutableStateOf<Boolean?>(null) }
    var selectedMode by remember { mutableStateOf(com.example.hestia.data.local.PreferencesManager.MODE_WEB) }

    LaunchedEffect(Unit) {
        serverUrl = repository.preferences.serverUrlFlow.first()
        selectedMode = repository.preferences.appModeFlow.first()
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = Icons.Default.LocalFireDepartment,
                contentDescription = null,
                tint = HestiaOrange,
                modifier = Modifier.size(64.dp)
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Připojení k Hestia serveru",
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground
            )

            Text(
                text = "Zadejte URL adresu vašeho self-hosted serveru Hestia",
                fontSize = 13.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 4.dp, bottom = 24.dp)
            )

            OutlinedTextField(
                value = serverUrl,
                onValueChange = {
                    serverUrl = it
                    testResult = null
                    isSuccess = null
                },
                label = { Text("Server URL") },
                leadingIcon = {
                    Icon(imageVector = Icons.Default.Lan, contentDescription = null)
                },
                singleLine = true,
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Presets
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = { serverUrl = "http://10.0.2.2:8000" },
                    shape = RoundedCornerShape(10.dp),
                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Emulátor", fontSize = 11.sp)
                }
                OutlinedButton(
                    onClick = { serverUrl = "http://192.168.1.100:8000" },
                    shape = RoundedCornerShape(10.dp),
                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Text("LAN IP", fontSize = 11.sp)
                }
                OutlinedButton(
                    onClick = { serverUrl = "http://localhost:8000" },
                    shape = RoundedCornerShape(10.dp),
                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Localhost", fontSize = 11.sp)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Test status feedback
            if (testResult != null) {
                Card(
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (isSuccess == true) StatusGreen.copy(alpha = 0.15f) else StatusRed.copy(alpha = 0.15f)
                    ),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = if (isSuccess == true) Icons.Default.CheckCircle else Icons.Default.Error,
                            contentDescription = null,
                            tint = if (isSuccess == true) StatusGreen else StatusRed
                        )
                        Text(
                            text = testResult!!,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = if (isSuccess == true) StatusGreen else StatusRed
                        )
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
            }

            // Test Button
            FilledTonalButton(
                onClick = {
                    coroutineScope.launch {
                        isChecking = true
                        testResult = null
                        val result = repository.checkHealth(serverUrl)
                        isChecking = false
                        result.onSuccess {
                            isSuccess = true
                            testResult = "Úspěšně připojeno! ${it.app} v${it.version}"
                        }.onFailure {
                            isSuccess = false
                            testResult = "Chyba připojení: ${it.localizedMessage ?: "Server nedostupný"}"
                        }
                    }
                },
                enabled = !isChecking && serverUrl.isNotBlank(),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                if (isChecking) {
                    CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                } else {
                    Text("Otestovat spojení")
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Mode Selector
            Text(
                text = "Režim mobilní aplikace",
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.align(Alignment.Start)
            )
            Spacer(modifier = Modifier.height(6.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChip(
                    selected = selectedMode == com.example.hestia.data.local.PreferencesManager.MODE_WEB,
                    onClick = { selectedMode = com.example.hestia.data.local.PreferencesManager.MODE_WEB },
                    label = { Text("Plnohodnotný Web (100%)", fontSize = 11.sp) },
                    leadingIcon = {
                        if (selectedMode == com.example.hestia.data.local.PreferencesManager.MODE_WEB) {
                            Icon(Icons.Default.CheckCircle, contentDescription = null, modifier = Modifier.size(14.dp))
                        }
                    },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = HestiaOrange.copy(alpha = 0.2f),
                        selectedLabelColor = HestiaOrange
                    ),
                    modifier = Modifier.weight(1f)
                )

                FilterChip(
                    selected = selectedMode == com.example.hestia.data.local.PreferencesManager.MODE_NATIVE,
                    onClick = { selectedMode = com.example.hestia.data.local.PreferencesManager.MODE_NATIVE },
                    label = { Text("Nativní Compose", fontSize = 11.sp) },
                    leadingIcon = {
                        if (selectedMode == com.example.hestia.data.local.PreferencesManager.MODE_NATIVE) {
                            Icon(Icons.Default.CheckCircle, contentDescription = null, modifier = Modifier.size(14.dp))
                        }
                    },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = HestiaOrange.copy(alpha = 0.2f),
                        selectedLabelColor = HestiaOrange
                    ),
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Save and continue button
            Button(
                onClick = {
                    coroutineScope.launch {
                        repository.preferences.setServerUrl(serverUrl)
                        repository.preferences.setAppMode(selectedMode)
                        onConfigured()
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = HestiaOrange),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Uložit a spustit Hestii", fontWeight = FontWeight.Bold)
            }
        }
    }
}
