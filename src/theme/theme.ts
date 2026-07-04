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
  danger: '#E0483F', // true muted red, not pink — kept soft, not fire-engine intense
  dangerSoft: '#FBE4E2',

  // Lines
  border: '#E6E8EC',
  divider: '#EEF0F3',

  // Misc
  bubbleUser: '#16181D', // chat: your bubble (black)
  bubbleUserText: '#FFFFFF', // white text on black bubble
  bubbleAgent: '#FFFFFF', // chat: agent bubble
  bubbleAgentText: '#16181D',
} as const;

/**
 * Chat colorways — the chat thread screen's palette, later user-selectable.
 * Each theme carries the full token set plus the MeshBg gradient corners
 * (`mesh`): base fill, g1 top-left, g2 top-right, g3 bottom-right,
 * g4 bottom-left. The rest of the app stays light regardless.
 */
export type ChatTheme = {
  base: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  glassBg: string;
  glassBorder: string;
  surface: string;
  solidSurface: string;
  divider: string;
  onLight: string;
  success: string;
  mesh: { base: string; g1: string; g2: string; g3: string; g4: string };
};

export const chatThemes: Record<'darkGreen' | 'skyBlue', ChatTheme> = {
  /** The original moody slate-teal look — preserved as a picker option. */
  darkGreen: {
    base: '#38454A',
    text: '#EDF1EE',
    textSecondary: 'rgba(236,241,238,0.65)',
    textTertiary: 'rgba(236,241,238,0.45)',
    glassBg: 'rgba(255,255,255,0.10)',
    glassBorder: 'rgba(255,255,255,0.28)',
    surface: 'rgba(255,255,255,0.08)',
    solidSurface: '#2C393E',
    divider: 'rgba(255,255,255,0.12)',
    onLight: '#26333C',
    success: '#5FD9A4',
    mesh: { base: '#38454A', g1: '#26333C', g2: '#2F3F46', g3: '#4C5E58', g4: '#5C6B62' },
  },
  /** Brighter hazy sky blue — same gradient mood, lighter air. */
  skyBlue: {
    base: '#6E93B0',
    text: '#F2F7FA',
    textSecondary: 'rgba(242,247,250,0.72)',
    textTertiary: 'rgba(242,247,250,0.52)',
    glassBg: 'rgba(255,255,255,0.12)',
    glassBorder: 'rgba(255,255,255,0.32)',
    surface: 'rgba(255,255,255,0.10)',
    solidSurface: '#3E5A70',
    divider: 'rgba(255,255,255,0.14)',
    onLight: '#2E4356',
    success: '#5FD9A4',
    mesh: { base: '#6E93B0', g1: '#476982', g2: '#5A7E9A', g3: '#8FB4CC', g4: '#A5C6DA' },
  },
} as const;

/** The active chat colorway. Swap here (or via a future user setting). */
export const darkChat = chatThemes.skyBlue;

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
  // System monospace — used for terminal-log lines, command-line style
  // messages, and tabular values (tokens, times, pipeline step tags).
  mono: 'Menlo',
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
