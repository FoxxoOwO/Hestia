package com.example.hestia.ui.components

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import android.util.LruCache
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit

/**
 * Převede cestu k obrázku na absolutní URL.
 * Podporuje absolutní URL, data: URI a cesty relativní ke kořeni serveru (/uploads/...).
 */
fun resolveImageUrl(path: String?, serverUrl: String = ""): String? {
    val raw = path?.trim().orEmpty()
    if (raw.isEmpty()) return null
    if (raw.startsWith("http://") || raw.startsWith("https://") ||
        raw.startsWith("data:") || raw.startsWith("content://")
    ) return raw

    val base = serverUrl.trim().trimEnd('/')
    if (base.isEmpty()) return raw
    return if (raw.startsWith("/")) base + raw else "$base/${raw.trimStart('/')}"
}

private val imageClient = OkHttpClient.Builder()
    .connectTimeout(15, TimeUnit.SECONDS)
    .readTimeout(30, TimeUnit.SECONDS)
    .build()

private object BitmapCache {
    private val cache = object : LruCache<String, Bitmap>(16 * 1024 * 1024) {
        override fun sizeOf(key: String, value: Bitmap): Int = value.byteCount
    }

    fun peek(url: String): Bitmap? = cache.get(url)

    suspend fun load(url: String): Bitmap? {
        cache.get(url)?.let { return it }
        val bitmap = withContext(Dispatchers.IO) { download(url) } ?: return null
        cache.put(url, bitmap)
        return bitmap
    }

    private fun download(url: String): Bitmap? = try {
        val bytes = if (url.startsWith("data:")) {
            val comma = url.indexOf(',')
            if (comma < 0) null else Base64.decode(url.substring(comma + 1), Base64.DEFAULT)
        } else {
            imageClient.newCall(Request.Builder().url(url).build()).execute().use { response ->
                if (response.isSuccessful) response.body?.bytes() else null
            }
        }
        bytes?.let { decode(it) }
    } catch (_: Throwable) {
        null
    }

    private fun decode(bytes: ByteArray): Bitmap? {
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeByteArray(bytes, 0, bytes.size, bounds)
        var sample = 1
        val largest = maxOf(bounds.outWidth, bounds.outHeight)
        while (largest / sample > 1280) sample *= 2
        val options = BitmapFactory.Options().apply { inSampleSize = sample }
        return BitmapFactory.decodeByteArray(bytes, 0, bytes.size, options)
    }
}

/**
 * Obrázek načtený z URL s jednoduchou paměťovou cache.
 * Při načítání nebo chybě zobrazí [placeholder].
 */
@Composable
fun RemoteImage(
    url: String?,
    contentDescription: String?,
    modifier: Modifier = Modifier,
    contentScale: ContentScale = ContentScale.Crop,
    placeholder: @Composable () -> Unit = {}
) {
    var bitmap by remember(url) { mutableStateOf(url?.let { BitmapCache.peek(it) }) }
    var failed by remember(url) { mutableStateOf(false) }

    LaunchedEffect(url) {
        if (url.isNullOrBlank() || bitmap != null) return@LaunchedEffect
        val loaded = BitmapCache.load(url)
        if (loaded != null) bitmap = loaded else failed = true
    }

    val current = bitmap
    if (current != null) {
        Image(
            bitmap = current.asImageBitmap(),
            contentDescription = contentDescription,
            modifier = modifier,
            contentScale = contentScale
        )
    } else {
        Box(
            modifier = modifier.background(MaterialTheme.colorScheme.surfaceVariant),
            contentAlignment = Alignment.Center
        ) {
            if (url.isNullOrBlank() || failed) {
                placeholder()
            } else {
                CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
            }
        }
    }
}
