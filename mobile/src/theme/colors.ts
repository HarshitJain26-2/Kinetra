export const colors = {
  // Canvases & Backgrounds
  background: '#050607',
  backgroundOnyx: '#0A0A0B',
  surface: '#111315',
  surfaceDim: '#0C0F10',
  surfaceBright: '#1D2021',
  card: '#17191B',
  surfaceContainerHigh: '#282A2B',
  surfaceContainerHighest: '#323536',

  // Typography & Content
  primaryText: '#F4F1EA',
  secondaryText: '#A7A5A0',
  tertiaryText: '#7A797A',
  inverseText: '#0A0A0B',
  placeholderText: 'rgba(167, 165, 160, 0.45)',

  // Brand Accents
  gold: '#D9B83F',
  goldBright: '#F0C83E',
  goldMuted: 'rgba(217, 184, 63, 0.15)',
  goldLight: '#FFE088',
  goldDark: '#8C741E',

  // Status & Performance
  crimson: '#E63946',
  crimsonMuted: 'rgba(230, 57, 70, 0.15)',
  success: '#2A9D8F',
  successMuted: 'rgba(42, 157, 143, 0.15)',
  error: '#FFB4AB',
  errorContainer: '#93000A',

  // Borders & Strokes
  border: 'rgba(255, 255, 255, 0.12)',
  borderLight: 'rgba(255, 255, 255, 0.06)',
  borderGold: 'rgba(217, 184, 63, 0.4)',
  borderGoldActive: '#D9B83F',
  borderError: '#E63946',

  // Overlays & Translucencies
  overlayDark: 'rgba(5, 6, 7, 0.72)',
  overlayDarkHeavy: 'rgba(5, 6, 7, 0.88)',
  overlayCard: 'rgba(23, 25, 27, 0.94)',
  overlayGlass: 'rgba(17, 19, 21, 0.85)',
} as const;

export type ColorKey = keyof typeof colors;
