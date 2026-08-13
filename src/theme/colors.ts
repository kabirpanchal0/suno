export const colors = {
  // Calm, meditation-inspired palette
  background: '#0A0A0B',
  surface: '#141416',
  surfaceLight: '#1C1C1F',
  
  primary: '#E8E8EA',
  secondary: '#A8A8AC',
  tertiary: '#6E6E73',
  
  accent: '#B8A583', // Warm, subtle accent
  accentLight: '#D4C5A6',
  
  text: {
    primary: '#E8E8EA',
    secondary: '#A8A8AC',
    tertiary: '#6E6E73',
  },
  
  border: '#2C2C2F',
  borderLight: '#3A3A3D',
  
  success: '#7FAF7F',
  warning: '#D9A566',
  error: '#CC6666',
  
  overlay: 'rgba(10, 10, 11, 0.85)',
  overlayLight: 'rgba(20, 20, 22, 0.75)',
  
  // Gradients for subtle depth
  gradientStart: '#0A0A0B',
  gradientEnd: '#141416',
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
  sm: 6,
  md: 12,
  lg: 18,
  xl: 24,
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
    xxxl: 40,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};
