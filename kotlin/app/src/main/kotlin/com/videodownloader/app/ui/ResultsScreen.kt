package com.videodownloader.app.ui

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
import okhttp3.OkHttpClient
import com.videodownloader.app.R
import com.videodownloader.app.model.AudioFormat
import com.videodownloader.app.model.MediaMetadata
import com.videodownloader.app.model.SubtitleOption
import com.videodownloader.app.model.VideoFormat
import com.videodownloader.app.ui.theme.*

private fun fmtDuration(s: Long): String {
    if (s <= 0) return "--:--"
    val h = s / 3600; val m = (s % 3600) / 60; val sec = s % 60
    return if (h > 0) "%d:%02d:%02d".format(h, m, sec) else "%02d:%02d".format(m, sec)
}

private fun fmtSize(bytes: Long): String {
    if (bytes <= 0) return ""
    val mb = bytes / (1024.0 * 1024.0)
    return if (mb >= 1024) "%.1f GB".format(mb / 1024.0) else "%.0f MB".format(mb)
}

@Composable
fun ResultsScreen(
    mediaMetadata: MediaMetadata?,
    onStartDownload: (formatType: String, detail: String, downloadUrl: String) -> Unit
) {
    if (mediaMetadata == null) {
        Box(
            modifier = Modifier.fillMaxSize().background(Black),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(Icons.Rounded.Movie, null, tint = TextTertiary, modifier = Modifier.size(40.dp))
                Text(stringResource(id = R.string.results_empty), style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                Text("Paste a link on the Home tab", style = MaterialTheme.typography.bodySmall, color = TextTertiary)
            }
        }
        return
    }

    val context = LocalContext.current

    // CDN-aware image loader
    val imageLoader = remember(context) {
        val client = OkHttpClient.Builder()
            .addInterceptor { chain ->
                val orig = chain.request()
                val url  = orig.url.toString()
                val ref  = when {
                    url.contains("cdninstagram") || url.contains("instagram") -> "https://www.instagram.com/"
                    url.contains("tiktokcdn")    || url.contains("tiktok")    -> "https://www.tiktok.com/"
                    url.contains("twimg")        || url.contains("twitter")   -> "https://twitter.com/"
                    url.contains("fbcdn")        || url.contains("facebook")  -> "https://www.facebook.com/"
                    url.contains("ytimg")        || url.contains("youtube")   -> "https://www.youtube.com/"
                    else -> "https://www.google.com/"
                }
                chain.proceed(
                    orig.newBuilder()
                        .header("User-Agent", "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/124.0 Mobile Safari/537.36")
                        .header("Referer", ref)
                        .header("Accept", "image/avif,image/webp,image/*,*/*;q=0.8")
                        .header("Sec-Fetch-Dest", "image")
                        .header("Sec-Fetch-Mode", "no-cors")
                        .header("Sec-Fetch-Site", "cross-site")
                        .build()
                )
            }
            .connectTimeout(20, java.util.concurrent.TimeUnit.SECONDS)
            .readTimeout(20, java.util.concurrent.TimeUnit.SECONDS)
            .build()
        ImageLoader.Builder(context).okHttpClient(client).crossfade(true).build()
    }

    val scroll   = rememberScrollState()
    var selVideo by remember(mediaMetadata) { mutableStateOf(mediaMetadata.videoFormats.firstOrNull()) }
    var selAudio by remember(mediaMetadata) { mutableStateOf(mediaMetadata.audioFormats.firstOrNull()) }
    var selSub   by remember(mediaMetadata) { mutableStateOf(mediaMetadata.subtitles.firstOrNull()) }
    var dlType   by remember(mediaMetadata) {
        mutableStateOf(when {
            mediaMetadata.videoFormats.isNotEmpty() -> "VIDEO"
            mediaMetadata.audioFormats.isNotEmpty() -> "AUDIO"
            else -> "SUBTITLE"
        })
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Black)
            .verticalScroll(scroll)
    ) {
        // ── Thumbnail ─────────────────────────────────────────────────────────
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(220.dp)
                .background(Black80)
        ) {
            if (!mediaMetadata.thumbnailUrl.isNullOrBlank()) {
                SubcomposeAsyncImage(
                    model = ImageRequest.Builder(context).data(mediaMetadata.thumbnailUrl).crossfade(true).build(),
                    imageLoader = imageLoader,
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize(),
                    loading = {
                        Box(modifier = Modifier.fillMaxSize().background(Black80))
                    },
                    error = {
                        Box(
                            modifier = Modifier.fillMaxSize().background(Black80),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Rounded.BrokenImage, null, tint = TextTertiary, modifier = Modifier.size(36.dp))
                        }
                    }
                )
            } else {
                Box(
                    modifier = Modifier.fillMaxSize().background(Black80),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Rounded.Movie, null, tint = TextTertiary, modifier = Modifier.size(48.dp))
                }
            }
            // Platform badge
            Box(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(12.dp)
                    .clip(RoundedCornerShape(4.dp))
                    .background(Color.Black.copy(alpha = 0.75f))
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Text(
                    mediaMetadata.platform.name,
                    fontSize = 11.sp,
                    color = White,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 0.5.sp
                )
            }
        }

        // ── Meta ──────────────────────────────────────────────────────────────
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(
                text = mediaMetadata.title,
                style = MaterialTheme.typography.titleMedium,
                color = White,
                maxLines = 3,
                overflow = TextOverflow.Ellipsis
            )
            Row(
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (mediaMetadata.author.isNotBlank()) {
                    MetaRow(Icons.Rounded.Person, mediaMetadata.author)
                }
                if (mediaMetadata.durationSeconds > 0) {
                    MetaRow(Icons.Rounded.Timer, fmtDuration(mediaMetadata.durationSeconds))
                }
            }
        }

        HorizontalDivider(color = DividerColor, thickness = 0.5.dp)

        // ── Type Tab Selector ─────────────────────────────────────────────────
        Row(modifier = Modifier.fillMaxWidth().background(Black)) {
            listOf(
                Triple("VIDEO",    Icons.Rounded.Movie,       "Video"),
                Triple("AUDIO",    Icons.Rounded.Audiotrack,  "Audio"),
                Triple("SUBTITLE", Icons.Rounded.Subtitles,   "Subtitles")
            ).forEachIndexed { idx, (type, icon, label) ->
                val sel = dlType == type
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .clickable { dlType = type }
                        .padding(vertical = 14.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(icon, null, tint = if (sel) White else TextTertiary, modifier = Modifier.size(18.dp))
                    Text(
                        label,
                        fontSize = 11.sp,
                        color = if (sel) White else TextTertiary,
                        fontWeight = if (sel) FontWeight.SemiBold else FontWeight.Normal
                    )
                }
                if (idx < 2) {
                    Box(
                        modifier = Modifier
                            .width(0.5.dp)
                            .height(48.dp)
                            .align(Alignment.CenterVertically)
                            .background(DividerColor)
                    )
                }
            }
        }

        // Active-tab underline
        Row(modifier = Modifier.fillMaxWidth()) {
            listOf("VIDEO", "AUDIO", "SUBTITLE").forEach { t ->
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(1.dp)
                        .background(if (dlType == t) White else DividerColor)
                )
            }
        }

        Spacer(modifier = Modifier.height(4.dp))

        // ── Format List ───────────────────────────────────────────────────────
        AnimatedContent(
            targetState = dlType,
            transitionSpec = { fadeIn(tween(150)) togetherWith fadeOut(tween(100)) },
            label = "dltype"
        ) { active ->
            Column(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(0.dp)
            ) {
                when (active) {
                    "VIDEO" -> {
                        SectionLabel(stringResource(id = R.string.section_video_quality))
                        if (mediaMetadata.videoFormats.isEmpty()) {
                            EmptyNote("No video formats found")
                        } else {
                            mediaMetadata.videoFormats.forEach { vf ->
                                VideoRow(vf, selVideo?.formatId == vf.formatId) { selVideo = vf }
                                HorizontalDivider(color = DividerColor, thickness = 0.5.dp)
                            }
                        }
                    }
                    "AUDIO" -> {
                        SectionLabel(stringResource(id = R.string.section_audio_options))
                        if (mediaMetadata.audioFormats.isEmpty()) {
                            EmptyNote("No audio formats found")
                        } else {
                            mediaMetadata.audioFormats.forEach { af ->
                                AudioRow(af, selAudio?.formatId == af.formatId) { selAudio = af }
                                HorizontalDivider(color = DividerColor, thickness = 0.5.dp)
                            }
                        }
                    }
                    "SUBTITLE" -> {
                        SectionLabel(stringResource(id = R.string.section_subtitles))
                        if (mediaMetadata.subtitles.isEmpty()) {
                            EmptyNote("No subtitles available")
                        } else {
                            mediaMetadata.subtitles.forEach { sub ->
                                SubRow(sub, selSub == sub) { selSub = sub }
                                HorizontalDivider(color = DividerColor, thickness = 0.5.dp)
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // ── Download Button ───────────────────────────────────────────────────
        val canDl = when (dlType) {
            "VIDEO" -> selVideo != null
            "AUDIO" -> selAudio != null
            else    -> selSub != null
        }
        Button(
            onClick = {
                val (detail, url) = when (dlType) {
                    "VIDEO" -> selVideo!!.qualityLabel to selVideo!!.downloadUrl
                    "AUDIO" -> "Audio: ${selAudio!!.qualityLabel}" to selAudio!!.downloadUrl
                    else    -> "Subtitle: ${selSub!!.languageName} (.${selSub!!.format})" to selSub!!.downloadUrl
                }
                onStartDownload(dlType, detail, url)
            },
            enabled  = canDl,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .height(52.dp),
            shape  = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor         = White,
                contentColor           = Black,
                disabledContainerColor = Black70,
                disabledContentColor   = TextTertiary
            )
        ) {
            Icon(Icons.Rounded.Download, null, modifier = Modifier.size(18.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Text(stringResource(id = R.string.btn_download), fontWeight = FontWeight.Bold, fontSize = 15.sp)
        }

        Spacer(modifier = Modifier.height(24.dp))
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

@Composable
private fun SectionLabel(title: String) {
    Text(
        text = title.uppercase(),
        style = MaterialTheme.typography.labelSmall,
        color = TextTertiary,
        letterSpacing = 1.sp,
        modifier = Modifier.padding(horizontal = 4.dp, vertical = 12.dp)
    )
}

@Composable
private fun EmptyNote(msg: String) {
    Box(
        modifier = Modifier.fillMaxWidth().padding(vertical = 24.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(msg, style = MaterialTheme.typography.bodySmall, color = TextTertiary)
    }
}

@Composable
private fun SelectionDot(selected: Boolean) {
    Box(
        modifier = Modifier
            .size(20.dp)
            .clip(CircleShape)
            .border(1.5.dp, if (selected) White else DividerLight, CircleShape)
            .background(if (selected) White else Color.Transparent),
        contentAlignment = Alignment.Center
    ) {
        if (selected) {
            Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(Black))
        }
    }
}

@Composable
private fun VideoRow(vf: VideoFormat, selected: Boolean, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 4.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            SelectionDot(selected)
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    vf.qualityLabel,
                    style = MaterialTheme.typography.titleSmall,
                    color = if (selected) White else TextSecondary
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (vf.container.isNotBlank()) {
                        Text(vf.container.uppercase(), style = MaterialTheme.typography.labelSmall, color = TextTertiary)
                    }
                    if (vf.fps > 0) {
                        Text("${vf.fps}fps", style = MaterialTheme.typography.labelSmall, color = TextTertiary)
                    }
                    if (vf.width > 0) {
                        Text("${vf.width}x${vf.height}", style = MaterialTheme.typography.labelSmall, color = TextTertiary)
                    }
                }
            }
        }
        val sz = fmtSize(vf.sizeBytes)
        if (sz.isNotEmpty()) {
            Text(sz, style = MaterialTheme.typography.labelSmall, color = if (selected) White else TextTertiary)
        }
    }
}

@Composable
private fun AudioRow(af: AudioFormat, selected: Boolean, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 4.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            SelectionDot(selected)
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    af.qualityLabel,
                    style = MaterialTheme.typography.titleSmall,
                    color = if (selected) White else TextSecondary
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (af.container.isNotBlank()) {
                        Text(af.container.uppercase(), style = MaterialTheme.typography.labelSmall, color = TextTertiary)
                    }
                    if (af.bitrate > 0) {
                        Text("${af.bitrate} kbps", style = MaterialTheme.typography.labelSmall, color = TextTertiary)
                    }
                }
            }
        }
        val sz = fmtSize(af.sizeBytes)
        if (sz.isNotEmpty()) {
            Text(sz, style = MaterialTheme.typography.labelSmall, color = if (selected) White else TextTertiary)
        }
    }
}

@Composable
private fun SubRow(sub: SubtitleOption, selected: Boolean, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 4.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            SelectionDot(selected)
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    sub.languageName,
                    style = MaterialTheme.typography.titleSmall,
                    color = if (selected) White else TextSecondary
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(sub.languageCode.uppercase(), style = MaterialTheme.typography.labelSmall, color = TextTertiary)
                    Text(".${sub.format}", style = MaterialTheme.typography.labelSmall, color = TextTertiary)
                    if (sub.isAutoGenerated) {
                        Text("AUTO", style = MaterialTheme.typography.labelSmall, color = WarnYellow)
                    }
                }
            }
        }
        if (selected) {
            Icon(Icons.Rounded.Check, null, tint = White, modifier = Modifier.size(16.dp))
        }
    }
}

@Composable
private fun MetaRow(icon: ImageVector, label: String) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Icon(icon, null, tint = TextTertiary, modifier = Modifier.size(13.dp))
        Text(label, style = MaterialTheme.typography.bodySmall, color = TextSecondary, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}
