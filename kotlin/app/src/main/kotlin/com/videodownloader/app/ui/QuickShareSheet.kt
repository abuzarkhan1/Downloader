package com.videodownloader.app.ui

import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.ImageLoader
import coil.compose.SubcomposeAsyncImage
import coil.request.ImageRequest
import com.videodownloader.app.R
import com.videodownloader.app.extractor.MediaExtractor
import com.videodownloader.app.model.AudioFormat
import com.videodownloader.app.model.MediaMetadata
import com.videodownloader.app.model.VideoFormat
import com.videodownloader.app.ui.theme.*
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient

fun extractUrlFromSharedText(text: String?): String? {
    if (text.isNullOrBlank()) return null
    val urlRegex = Regex("(https?://[\\w\\d:#@%/;\$()~_?\\+-=\\.\\&]+)")
    return urlRegex.find(text)?.value ?: if (text.startsWith("http://") || text.startsWith("https://")) text else null
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuickShareSheet(
    sharedUrl: String?,
    onDismiss: () -> Unit,
    onStartDownload: (url: String, title: String, type: String, detail: String) -> Unit,
    onOpenFullApp: () -> Unit
) {
    if (sharedUrl.isNullOrBlank()) return

    val context = LocalContext.current
    val scope   = rememberCoroutineScope()

    var isAnalyzing  by remember(sharedUrl) { mutableStateOf(true) }
    var analyzeError by remember(sharedUrl) { mutableStateOf<String?>(null) }
    var metadata     by remember(sharedUrl) { mutableStateOf<MediaMetadata?>(null) }

    var selectedVideo by remember(metadata) { mutableStateOf(metadata?.videoFormats?.firstOrNull()) }
    var selectedAudio by remember(metadata) { mutableStateOf(metadata?.audioFormats?.firstOrNull()) }
    var downloadType  by remember(metadata) {
        mutableStateOf(if ((metadata?.videoFormats?.size ?: 0) > 0) "VIDEO" else "AUDIO")
    }

    val imageLoader = remember(context) {
        val client = OkHttpClient.Builder()
            .addInterceptor { chain ->
                val orig = chain.request()
                val url  = orig.url.toString()
                val ref  = when {
                    url.contains("instagram") -> "https://www.instagram.com/"
                    url.contains("tiktok")    -> "https://www.tiktok.com/"
                    url.contains("twitter")   -> "https://twitter.com/"
                    url.contains("facebook")  -> "https://www.facebook.com/"
                    else -> "https://www.youtube.com/"
                }
                chain.proceed(
                    orig.newBuilder()
                        .header("User-Agent", "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/124.0 Mobile Safari/537.36")
                        .header("Referer", ref)
                        .build()
                )
            }
            .build()
        ImageLoader.Builder(context).okHttpClient(client).crossfade(true).build()
    }

    // Auto-analyze link on launch
    LaunchedEffect(sharedUrl) {
        isAnalyzing  = true
        analyzeError = null
        try {
            val meta = MediaExtractor.extractMediaInfo(sharedUrl, removeWatermark = true)
            metadata = meta
            selectedVideo = meta.videoFormats.firstOrNull()
            selectedAudio = meta.audioFormats.firstOrNull()
            downloadType  = if (meta.videoFormats.isNotEmpty()) "VIDEO" else "AUDIO"
        } catch (e: Exception) {
            analyzeError = e.message ?: "Failed to analyze shared link"
        } finally {
            isAnalyzing = false
        }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = Black80,
        contentColor   = White,
        dragHandle     = {
            Box(
                modifier = Modifier
                    .padding(vertical = 10.dp)
                    .width(36.dp)
                    .height(4.dp)
                    .clip(CircleShape)
                    .background(DividerLight)
            )
        }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .padding(bottom = 32.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Rounded.FlashOn, null, tint = White, modifier = Modifier.size(18.dp))
                    Text("Quick Download", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = White)
                }
                IconButton(onClick = onDismiss, modifier = Modifier.size(32.dp)) {
                    Icon(Icons.Rounded.Close, "Close", tint = TextSecondary, modifier = Modifier.size(18.dp))
                }
            }

            HorizontalDivider(color = DividerColor, thickness = 0.5.dp)

            // Content States
            when {
                isAnalyzing -> {
                    Box(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 32.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            CircularProgressIndicator(color = White, strokeWidth = 2.dp, modifier = Modifier.size(28.dp))
                            Text("Analyzing shared link…", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                            Text(sharedUrl, style = MaterialTheme.typography.labelSmall, color = TextTertiary, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        }
                    }
                }

                analyzeError != null -> {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Icon(Icons.Rounded.ErrorOutline, null, tint = ErrorRed, modifier = Modifier.size(36.dp))
                        Text(analyzeError!!, style = MaterialTheme.typography.bodySmall, color = ErrorRed)
                        OutlinedButton(
                            onClick = {
                                scope.launch {
                                    isAnalyzing  = true
                                    analyzeError = null
                                    try {
                                        metadata = MediaExtractor.extractMediaInfo(sharedUrl, true)
                                    } catch (e: Exception) {
                                        analyzeError = e.message
                                    } finally {
                                        isAnalyzing = false
                                    }
                                }
                            },
                            shape = RoundedCornerShape(8.dp),
                            border = ButtonDefaults.outlinedButtonBorder.copy(width = 0.5.dp, brush = androidx.compose.ui.graphics.SolidColor(DividerLight))
                        ) {
                            Text("Retry", color = White, fontSize = 13.sp)
                        }
                    }
                }

                metadata != null -> {
                    val meta = metadata!!

                    // Media preview card
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(Black70)
                            .border(0.5.dp, DividerColor, RoundedCornerShape(12.dp))
                            .padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        if (!meta.thumbnailUrl.isNullOrBlank()) {
                            SubcomposeAsyncImage(
                                model = ImageRequest.Builder(context).data(meta.thumbnailUrl).crossfade(true).build(),
                                imageLoader = imageLoader,
                                contentDescription = null,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.size(64.dp).clip(RoundedCornerShape(8.dp))
                            )
                        } else {
                            Box(
                                modifier = Modifier.size(64.dp).clip(RoundedCornerShape(8.dp)).background(Black60),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Rounded.Movie, null, tint = TextTertiary, modifier = Modifier.size(24.dp))
                            }
                        }

                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(meta.title, style = MaterialTheme.typography.titleSmall, color = White, maxLines = 2, overflow = TextOverflow.Ellipsis)
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text(meta.platform.name, style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                                if (meta.author.isNotBlank()) {
                                    Text("·", style = MaterialTheme.typography.labelSmall, color = TextTertiary)
                                    Text(meta.author, style = MaterialTheme.typography.labelSmall, color = TextTertiary, maxLines = 1)
                                }
                            }
                        }
                    }

                    // Download Format Selector
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FormatTypeChip(
                            label = "Video",
                            icon = Icons.Rounded.Movie,
                            selected = downloadType == "VIDEO",
                            modifier = Modifier.weight(1f),
                            onClick = { downloadType = "VIDEO" }
                        )
                        FormatTypeChip(
                            label = "Audio",
                            icon = Icons.Rounded.Audiotrack,
                            selected = downloadType == "AUDIO",
                            modifier = Modifier.weight(1f),
                            onClick = { downloadType = "AUDIO" }
                        )
                    }

                    // Quality options
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        if (downloadType == "VIDEO") {
                            meta.videoFormats.take(3).forEach { vf ->
                                QuickQualityRow(
                                    label = vf.qualityLabel,
                                    subtext = "${vf.container.uppercase()} · ${if (vf.fps > 0) "${vf.fps}fps" else ""}",
                                    selected = selectedVideo == vf,
                                    onClick = { selectedVideo = vf }
                                )
                            }
                        } else {
                            meta.audioFormats.take(3).forEach { af ->
                                QuickQualityRow(
                                    label = af.qualityLabel,
                                    subtext = "${af.container.uppercase()} · ${if (af.bitrate > 0) "${af.bitrate}kbps" else ""}",
                                    selected = selectedAudio == af,
                                    onClick = { selectedAudio = af }
                                )
                            }
                        }
                    }

                    // Action Buttons
                    Button(
                        onClick = {
                            val (detail, url) = if (downloadType == "VIDEO") {
                                (selectedVideo?.qualityLabel ?: "720p") to (selectedVideo?.downloadUrl ?: sharedUrl)
                            } else {
                                ("Audio: ${selectedAudio?.qualityLabel ?: "MP3"}") to (selectedAudio?.downloadUrl ?: sharedUrl)
                            }
                            onStartDownload(url, meta.title, downloadType, detail)
                            Toast.makeText(context, "Download started!", Toast.LENGTH_SHORT).show()
                            onDismiss()
                        },
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = White, contentColor = Black)
                    ) {
                        Icon(Icons.Rounded.Download, null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Download Now", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    }

                    TextButton(
                        onClick = {
                            onDismiss()
                            onOpenFullApp()
                        },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Open in Full App", color = TextSecondary, fontSize = 13.sp)
                    }
                }
            }
        }
    }
}

@Composable
private fun FormatTypeChip(
    label: String,
    icon: ImageVector,
    selected: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(if (selected) Black60 else Black70)
            .border(0.5.dp, if (selected) White else DividerColor, RoundedCornerShape(8.dp))
            .clickable(onClick = onClick)
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, null, tint = if (selected) White else TextTertiary, modifier = Modifier.size(15.dp))
        Spacer(modifier = Modifier.width(6.dp))
        Text(label, fontSize = 12.sp, color = if (selected) White else TextTertiary, fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal)
    }
}

@Composable
private fun QuickQualityRow(
    label: String,
    subtext: String,
    selected: Boolean,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(if (selected) Black70 else Color.Transparent)
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Box(
                modifier = Modifier
                    .size(16.dp)
                    .clip(CircleShape)
                    .border(1.dp, if (selected) White else TextTertiary, CircleShape)
                    .background(if (selected) White else Color.Transparent),
                contentAlignment = Alignment.Center
            ) {
                if (selected) Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(Black))
            }
            Text(label, style = MaterialTheme.typography.bodySmall, color = if (selected) White else TextSecondary, fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal)
        }
        Text(subtext, style = MaterialTheme.typography.labelSmall, color = TextTertiary)
    }
}
