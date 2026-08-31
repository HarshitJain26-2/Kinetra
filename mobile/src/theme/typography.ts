export interface TypographyStyle {
  fontFamily?: string;
  fontSize: number;
  lineHeight?: number;
  fontWeight?: '300' | '400' | '500' | '600' | '700' | '800' | 'bold' | 'normal';
  letterSpacing?: number;
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
  color?: string;
}

const SERIF_FONT = 'serif';
const SANS_FONT = 'sans-serif';

export const typography = {
  headlineXl: {
    fontFamily: SERIF_FONT,
    fontSize: 38,
    lineHeight: 46,
    fontWeight: '700',
    letterSpacing: -0.5,
  } as TypographyStyle,

  headlineLg: {
    fontFamily: SERIF_FONT,
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -0.3,
  } as TypographyStyle,

  headlineMd: {
    fontFamily: SERIF_FONT,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
  } as TypographyStyle,

  headlineSm: {
    fontFamily: SERIF_FONT,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
  } as TypographyStyle,

  brandWordmark: {
    fontFamily: SERIF_FONT,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: 6,
    textTransform: 'uppercase',
  } as TypographyStyle,

  brandWordmarkSmall: {
    fontFamily: SERIF_FONT,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: 4,
    textTransform: 'uppercase',
  } as TypographyStyle,

  tagline: {
    fontFamily: SANS_FONT,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  } as TypographyStyle,

  labelCaps: {
    fontFamily: SANS_FONT,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  } as TypographyStyle,

  button: {
    fontFamily: SANS_FONT,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  } as TypographyStyle,

  bodyLg: {
    fontFamily: SANS_FONT,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  } as TypographyStyle,

  bodyMd: {
    fontFamily: SANS_FONT,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  } as TypographyStyle,

  bodySm: {
    fontFamily: SANS_FONT,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  } as TypographyStyle,

  caption: {
    fontFamily: SANS_FONT,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '400',
  } as TypographyStyle,
} as const;
