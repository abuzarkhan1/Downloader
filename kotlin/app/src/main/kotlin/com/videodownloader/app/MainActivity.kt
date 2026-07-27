package com.videodownloader.app

import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.Crossfade
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.videodownloader.app.downloader.AndroidDownloadManager
import com.videodownloader.app.extractor.MediaExtractor
import com.videodownloader.app.model.MediaMetadata
import com.videodownloader.app.ui.*
import com.videodownloader.app.ui.theme.*
import com.videodownloader.app.utils.LocaleHelper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.UUID

class MainActivity : ComponentActivity() {

    private var sharedUrlState     = mutableStateOf<String?>(null)
    private var isShareIntentState = mutableStateOf(false)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val isShare = handleIncomingIntent(intent)

        if (isShare) {
            window.setBackgroundDrawableResource(android.R.color.transparent)
        } else {
            window.setBackgroundDrawableResource(android.R.color.black)
        }

        setContent {
            val context = LocalContext.current
            var lang by remember { mutableStateOf(LocaleHelper.getLanguage(context)) }
            CompositionLocalProvider(LocalLayoutDirection provides if (lang == "ur") LayoutDirection.Rtl else LayoutDirection.Ltr) {
                VideoDownloaderTheme {
                    MainAppContent(
                        currentLanguage   = lang,
                        onLanguageChange  = { newLang -> lang = newLang; LocaleHelper.setLocale(context, newLang) },
                        incomingSharedUrl = sharedUrlState.value,
                        isShareMode       = isShareIntentState.value,
                        onClearSharedUrl  = {
                            sharedUrlState.value = null
                            if (isShareIntentState.value) {
                                finish() // Return directly to Instagram / host app!
                            }
                        },
                        onSetSharedUrl = { url -> sharedUrlState.value = url },
                        onSwitchToFullApp = {
                            isShareIntentState.value = false
                            window.setBackgroundDrawableResource(android.R.color.black)
                        }
                    )
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        val isShare = handleIncomingIntent(intent)
        if (isShare) {
            window.setBackgroundDrawableResource(android.R.color.transparent)
        }
    }

    private fun handleIncomingIntent(intent: Intent?): Boolean {
        if (intent == null) return false
        when (intent.action) {
            Intent.ACTION_SEND -> {
                val sharedText = intent.getStringExtra(Intent.EXTRA_TEXT)
                val url = extractUrlFromSharedText(sharedText)
                if (!url.isNullOrBlank()) {
                    sharedUrlState.value     = url
                    isShareIntentState.value = true
                    return true
                }
            }
            Intent.ACTION_VIEW -> {
                val data = intent.data
                val url  = data?.getQueryParameter("url") ?: extractUrlFromSharedText(data?.toString())
                if (!url.isNullOrBlank()) {
                    sharedUrlState.value     = url
                    isShareIntentState.value = true
                    return true
                }
            }
        }
        return false
    }
}

enum class NavigationTab { HOME, RESULTS, BATCH_QUEUE }

@Composable
fun SplashScreen(onFinished: () -> Unit) {
    LaunchedEffect(Unit) {
        delay(1500L) // 1.5 seconds
        onFinished()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Black),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Image(
                painter = painterResource(id = R.drawable.logoo),
                contentDescription = "App Logo",
                contentScale = ContentScale.Fit,
                modifier = Modifier
                    .size(90.dp)
                    .clip(RoundedCornerShape(20.dp))
            )

            Spacer(modifier = Modifier.height(20.dp))

            Text(
                text = stringResource(id = R.string.app_name),
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Black,
                color = White,
                fontSize = 24.sp,
                letterSpacing = (-0.5).sp
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Aqil Konabak",
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary,
                fontWeight = FontWeight.Medium,
                letterSpacing = 2.sp
            )
        }
    }
}

@Composable
fun MainAppContent(
    currentLanguage: String,
    onLanguageChange: (String) -> Unit,
    incomingSharedUrl: String? = null,
    isShareMode: Boolean = false,
    onClearSharedUrl: () -> Unit = {},
    onSetSharedUrl: (String) -> Unit = {},
    onSwitchToFullApp: () -> Unit = {}
) {
    var showSplash by remember { mutableStateOf(!isShareMode) }

    if (isShareMode) {
        MainAppScaffold(
            currentLanguage = currentLanguage,
            onLanguageChange = onLanguageChange,
            incomingSharedUrl = incomingSharedUrl,
            isShareMode = true,
            onClearSharedUrl = onClearSharedUrl,
            onSetSharedUrl = onSetSharedUrl,
            onSwitchToFullApp = onSwitchToFullApp
        )
    } else {
        Crossfade(targetState = showSplash, animationSpec = tween(400), label = "splash_fade") { isSplashing ->
            if (isSplashing) {
                SplashScreen(onFinished = { showSplash = false })
            } else {
                MainAppScaffold(
                    currentLanguage = currentLanguage,
                    onLanguageChange = onLanguageChange,
                    incomingSharedUrl = incomingSharedUrl,
                    isShareMode = false,
                    onClearSharedUrl = onClearSharedUrl,
                    onSetSharedUrl = onSetSharedUrl,
                    onSwitchToFullApp = onSwitchToFullApp
                )
            }
        }
    }
}

@Composable
private fun MainAppScaffold(
    currentLanguage: String,
    onLanguageChange: (String) -> Unit,
    incomingSharedUrl: String? = null,
    isShareMode: Boolean = false,
    onClearSharedUrl: () -> Unit = {},
    onSetSharedUrl: (String) -> Unit = {},
    onSwitchToFullApp: () -> Unit = {}
) {
    val context      = LocalContext.current
    val scope        = rememberCoroutineScope()
    val dlMgr        = remember { AndroidDownloadManager(context) }
    var tab          by remember { mutableStateOf(NavigationTab.HOME) }
    var showDiscl    by remember { mutableStateOf(!isShareMode && !isDisclaimerAccepted(context)) }

    var urlText      by remember { mutableStateOf("") }
    var batchMode    by remember { mutableStateOf(false) }
    var noWatermark  by remember { mutableStateOf(true) }
    var analyzedUrl  by remember { mutableStateOf<String?>(null) }
    var analyzing    by remember { mutableStateOf(false) }
    var metadata     by remember { mutableStateOf<MediaMetadata?>(null) }
    val queue        = remember { mutableStateListOf<QueueItem>() }

    // Store original URL per queue item for retry
    val queueUrls    = remember { mutableStateMapOf<String, String>() }

    val activeCount  = queue.count { it.status == DownloadStatus.DOWNLOADING || it.status == DownloadStatus.QUEUED }

    fun download(targetUrl: String, title: String, formatType: String, quality: String) {
        // Guard: never enqueue a doomed item with no stream.
        if (targetUrl.isBlank()) {
            Toast.makeText(context, "No downloadable stream found for this link. Try another link or retry in a moment.", Toast.LENGTH_LONG).show()
            return
        }

        val id  = UUID.randomUUID().toString()
        val ext = when (formatType.uppercase()) {
            "AUDIO"    -> when { quality.contains("wav", true) -> "wav"; quality.contains("m4a", true) -> "m4a"; else -> "mp3" }
            "SUBTITLE" -> "vtt"
            else       -> "mp4"
        }
        val cleanQuality = quality.replace(Regex("[^a-zA-Z0-9]"), "_").take(20)
        val safeTitle    = title.replace(Regex("[^a-zA-Z0-9._-]"), "_").take(35)
        val fileName     = "${safeTitle}_$cleanQuality.$ext"
        val mime         = when (ext) {
            "mp3" -> "audio/mpeg"; "m4a" -> "audio/mp4"; "wav" -> "audio/wav"; "vtt" -> "text/vtt"; else -> "video/mp4"
        }

        queueUrls[id] = targetUrl
        queue.add(QueueItem(id = id, title = title, quality = "$quality ($ext)", status = DownloadStatus.DOWNLOADING, progressPercent = 0))

        scope.launch(Dispatchers.IO) {
            dlMgr.enqueueDownload(id, title, targetUrl, fileName, mime) { job ->
                scope.launch(Dispatchers.Main) {   // UI state MUST be written on Main
                    val i = queue.indexOfFirst { it.id == id }
                    if (i != -1) {
                        val s = when (job.status) {
                            com.videodownloader.app.model.DownloadStatus.COMPLETED -> DownloadStatus.COMPLETED
                            com.videodownloader.app.model.DownloadStatus.FAILED    -> DownloadStatus.FAILED
                            com.videodownloader.app.model.DownloadStatus.CANCELLED -> DownloadStatus.FAILED
                            else -> DownloadStatus.DOWNLOADING
                        }
                        queue[i] = queue[i].copy(
                            progressPercent = job.progressPercent,
                            status          = s,
                            isPaused        = job.status == com.videodownloader.app.model.DownloadStatus.PAUSED,
                            localUri        = job.localUri ?: queue[i].localUri
                        )
                    }
                }
            }
        }
    }

    // Auto-detect clipboard URL on normal launch if no incoming shared URL
    LaunchedEffect(Unit) {
        if (!isShareMode && incomingSharedUrl.isNullOrBlank()) {
            try {
                val cb = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
                val t  = cb?.primaryClip?.getItemAt(0)?.text?.toString()?.trim()
                val url = extractUrlFromSharedText(t)
                if (!url.isNullOrEmpty()) {
                    onSetSharedUrl(url)
                }
            } catch (_: Exception) {}
        }
    }

    Scaffold(
        containerColor = if (isShareMode) Color.Transparent else Black,
        topBar = {
            if (!isShareMode) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .statusBarsPadding()
                        .background(Black)
                        .padding(horizontal = 20.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    var langOpen by remember { mutableStateOf(false) }
                    Box {
                        IconButton(onClick = { langOpen = true }, modifier = Modifier.size(36.dp)) {
                            Icon(Icons.Rounded.Language, "Language", tint = TextSecondary, modifier = Modifier.size(18.dp))
                        }
                        DropdownMenu(
                            expanded = langOpen,
                            onDismissRequest = { langOpen = false },
                            modifier = Modifier.background(Black80).border(0.5.dp, DividerColor, RoundedCornerShape(8.dp))
                        ) {
                            LangOption("English", currentLanguage == "en") { onLanguageChange("en"); langOpen = false }
                            LangOption("اردو", currentLanguage == "ur")    { onLanguageChange("ur"); langOpen = false }
                        }
                    }
                }
            }
        },
        bottomBar = {
            if (!isShareMode) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Black)
                        .border(width = 0.5.dp, color = DividerColor, shape = RoundedCornerShape(0.dp))
                        .navigationBarsPadding()
                        .padding(vertical = 6.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    NavBtn(Icons.Rounded.Home,     stringResource(R.string.nav_home),    tab == NavigationTab.HOME)        { tab = NavigationTab.HOME }
                    NavBtn(Icons.Rounded.Movie,    stringResource(R.string.nav_results), tab == NavigationTab.RESULTS)     { tab = NavigationTab.RESULTS }
                    NavBtn(Icons.Rounded.Queue,    stringResource(R.string.nav_queue),   tab == NavigationTab.BATCH_QUEUE, activeCount) { tab = NavigationTab.BATCH_QUEUE }
                }
            }
        }
    ) { inner ->
        Box(modifier = Modifier.fillMaxSize().padding(inner)) {
            if (!isShareMode) {
                when (tab) {
                    NavigationTab.HOME -> HomeScreen(
                        urlText = urlText,
                        onUrlChange = { urlText = it },
                        isBatchMode = batchMode,
                        onBatchModeChange = { batchMode = it },
                        removeWatermark = noWatermark,
                        onRemoveWatermarkChange = { noWatermark = it },
                        onPasteFromClipboard = {
                            try {
                                val cb = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
                                cb?.primaryClip?.getItemAt(0)?.text?.toString()?.let { urlText = it }
                            } catch (_: Exception) {}
                        },
                        onAnalyzeLink = { link ->
                            analyzedUrl = link
                            scope.launch {
                                analyzing = true
                                try {
                                    if (batchMode) {
                                        link.split("\n").map { it.trim() }.filter { it.isNotBlank() }.forEach { u ->
                                            val m = MediaExtractor.extractMediaInfo(u, noWatermark)
                                            val f = m.videoFormats.firstOrNull()
                                            download(f?.downloadUrl ?: u, m.title, "VIDEO", f?.qualityLabel ?: "720p")
                                        }
                                        Toast.makeText(context, context.getString(R.string.download_added), Toast.LENGTH_SHORT).show()
                                        tab = NavigationTab.BATCH_QUEUE
                                    } else {
                                        metadata = MediaExtractor.extractMediaInfo(link, noWatermark)
                                        tab = NavigationTab.RESULTS
                                    }
                                } catch (e: Exception) {
                                    Toast.makeText(context, "Failed: ${e.message}", Toast.LENGTH_LONG).show()
                                } finally {
                                    analyzing = false
                                }
                            }
                        },
                        isAnalyzing = analyzing
                    )

                    NavigationTab.RESULTS -> ResultsScreen(
                        mediaMetadata = metadata,
                        onStartDownload = { type, detail, url ->
                            download(url.ifBlank { metadata?.sourceUrl ?: analyzedUrl ?: "" }, metadata?.title ?: "Media", type, detail)
                            Toast.makeText(context, context.getString(R.string.download_added), Toast.LENGTH_SHORT).show()
                            tab = NavigationTab.BATCH_QUEUE
                        }
                    )

                    NavigationTab.BATCH_QUEUE -> BatchQueueScreen(
                        queueItems = queue,
                        onPauseItem  = { id -> val i = queue.indexOfFirst { it.id == id }; if (i != -1) queue[i] = queue[i].copy(isPaused = true) },
                        onResumeItem = { id -> val i = queue.indexOfFirst { it.id == id }; if (i != -1) queue[i] = queue[i].copy(isPaused = false) },
                        onRetryItem  = { id ->
                            val i = queue.indexOfFirst { it.id == id }
                            if (i != -1) {
                                val item = queue.removeAt(i)
                                val originalUrl  = queueUrls.remove(id) ?: ""
                                val cleanQuality = item.quality.substringBefore("(").trim()   // strip " (mp4)"
                                if (originalUrl.isNotBlank()) download(originalUrl, item.title, "VIDEO", cleanQuality)
                                else Toast.makeText(context, "Original link not stored — paste it again on Home.", Toast.LENGTH_LONG).show()
                            }
                        },
                        onCancelItem = { id -> dlMgr.cancelDownload(id); queue.removeAll { it.id == id }; queueUrls.remove(id) },
                        onClearCompleted = {
                            queue.filter { it.status == DownloadStatus.COMPLETED }.forEach { queueUrls.remove(it.id) }
                            queue.removeAll { it.status == DownloadStatus.COMPLETED }
                        }
                    )
                }
            }

            // Quick Share Bottom Sheet (for shared URLs & auto-detected clipboard links)
            if (!incomingSharedUrl.isNullOrBlank()) {
                QuickShareSheet(
                    sharedUrl = incomingSharedUrl,
                    onDismiss = onClearSharedUrl,
                    onStartDownload = { url, title, type, detail ->
                        download(url, title, type, detail)
                        if (!isShareMode) {
                            tab = NavigationTab.BATCH_QUEUE
                        }
                    },
                    onOpenFullApp = {
                        urlText = incomingSharedUrl
                        onSwitchToFullApp()
                        tab = NavigationTab.HOME
                    }
                )
            }

            if (showDiscl && !isShareMode) {
                DisclaimerDialog(
                    onAccept  = { setDisclaimerAccepted(context, true); showDiscl = false },
                    onDecline = { (context as? ComponentActivity)?.finish() }
                )
            }
        }
    }
}

@Composable
private fun NavBtn(
    icon: ImageVector,
    label: String,
    selected: Boolean,
    badge: Int = 0,
    onClick: () -> Unit
) {
    val iconTint by animateColorAsState(
        targetValue = if (selected) White else TextTertiary,
        animationSpec = tween(150),
        label = "nav_tint"
    )
    Column(
        modifier = Modifier
            .clip(RoundedCornerShape(10.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 18.dp, vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(3.dp)
    ) {
        BadgedBox(
            badge = {
                if (badge > 0) Badge(containerColor = White, contentColor = Black) {
                    Text("$badge", fontSize = 9.sp, fontWeight = FontWeight.Bold)
                }
            }
        ) {
            Icon(icon, contentDescription = label, tint = iconTint, modifier = Modifier.size(22.dp))
        }
        Text(label, fontSize = 10.sp, color = iconTint, fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal)
    }
}

@Composable
private fun LangOption(label: String, selected: Boolean, onClick: () -> Unit) {
    DropdownMenuItem(
        text = {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                Text(label, color = if (selected) White else TextSecondary, fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal, fontSize = 14.sp)
                if (selected) Icon(Icons.Rounded.Check, null, tint = White, modifier = Modifier.size(14.dp))
            }
        },
        onClick = onClick,
        modifier = Modifier.background(Black80)
    )
}
