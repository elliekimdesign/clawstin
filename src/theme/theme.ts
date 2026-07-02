/**
 * OpenClaw — Design tokens
 * One place to change the whole look & feel.
 * Style: clean & minimal (light) — soft neutrals, one calm accent, rounded cards.
 */

export const colors = {
  // Surfaces
  background: '#F7F8FA', // app background (near-white cool grey)
  card: '#FFFFFF', // cards / sheets
  cardAlt: '#F1F3F6', // subtle inset / secondary surface

  // Text
  text: '#16181D', // primary text (near-black, softer than pure black)
  textSecondary: '#6B7280', // secondary / captions
  textTertiary: '#9CA3AF', // hints / timestamps

  // Accent (black) — used as a FILL; pair with white text/icons on top.
  accent: '#16181D',
  accentSoft: '#F1F3F6', // soft neutral tinted background
  accentText: '#FFFFFF', // text/icon on accent (white, for contrast on black)

  // Status
  success: '#1FB877',
  successSoft: '#E4F7EF',
  warning: '#F5A524',
  warningSoft: '#FDF1DD',
  danger: '#F23F5D',
  dangerSoft: '#FDE5E9',

  // Lines
  border: '#E6E8EC',
  divider: '#EEF0F3',

  // Misc
  bubbleUser: '#16181D', // chat: your bubble (black)
  bubbleUserText: '#FFFFFF', // white text on black bubble
  bubbleAgent: '#FFFFFF', // chat: agent bubble
  bubbleAgentText: '#16181D',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 14,
  xl: 20,
  xxl: 28,
} as const;

export const radius = {
  sm: 10,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export const fontSize = {
  caption: 12,
  small: 13,
  body: 15,
  bodyLg: 16,
  title: 19,
  largeTitle: 26,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

/**
 * Brand font (Instrument Sans). Custom fonts don't respond to fontWeight in RN,
 * so pick weight by family. Loaded in src/app/_layout.tsx via expo-font.
 */
export const fontFamily = {
  regular: 'InstrumentSans-Regular',
  medium: 'InstrumentSans-Medium',
  semibold: 'InstrumentSans-SemiBold',
  bold: 'InstrumentSans-Bold',
} as const;

/** Gentle iOS-like shadow for cards. */
export const shadow = {
  card: {
    shadowColor: '#1B1F3B',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
} as const;

export const theme = { colors, spacing, radius, fontSize, fontWeight, fontFamily, shadow };
export default theme;
