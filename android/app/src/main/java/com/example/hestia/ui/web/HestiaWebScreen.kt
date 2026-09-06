package com.example.hestia.ui.web

import android.annotation.SuppressLint
import android.app.Activity
import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.view.View
import android.view.ViewGroup
import android.webkit.*
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.example.hestia.theme.HestiaOrange

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun HestiaWebScreen(
    serverUrl: String,
    onNavigateServerConfig: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var webViewInstance by remember { mutableStateOf<WebView?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var progress by remember { mutableIntStateOf(0) }
    var hasError by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    // File chooser callback for <input type="file"> (receipt scans, photos, backup imports)
    var fileUploadCallback by remember { mutableStateOf<ValueCallback<Array<Uri>>?>(null) }

    val fileChooserLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val intentData = result.data
            val results: Array<Uri>? = when {
                intentData?.clipData != null -> {
                    val clipData = intentData.clipData!!
                    Array(clipData.itemCount) { i -> clipData.getItemAt(i).uri }
                }
                intentData?.data != null -> {
                    arrayOf(intentData.data!!)
                }
                else -> null
            }
            fileUploadCallback?.onReceiveValue(results)
        } else {
            fileUploadCallback?.onReceiveValue(null)
        }
        fileUploadCallback = null
    }

    // Hardware Back Button: navigate backwards in WebView history first
    BackHandler(enabled = true) {
        if (webViewInstance?.canGoBack() == true) {
            webViewInstance?.goBack()
        } else {
            // At root page
            (context as? Activity)?.moveTaskToBack(true)
        }
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Main WebView container
            AndroidView(
                modifier = Modifier.fillMaxSize(),
                factory = { ctx ->
                    WebView(ctx).apply {
                        layoutParams = ViewGroup.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.MATCH_PARENT
                        )

                        isVerticalScrollBarEnabled = true
                        isHorizontalScrollBarEnabled = false
                        overScrollMode = View.OVER_SCROLL_NEVER

                        settings.apply {
                            javaScriptEnabled = true
                            domStorageEnabled = true
                            databaseEnabled = true
                            useWideViewPort = true
                            loadWithOverviewMode = true
                            cacheMode = WebSettings.LOAD_DEFAULT
                            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                            setSupportZoom(false)
                            builtInZoomControls = false
                            displayZoomControls = false
                            allowFileAccess = true
                            allowContentAccess = true
                            mediaPlaybackRequiresUserGesture = false
                            userAgentString = "$userAgentString HestiaMobileApp/1.1"
                        }

                        // WebChromeClient: file picker, progress, permissions
                        webChromeClient = object : WebChromeClient() {
                            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                                progress = newProgress
                                isLoading = newProgress < 100
                            }

                            override fun onShowFileChooser(
                                webView: WebView?,
                                filePathCallback: ValueCallback<Array<Uri>>?,
                                fileChooserParams: FileChooserParams?
                            ): Boolean {
                                fileUploadCallback?.onReceiveValue(null)
                                fileUploadCallback = filePathCallback

                                val contentIntent = Intent(Intent.ACTION_GET_CONTENT).apply {
                                    addCategory(Intent.CATEGORY_OPENABLE)
                                    type = "*/*"
                                    fileChooserParams?.acceptTypes?.let { types ->
                                        if (types.isNotEmpty() && types[0].isNotBlank()) {
                                            putExtra(Intent.EXTRA_MIME_TYPES, types)
                                        }
                                    }
                                }

                                val chooserIntent = Intent(Intent.ACTION_CHOOSER).apply {
                                    putExtra(Intent.EXTRA_INTENT, contentIntent)
                                    putExtra(Intent.EXTRA_TITLE, "Vyberte soubor nebo fotografii")
                                }

                                try {
                                    fileChooserLauncher.launch(chooserIntent)
                                } catch (e: Exception) {
                                    fileUploadCallback?.onReceiveValue(null)
                                    fileUploadCallback = null
                                    Toast.makeText(ctx, "Nelze otevřít výběr souborů", Toast.LENGTH_SHORT).show()
                                    return false
                                }
                                return true
                            }

                            override fun onPermissionRequest(request: PermissionRequest?) {
                                request?.grant(request.resources)
                            }
                        }

                        // WebViewClient: URL routing and connection error handling
                        webViewClient = object : WebViewClient() {
                            override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                                super.onPageStarted(view, url, favicon)
                                isLoading = true
                            }

                            override fun onPageFinished(view: WebView?, url: String?) {
                                super.onPageFinished(view, url)
                                isLoading = false
                            }

                            override fun onReceivedError(
                                view: WebView?,
                                request: WebResourceRequest?,
                                error: WebResourceError?
                            ) {
                                super.onReceivedError(view, request, error)
                                if (request?.isForMainFrame == true) {
                                    hasError = true
                                    errorMessage = error?.description?.toString() ?: "Spojení se serverem selhalo"
                                }
                            }

                            override fun onReceivedHttpError(
                                view: WebView?,
                                request: WebResourceRequest?,
                                errorResponse: WebResourceResponse?
                            ) {
                                super.onReceivedHttpError(view, request, errorResponse)
                                if (request?.isForMainFrame == true && (errorResponse?.statusCode ?: 200) >= 500) {
                                    hasError = true
                                    errorMessage = "Chyba serveru (${errorResponse?.statusCode})"
                                }
                            }

                            override fun shouldOverrideUrlLoading(
                                view: WebView?,
                                request: WebResourceRequest?
                            ): Boolean {
                                val url = request?.url?.toString() ?: return false
                                return when {
                                    url.startsWith("tel:") || url.startsWith("mailto:") || url.startsWith("sms:") -> {
                                        try {
                                            ctx.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                                        } catch (_: Exception) {}
                                        true
                                    }
                                    url.startsWith(serverUrl) || url.startsWith("/") -> {
                                        false
                                    }
                                    else -> {
                                        // External links open in system browser
                                        try {
                                            ctx.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                                        } catch (_: Exception) {}
                                        true
                                    }
                                }
                            }
                        }

                        // DownloadListener: JSON backups and documents
                        setDownloadListener { url, userAgent, contentDisposition, mimeType, contentLength ->
                            try {
                                val filename = URLUtil.guessFileName(url, contentDisposition, mimeType)
                                val request = DownloadManager.Request(Uri.parse(url)).apply {
                                    setMimeType(mimeType)
                                    val cookies = CookieManager.getInstance().getCookie(url)
                                    addRequestHeader("cookie", cookies)
                                    addRequestHeader("User-Agent", userAgent)
                                    setDescription("Stahování souboru z Hestia...")
                                    setTitle(filename)
                                    setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                                    setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename)
                                }

                                val dm = ctx.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
                                dm.enqueue(request)
                                Toast.makeText(ctx, "Stahování zahájeno: $filename", Toast.LENGTH_SHORT).show()
                            } catch (e: Exception) {
                                Toast.makeText(ctx, "Chyba při stahování: ${e.message}", Toast.LENGTH_SHORT).show()
                            }
                        }

                        webViewInstance = this
                        loadUrl(serverUrl)
                    }
                },
                update = { webView ->
                    webViewInstance = webView
                }
            )

            // Top progress bar during loading
            AnimatedVisibility(
                visible = isLoading && progress < 100,
                enter = fadeIn(),
                exit = fadeOut(),
                modifier = Modifier.align(Alignment.TopCenter)
            ) {
                LinearProgressIndicator(
                    progress = { progress / 100f },
                    modifier = Modifier.fillMaxWidth(),
                    color = HestiaOrange,
                    trackColor = Color.Transparent
                )
            }

            // Quick floating button for Server Settings & Reload
            Row(
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilledTonalIconButton(
                    onClick = {
                        hasError = false
                        webViewInstance?.reload()
                    },
                    colors = IconButtonDefaults.filledTonalIconButtonColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.85f)
                    ),
                    modifier = Modifier.size(38.dp)
                ) {
                    Icon(
                        Icons.Default.Refresh,
                        contentDescription = "Znovu načíst",
                        modifier = Modifier.size(18.dp)
                    )
                }

                FilledTonalIconButton(
                    onClick = onNavigateServerConfig,
                    colors = IconButtonDefaults.filledTonalIconButtonColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.85f)
                    ),
                    modifier = Modifier.size(38.dp)
                ) {
                    Icon(
                        Icons.Default.Lan,
                        contentDescription = "Nastavení serveru",
                        tint = HestiaOrange,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }

            // Error Overlay if connection fails
            if (hasError) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background.copy(alpha = 0.98f)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Box(
                            modifier = Modifier
                                .size(72.dp)
                                .clip(CircleShape)
                                .background(Color(0xFFEF4444).copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                Icons.Default.WifiOff,
                                contentDescription = null,
                                tint = Color(0xFFEF4444),
                                modifier = Modifier.size(36.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(20.dp))

                        Text(
                            text = "Nelze se připojit k Hestii",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.Center
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = errorMessage ?: "Zkontrolujte, zda server Hestia běží a mobil je připojen ke stejné síti.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant
                        ) {
                            Text(
                                text = serverUrl,
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        Row(
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Button(
                                onClick = {
                                    hasError = false
                                    webViewInstance?.loadUrl(serverUrl)
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = HestiaOrange),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Zkusit znovu")
                            }

                            OutlinedButton(
                                onClick = onNavigateServerConfig,
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Icon(Icons.Default.Lan, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Změnit adresu")
                            }
                        }
                    }
                }
            }
        }
    }
}
