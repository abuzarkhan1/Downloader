// Multi-Tiered Dark Theme Tokens & Brand Accents
export const Colors = {
  black: '#000000', // Canvas
  black90: '#0A0A0A',
  black80: '#141414',
  black70: '#1C1C1C',
  black60: '#242424',
  black50: '#2C2C2C',
  
  // New Elevation Surfaces
  surfaceCard: '#0F0F12', // Card surface
  surfaceInput: '#18181C', // Inputs
  surfaceOverlay: '#1C1C22', // Floating overlays
  
  // Glassmorphic Borders
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassBorderHighlight: 'rgba(255, 255, 255, 0.2)',
  
  dividerColor: '#2A2A2A',
  dividerLight: '#3A3A3A',
  
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  textTertiary: '#555555',
  
  white: '#FFFFFF',
  white10: 'rgba(255, 255, 255, 0.1)',
  white20: 'rgba(255, 255, 255, 0.2)',
  
  errorRed: '#FF3B30',
  successGreen: '#30D158',
  warnYellow: '#FFD60A',
  
  primary: '#FFFFFF',
  primaryButtonText: '#000000',

  // Platform Brand Colors
  brandYoutube: '#FF0000',
  brandTiktok: '#00F2FE',
  brandInstagram: '#E1306C',
  brandTwitter: '#1DA1F2',
  brandFacebook: '#1877F2',
};

export const Typography = {
  displayLarge: { fontWeight: '900' as const, fontSize: 57, letterSpacing: -1.0 },
  titleLarge: { fontWeight: '700' as const, fontSize: 20, letterSpacing: -0.5 },
  titleMedium: { fontWeight: '600' as const, fontSize: 16, letterSpacing: -0.3 },
  titleSmall: { fontWeight: '600' as const, fontSize: 14, letterSpacing: -0.2 },
  bodyLarge: { fontWeight: '400' as const, fontSize: 16, letterSpacing: 0 },
  bodyMedium: { fontWeight: '400' as const, fontSize: 14, letterSpacing: 0.1 },
  bodySmall: { fontWeight: '400' as const, fontSize: 12, letterSpacing: 0.2 },
  labelLarge: { fontWeight: '600' as const, fontSize: 14, letterSpacing: 0.1 },
  labelMedium: { fontWeight: '500' as const, fontSize: 12, letterSpacing: 0.4 },
  labelSmall: { fontWeight: '500' as const, fontSize: 11, letterSpacing: 0.6 },
};

export const Shapes = {
  borderRadiusSmall: 8,
  borderRadiusMedium: 12,
  borderRadiusLarge: 16,
  borderRadiusCard: 20,
  borderRadiusPill: 999,
};
