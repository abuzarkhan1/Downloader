package com.videodownloader.app.ui

import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.videodownloader.app.R
import com.videodownloader.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    urlText: String,
    onUrlChange: (String) -> Unit,
    isBatchMode: Boolean,
    onBatchModeChange: (Boolean) -> Unit,
    removeWatermark: Boolean,
    onRemoveWatermarkChange: (Boolean) -> Unit,
    onPasteFromClipboard: () -> Unit,
    onAnalyzeLink: (String) -> Unit,
    isAnalyzing: Boolean = false
) {
    val scroll = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Black)
            .verticalScroll(scroll)
            .padding(horizontal = 20.dp)
            .padding(top = 28.dp, bottom = 40.dp),
        verticalArrangement = Arrangement.spacedBy(0.dp)
    ) {

        // ── Headline ──────────────────────────────────────────────────────────
        Text(
            text = "Download\nAnything.",
            style = MaterialTheme.typography.displayLarge.copy(
                fontSize = 40.sp,
                fontWeight = FontWeight.Black,
                letterSpacing = (-1.5).sp,
                lineHeight = 46.sp
            ),
            color = White
        )

        Spacer(modifier = Modifier.height(6.dp))

        Text(
            text = "YouTube · TikTok · Instagram · Twitter & more",
            style = MaterialTheme.typography.bodySmall,
            color = TextSecondary
        )

        Spacer(modifier = Modifier.height(28.dp))

        // ── URL Input ─────────────────────────────────────────────────────────
        UrlInputCard(
            urlText = urlText,
            onUrlChange = onUrlChange,
            isBatchMode = isBatchMode,
            onPasteFromClipboard = onPasteFromClipboard
        )

        Spacer(modifier = Modifier.height(16.dp))

        // ── Options Row ───────────────────────────────────────────────────────
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            ToggleChip(
                modifier = Modifier.weight(1f),
                selected = isBatchMode,
                icon = if (isBatchMode) Icons.Rounded.DynamicFeed else Icons.Rounded.Link,
                label = if (isBatchMode) "Batch mode" else "Single link",
                onClick = { onBatchModeChange(!isBatchMode) }
            )
            ToggleChip(
                modifier = Modifier.weight(1f),
                selected = removeWatermark,
                icon = Icons.Rounded.Block,
                label = "No watermark",
                onClick = { onRemoveWatermarkChange(!removeWatermark) }
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        // ── Analyze Button ────────────────────────────────────────────────────
        Button(
            onClick = { if (!isAnalyzing && urlText.isNotBlank()) onAnalyzeLink(urlText) },
            enabled = urlText.isNotBlank() && !isAnalyzing,
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor         = White,
                contentColor           = Black,
                disabledContainerColor = Black70,
                disabledContentColor   = TextTertiary
            )
        ) {
            if (isAnalyzing) {
                CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Black, strokeWidth = 2.dp)
                Spacer(modifier = Modifier.width(10.dp))
                Text("Analyzing…", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Black)
            } else {
                Icon(Icons.Rounded.Search, null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text(stringResource(id = R.string.btn_analyze), fontWeight = FontWeight.Bold, fontSize = 15.sp)
            }
        }

        Spacer(modifier = Modifier.height(32.dp))

        // ── Platform Footer ───────────────────────────────────────────────────
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Text(
                "SUPPORTED PLATFORMS",
                style = MaterialTheme.typography.labelSmall,
                color = TextTertiary,
                letterSpacing = 1.2.sp
            )
            Row(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                listOf("YouTube", "TikTok", "Instagram", "Twitter", "Facebook").forEach { name ->
                    Text(
                        text = name,
                        style = MaterialTheme.typography.labelSmall,
                        color = TextSecondary,
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(Black80)
                            .border(0.5.dp, DividerColor, RoundedCornerShape(6.dp))
                            .padding(horizontal = 9.dp, vertical = 4.dp)
                    )
                }
            }
        }
    }
}

// ── URL Input Card ────────────────────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun UrlInputCard(
    urlText: String,
    onUrlChange: (String) -> Unit,
    isBatchMode: Boolean,
    onPasteFromClipboard: () -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isFocused by interactionSource.collectIsFocusedAsState()

    val borderWidth by animateDpAsState(
        targetValue = if (isFocused) 1.5.dp else 1.dp,
        animationSpec = tween(200),
        label = "border_width"
    )

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(Black80)
            .border(
                width = borderWidth,
                color = if (isFocused) White20 else DividerColor,
                shape = RoundedCornerShape(14.dp)
            )
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        // Label row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = if (isBatchMode) "URLs — one per line" else "Video URL",
                style = MaterialTheme.typography.labelSmall,
                color = TextTertiary,
                letterSpacing = 0.8.sp
            )
            TextButton(
                onClick = onPasteFromClipboard,
                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
            ) {
                Icon(Icons.Rounded.ContentPaste, null, modifier = Modifier.size(13.dp), tint = TextSecondary)
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    stringResource(id = R.string.btn_paste),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    color = TextSecondary
                )
            }
        }

        // Text Field
        OutlinedTextField(
            value = urlText,
            onValueChange = onUrlChange,
            modifier = Modifier.fillMaxWidth(),
            interactionSource = interactionSource,
            placeholder = {
                Text(
                    if (isBatchMode) "https://youtube.com/watch?v=...\nhttps://tiktok.com/@user/video/..."
                    else "https://youtube.com/watch?v=...",
                    color = TextTertiary,
                    fontSize = 13.sp
                )
            },
            trailingIcon = {
                if (urlText.isNotEmpty()) {
                    IconButton(onClick = { onUrlChange("") }, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Rounded.Close, "Clear", tint = TextSecondary, modifier = Modifier.size(16.dp))
                    }
                }
            },
            singleLine = !isBatchMode,
            maxLines   = if (isBatchMode) 5 else 1,
            minLines   = if (isBatchMode) 3 else 1,
            shape = RoundedCornerShape(10.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor      = DividerLight,
                unfocusedBorderColor    = DividerColor,
                focusedTextColor        = White,
                unfocusedTextColor      = White,
                cursorColor             = White,
                focusedContainerColor   = Black70,
                unfocusedContainerColor = Black70
            ),
            textStyle = LocalTextStyle.current.copy(fontSize = 14.sp, color = White, lineHeight = 20.sp)
        )

        if (urlText.isNotBlank()) {
            Text(
                "${urlText.length} characters",
                style = MaterialTheme.typography.labelSmall,
                color = TextTertiary,
                modifier = Modifier.align(Alignment.End)
            )
        }
    }
}

// ── Toggle Chip ───────────────────────────────────────────────────────────────
@Composable
private fun ToggleChip(
    modifier: Modifier = Modifier,
    selected: Boolean,
    icon: ImageVector,
    label: String,
    onClick: () -> Unit
) {
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .background(if (selected) Black60 else Black80)
            .border(
                width = if (selected) 1.dp else 0.5.dp,
                color = if (selected) DividerLight else DividerColor,
                shape = RoundedCornerShape(10.dp)
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Icon(
            icon, null,
            modifier = Modifier.size(15.dp),
            tint = if (selected) White else TextSecondary
        )
        Text(
            label,
            fontSize = 13.sp,
            fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
            color = if (selected) White else TextSecondary,
            maxLines = 1
        )
    }
}
