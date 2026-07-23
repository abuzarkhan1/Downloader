/**
 * Seal Material Design 3 (MD3) Design System Tokens & Theme
 * Primary Seed: #A3D48D / #B4EB12 (Seal Signature Lime Green)
 */

export const sealColors = {
  // Primary / Lime Green Accent
  primary: '#B4EB12',
  primarySeed: '#A3D48D',
  primaryContainer: '#2F4D18',
  primaryContainerAlt: '#38531D',
  onPrimary: '#13140E',
  onPrimaryContainer: '#C6EE58',

  // Surfaces & Backgrounds
  background: '#13140E',
  surface: '#1B1C18',
  surfaceContainer: '#202119',
  surfaceContainerAlt: '#25271F',
  surfaceContainerHigh: '#2B2C23',
  surfaceContainerHighest: '#36392D',

  // Borders & Dividers
  border: '#36392D',
  borderLight: '#44483B',

  // Typography
  textPrimary: '#E3E3DC',
  textPrimaryWhite: '#FFFFFF',
  textSecondary: '#C6C8BC',
  textMuted: '#A1A1AA',

  // Status & Feedback
  error: '#FF5449',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',
  success: '#A3D48D',
  warning: '#FACC15',
} as const;

export const sealRadii = {
  xs: 4,
  sm: 8,
  md: 12,
  card: 16, // MD3 16dp radius
  lg: 16,
  xl: 24, // MD3 24dp radius
  pill: 9999,
  full: 9999,
} as const;

export const sealSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const sealTypography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  sizes: {
    caption: 12,
    body: 14,
    subheading: 16,
    heading: 20,
    title: 24,
    display: 32,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

export const sealTheme = {
  colors: sealColors,
  radii: sealRadii,
  spacing: sealSpacing,
  typography: sealTypography,
};

export type SealTheme = typeof sealTheme;
export default sealTheme;
