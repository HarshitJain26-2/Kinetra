export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,

  // Mobile layout standards
  marginMobile: 20,
  cardPadding: 24,
  inputHeight: 52,
  buttonHeight: 54,
  headerHeight: 56,
} as const;

export const borderRadius = {
  none: 0,
  xs: 2,
  sm: 4,     // Sharp technical buttons & tags
  md: 6,
  lg: 8,     // Standard cards & containers
  xl: 12,    // Modals / Elevated sheets
  full: 9999,// Circular badges & pills
} as const;
