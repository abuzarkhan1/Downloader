package com.videodownloader.app.ui.theme

import android.app.Activity
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.core.view.WindowCompat

// ── Color Tokens ──────────────────────────────────────────────────────────────
val Black         = Color(0xFF000000)
val Black90       = Color(0xFF0A0A0A)
val Black80       = Color(0xFF141414)
val Black70       = Color(0xFF1C1C1C)
val Black60       = Color(0xFF242424)
val Black50       = Color(0xFF2C2C2C)
val DividerColor  = Color(0xFF2A2A2A)
val DividerLight  = Color(0xFF3A3A3A)
val TextPrimary   = Color(0xFFFFFFFF)
val TextSecondary = Color(0xFF888888)
val TextTertiary  = Color(0xFF555555)
val White         = Color(0xFFFFFFFF)
val White10       = Color(0x1AFFFFFF)
val White20       = Color(0x33FFFFFF)
val ErrorRed      = Color(0xFFFF3B30)
val SuccessGreen  = Color(0xFF30D158)
val WarnYellow    = Color(0xFFFFD60A)

// ── Color Scheme ──────────────────────────────────────────────────────────────
private val AppColorScheme = darkColorScheme(
    primary                = White,
    onPrimary              = Black,
    primaryContainer       = Black70,
    onPrimaryContainer     = White,
    secondary              = Color(0xFF8E8E93),
    onSecondary            = Black,
    secondaryContainer     = Black60,
    onSecondaryContainer   = TextPrimary,
    background             = Black,
    onBackground           = White,
    surface                = Black90,
    onSurface              = White,
    surfaceVariant         = Black80,
    onSurfaceVariant       = TextSecondary,
    outline                = DividerColor,
    outlineVariant         = Black50,
    error                  = ErrorRed,
    onError                = White,
    inverseSurface         = White,
    inverseOnSurface       = Black
)

// ── Typography ────────────────────────────────────────────────────────────────
private val AppTypography = Typography(
    displayLarge   = TextStyle(fontWeight = FontWeight.Black,    fontSize = 57.sp, letterSpacing = (-0.5).sp),
    titleLarge     = TextStyle(fontWeight = FontWeight.Bold,     fontSize = 20.sp, letterSpacing = (-0.3).sp),
    titleMedium    = TextStyle(fontWeight = FontWeight.SemiBold, fontSize = 16.sp, letterSpacing = (-0.2).sp),
    titleSmall     = TextStyle(fontWeight = FontWeight.SemiBold, fontSize = 14.sp, letterSpacing = (-0.1).sp),
    bodyLarge      = TextStyle(fontWeight = FontWeight.Normal,   fontSize = 16.sp, letterSpacing = 0.sp),
    bodyMedium     = TextStyle(fontWeight = FontWeight.Normal,   fontSize = 14.sp, letterSpacing = 0.sp),
    bodySmall      = TextStyle(fontWeight = FontWeight.Normal,   fontSize = 12.sp, letterSpacing = 0.1.sp),
    labelLarge     = TextStyle(fontWeight = FontWeight.SemiBold, fontSize = 14.sp, letterSpacing = 0.sp),
    labelMedium    = TextStyle(fontWeight = FontWeight.Medium,   fontSize = 12.sp, letterSpacing = 0.3.sp),
    labelSmall     = TextStyle(fontWeight = FontWeight.Medium,   fontSize = 11.sp, letterSpacing = 0.5.sp)
)

// ── Theme ─────────────────────────────────────────────────────────────────────
@Composable
fun VideoDownloaderTheme(content: @Composable () -> Unit) {
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor     = Black.toArgb()
            window.navigationBarColor = Black.toArgb()
            with(WindowCompat.getInsetsController(window, view)) {
                isAppearanceLightStatusBars     = false
                isAppearanceLightNavigationBars = false
            }
        }
    }
    MaterialTheme(
        colorScheme = AppColorScheme,
        typography  = AppTypography,
        content     = content
    )
}
