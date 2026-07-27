package com.videodownloader.app.ui

import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Gavel
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.videodownloader.app.R
import com.videodownloader.app.ui.theme.*

const val PREFS_NAME              = "downloader_prefs"
const val KEY_DISCLAIMER_ACCEPTED = "disclaimer_accepted"

fun isDisclaimerAccepted(context: Context): Boolean =
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .getBoolean(KEY_DISCLAIMER_ACCEPTED, false)

fun setDisclaimerAccepted(context: Context, accepted: Boolean) {
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .edit().putBoolean(KEY_DISCLAIMER_ACCEPTED, accepted).apply()
}

@Composable
fun DisclaimerDialog(onAccept: () -> Unit, onDecline: () -> Unit) {
    Dialog(
        onDismissRequest = {},
        properties = DialogProperties(dismissOnBackPress = false, dismissOnClickOutside = false)
    ) {
        Column(
            modifier = Modifier
                .clip(RoundedCornerShape(16.dp))
                .background(Black80)
                .border(0.5.dp, DividerLight, RoundedCornerShape(16.dp))
                .padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header
            Row(
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Rounded.Gavel, null, tint = White, modifier = Modifier.size(20.dp))
                Column {
                    Text(
                        stringResource(id = R.string.disclaimer_title),
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        color = White
                    )
                    Text("Please read before continuing", fontSize = 11.sp, color = TextSecondary)
                }
            }

            HorizontalDivider(color = DividerColor, thickness = 0.5.dp)

            // Content
            Text(
                text = stringResource(id = R.string.disclaimer_content),
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary,
                lineHeight = 19.sp
            )

            HorizontalDivider(color = DividerColor, thickness = 0.5.dp)

            // Buttons
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = onAccept,
                    modifier = Modifier.fillMaxWidth().height(46.dp),
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = White, contentColor = Black)
                ) {
                    Text(stringResource(id = R.string.disclaimer_accept), fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Black)
                }
                OutlinedButton(
                    onClick = onDecline,
                    modifier = Modifier.fillMaxWidth().height(44.dp),
                    shape = RoundedCornerShape(10.dp),
                    border = ButtonDefaults.outlinedButtonBorder.copy(
                        width = 0.5.dp,
                        brush = androidx.compose.ui.graphics.SolidColor(DividerLight)
                    )
                ) {
                    Text(stringResource(id = R.string.disclaimer_decline), color = ErrorRed, fontSize = 14.sp)
                }
            }
        }
    }
}
