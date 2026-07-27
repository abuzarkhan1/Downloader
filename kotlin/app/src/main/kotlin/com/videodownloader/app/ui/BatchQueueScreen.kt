package com.videodownloader.app.ui

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.videodownloader.app.R
import com.videodownloader.app.ui.theme.*

enum class DownloadStatus { QUEUED, DOWNLOADING, COMPLETED, FAILED }

data class QueueItem(
    val id: String,
    val title: String,
    val quality: String,
    val status: DownloadStatus,
    val progressPercent: Int,
    val isPaused: Boolean = false,
    val localUri: String? = null,
    val mimeType: String = "video/mp4"
)

@Composable
fun BatchQueueScreen(
    queueItems: List<QueueItem>,
    onPauseItem: (String) -> Unit,
    onResumeItem: (String) -> Unit,
    onRetryItem: (String) -> Unit,
    onCancelItem: (String) -> Unit,
    onClearCompleted: () -> Unit,
    onOpenItem: ((QueueItem) -> Unit)? = null
) {
    val context = LocalContext.current
    val handleOpen: (QueueItem) -> Unit = onOpenItem ?: { item ->
        val uri = item.localUri
        if (uri.isNullOrEmpty()) {
            Toast.makeText(context, "File path unavailable", Toast.LENGTH_SHORT).show()
        } else {
            try {
                context.startActivity(
                    Intent(Intent.ACTION_VIEW).apply {
                        setDataAndType(Uri.parse(uri), item.mimeType)
                        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    }
                )
            } catch (e: Exception) {
                Toast.makeText(context, "Cannot open file", Toast.LENGTH_SHORT).show()
            }
        }
    }

    val completing  = queueItems.count { it.status == DownloadStatus.COMPLETED }
    val downloading = queueItems.count { it.status == DownloadStatus.DOWNLOADING }
    val failed      = queueItems.count { it.status == DownloadStatus.FAILED }
    val queued      = queueItems.count { it.status == DownloadStatus.QUEUED }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Black)
    ) {
        // ── Header ────────────────────────────────────────────────────────────
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(Black)
                .padding(horizontal = 20.dp, vertical = 20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = stringResource(id = R.string.queue_title),
                        style = MaterialTheme.typography.titleLarge,
                        color = White
                    )
                    Text(
                        text = "${queueItems.size} items",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary
                    )
                }
                if (completing > 0) {
                    TextButton(onClick = onClearCompleted) {
                        Icon(Icons.Rounded.Delete, null, tint = ErrorRed, modifier = Modifier.size(15.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(stringResource(id = R.string.queue_clear_completed), color = ErrorRed, fontSize = 13.sp)
                    }
                }
            }

            // Status summary pills
            if (queueItems.isNotEmpty()) {
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    if (downloading > 0) StatusPill("$downloading active", White)
                    if (completing  > 0) StatusPill("$completing done",   SuccessGreen)
                    if (queued      > 0) StatusPill("$queued waiting",     TextSecondary)
                    if (failed      > 0) StatusPill("$failed failed",      ErrorRed)
                }
            }
        }

        HorizontalDivider(color = DividerColor, thickness = 0.5.dp)

        // ── Content ───────────────────────────────────────────────────────────
        if (queueItems.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.Rounded.Inbox, null, tint = TextTertiary, modifier = Modifier.size(40.dp))
                    Text(stringResource(id = R.string.queue_empty), style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                    Text("Go to Home and analyze a link", style = MaterialTheme.typography.bodySmall, color = TextTertiary)
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
                verticalArrangement = Arrangement.spacedBy(1.dp)
            ) {
                items(queueItems, key = { it.id }) { item ->
                    QueueItemRow(
                        item = item,
                        onPause    = { onPauseItem(item.id) },
                        onResume   = { onResumeItem(item.id) },
                        onRetry    = { onRetryItem(item.id) },
                        onCancel   = { onCancelItem(item.id) },
                        onOpenItem = { handleOpen(item) }
                    )
                    HorizontalDivider(color = DividerColor, thickness = 0.5.dp)
                }
            }
        }
    }
}

// ── Queue Item Row ────────────────────────────────────────────────────────────
@Composable
fun QueueItemRow(
    item: QueueItem,
    onPause: () -> Unit,
    onResume: () -> Unit,
    onRetry: () -> Unit,
    onCancel: () -> Unit,
    onOpenItem: (QueueItem) -> Unit = {}
) {
    val animProgress by animateFloatAsState(
        targetValue = item.progressPercent / 100f,
        animationSpec = tween(500, easing = FastOutSlowInEasing),
        label = "progress"
    )

    val (statusColor, statusText) = when (item.status) {
        DownloadStatus.DOWNLOADING -> if (item.isPaused) WarnYellow to "Paused" else White to "Downloading"
        DownloadStatus.COMPLETED   -> SuccessGreen to "Completed"
        DownloadStatus.FAILED      -> ErrorRed to "Failed"
        DownloadStatus.QUEUED      -> TextSecondary to "Queued"
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Black)
            .then(
                if (item.status == DownloadStatus.COMPLETED)
                    Modifier.clickable { onOpenItem(item) }
                else Modifier
            )
            .padding(horizontal = 4.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.Top,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(
                    text = item.title,
                    style = MaterialTheme.typography.titleSmall,
                    color = White,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(item.quality, style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                    Text("·", color = TextTertiary, fontSize = 10.sp)
                    Text(statusText, style = MaterialTheme.typography.labelSmall, color = statusColor, fontWeight = FontWeight.SemiBold)
                }
            }

            Spacer(modifier = Modifier.width(8.dp))

            // Action icons
            Row(verticalAlignment = Alignment.CenterVertically) {
                when (item.status) {
                    DownloadStatus.DOWNLOADING -> {
                        if (item.isPaused) {
                            QueueIconBtn(Icons.Rounded.PlayArrow, "Resume", White, onResume)
                        } else {
                            QueueIconBtn(Icons.Rounded.Pause, "Pause", TextSecondary, onPause)
                        }
                        QueueIconBtn(Icons.Rounded.Close, "Cancel", TextTertiary, onCancel)
                    }
                    DownloadStatus.FAILED -> {
                        QueueIconBtn(Icons.Rounded.Refresh, "Retry", White, onRetry)
                        QueueIconBtn(Icons.Rounded.Close, "Remove", TextTertiary, onCancel)
                    }
                    DownloadStatus.COMPLETED -> {
                        Icon(Icons.Rounded.OpenInNew, "Open", tint = SuccessGreen, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                    }
                    DownloadStatus.QUEUED -> {
                        QueueIconBtn(Icons.Rounded.Close, "Cancel", TextTertiary, onCancel)
                    }
                }
            }
        }

        // Progress bar — only when active
        if (item.status == DownloadStatus.DOWNLOADING || item.status == DownloadStatus.QUEUED) {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(2.dp)
                        .clip(RoundedCornerShape(1.dp))
                        .background(Black60)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(animProgress)
                            .fillMaxHeight()
                            .background(if (item.isPaused) WarnYellow else White)
                    )
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = if (item.status == DownloadStatus.QUEUED) "Waiting…"
                               else if (item.isPaused) "Paused"
                               else "Downloading",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextTertiary
                    )
                    Text(
                        text = "${item.progressPercent}%",
                        style = MaterialTheme.typography.labelSmall,
                        color = statusColor,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        } else if (item.status == DownloadStatus.FAILED) {
            Text(
                text = "Download failed — tap retry to try again",
                style = MaterialTheme.typography.labelSmall,
                color = ErrorRed
            )
        } else if (item.status == DownloadStatus.COMPLETED) {
            Text(
                text = "Saved · Tap to open",
                style = MaterialTheme.typography.labelSmall,
                color = SuccessGreen
            )
        }
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
@Composable
private fun QueueIconBtn(icon: ImageVector, desc: String, tint: Color, onClick: () -> Unit) {
    IconButton(onClick = onClick, modifier = Modifier.size(36.dp)) {
        Icon(icon, contentDescription = desc, tint = tint, modifier = Modifier.size(18.dp))
    }
}

@Composable
private fun StatusPill(label: String, color: Color) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(20.dp))
            .border(0.5.dp, color.copy(alpha = 0.35f), RoundedCornerShape(20.dp))
            .padding(horizontal = 10.dp, vertical = 4.dp)
    ) {
        Text(label, fontSize = 11.sp, color = color, fontWeight = FontWeight.Medium)
    }
}
