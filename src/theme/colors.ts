export const colors = {
  // Deep obsidian base with tonal depth — inspired by vinyl sleeves at night
  background: '#0B0A10',
  backgroundElevated: '#120F1A',
  surface: '#171320',
  surfaceLight: '#221C2E',
  surfaceGlass: 'rgba(34, 28, 46, 0.55)',

  primary: '#F3F1F6',
  secondary: '#B4ACC2',
  tertiary: '#6F6884',

  // Warm amber lead accent + electric violet undertone for depth/glow
  accent: '#F0B25E',
  accentLight: '#FFD59A',
  accentDim: 'rgba(240, 178, 94, 0.16)',
  accentGlow: 'rgba(240, 178, 94, 0.35)',

  secondaryAccent: '#8C6EFF',
  secondaryAccentDim: 'rgba(140, 110, 255, 0.16)',
  secondaryAccentGlow: 'rgba(140, 110, 255, 0.35)',

  text: {
    primary: '#F3F1F6',
    secondary: '#B4ACC2',
    tertiary: '#6F6884',
    inverse: '#0B0A10',
  },

  border: '#2A2436',
  borderLight: '#3A3248',
  borderGlow: 'rgba(240, 178, 94, 0.4)',

  success: '#8FCB9B',
  warning: '#F0B25E',
  error: '#E0788A',

  overlay: 'rgba(6, 5, 10, 0.88)',
  overlayLight: 'rgba(23, 19, 32, 0.7)',

  // Ambient gradient mesh stops — deep violet-black to warm ember glow
  gradientStart: '#0B0A10',
  gradientMid: '#161221',
  gradientEnd: '#1C1526',
  glowWarm: 'rgba(240, 178, 94, 0.14)',
  glowCool: 'rgba(140, 110, 255, 0.12)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
};

export const typography = {
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 24,
    xxl: 32,
    xxxl: 42,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '800' as const,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1.5,
  },
};

// "Neon Void" palette — used only by the Now Playing screen, per
// neon-void-design.md. Values are taken verbatim from that spec's tokens /
// reference HTML (the doc states tokens + HTML are authoritative over prose).
export const nowPlayingColors = {
  canvas: '#993a25',
  surfaceRecessed: '#7a2e1e',
  surface: '#f87254',
  surfaceElevated: '#f87a5e',

  fg: '#ffffff',
  fgMuted: '#bba5a0',

  accent: '#150505', // --gesso-accent / --gesso-primary — used sparingly
  accent2: '#e85638', // --gesso-accent-2 — the dominant on-screen action color
  onAccent: '#ffffff',
  onImage: '#ffffff',
  scrim: 'rgba(10,3,2,0.62)',

  // Soft translucent chip/pill backgrounds mixed from fg, matching the
  // spec's color-mix(in srgb, var(--gesso-fg) N%, transparent) usage.
  chipBg: 'rgba(255,255,255,0.06)',
  roundBtnBg: 'rgba(153,58,37,0.88)', // color-mix(canvas 88%, transparent)
  miniPlayerBg: 'rgba(153,58,37,0.90)', // color-mix(canvas 90%, transparent)

  divider: 'rgba(255,255,255,0.04)',
};

// Shared elevation/glow presets for tactile depth
export const elevation = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  floating: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
    elevation: 12,
  },
  glow: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
};
