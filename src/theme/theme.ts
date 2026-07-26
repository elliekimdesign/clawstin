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
  background: 'mesh' | 'aqua' | 'mint' | 'butter' | 'clouds' | 'desk';
  mesh: { base: string; g1: string; g2: string; g3: string; g4: string };
};

export const chatThemes: Record<'darkGreen' | 'skyBlue' | 'skyBlueOs' | 'mintOs' | 'butterOs' | 'blueCloudOs' | 'mistOs' | 'deskOs', ChatTheme> = {
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
    base: '#6B93DD',
    text: '#F3F8FC',
    textSecondary: 'rgba(243,248,252,0.72)',
    textTertiary: 'rgba(243,248,252,0.55)',
    glassBg: 'rgba(255,255,255,0.12)',
    glassBorder: 'rgba(255,255,255,0.32)',
    surface: 'rgba(255,255,255,0.10)',
    solidSurface: '#38609F',
    divider: 'rgba(255,255,255,0.14)',
    onLight: '#2E4F88',
    success: '#5FD9A4',
    background: 'clouds',
    // fallback mesh corners approximating the sky's tones
    mesh: { base: '#6B93DD', g1: '#3565C4', g2: '#4479DC', g3: '#6E9BEF', g4: '#85ACF4' },
  },
  /** Pale misty sky: near-white haze, blue-gray cloud shadows, dark ink.
   * The one LIGHT chat colorway; "onLight" here means text on the dark
   * ink/azure surfaces (buttons, the selected crew capsule). */
  mistOs: {
    base: '#E7EEFA',
    text: '#243650',
    textSecondary: 'rgba(36,54,80,0.72)',
    textTertiary: 'rgba(36,54,80,0.5)',
    glassBg: 'rgba(255,255,255,0.5)',
    glassBorder: 'rgba(255,255,255,0.75)',
    surface: 'rgba(255,255,255,0.45)',
    solidSurface: '#FFFFFF',
    divider: 'rgba(36,54,80,0.12)',
    onLight: '#F6F9FE',
    success: '#1F8A5D',
    background: 'clouds',
    mesh: { base: '#E7EEFA', g1: '#CBDCF5', g2: '#DAE7F9', g3: '#F2F7FE', g4: '#E2EDFB' },
  },
  /** The Home desk itself (2026-07-12): aquaos desk blues under a
   * vintage-futuristic layer — machined light arcs + the three original
   * window-button gels (DeskRetroBg). Chat and Home become one OS. */
  deskOs: {
    // the mosaic-tile field's own desk blue (2026-07-17) — the
    // SafeAreaView fill must agree with the field or a seam shows at
    // any edge it doesn't cover (status bar, load flash)
    base: '#D8E4EF',
    // INK voice (2026-07-25 "배경을 좀더 흰색에 가까운거로하기"): the mosaic
    // field was lifted 78% toward white, which killed the white voice this
    // theme had carried since 2026-07-17 — white measured 1.29:1 on the pale
    // field. Ink measures 13.76:1, so the conversation now speaks ink, the
    // same #16181C the board uses. The white era lives in git.
    text: '#16181C',
    textSecondary: 'rgba(22,24,28,0.72)',
    textTertiary: 'rgba(22,24,28,0.52)',
    // glass tints inverted with the field: on a pale plane a white veil is
    // invisible, so the lifted panes tint with ink instead
    glassBg: 'rgba(22,24,28,0.05)',
    glassBorder: 'rgba(22,24,28,0.14)',
    // a WHITE lift, not an ink veil (2026-07-25): on the pale mosaic an ink
    // wash turned every card grey. Cards should read as panes lifted OFF the
    // field, which on a light plane means brighter than it, not darker.
    surface: 'rgba(255,255,255,0.72)',
    solidSurface: '#C2D3E4',
    divider: 'rgba(22,24,28,0.14)',
    onLight: '#2E4F73',
    success: '#5FD9A4',
    background: 'desk',
    // fallback mesh corners in the desk's own blues
    mesh: { base: '#4E83B8', g1: '#33689C', g2: '#4074A5', g3: '#6297CE', g4: '#8FC0E8' },
  },
} as const;

/** The active chat colorway. Swap here (or via a future user setting). */
export const darkChat = chatThemes.deskOs;

/** The crew's signature light blue: chart bars, agent marks, composer
 * send/mic circles. One blue on every surface. */
export const brandBlue = '#8FBFF2';

/** Semantic system colors (rewritten 2026-07-11 for the titanium home
 * skin). One meaning, one color, everywhere. The board is ink on brushed
 * silver with smoked-glass sections; the single system-energy accent is
 * a deep aqua teal (never purple, never pink — product rule). The
 * blue-accent paperblue set (#3B5BDB) lives in git for rollback. */
export const sysColor = {
  /** the one system-energy accent: crisp aqua blue (2026-07-11 late:
   * the board went full Aqua — blue desktop, silver windows — per
   * Ellie's Mac OS X 10.2 reference; mint-teal era lives in git) */
  accent: '#3B76C4',
  /** needs you / your turn: shares the aqua accent (act here first) */
  action: '#3B76C4',
  /** needs you: dot/badge form, one step lighter than the accent */
  actionDot: '#6795D4',
  /** in progress: crew at work (dusty blue, quieter than the accent) */
  running: '#5E87C4',
  /** done / ready: completion accents (unread dots, ready marks) */
  ready: '#4E9B6E',
  /** done timestamps and quiet finished text */
  doneDim: 'rgba(22,24,28,0.5)',
  /** fail / deny / destructive (muted terminal red) */
  fail: '#C7504A',
  /** degraded / pending system state (muted amber) */
  degraded: '#C77E22',
};

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
 * Body voice (2026-07-14): Helvetica Neue, app-wide — the winner of the
 * five-font tour (Space Grotesk, Inter, Manrope, Plus Jakarta tried and
 * passed over). Ships with iOS, so nothing to load. It has no 600 cut;
 * semibold maps to Bold so emphasis stays visible next to Medium.
 */
export const fontFamily = {
  regular: 'HelveticaNeue',
  medium: 'HelveticaNeue-Medium',
  semibold: 'HelveticaNeue-Bold',
  bold: 'HelveticaNeue-Bold',
  // The system voice — window-title labels, times, counts, statuses,
  // terminal-log lines. Folded into the body's own Helvetica
  // (2026-07-16, "모두 helvetica로"): one typeface everywhere, the
  // machine register now carried by size/spacing/case alone. The
  // Poppins-as-mono era (and the earlier Geist Mono tour) is retired.
  mono: 'HelveticaNeue-Medium',
  /** the heavier cut for labels that must anchor (active tabs etc.) */
  monoMedium: 'HelveticaNeue-Bold',
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
