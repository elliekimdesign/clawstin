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
  /** which background component draws this theme: MeshBg corner glows or
   * one of the artworks (AquaBg, MintBg, ButterBg, CloudBg — components/ui) */
  background: 'mesh' | 'aqua' | 'mint' | 'butter' | 'clouds';
  mesh: { base: string; g1: string; g2: string; g3: string; g4: string };
};

export const chatThemes: Record<'darkGreen' | 'skyBlue' | 'skyBlueOs' | 'mintOs' | 'butterOs' | 'blueCloudOs', ChatTheme> = {
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
    background: 'mesh',
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
    background: 'mesh',
    mesh: { base: '#6E93B0', g1: '#476982', g2: '#5A7E9A', g3: '#8FB4CC', g4: '#A5C6DA' },
  },
  /** Bright sky blue with the 2000s Mac OS Aqua swoosh artwork (AquaBg). */
  skyBlueOs: {
    base: '#84AAC7',
    text: '#F2F7FA',
    textSecondary: 'rgba(242,247,250,0.72)',
    textTertiary: 'rgba(242,247,250,0.55)',
    glassBg: 'rgba(255,255,255,0.12)',
    glassBorder: 'rgba(255,255,255,0.32)',
    surface: 'rgba(255,255,255,0.10)',
    solidSurface: '#3E5A70',
    divider: 'rgba(255,255,255,0.14)',
    onLight: '#2E4356',
    success: '#5FD9A4',
    background: 'aqua',
    // fallback mesh corners approximating the aqua art's tones
    mesh: { base: '#84AAC7', g1: '#3A6390', g2: '#7CA3C2', g3: '#A2C2DA', g4: '#8FB2CE' },
  },
  /** Bright sage-mint with the same swoosh geometry, drawn by MintBg. */
  mintOs: {
    base: '#8CBBB2',
    text: '#F4FAF7',
    textSecondary: 'rgba(244,250,247,0.72)',
    textTertiary: 'rgba(244,250,247,0.55)',
    glassBg: 'rgba(255,255,255,0.12)',
    glassBorder: 'rgba(255,255,255,0.32)',
    surface: 'rgba(255,255,255,0.10)',
    solidSurface: '#39615C',
    divider: 'rgba(255,255,255,0.14)',
    onLight: '#2E4B47',
    success: '#5FD9A4',
    background: 'mint',
    // fallback mesh corners approximating the mint art's tones
    mesh: { base: '#8CBBB2', g1: '#2F6560', g2: '#79A8A3', g3: '#B7D8CB', g4: '#A5CFC0' },
  },
  /** Warm butter-honey with the same swoosh geometry, drawn by ButterBg. */
  butterOs: {
    base: '#D8C382',
    text: '#FFFDF5',
    textSecondary: 'rgba(255,253,245,0.75)',
    textTertiary: 'rgba(255,253,245,0.58)',
    glassBg: 'rgba(255,255,255,0.14)',
    glassBorder: 'rgba(255,255,255,0.38)',
    surface: 'rgba(255,255,255,0.12)',
    solidSurface: '#7A6226',
    divider: 'rgba(255,255,255,0.16)',
    onLight: '#5C4A1E',
    success: '#2E8F66',
    background: 'butter',
    // fallback mesh corners approximating the butter art's tones
    mesh: { base: '#D8C382', g1: '#8A6C2A', g2: '#C9AC5F', g3: '#EFE4B4', g4: '#E3D49A' },
  },
  /** Open blue sky with wispy clouds up top, drawn by CloudBg. */
  blueCloudOs: {
    base: '#5D89BE',
    text: '#F3F8FC',
    textSecondary: 'rgba(243,248,252,0.72)',
    textTertiary: 'rgba(243,248,252,0.55)',
    glassBg: 'rgba(255,255,255,0.12)',
    glassBorder: 'rgba(255,255,255,0.32)',
    surface: 'rgba(255,255,255,0.10)',
    solidSurface: '#38587E',
    divider: 'rgba(255,255,255,0.14)',
    onLight: '#2C4665',
    success: '#5FD9A4',
    background: 'clouds',
    // fallback mesh corners approximating the sky's tones
    mesh: { base: '#5D89BE', g1: '#4F7CB4', g2: '#6E97C6', g3: '#7FA6CF', g4: '#8FB2D6' },
  },
} as const;

/** The active chat colorway. Swap here (or via a future user setting). */
export const darkChat = chatThemes.blueCloudOs;

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
