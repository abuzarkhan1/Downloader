// Exact design system color tokens matching Kotlin Theme.kt
export const Colors = {
  black: '#000000',
  black90: '#0A0A0A', // Card / surface background
  black80: '#141414', // Secondary surface / container
  black70: '#1C1C1C', // Input background / tertiary container
  black60: '#242424', // Elevated border / subtle highlight
  black50: '#2C2C2C', // Active border / control fills
  dividerColor: '#2A2A2A', // Standard border / divider line
  dividerLight: '#3A3A3A', // Active / focused border
  textPrimary: '#FFFFFF', // Primary text
  textSecondary: '#888888', // Subtitles / labels
  textTertiary: '#555555', // Placeholders / muted captions
  white: '#FFFFFF',
  white10: 'rgba(255, 255, 255, 0.1)',
  white20: 'rgba(255, 255, 255, 0.2)',
  errorRed: '#FF3B30',
  successGreen: '#30D158',
  warnYellow: '#FFD60A',
  primary: '#FFFFFF', // Primary action accent in Kotlin
  primaryButtonText: '#000000',
};

export const Typography = {
  displayLarge: { fontWeight: '900' as const, fontSize: 57, letterSpacing: -0.5 },
  titleLarge: { fontWeight: '700' as const, fontSize: 20, letterSpacing: -0.3 },
  titleMedium: { fontWeight: '600' as const, fontSize: 16, letterSpacing: -0.2 },
  titleSmall: { fontWeight: '600' as const, fontSize: 14, letterSpacing: -0.1 },
  bodyLarge: { fontWeight: '400' as const, fontSize: 16, letterSpacing: 0 },
  bodyMedium: { fontWeight: '400' as const, fontSize: 14, letterSpacing: 0 },
  bodySmall: { fontWeight: '400' as const, fontSize: 12, letterSpacing: 0.1 },
  labelLarge: { fontWeight: '600' as const, fontSize: 14, letterSpacing: 0 },
  labelMedium: { fontWeight: '500' as const, fontSize: 12, letterSpacing: 0.3 },
  labelSmall: { fontWeight: '500' as const, fontSize: 11, letterSpacing: 0.5 },
};

export const Shapes = {
  borderRadiusSmall: 8,
  borderRadiusMedium: 12,
  borderRadiusLarge: 16,
  borderRadiusCard: 20,
  borderRadiusPill: 999,
};
