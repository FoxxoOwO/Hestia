package com.example.hestia.ui.components

import android.graphics.Paint
import android.graphics.Typeface
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Casino
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.hestia.data.models.Chore
import com.example.hestia.data.models.PublicMember
import com.example.hestia.theme.HestiaOrange
import kotlinx.coroutines.launch
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin
import kotlin.random.Random

@Composable
fun ChoreWheelDialog(
    members: List<PublicMember>,
    chores: List<Chore>,
    onDismiss: () -> Unit,
    onAssign: (choreId: Int, memberId: Int) -> Unit = { _, _ -> }
) {
    val coroutineScope = rememberCoroutineScope()
    var isSpinning by remember { mutableStateOf(false) }
    var winner by remember { mutableStateOf<PublicMember?>(null) }
    var selectedChore by remember { mutableStateOf(chores.firstOrNull()) }

    // Wheel items - default to members if available, or chore titles
    val items = remember(members) {
        if (members.isNotEmpty()) {
            members.map { it.display_name to (it.avatar_color ?: "#F97316") }
        } else {
            listOf("Člen 1" to "#F97316", "Člen 2" to "#3B82F6", "Člen 3" to "#10B981")
        }
    }

    val rotation = remember { Animatable(0f) }

    fun spinWheel() {
        if (isSpinning || items.isEmpty()) return
        isSpinning = true
        winner = null

        coroutineScope.launch {
            val randomTurns = Random.nextInt(5, 10)
            val randomExtraAngle = Random.nextFloat() * 360f
            val targetRotation = rotation.value + (randomTurns * 360f) + randomExtraAngle

            rotation.animateTo(
                targetValue = targetRotation,
                animationSpec = tween(
                    durationMillis = 4000,
                    easing = FastOutSlowInEasing
                )
            )

            // Determine winner: Top pointer is at 270 degrees
            val finalAngle = (targetRotation % 360f + 360f) % 360f
            val sliceAngle = 360f / items.size
            // Pointer is at the top (270 degrees)
            val winningAngle = (270f - finalAngle + 360f) % 360f
            val winningIndex = (winningAngle / sliceAngle).toInt().coerceIn(0, items.size - 1)

            if (members.isNotEmpty() && winningIndex < members.size) {
                winner = members[winningIndex]
            }
            isSpinning = false
        }
    }

    Dialog(onDismissRequest = { if (!isSpinning) onDismiss() }) {
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.Casino, contentDescription = null, tint = HestiaOrange)
                        Text(
                            text = "Kolo štěstí úklidu",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    IconButton(
                        onClick = onDismiss,
                        enabled = !isSpinning,
                        modifier = Modifier.size(28.dp)
                    ) {
                        Icon(Icons.Default.Close, contentDescription = "Zavřít")
                    }
                }

                if (chores.isNotEmpty()) {
                    Text(
                        text = "Losuje se pro: ${selectedChore?.title ?: "Vybraný úkol"}",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                // Wheel Canvas
                Box(
                    modifier = Modifier
                        .size(240.dp)
                        .padding(8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        val canvasWidth = size.width
                        val canvasHeight = size.height
                        val radius = canvasWidth / 2f
                        val center = Offset(canvasWidth / 2f, canvasHeight / 2f)
                        val numSlices = items.size
                        val sliceDegrees = 360f / numSlices

                        // Draw slices rotated
                        val currentRotation = rotation.value
                        for (i in 0 until numSlices) {
                            val startAngle = currentRotation + (i * sliceDegrees)
                            val colorHex = items[i].second
                            val sliceColor = try {
                                Color(android.graphics.Color.parseColor(colorHex))
                            } catch (_: Exception) {
                                HestiaOrange
                            }

                            drawArc(
                                color = sliceColor,
                                startAngle = startAngle,
                                sweepAngle = sliceDegrees,
                                useCenter = true,
                                topLeft = Offset.Zero,
                                size = Size(canvasWidth, canvasHeight)
                            )

                            // Slice border line
                            val rad = Math.toRadians(startAngle.toDouble())
                            val endX = center.x + (radius * cos(rad)).toFloat()
                            val endY = center.y + (radius * sin(rad)).toFloat()
                            drawLine(
                                color = Color.White.copy(alpha = 0.8f),
                                start = center,
                                end = Offset(endX, endY),
                                strokeWidth = 2.dp.toPx()
                            )

                            // Text label
                            drawIntoCanvas { canvas ->
                                val textPaint = Paint().apply {
                                    color = android.graphics.Color.WHITE
                                    textSize = 12.sp.toPx()
                                    isAntiAlias = true
                                    typeface = Typeface.DEFAULT_BOLD
                                    textAlign = Paint.Align.RIGHT
                                    setShadowLayer(4f, 0f, 0f, android.graphics.Color.BLACK)
                                }
                                val textAngle = startAngle + (sliceDegrees / 2f)
                                canvas.nativeCanvas.save()
                                canvas.nativeCanvas.rotate(textAngle, center.x, center.y)
                                val label = items[i].first.take(10)
                                canvas.nativeCanvas.drawText(label, center.x + radius - 16.dp.toPx(), center.y + 4.dp.toPx(), textPaint)
                                canvas.nativeCanvas.restore()
                            }
                        }

                        // Center pin
                        drawCircle(
                            color = Color(0xFF1E293B),
                            radius = 22.dp.toPx(),
                            center = center
                        )
                        drawCircle(
                            color = Color.White,
                            radius = 18.dp.toPx(),
                            center = center
                        )
                        drawCircle(
                            color = HestiaOrange,
                            radius = 12.dp.toPx(),
                            center = center
                        )
                    }

                    // Top Pointer indicator
                    Box(
                        modifier = Modifier
                            .align(Alignment.TopCenter)
                            .offset(y = (-4).dp)
                    ) {
                        Canvas(modifier = Modifier.size(24.dp)) {
                            val path = Path().apply {
                                moveTo(size.width / 2f, size.height)
                                lineTo(0f, 0f)
                                lineTo(size.width, 0f)
                                close()
                            }
                            drawPath(path, color = Color(0xFFEF4444))
                        }
                    }
                }

                // Winner announcement
                winner?.let { win ->
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = HestiaOrange.copy(alpha = 0.15f),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = "🎉 Vítěz kola: ${win.display_name}!",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                color = HestiaOrange
                            )
                            if (selectedChore != null) {
                                Spacer(modifier = Modifier.height(6.dp))
                                Button(
                                    onClick = {
                                        onAssign(selectedChore!!.id, win.id)
                                        onDismiss()
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = HestiaOrange),
                                    shape = RoundedCornerShape(8.dp),
                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                                ) {
                                    Text("Přiřadit tento úkol", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }

                // Spin button
                Button(
                    onClick = { spinWheel() },
                    enabled = !isSpinning,
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = HestiaOrange),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.Casino, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (isSpinning) "Kolo se točí..." else "Roztočit kolo štěstí!",
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp
                    )
                }
            }
        }
    }
}
