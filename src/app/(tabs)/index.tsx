import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Image,
  LayoutAnimation,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { RowRule, ROW_RULE } from '@/components/ui/luminous-pour';
import { MosaicDissolveFill } from '@/components/ui/mosaic-tile-fill';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AUTOPILOT_RULES } from '@/mock/autopilot';
import { AWAY_DIGEST } from '@/mock/away';
import { UNDOABLES } from '@/mock/undoables';
import { AwayDigestCard } from '@/components/ui/away-digest';
import { AuroraLine } from '@/components/ui/aurora-line';
import { Card } from '@/components/ui/card';
import { GlassIconButton } from '@/components/ui/glass-icon-button';
import { CrewSticker } from '@/components/ui/crew-sticker';
import { IndexTab } from '@/components/ui/index-tab';
import { PairingBg } from '@/components/ui/pairing-bg';
import { PairingFlow, PairingStep } from '@/components/ui/pairing-flow';
import { StepToolbox } from '@/components/ui/step-toolbox';
import { BlissSwooshBg } from '@/components/ui/bliss-swoosh-bg';
import { ColorPanelsBg } from '@/components/ui/color-panels-bg';
import { ConnectionMark } from '@/components/ui/connection-mark';
import { CTA_SLAB_INK, CtaSlabFill } from '@/components/ui/cta-slab';
import { FrostedGlassFill } from '@/components/ui/frosted-glass-fill';
import { TaskSheet, type TaskSheetRow } from '@/components/ui/task-sheet';
import { PixelText } from '@/components/ui/pixel-text';
import { RasterCloud } from '@/components/ui/analog-key';
import { MosaicCheck } from '@/components/ui/mosaic-check';
import { ProgressCells } from '@/components/ui/progress-cells';
import { StatusPopover, worstServiceState } from '@/components/ui/status-popover';
import { TOOL_ACTION_PHRASE, useAppStore } from '@/store/app-store';
import { brandBlue,
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  radius,
  shadow,
  spacing,
  sysColor,
} from '@/theme/theme';

// Brand accent (orange). Used as a POINT color: marks, icon chips, tiles.
// (Buttons/CTAs stay black via colors.accent.)
const BRAND = '#FF4A32';
const BRAND_SOFT = 'rgba(255,74,50,0.12)';

// alias kept for the step-1 agent mark
const AGENT_MARK = BRAND;

// Figma-exact text color for step 2.
const FIG_TEXT = '#1A1C21';

// "blissxp" — the active home skin: clear liquid glass windows floating on
// the bliss_swoosh field (sky melting into hill green, see
// bliss-swoosh-bg.tsx). Bold Bento blue for the hero and accents, XP
// orange for the single alert dot, ink navy type. The previous
// "defaultskin" (lavender_swoosh + chat-blue accents) stays in the repo
// as the fallback skin. Exactly one signal on the whole board: the orange
// dot on the card that needs the user (approvals waiting).
const GLASS = {
  bg: '#8EC9F0', // behind the SVG field, matches its sky top
  text: '#1F3A57',
  textStrong: '#12233D', // headline/number ink: bold text needs the extra depth
  title: '#2C4A6B',
  dim: 'rgba(31,58,87,0.6)',
  faint: 'rgba(31,58,87,0.45)',
  // Bold classic-OS blue (Figma Z Glass Bento): hero, numbers, circles.
  blue: '#2E7CD6',
  blueLight: '#2E7CD6',
  ink: '#1F3A57', // pills/CTAs
  dotAlert: '#F0812F', // XP orange: attention in the Bliss palette
  avatar: '#E8563F', // Muppet's round character face
  cardBorder: 'rgba(255,255,255,0.75)',
  cardFallback: 'rgba(255,255,255,0.5)',
  line: 'rgba(31,58,87,0.12)',
};

// expo-glass-effect is iOS-only; fall back to a translucent dark fill.
const GLASS_AVAILABLE = Platform.OS === 'ios' && isGlassEffectAPIAvailable();

// Post-action control mock: the agent's most recent [WRITE] action and
// its rollback window. Trust = approvals (before) + undo (after).
const LAST_ACTION = {
  label: 'Blocked 10:00–10:30 for PR review',
  ago: '2m ago',
  // t2 = the PR-review thread: the crew that actually ran the action.
  // Undo always routes back to its executor's thread.
  threadId: 't2',
};

// UNDOABLES moved to src/mock/undoables.ts (2026-07-12) so the
// new-chat screen can run the same undo routing.

// The hero's PITCH tab (2026-07-21): a crew-INITIATED proposal, from
// storyboard B's standing PR-watch rule. Non-blocking by design: light
// Go / Not now, and it expires on its own if ignored.
const PITCH = {
  title: 'Block 10:00 for the auth-service #482 review?',
  threadId: 't2',
  // the queue approval this pitch REPRESENTS on Home — excluded from
  // the waiting list so the same ask never appears twice (2026-07-22)
  approvalId: 'ap2',
  // the crew member fronting this pitch — their face IS the "crew
  // initiated this" mark (test on this row first, 2026-07-21)
  agentId: 'muppet',
  expires: '6 PM',
  goAsk: 'Go ahead, block 10:00 for the review.',
};

// Autopilot ledger mock: what each auto-approved rule has been doing.
// The gauge earns trust by showing receipts; "undone" is the honest
// counter-metric (an autopilot that never gets undone is working).
// Home section material. 'milk' = the Acid Pop recipe (blur + a strong
// milky veil, the field whispers through). Flip to 'paper' to restore
// solid white cards instantly.
const SECTION_MATERIAL: 'paper' | 'milk' | 'night' | 'glass' = 'glass';
const MILK = (SECTION_MATERIAL as string) === 'milk';
// 'night' = Logs-tone dark sections (experiment; 'paper' is the way back)
const NIGHT = (SECTION_MATERIAL as string) === 'night';
// 'glass' = translucent white over real blur: whiter than milk so text
// keeps its contrast, but the field tints through — sky into the desk
// card, green into DONE — so the board reads as one body, not blocks.
const GLASSY = (SECTION_MATERIAL as string) === 'glass';

// "logstyle" — the active home skin (named 2026-07-06): the Logs console
// colors promoted to the whole home board. Night field shared with the
// Logs tab, mono statusline instead of tiles, a quiet prompt bar, and
// state-tinted task rows (blue running / amber needs-you / green done,
// radius 12). One adult, dark, OS-grade surface family across tabs.
const NHOME = {
  bg: '#141F33',
  text: 'rgba(255,255,255,0.92)',
  secondary: 'rgba(255,255,255,0.62)',
  dim: 'rgba(255,255,255,0.55)',
  faint: 'rgba(255,255,255,0.32)',
  row: 'rgba(255,255,255,0.06)',
  rowBorder: 'rgba(255,255,255,0.08)',
  blue: '#8FBFF2',
  ok: '#7ED9A0',
  warn: '#F0B25F',
  green: '#5FD9A4',
};

// Ink for the paperblue surfaces (light field): neutral near-black text,
// quiet hairlines, and state colors deep enough to hold contrast on paper.
const AINK = {
  text: '#16181C',
  dim: 'rgba(22,24,28,0.55)',
  // row hairlines moved to RowRule/ROW_RULE (luminous-pour.tsx)
  // 2026-07-30: soft white, full-bleed rim to rim
  running: sysColor.running,
  warn: sysColor.action,
  accent: sysColor.ready,
};

/** THE BOARD'S ONE SEAM (2026-07-29): every folder is separated from the
 * next by this, vertically and horizontally. */
const SECTION_GAP = 28;

/** but the two dashboard TILES are one unit, not two sections (2026-07-30
 * "대시보드 같지 않고 좀 따로 노는 느낌"): at the full seam they drifted
 * apart and read as unrelated cards. */
const PAIR_GAP = 10;

/** one quiet line inside a section shell with no rows yet (2026-07-28
 * "섹션들은 전부 나두고... 빈칸을 말이 맞게"): while the new mock world is
 * seeded prompt by prompt, every folder stays on the board and states its
 * own empty in plain words instead of vanishing. */
function EmptyNote({ text, pad = 18 }: { text: string; pad?: number }) {
  return (
    <Text
      style={{
        paddingHorizontal: pad,
        paddingTop: 12,
        paddingBottom: 16,
        fontSize: fontSize.body,
        fontFamily: fontFamily.regular,
        color: 'rgba(22,24,28,0.4)',
      }}>
      {text}
    </Text>
  );
}

/** app slug -> monochrome Ionicon for NEXT UP rows (the retired
 * AutopilotSheet's map): the left slot answers "what does it touch" */
const NEXTUP_APP_ICON = {
  gmail: 'mail-outline',
  github: 'logo-github',
  drive: 'folder-outline',
  calendar: 'calendar-clear-outline',
} as const;

// "silkstyle" — logstyle's exact layout, re-inked for the silk_swoosh
// light field (white silk + blue veils, see silk-swoosh-bg.tsx): navy
// ink instead of white, blissxp orange/blue/green for the three states.
const HOMEINK = {
  text: '#1F3A57',
  secondary: 'rgba(31,58,87,0.75)',
  dim: 'rgba(31,58,87,0.6)',
  faint: 'rgba(31,58,87,0.42)',
  blue: '#2E7CD6',
  warn: '#E8862F',
  green: '#2E9E5B',
};

// Section ink: content colors that flip with the material.
const SINK = NIGHT
  ? {
      text: '#FFFFFF',
      strong: '#FFFFFF',
      dim: 'rgba(255,255,255,0.55)',
      faint: 'rgba(255,255,255,0.4)',
      line: 'rgba(255,255,255,0.10)',
      tile: 'rgba(255,255,255,0.08)',
    }
  : {
      text: '#1F3A57',
      strong: '#12233D',
      dim: 'rgba(31,58,87,0.6)',
      faint: 'rgba(31,58,87,0.45)',
      line: GLASSY ? 'rgba(31,58,87,0.14)' : 'rgba(31,58,87,0.12)',
      // translucent surface eats a little contrast — tiles push back
      tile: GLASSY ? 'rgba(31,58,87,0.07)' : 'rgba(31,58,87,0.04)',
    };

// Cloud wisps for the hero card, as fractions of the card size.
// [cx, cy, rx, ry, rotation, peak opacity]
const CARD_CLOUDS: [number, number, number, number, number, number][] = [
  [0.12, 0.18, 0.42, 0.34, -10, 0.5],
  [0.62, 0.1, 0.46, 0.36, -8, 0.42],
  [0.34, 0.58, 0.5, 0.3, -12, 0.35],
  [0.82, 0.78, 0.4, 0.28, -6, 0.3],
];

/** Muppet's round character face: orange circle, two dot eyes, a small
 * mouth. The agent's mark, drawn in code so it scales anywhere. */
function MuppetFace({ size = 34, square }: { size?: number; square?: boolean }) {
  const k = size / 34;
  return (
    <View
      style={{
        width: size,
        height: size,
        // square: the app-icon squircle face (onboarding mark)
        borderRadius: square ? size * 0.3 : 999,
        backgroundColor: GLASS.avatar,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <View style={{ flexDirection: 'row', gap: 6 * k, marginBottom: 4 * k }}>
        <View
          style={{ width: 4.5 * k, height: 4.5 * k, borderRadius: 999, backgroundColor: '#FFFFFF' }}
        />
        <View
          style={{ width: 4.5 * k, height: 4.5 * k, borderRadius: 999, backgroundColor: '#FFFFFF' }}
        />
      </View>
      <View
        style={{
          width: 11 * k,
          height: 2.5 * k,
          borderRadius: 2 * k,
          backgroundColor: 'rgba(255,255,255,0.9)',
        }}
      />
    </View>
  );
}

/** Small breathing dot for in-flight background work. */
function RunningDot({
  color = GLASS.blue,
  size = 7,
  square = false,
}: {
  color?: string;
  size?: number;
  /** pixel-cell body (the task list's 8×8 block grammar) */
  square?: boolean;
}) {
  const o = useSharedValue(0.3);
  useEffect(() => {
    o.value = withRepeat(
      withSequence(withTiming(1, { duration: 600 }), withTiming(0.3, { duration: 600 })),
      -1
    );
  }, [o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      style={[
        { width: size, height: size, borderRadius: square ? 0 : 999, backgroundColor: color },
        style,
      ]}
    />
  );
}

// Pixel chrome (the stepped-corner ink frame) moved to
// components/ui/pixel-chrome.tsx once Crew's open slot adopted it too.

/** Thread rail: the quiet rounded connector that strings the list's
 * conversations together like replies in a thread. Each row gets an
 * elbow curving in from the line above; non-last rows continue the
 * line downward. Negative top/bottom reach across the rows' padding
 * so the rail reads as one unbroken thread. */
const RAIL_COLOR = 'rgba(22,24,28,0.16)';
function ThreadRail({ first, last }: { first?: boolean; last?: boolean }) {
  return (
    <View style={{ width: 16, alignSelf: 'stretch' }}>
      <View
        style={{
          position: 'absolute',
          left: 3,
          width: 11,
          top: first ? 2 : -15,
          bottom: '50%',
          borderLeftWidth: 1.5,
          borderBottomWidth: 1.5,
          borderBottomLeftRadius: 9,
          borderColor: RAIL_COLOR,
        }}
      />
      {!last ? (
        <View
          style={{
            position: 'absolute',
            left: 3,
            width: 1.5,
            top: '50%',
            bottom: -15,
            backgroundColor: RAIL_COLOR,
          }}
        />
      ) : null}
    </View>
  );
}

/** Pixel wordmark: "Clawstin" hand-drawn on a 7-row pixel grid, the
 * same language as the mascot (no font dependency). The i's dot is the
 * cap-blue pixel. Rows use '#' for ink cells; '@' marks the blue dot. */
const WORD_GLYPHS: string[][] = [
  // C
  ['.###', '#...', '#...', '#...', '#...', '#...', '.###'],
  // l
  ['#', '#', '#', '#', '#', '#', '#'],
  // a
  ['....', '....', '.###', '...#', '.###', '#..#', '.###'],
  // w
  ['.....', '.....', '#...#', '#...#', '#.#.#', '#.#.#', '.#.#.'],
  // s
  ['....', '....', '.###', '#...', '.##.', '...#', '###.'],
  // t
  ['.#..', '.#..', '####', '.#..', '.#..', '.#..', '..##'],
  // i (blue pixel dot, gap, stem)
  ['@', '.', '#', '#', '#', '#', '#'],
  // n
  ['....', '....', '###.', '#..#', '#..#', '#..#', '#..#'],
];
function PixelWordmark({
  cell,
  color = '#121417',
  dotColor = '#3B76C4',
}: {
  cell: number;
  color?: string;
  dotColor?: string;
}) {
  let xOff = 0;
  const rects: { x: number; y: number; blue: boolean }[] = [];
  for (const glyph of WORD_GLYPHS) {
    const width = Math.max(...glyph.map((r) => r.length));
    glyph.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        if (row[x] === '#' || row[x] === '@') {
          rects.push({ x: xOff + x, y, blue: row[x] === '@' });
        }
      }
    });
    xOff += width + 1; // one-cell letter gap
  }
  const w = (xOff - 1) * cell;
  const overlap = cell * 1.06;
  return (
    <Svg width={w} height={7 * cell}>
      {rects.map((r, i) => (
        <Rect
          key={i}
          x={r.x * cell}
          y={r.y * cell}
          width={overlap}
          height={overlap}
          fill={r.blue ? dotColor : color}
        />
      ))}
    </Svg>
  );
}

/** One liquid-glass window: native background blur (where available)
 * under a milky white veil, a bright hairline border with a brighter top
 * rim, a title row with its status dot on the right, and an optional blue
 * tint that turns the whole card into colored glass (the hero). */
function LiquidCard({
  title,
  dot,
  tint,
  clouds,
  onPress,
  style,
  contentStyle,
  children,
}: {
  title?: string;
  /** alert dot at the right end of the title row (approvals only) */
  dot?: string;
  /** [top, bottom] gradient that tints the whole card (hero) */
  tint?: [string, string];
  /** soft cloud wisps over the tint, like the chat tab's CloudBg */
  clouds?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  children: ReactNode;
}) {
  const onTint = !!tint;
  // Measured so the gradient border SVG can be drawn at exact size.
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  // Figma glass spec (all cards): border gradient white 0.95->0.25 at
  // 1.2px, shadow 0 12 30 rgba(46,50,82,0.16), inset top rim, blur.
  // Fill: light cards white 0.55->0.30; hero the blue tint at 0.92.
  // Plain sections: milky glass (Acid Pop) or solid white, by the
  // SECTION_MATERIAL switch above. Hero keeps its tinted glass either way.
  const base: ViewStyle = {
    borderRadius: 16,
    overflow: 'hidden',
    ...(onTint
      ? {
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.4)',
          backgroundColor: 'rgba(255,255,255,0.12)',
        }
      : NIGHT
        ? {
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.10)',
            // slate gray: the night idea without the near-black weight
            backgroundColor: '#4A525E',
          }
        : MILK
          ? {
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.35)',
              backgroundColor: 'rgba(255,255,255,0.18)',
            }
          : GLASSY
            ? {
                                backgroundColor: 'rgba(255,255,255,0.35)',
              }
            : { backgroundColor: '#FFFFFF' }),
    shadowColor: '#2E3252',
    shadowOpacity: 0.13,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    ...style,
  };
  const onLayout = (e: { nativeEvent: { layout: { width: number; height: number } } }) =>
    setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  const inner = (
    <>
      {GLASS_AVAILABLE && (onTint || MILK || GLASSY) ? (
        <GlassView
          // "regular" carries the real frost/blur (hero tint, milk cards).
          glassEffectStyle="regular"
          colorScheme="light"
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}
      {/* the blue tint over the hero's glass, or the milky veil that
          keeps plain cards creamy and uniform */}
      {tint || MILK || GLASSY ? (
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <SvgGradient id="veil" x1="0" y1="0" x2="0" y2="1">
              <Stop
                offset="0%"
                stopColor={tint ? tint[0] : '#FFFFFF'}
                stopOpacity={tint ? 0.92 : GLASSY ? 0.5 : 0.46}
              />
              <Stop
                offset="100%"
                stopColor={tint ? tint[1] : '#FFFFFF'}
                stopOpacity={tint ? 0.92 : GLASSY ? 0.34 : 0.26}
              />
            </SvgGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#veil)" />
        </Svg>
      ) : null}
      {/* soft cloud wisps, same construction as the chat's CloudBg */}
      {clouds && size ? (
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            {CARD_CLOUDS.map(([cx, cy, rx, ry, rot, op], i) => (
              <RadialGradient
                key={i}
                id={`cc${i}`}
                gradientUnits="userSpaceOnUse"
                cx={cx * size.w}
                cy={cy * size.h}
                rx={rx * size.w}
                ry={ry * size.h}
                gradientTransform={`rotate(${rot} ${cx * size.w} ${cy * size.h})`}>
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={op} />
                <Stop offset="60%" stopColor="#FFFFFF" stopOpacity={op * 0.45} />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
              </RadialGradient>
            ))}
          </Defs>
          {CARD_CLOUDS.map((_, i) => (
            <Rect key={i} x="0" y="0" width="100%" height="100%" fill={`url(#cc${i})`} />
          ))}
        </Svg>
      ) : null}
      {title ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 14,
            paddingTop: 9,
          }}>
          <Text
            style={{
              color: onTint ? 'rgba(255,255,255,0.85)' : SINK.dim,
              fontSize: 11,
              fontFamily: fontFamily.medium,
              letterSpacing: 1,
            }}>
            {title}
          </Text>
          {dot ? (
            <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: dot }} />
          ) : null}
        </View>
      ) : null}
      <View style={{ padding: spacing.lg, paddingTop: spacing.md, ...contentStyle }}>
        {children}
      </View>
    </>
  );
  if (!onPress)
    return (
      <View style={base} onLayout={onLayout}>
        {inner}
      </View>
    );
  return (
    <Pressable
      onPress={onPress}
      onLayout={onLayout}
      style={({ pressed }) => ({ ...base, opacity: pressed ? 0.85 : 1 })}>
      {inner}
    </Pressable>
  );
}

// the FACE avatar dial retired 2026-07-28 with the row faces themselves
// ("얼굴들을 빼줘"); its sizing history (16 → 20 → 26 → 24 → 21) lives in
// git. The 25px mark column the faces sat in survives, now holding dots.

// AskFace retired 2026-07-28 ("얼굴들을 빼줘"), and the aqua MosaicDot
// that briefly replaced it went the same morning ("이부분 아이콘도 없어도
// 될거같아"): board rows carry no mark at all now — the section headers
// alone say what a row means.

/** the idle console's FACE (2026-07-24 "깜빡이면서 그 표정 같은
 * 거"): the >_ glyph mostly holds steady, then gives a quick wink —
 * a cursor blink read as an expression, the machine at rest. */
function ConsoleFace({ color }: { color: string }) {
  const o = useSharedValue(1);
  useEffect(() => {
    o.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2100 }),
        withTiming(0.12, { duration: 110 }),
        withTiming(1, { duration: 180 })
      ),
      -1
    );
  }, [o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.Text
      style={[
        { fontFamily: fontFamily.mono, fontSize: 13, color },
        style,
      ]}>
      {'>_'}
    </Animated.Text>
  );
}

// ProfileFace retired 2026-07-28 with AskFace (same pass): its long
// who-fronts-the-row history (photo → drawn → duotone → executor face)
// lives in git; the answer became "no face at all". Ellie's photo still
// runs in the Home header lockup, identifying the ACCOUNT. See
// src/mock/user.ts.

export default function HomeScreen() {
  const {
    connected,
    setConnected,
    approvals,
    running,
    thinking,
    runArchive,
    typingThreadId,
    services,
    background,
    threads,
    crew,
    schedules,
    addRoutine,
    skipDinner,
    resolveApproval,
    createThread,
    sendMessage,
  } = useAppStore();
  const insets = useSafeAreaInsets();

  // Connection status popover (tap the "Online" label to inspect services).
  const [statusOpen, setStatusOpen] = useState(false);
  // PAIRING (2026-07-30): the product's one onboarding moment. null = the
  // splash; a step = the pairing flow is running. There is deliberately no
  // account or login screen anywhere — your server IS your account.
  const [pairing, setPairing] = useState<PairingStep | null>(null);
  // the >_ panel's receipt roll (2026-07-28): every archived run across
  // every thread, newest first, the LIVE run leading — labels fall back
  // to the thread title when a run has no recorded ask
  const threadTitle = (id: string) => threads.find((t) => t.id === id)?.title;
  const activityRuns = [
    ...(thinking && !thinking.done
      ? [
          {
            key: 'live',
            threadId: thinking.threadId,
            label: threadTitle(thinking.threadId),
            lines: thinking.lines,
            live: true,
          },
        ]
      : []),
    ...Object.entries(runArchive)
      .flatMap(([tid, recs]) =>
        recs.map((r, i) => ({
          key: `${tid}-${i}`,
          threadId: tid,
          label: r.ask ?? threadTitle(tid),
          lines: r.lines,
          failed: r.failed,
          at: r.at ?? 0,
        }))
      )
      .sort((a, b) => b.at - a.at),
    // TWO whole receipts, not eight clipped ones (2026-07-28): the panel
    // is a glance; the full ledger is the Activity tab
  ].slice(0, 2);
  // folder flaps hug their titles (2026-07-17 "타이틀이랑 간격 맞춰"):
  // each section's label is measured as it renders and the diagonal
  // starts TAB_GAP after it; until measured, the component default holds
  const TAB_GAP = 18;
  const [titleW, setTitleW] = useState<Record<string, number>>({});
  const measureTitle =
    (key: string) => (e: { nativeEvent: { lines: { width: number }[] } }) => {
      const w = Math.ceil(e.nativeEvent.lines[0]?.width ?? 0);
      setTitleW((prev) => (prev[key] === w ? prev : { ...prev, [key]: w }));
    };
  const flapW = (key: string, fallback: number) =>
    titleW[key] ? 18 + titleW[key] + TAB_GAP : fallback;
  // "+N MORE" opens the queue as a RISING FOLDER (2026-07-17, replaces
  // the teleport-scroll that remotely flipped a distant filter tab)
  const [taskSheet, setTaskSheet] = useState<'needsYou' | 'running' | null>(null);
  // the status pill's gel: aqua at rest, amber/red fluid when a
  // service is sick. Worst wins.
  const worst = worstServiceState(services);

  const startChat = () => router.push(`/chat/${createThread()}`);

  // Scroll-to-approvals (the charcoal count tile jumps here).
  const scrollRef = useRef<ScrollView>(null);
  // (2026-07-17: the floating ask bar left Home — the tab bar's
  // detached "+" circle is the one chat entry now, see (tabs)/ask.tsx)
  // TRUST widget: calibration proposal -> autonomy summary. 'allowed'
  // promotes the pattern to auto-approve; 'kept' snoozes the proposal.
  const [trustHandled, setTrustHandled] = useState<null | 'allowed' | 'kept'>(null);
  // the accumulated-habit SUGGESTION at the top of Routines (2026-07-24):
  // an inferred rule the user hasn't set up yet — + promotes it to a
  // real routine. Dismissed once accepted.
  // back ON with the new mock world (2026-07-29): the habit Clawstin
  // noticed is prep notes before investor calls, and the + turns it into
  // a real routine that runs on its own
  const [ruleSuggested, setRuleSuggested] = useState(true);
  const acceptSuggestedRule = () => {
    setRuleSuggested(false);
    addRoutine({
      name: 'Prep notes before investor calls',
      cadence: 'Before every investor call',
      threadId: 'tv5',
      permissionKey: 'calendar',
      scope: 'READ',
      runs: 0,
    });
  };
  // The ask bar is a DOOR, not a form (2026-07-12): tapping it enters
  // /chat/new full screen — the empty thread IS the compose surface,
  // so the reply and the routing pill land where you typed.
  const openNewChat = (draft?: string) =>
    router.push({ pathname: '/chat/[id]', params: { id: 'new', ...(draft ? { draft } : {}) } });

  // LAST ACTION expands in place: the card grows downward into the
  // full undoable queue instead of opening a separate sheet
  const [lastActionOpen, setLastActionOpen] = useState(false);
  // partially-irreversible actions two-step their revert (2026-07-17):
  // first tap ARMS the row (label of the armed row lives here) and
  // surfaces what stays done; the second tap actually sends the ask
  const [armedRevert, setArmedRevert] = useState<string | null>(null);
  // which dinner slot was answered from the hero card (receipt stamp)
  const [dinnerAnswered, setDinnerAnswered] = useState<string | null>(null);
  // the pitch answers in place (2026-07-21): Go / Not now receipts
  const [pitchAnswered, setPitchAnswered] = useState<'go' | 'later' | null>(null);
  // ONE button principle (2026-07-22): buttons exist ONLY on the
  // expanded item. Collapsed rows are pure list; tap = expand;
  // swipe = the power-user dismiss.
  const [heroExpanded, setHeroExpanded] = useState<'dinner' | 'pitch' | null>(null);
  const toggleHeroItem = (k: 'dinner' | 'pitch') => {
    LayoutAnimation.configureNext({
      duration: 260,
      create: { type: 'easeInEaseOut', property: 'opacity' },
      update: { type: 'easeInEaseOut' },
      delete: { type: 'easeInEaseOut', property: 'opacity' },
    });
    setHeroExpanded((cur) => (cur === k ? null : k));
  };
  /** the digest swipe rail's dark key, reused for Skip / Not now */
  const swipeKey = (label: string, onPress: () => void) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 86,
        marginLeft: 10,
        marginVertical: 4,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(22,24,28,0.82)',
        opacity: pressed ? 0.8 : 1,
      })}>
      <Text style={{ fontSize: 13, fontWeight: fontWeight.semibold, color: '#FFFFFF' }}>
        {label}
      </Text>
    </Pressable>
  );
  // the waiting queue expands IN PLACE under the ask (2026-07-21, no
  // half-sheet): same grammar as the digest's folded routine runs
  const [waitingOpen, setWaitingOpen] = useState(false);
  const toggleWaiting = () => {
    // height glides; the rows make their own staggered entrance
    LayoutAnimation.configureNext({
      duration: 300,
      update: { type: 'easeInEaseOut' },
      delete: { type: 'easeInEaseOut', property: 'opacity' },
    });
    setWaitingOpen((v) => !v);
  };
  // WHILE YOU WERE AWAY has NO dismiss and NO fold (2026-07-21, both
  // tried): × is unrecoverable, folding read as fussy. The digest just
  // stays for the session; the next session's digest replaces it.
  // Accepting the pattern suggestion (YOUR TURN or the sheet) does one
  // real thing: the habit becomes a schedule with its own thread.
  const acceptMorningRoutine = () => {
    setTrustHandled('allowed');
    addRoutine({
      name: 'Morning briefing',
      cadence: '8 AM daily',
      threadId: 't3',
      permissionKey: 'gmail',
      scope: 'READ',
      runs: 0,
    });
  };
  const undoAction = (u: (typeof UNDOABLES)[number]) => {
    setLastActionOpen(false);
    setArmedRevert(null);
    sendMessage(u.threadId, u.ask);
    router.push(`/chat/${u.threadId}`);
  };

  // The greeting speaks: the orchestrator's status line, terse and
  // count-first. A sentence, not a badge row.
  const runningCount = background.filter((t) => t.state === 'running').length;
  // the pitch already fronts its approval on the board — the queue and
  // its count drop that one (dedup rule: one task, one place)
  const queueApprovals = approvals.filter((a) => a.id !== PITCH.approvalId);
  const needsYou =
    background.filter((t) => t.state === 'waiting').length + queueApprovals.length;

  // Live focus for the dashboard widgets: the one running task (real-time
  // pulse) and the front of the needs-you queue (the next action).
  // Computed BEFORE the list rows so the list can exclude the promoted
  // item (2026-07-21 dedup: a task never appears twice on one board).
  const runningTask = background.find((t) => t.state === 'running');
  // the header chip's live feed: an active thinking run wins, else
  // the first long-running task; null = idle (system door)
  // stale-run guard (2026-07-24): a thinking state can linger after
  // its reply if a timer was clobbered — only trust it while the
  // thread is genuinely typing
  const liveRun =
    thinking && !thinking.done && typingThreadId === thinking.threadId
      ? {
          threadId: thinking.threadId,
          line: thinking.lines[thinking.lines.length - 1] ?? 'working',
        }
      : runningTask?.threadId
        ? { threadId: runningTask.threadId, line: runningTask.label }
        : null;
  const nextAsk = [
    ...background
      .filter((t) => t.state === 'waiting')
      .map((t) => ({
        label: t.label,
        suffix: t.deadline ?? t.age,
        aged: t.age?.endsWith('d') ?? false,
        threadId: t.threadId as string | undefined,
        agentId: t.agentId as string | undefined,
      })),
    ...queueApprovals.map((a) => ({
      label: a.title,
      suffix: a.age === 'now' ? undefined : a.age,
      aged: a.age?.endsWith('d') ?? false,
      threadId: a.threadId,
      // WHO is proposing this (2026-07-29): the sticker at the end of the
      // sentence, resolved from the thread that owns the ask
      agentId: threads.find((t) => t.id === a.threadId)?.agentId ?? 'muppet',
    })),
  ].sort((a, b) => Number(a.aged) - Number(b.aged))[0];

  // NEXT UP rows: the routines ledger as a flat board list (2026-07-21,
  // the AutopilotSheet retired) — schedules (time-anchored) first, then
  // event rules; the right column is each row's future hook
  const nextUpRows = [
    ...schedules.map((s) => ({
      key: s.id,
      app: (s.permissionKey ?? 'calendar') as string,
      name: s.name,
      when: s.cadence,
      threadId: s.threadId,
      // proof of life for the Routines ledger (2026-07-29)
      lastRun: s.lastRun,
    })),
    ...AUTOPILOT_RULES.map((r) => ({
      key: r.key,
      app: r.app as string,
      name: r.name,
      when: r.next ?? 'when it fires',
      threadId: r.threadId,
      lastRun: undefined as { ago: string; ok: boolean } | undefined,
    })),
  ];
  // ROUTINES grouping (2026-07-22 "카테고리 안에 들어가는 것들이면
  // 분류"): routines sharing an app fold under one category header;
  // loners stay flat rows
  const routineGroups = (() => {
    const order: string[] = [];
    const byApp: Record<string, typeof nextUpRows> = {};
    nextUpRows.forEach((r) => {
      if (!byApp[r.app]) {
        byApp[r.app] = [];
        order.push(r.app);
      }
      byApp[r.app].push(r);
    });
    return order.map((app) => ({ app, rows: byApp[app] }));
  })();

  // the hero's in-place queue (2026-07-21 provenance marks): work YOU
  // started keeps the blue mosaic dot; crew-initiated approvals wear
  // the responsible member's face (looked up via their thread)
  const heroQueueRows = [
    ...background
      .filter((t) => t.state === 'waiting')
      .map((t) => ({
        key: t.id,
        label: t.label,
        age: t.age,
        threadId: t.threadId as string | undefined,
        agentId: undefined as string | undefined,
      })),
    ...queueApprovals.map((a) => ({
      key: a.id,
      label: a.title,
      age: a.age,
      threadId: a.threadId,
      agentId: threads.find((t) => t.id === a.threadId)?.agentId ?? 'muppet',
    })),
  ];

  // what the corner control HIDES right now: queue rows beyond the
  // promoted ask (pitch extras join this when that list grows)
  const heroHiddenCount = heroQueueRows.filter(
    (r) => r.label !== nextAsk?.label
  ).length;

  // what each hero card's rising folder lists
  const needsYouRows: TaskSheetRow[] = [
    ...background
      .filter((t) => t.state === 'waiting')
      .map((t) => ({ key: t.id, label: t.label, age: t.age, threadId: t.threadId })),
    ...approvals.map((a) => ({ key: a.id, label: a.title, age: a.age, threadId: a.threadId })),
  ];
  const runningRows: TaskSheetRow[] = background
    .filter((t) => t.state === 'running')
    .map((t) => ({
      key: t.id,
      label: t.label,
      age: t.progress ?? t.age,
      threadId: t.threadId,
      running: true,
    }));

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#4E83B8' }}
      edges={['top']}>
      <StatusBar style="dark" />
      {/* start field: the color-panels shader in its light "paper"
          colorway — silver-white and the old start-glow blues drifting
          on pale paper gray, ink text stays legible. Un-froze it
          2026-07-16 ("slowly moving as it was but slowly") — quarter
          speed keeps the fan a calm, ambient drift rather than the
          board's own livelier motion. */}
      {/* the SPLASH keeps the drifting fan; PAIRING gets a much quieter
          field (2026-07-30 "배경 때문에 잘 안 보이는데"): the same panels
          that read as atmosphere behind a wordmark cut straight through
          body copy. Same shader, flattened to a wash and slowed further,
          so the step still feels like the same world. */}
      {!connected &&
        (pairing ? (
          // edge washes, not panels: the shader's seams drew hard lines
          // straight through the copy (2026-07-30)
          <PairingBg />
        ) : (
          <ColorPanelsBg variant="paper" animated speed={0.125} />
        ))}
      {/* PAIRING runs over the same calm paper fan as the splash, so the
          three steps read as one continuous first-run moment (2026-07-30) */}
      {!connected && pairing ? (
        <PairingFlow
          step={pairing}
          onStep={setPairing}
          onDone={() => {
            setPairing(null);
            setConnected(true);
          }}
        />
      ) : connected ? (
        // ───────────────────────── State board ─────────────────────────
        <>
          {/* fan preset (2026-07-17, reverted back per request): back to
              the same mid-screen 3D fan the other tabs use, for a
              consistent motion language across Home/Activity/Crew. */}
          <ColorPanelsBg variant="deskWash" preset="fan" />
          {/* no veil: the aqua desktop shows at full strength; the
              silver windows carry legibility (fullback: white 0.1) */}
          <View style={{ flex: 1 }}>
            <Animated.ScrollView
              ref={scrollRef}
              contentContainerStyle={{ padding: spacing.lg, paddingBottom: 140 }}
              showsVerticalScrollIndicator={false}>
              {/* top row: the wordmark left, gateway status right */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 4,
                }}>
                {/* header brand went wordmark-ONLY (2026-07-15, "그냥
                    클로스틴만"): the pixel-girl chip read as clutter next
                    to the serif; the mark still lives in chat routing
                    and brand moments. The ONLINE chip dissolved into a
                    presence dot on the wordmark (2026-07-16) — tap the
                    lockup to open System Status; the dot goes amber/red
                    when a service is degraded/down. */}
                {/* the photo avatar CUT from this slot (2026-07-30 "얼굴
                    프로필 지우기") — the 2026-07-25 "my photo" experiment
                    is over; the serif wordmark stands alone again, same
                    as when the mascot chip was cut on 2026-07-15. */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                  {/* faux-weight shadow only, eased 2.2 → 1.3 (2026-07-16
                      "글로우 조금더 약하게") — barely thicker than the
                      bare serif, no halo */}
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: 23,
                      letterSpacing: 0.5,
                      fontFamily: 'InstrumentSerif-Regular',
                      textShadowColor: '#FFFFFF',
                      textShadowRadius: 1.3,
                      textShadowOffset: { width: 0, height: 0 },
                    }}>
                    Clawstin
                  </Text>
                </View>
                {/* status = the LIVE CONSOLE CHIP (2026-07-24
                    "running console should come on the home tab...
                    instead of the system part"): the header carries
                    the machine's own dark window, always. Idle = the
                    quiet >_ (tap opens System Status — the chip keeps
                    the system-door role). Running = a one-line mono
                    ticker of the current step; tap jumps INTO that
                    run's thread. */}
                <Pressable
                  // ALWAYS the panel door (2026-07-29 "버튼처럼 이전처럼
                  // 나오고 누르면 밑에 로그가 나오게"): the key used to widen
                  // into a one-line ticker whenever something was running,
                  // so the header changed shape and the tap silently changed
                  // meaning (jumping into a thread instead of opening the
                  // log). It is one button now: same square, always opens
                  // the activity panel below.
                  onPress={() => setStatusOpen(true)}
                  hitSlop={12}
                  style={({ pressed }) => ({
                    // the docked console SQUARE as-is (2026-07-24 "접혔을
                    // 때 그 사각 그대로"), in every state
                    height: 40,
                    width: 40,
                    // same corner as the chat's docked >_ console
                    // (2026-07-24 "라운드 똑같아야"): both radius 13
                    borderRadius: 13,
                    backgroundColor: '#0E1626',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.8 : 1,
                  })}>
                  {/* the glyph carries the state instead of the shape:
                      running blinks the run's own green, idle holds the
                      health colour */}
                  <ConsoleFace
                    color={
                      liveRun
                        ? '#7ED9A0'
                        : worst === 'operational'
                          ? '#7ED9A0'
                          : sysColor.degraded
                    }
                  />
                </Pressable>
              </View>

              {/* ── Control-tower dashboard: the trust cycle as a board.
                  YOUR TURN leads (2026-07-21 "your turn up"): the ask
                  outranks the briefing. RUNNING shows delegation at
                  work, TRUST calibrates what stops needing approval.
                  Every approval feeds TRUST; TRUST slims YOUR TURN;
                  undo makes the added autonomy safe. ── */}
              {/* the standalone connection strip retired (2026-07-30):
                  the System square in the paired row below now carries the
                  machines, the host and the ping, so a strip up here was
                  the same fact stated twice. */}

              {/* ── THE PAIRED CARDS, now the board's FIRST row
                  (2026-07-30): the machine's own state leads, then what it
                  finished (Completed), then what it wants from you
                  (Suggestions) — present, past, then the ask.
                  Left = the running task, or the next scheduled one when
                  nothing is running. Right = the machine itself, which is
                  why the standalone connection strip retired: it was the
                  same fact stated twice. ── */}
              <Animated.View
                entering={FadeInDown.duration(420).delay(240)}
                style={{
                  flexDirection: 'row',
                  gap: PAIR_GAP,
                  marginTop: SECTION_GAP,
                }}>
                {/* ── LEFT: the machine itself ── */}
                <Pressable
                  onPress={() => setStatusOpen(true)}
                  style={({ pressed }) => ({
                    flex: 1,
                    height: 124,
                    paddingHorizontal: 18,
                    paddingBottom: 18,
                    shadowColor: '#16181C',
                    shadowOpacity: 0.1,
                    shadowRadius: 18,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 5,
                    opacity: pressed ? 0.85 : 1,
                  })}>
                  {/* FOLDER shape, GHOST material, DISSOLVING mosaic
                      (2026-07-30): the flap keeps it in the board family,
                      the ghost-blue tint keeps it one layer deeper than
                      the task folders, and a corner of glass tiles
                      breaking apart says "machine" without repainting the
                      whole face. */}
                  <FrostedGlassFill
                    radius={14}
                    tabWidth={flapW('system', 90)}
                    tabHeight={22}
                    tint="rgba(173,208,240,0.42)"
                  />
                  <MosaicDissolveFill />
                  <View style={{ height: 26, flexDirection: 'row', alignItems: 'center' }}>
                    <Text
                      onTextLayout={measureTitle('system')}
                      style={{
                        fontSize: 12,
                        fontFamily: fontFamily.mono,
                        letterSpacing: 0.3,
                        color: 'rgba(22,24,28,0.55)',
                      }}>
                      System
                    </Text>
                  </View>

                  {/* SAME ANATOMY as the card beside it (2026-07-30
                      "레이아웃이 안맞고"): every board card is title, then
                      body centred in the space left, then meta pinned
                      bottom-right. System stacked its image and host name
                      as one block instead, which is why it read off.
                      The picture IS the body here, so it fills that slot
                      and the host drops to the meta line where "started
                      9:02 AM" and "12ms" already live. */}
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ConnectionMark />
                  </View>

                  <View
                    style={{
                      position: 'absolute',
                      left: 18,
                      right: 18,
                      bottom: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        flex: 1,
                        fontSize: 11,
                        fontFamily: fontFamily.mono,
                        color: AINK.dim,
                      }}>
                      openclaw.local
                    </Text>
                    <Text
                      style={{ fontSize: 11, fontFamily: fontFamily.mono, color: AINK.dim }}>
                      12ms
                    </Text>
                  </View>
                </Pressable>
                {/* ── RIGHT: running, else next up ── */}
                <Pressable
                  onPress={() => {
                    if (runningTask?.threadId) router.push(`/chat/${runningTask.threadId}`);
                    else if (nextUpRows[0]) router.push(`/chat/${nextUpRows[0].threadId}`);
                  }}
                  style={({ pressed }) => ({
                    flex: 1,
                    height: 124,
                    paddingHorizontal: 18,
                    paddingBottom: 18,
                    shadowColor: '#16181C',
                    shadowOpacity: 0.1,
                    shadowRadius: 18,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 5,
                    opacity: pressed ? 0.85 : 1,
                  })}>
                  <FrostedGlassFill
                    radius={14}
                    tabWidth={flapW(runningTask ? 'running' : 'nextup', 90)}
                    tabHeight={22}
                  />
                  <View style={{ height: 26, flexDirection: 'row', alignItems: 'center' }}>
                    <Text
                      onTextLayout={measureTitle(runningTask ? 'running' : 'nextup')}
                      style={{
                        fontSize: 12,
                        fontFamily: fontFamily.mono,
                        letterSpacing: 0.3,
                        color: 'rgba(22,24,28,0.55)',
                      }}>
                      {runningTask ? 'Running' : 'Next up'}
                    </Text>
                  </View>

                  {/* the body clears the meta row (2026-07-30 "사이 간격이
                      irregular"): a two-line title ran right up against
                      "started 9:02 AM". paddingBottom reserves that line's
                      space so the gap is the same however long the label. */}
                  <View style={{ flex: 1, justifyContent: 'center', paddingBottom: 14 }}>
                    {runningTask ? (
                      <View style={{ gap: 8 }}>
                        <ProgressCells color={AINK.running} size={10} />
                        <Text
                          numberOfLines={2}
                          style={{
                            fontSize: fontSize.body,
                            lineHeight: 20,
                            fontFamily: fontFamily.regular,
                            color: AINK.text,
                          }}>
                          {runningTask.label}
                        </Text>
                      </View>
                    ) : nextUpRows[0] ? (
                      <View style={{ gap: 6 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Ionicons
                            name={
                              NEXTUP_APP_ICON[
                                nextUpRows[0].app as keyof typeof NEXTUP_APP_ICON
                              ] ?? 'apps-outline'
                            }
                            size={16}
                            color={AINK.dim}
                          />
                          <Text
                            style={{
                              fontSize: 11,
                              fontFamily: fontFamily.mono,
                              letterSpacing: 0.3,
                              color: AINK.dim,
                            }}>
                            {nextUpRows[0].app.toUpperCase()}
                          </Text>
                        </View>
                        <Text
                          numberOfLines={3}
                          style={{
                            fontSize: fontSize.body,
                            lineHeight: 20,
                            fontFamily: fontFamily.regular,
                            color: AINK.text,
                          }}>
                          {nextUpRows[0].name}
                        </Text>
                      </View>
                    ) : (
                      <Text
                        style={{
                          fontSize: fontSize.body,
                          lineHeight: 20,
                          fontFamily: fontFamily.regular,
                          color: AINK.dim,
                        }}>
                        Nothing running
                      </Text>
                    )}
                  </View>

                  {/* the meta each state carries: elapsed, or when it fires */}
                  <View style={{ position: 'absolute', right: 18, bottom: 16 }}>
                    <Text
                      style={{ fontSize: 11, fontFamily: fontFamily.mono, color: AINK.dim }}>
                      {runningTask
                        ? runningTask.progress ?? runningTask.age ?? 'now'
                        : nextUpRows[0]?.when ?? ''}
                    </Text>
                  </View>
                </Pressable>

              </Animated.View>

              {/* the CREW/YOU digest rides SECOND now (2026-07-21 "your
                  turn up"): pure FYI yields to the live ask above.
                  Stays mounted when empty (2026-07-28) — the card
                  carries its own empty note. */}
              <AwayDigestCard
                digest={AWAY_DIGEST}
                undoables={UNDOABLES}
                enterDelay={120}
                onOpenThread={(id) => router.push(`/chat/${id}`)}
                onUndo={undoAction}
              />


              {/* ALWAYS on the board (2026-07-28 "섹션들은 전부 나두고"):
                  the folder no longer hides when empty — it states the
                  empty instead. The card-wide '/chat/t1' door went with
                  the demo data; rows are the doors now. */}
              <Animated.View
                  entering={FadeInDown.duration(420)}
                  style={{ marginTop: 28 }}>
                <View
                  style={{
                    paddingHorizontal: 18,
                    paddingBottom: 18,
                    shadowColor: '#16181C',
                    shadowOpacity: 0.1,
                    shadowRadius: 20,
                    shadowOffset: { width: 0, height: 8 },
                    elevation: 5,
                  }}>
                  {/* frosted glass folder (2026-07-17, "state of the
                      art" reference, "폴더스타일" notch): the shape
                      itself is drawn as one SVG path, so the outer box
                      stays unclipped/radius-less — no overflow:hidden
                      here, it would clip the notch off */}
                  {/* ONE folder again (2026-07-21 "탭 구분 말고 하나에"):
                      the clarification and the crew's pitch stack in
                      the same YOUR TURN card, split by a hairline */}
                  <FrostedGlassFill radius={16} tabWidth={flapW('yourturn', 122)} />
                  <View style={{ height: 26, flexDirection: 'row', alignItems: 'center' }}>
                    <Text
                      onTextLayout={measureTitle('yourturn')}
                      style={{
                        fontSize: 12,
                        fontFamily: fontFamily.mono,
                        letterSpacing: 0.3,
                        color: 'rgba(22,24,28,0.55)',
                      }}>
                      Suggestions
                    </Text>
                    <View style={{ flex: 1 }} />
                    {/* the card's identity readout: still the door to
                        the full queue, expanding in place */}
                    {/* the corner answers "what does tapping GIVE me":
                        the HIDDEN count (+N, the app's own MORE
                        grammar), not the list size — visible rows never
                        count themselves. Open = nothing hidden = bare
                        chevron; nothing folded at all = no control. */}
                    {heroHiddenCount > 0 || waitingOpen ? (
                      <Pressable
                        onPress={toggleWaiting}
                        hitSlop={12}
                        style={({ pressed }) => ({
                          flexDirection: 'row',
                          alignItems: 'center',
                          opacity: pressed ? 0.5 : 1,
                        })}>
                        {!waitingOpen ? (
                          <Text
                            style={{
                              fontSize: 10,
                              fontFamily: fontFamily.mono,
                              letterSpacing: 0.3,
                              color: AINK.dim,
                            }}>
                            {`+${heroHiddenCount}`}
                          </Text>
                        ) : null}
                        <Ionicons
                          name={waitingOpen ? 'chevron-up' : 'chevron-down'}
                          size={11}
                          color={AINK.dim}
                          style={{ marginLeft: 3 }}
                        />
                      </Pressable>
                    ) : null}
                  </View>
                  {/* DATA-DRIVEN rows only (2026-07-28 wipe): the hardcoded
                      dinner and pitch demo rows live in git — every
                      suggestion now comes from the store (waiting tasks +
                      approvals), and an empty section says so instead of
                      vanishing. Rows are doors; deciding happens in the
                      thread they open. */}
                  {nextAsk ? (
                    <Pressable
                      onPress={() =>
                        nextAsk.threadId && router.push(`/chat/${nextAsk.threadId}`)
                      }
                      style={({ pressed }) => ({
                        marginTop: 14,
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        gap: spacing.sm,
                        opacity: pressed ? 0.6 : 1,
                      })}>
                      {/* the face sits ON THE LAST LINE, right after the
                          final word (2026-07-29 "문장 바로 끝에 같은 라인으로"),
                          not floating at the end of the block.
                          A bare View inside Text renders unreliably on iOS,
                          so the sticker rides inside an inline Text run whose
                          own baseline the emoji-sized box follows. */}
                      <Text
                        style={{
                          flex: 1,
                          fontSize: fontSize.body,
                          lineHeight: 22,
                          fontFamily: fontFamily.medium,
                          color: AINK.text,
                        }}>
                        {nextAsk.label}
                        {nextAsk.agentId ? (
                          <Text>
                            {' '}
                            <CrewSticker agentId={nextAsk.agentId} size={15} inline />
                          </Text>
                        ) : null}
                      </Text>
                      <Text
                        style={{ fontSize: 11, fontFamily: fontFamily.mono, color: AINK.dim }}>
                        {nextAsk.suffix ?? 'now'}
                      </Text>
                    </Pressable>
                  ) : (
                    <EmptyNote text="All clear" pad={0} />
                  )}
                  {waitingOpen ? (
                    <View style={{ marginTop: 12 }}>
                      {heroQueueRows
                        .filter((r) => r.label !== nextAsk?.label)
                        .map((r, idx) => (
                          <Animated.View
                            key={r.key}
                            entering={FadeInDown.duration(260).delay(80 * idx)}>
                            <Pressable
                              onPress={() =>
                                r.threadId && router.push(`/chat/${r.threadId}`)
                              }
                              style={({ pressed }) => ({
                                flexDirection: 'row',
                                // top-aligned now that the label can wrap:
                                // centering floated the time beside the
                                // middle of a two-line ask
                                alignItems: 'flex-start',
                                gap: spacing.sm,
                                paddingVertical: 12,
                                opacity: pressed ? 0.5 : 1,
                              })}>
                              <RowRule />
                              {/* SAME anatomy as the promoted row above
                                  (2026-07-29): the sentence wraps instead of
                                  truncating, and its own crew face signs the
                                  end of it. A "…" hid the actual ask, which
                                  is the one thing the row exists to say. */}
                              <Text
                                style={{
                                  flex: 1,
                                  fontSize: fontSize.body,
                                  lineHeight: 22,
                                  fontFamily: fontFamily.regular,
                                  color: AINK.text,
                                }}>
                                {r.label}
                                {r.agentId ? (
                                  <Text>
                                    {' '}
                                    <CrewSticker agentId={r.agentId} size={15} inline />
                                  </Text>
                                ) : null}
                              </Text>
                              <Text
                                style={{ fontSize: 11, fontFamily: fontFamily.mono, color: AINK.dim }}>
                                {r.age}
                              </Text>
                            </Pressable>
                          </Animated.View>
                        ))}
                    </View>
                  ) : null}
                </View>
                </Animated.View>

              {/* post-action control: the agent's most recent write
                  action stays undoable here instead of scrolling away
                  in chat. "+N more" expands the card in place into the
                  full undoable queue; the descending minutes column
                  explains itself, no caption needed. */}
              {/* LAST ACTION only stands alone in PLAIN time (no away
                  digest on the board): with WYWA present its undo rail
                  rides the digest rows instead — the two are states of
                  the same card (2026-07-21 merge) */}
              {/* hidden outright when there is nothing to undo (2026-07-28
                  data wipe): an empty LAST ACTION shell said nothing */}
              {AWAY_DIGEST.auto.length + AWAY_DIGEST.asked.length > 0 ||
              UNDOABLES.length === 0 ? null : (
              <Animated.View
                entering={FadeInDown.duration(420).delay(360)}
                style={{
                  marginTop: SECTION_GAP,
                  paddingHorizontal: 18,
                  paddingBottom: 18,
                  shadowColor: '#16181C',
                  shadowOpacity: 0.1,
                  shadowRadius: 20,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: 5,
                }}>
                <FrostedGlassFill radius={16} tabWidth={flapW('lastaction', 132)} />
                <View
                  style={{
                    height: 26,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text
                      onTextLayout={measureTitle('lastaction')}
                      style={{
                        fontSize: 12,
                        fontFamily: fontFamily.mono,
                        letterSpacing: 0.3,
                        color: 'rgba(22,24,28,0.55)',
                      }}>
                      Last action
                    </Text>
                  </View>
                  {lastActionOpen ? (
                    <Pressable
                      hitSlop={16}
                      onPress={() => {
                        setLastActionOpen(false);
                        setArmedRevert(null);
                      }}>
                      <Ionicons name="close" size={15} color={AINK.dim} />
                    </Pressable>
                  ) : UNDOABLES.length > 1 ? (
                    <Pressable hitSlop={16} onPress={() => setLastActionOpen(true)}>
                      <PixelText text={`+${UNDOABLES.length - 1} MORE`} color={AINK.dim} />
                    </Pressable>
                  ) : null}
                </View>
                {(lastActionOpen ? UNDOABLES : UNDOABLES.slice(0, 1)).map((u, idx) => (
                  <View
                    key={u.label}
                    style={{
                      // one rhythm for every row: equal padding above
                      // and below, hairlines always the same distance
                      // from the text
                      marginTop: idx === 0 ? (lastActionOpen ? 4 : 14) : 0,
                      paddingVertical: lastActionOpen ? 12 : 0,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.sm,
                    }}>
                    {lastActionOpen && idx > 0 ? <RowRule /> : null}
                    <View style={{ flex: 1 }}>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: fontSize.body,
                          fontFamily: fontFamily.regular,
                          color: AINK.text,
                        }}>
                        {u.label}
                      </Text>
                      {/* the armed row states what stays done: the
                          calendar frees, the sent heads-up does not.
                          Reversibility honesty is provenance too. */}
                      {armedRevert === u.label && u.irreversible ? (
                        <Text
                          style={{
                            marginTop: 3,
                            fontSize: fontSize.caption,
                            color: AINK.dim,
                          }}>
                          {u.irreversible}
                        </Text>
                      ) : null}
                    </View>
                    {/* secondary by design: undo is the rare path.
                        Pressing it speaks to the executor in the
                        original thread. Actions with an irreversible
                        part say "Revert…" and take TWO taps: arm with
                        the warning first, fire second. */}
                    <Pressable
                      hitSlop={8}
                      onPress={() => {
                        if (u.irreversible && armedRevert !== u.label) {
                          setArmedRevert(u.label);
                          return;
                        }
                        undoAction(u);
                      }}
                      style={({ pressed }) => ({
                        // quiet gray, not accent — undo never competes
                        // with the blue action slabs above; the armed
                        // state darkens only the TEXT
                        backgroundColor: 'rgba(22,24,28,0.06)',
                        borderRadius: 0,
                        paddingHorizontal: 16,
                        paddingVertical: 9,
                        opacity: pressed ? 0.6 : 1,
                      })}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: fontWeight.semibold,
                          color:
                            armedRevert === u.label && u.irreversible
                              ? '#16181C'
                              : 'rgba(22,24,28,0.65)',
                        }}>
                        Undo
                      </Text>
                    </Pressable>
                  </View>
                ))}
                {lastActionOpen ? (
                  // conversation is the fallback for everything older
                  <Pressable
                    onPress={() => {
                      setLastActionOpen(false);
                      openNewChat('undo ');
                    }}
                    style={({ pressed }) => ({
                      paddingTop: 12,
                      opacity: pressed ? 0.6 : 1,
                    })}>
                    <RowRule />
                    {/* dry register (2026-07-21 tone pass): state the
                        fallback, do not chat about it */}
                    <Text style={{ fontSize: 12, color: AINK.dim }}>
                      Older actions: ask in chat
                    </Text>
                  </Pressable>
                ) : null}
              </Animated.View>
              )}

              {/* ROUTINES (2026-07-21 reshuffle): the standing-autonomy
                  ledger as the board's bottom section — the suggestion
                  line leads (the old gauge card's body), then the flat
                  list (AutopilotSheet retired): schedules first, event
                  rules after, every row a door to its home thread.
                  Stays mounted when empty (2026-07-28 "섹션들은 전부
                  나두고") with its own plain empty note. */}
              <Animated.View
                entering={FadeInDown.duration(420).delay(480)}
                style={{
                  marginTop: SECTION_GAP,
                  shadowColor: '#16181C',
                  shadowOpacity: 0.1,
                  shadowRadius: 20,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: 5,
                }}>
                <FrostedGlassFill radius={16} tabWidth={flapW('routines', 100)} />
                <View style={{ height: 26, justifyContent: 'center', paddingHorizontal: 18 }}>
                  <Text
                    onTextLayout={measureTitle('routines')}
                    style={{
                      alignSelf: 'flex-start',
                      fontSize: 12,
                      fontFamily: fontFamily.mono,
                      letterSpacing: 0.3,
                      color: 'rgba(22,24,28,0.55)',
                    }}>
                    Routines
                  </Text>
                </View>
                {/* SUGGESTED RULE (2026-07-24 "홈탭 스타일에 어울리게"):
                    an inferred habit not yet a routine — the + promotes
                    it.
                    2026-07-25 ("점선같은거로해서 추가할수잇음이라는 표시를
                    더 정확하게"): a DASHED outline is back. The 07-24 pass
                    deliberately avoided one ("not a loud dashed box") and
                    leaned on a mono eyebrow + accent tint alone — but
                    without an edge the row sat in the Routines list
                    looking like an ALREADY-ACTIVE routine, so the tag was
                    carrying the whole "not yet" message and losing.
                    The dash is the honest signal: an empty slot you can
                    fill. Kept quiet to respect the earlier note — 1px,
                    accent at 40%, no fill, so it reads as a placeholder
                    rather than a warning. */}
                {ruleSuggested ? (
                  <View>
                    <View
                      style={{
                        marginTop: 14,
                        // the dashed EDGE hangs outside the content grid
                        // (2026-07-25 "얼라인먼트가 같은 구조로 나와야해"):
                        // real routine rows sit at paddingHorizontal 18,
                        // so this box is inset 8 and pads 9 + 1px border
                        // = content resumes at exactly 18. The icon and
                        // title therefore share the same left edge as
                        // every routine above it; only the dash sits
                        // proud of the column.
                        marginHorizontal: 8,
                        paddingLeft: 9,
                        paddingRight: 8,
                        // matches the routine group's own paddingTop 14
                        // so the dash sits off the text by the same
                        // margin the real rows keep (2026-07-25)
                        paddingVertical: 14,
                        borderWidth: 1,
                        borderStyle: 'dashed',
                        borderColor: 'rgba(47,124,216,0.4)',
                        borderRadius: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                      }}>
                      {/* the app glyph leads, same as a real routine
                          group — then the SUGGESTED tag marks it as
                          not-yet-set-up */}
                      <Ionicons name="calendar-clear-outline" size={16} color={AINK.dim} />
                      <View style={{ flex: 1 }}>
                        <View
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                          <Text
                            style={{
                              fontSize: 11,
                              fontFamily: fontFamily.mono,
                              letterSpacing: 0.3,
                              color: AINK.dim,
                            }}>
                            CALENDAR
                          </Text>
                          <Text
                            style={{
                              fontSize: 9,
                              fontFamily: fontFamily.mono,
                              letterSpacing: 0.4,
                              color: sysColor.action,
                            }}>
                            SUGGESTED
                          </Text>
                        </View>
                        <View
                          style={{
                            // 3 → 9 (2026-07-25 "글씨 사이 위아래 중간에
                            // 간격도 다른데랑 똑같아야해 너무 좁아"): real
                            // routine groups breathe by paddingTop 14 on
                            // the eyebrow + paddingVertical 11 on the
                            // title row; 3px here made the suggested row
                            // read cramped next to them. 9 lands the
                            // eyebrow-to-title gap on the same rhythm.
                            marginTop: 11,
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}>
                          <Text
                            numberOfLines={2}
                            style={{
                              flex: 1,
                              fontSize: fontSize.body,
                              fontFamily: fontFamily.regular,
                              color: AINK.text,
                            }}>
                            Prep notes before every investor call?
                          </Text>
                        </View>
                        {/* WHY this is being suggested (2026-07-29): a
                            routine proposal has to show the habit it
                            noticed, or it reads as the app guessing */}
                        <Text
                          style={{
                            marginTop: 4,
                            fontSize: 11,
                            fontFamily: fontFamily.mono,
                            color: AINK.dim,
                          }}>
                          You've asked 3 times before calls with investors
                        </Text>
                      </View>
                      {/* + promotes the habit into a real routine. Glass
                          chip, not a filled disc (2026-07-30): same white
                          veil + lit rim as the card material, accent lives
                          only in the glyph. */}
                      <Pressable
                        onPress={acceptSuggestedRule}
                        hitSlop={10}
                        style={({ pressed }) => ({
                          width: 30,
                          height: 30,
                          borderRadius: 15,
                          backgroundColor: 'rgba(255,255,255,0.45)',
                          borderWidth: 1,
                          borderColor: 'rgba(255,255,255,0.85)',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: pressed ? 0.7 : 1,
                        })}>
                        <Ionicons name="add" size={19} color={sysColor.accent} />
                      </Pressable>
                    </View>
                    {/* no hairline under this one (2026-07-25): the
                        dashed box already closes the region, and a
                        divider right below it read as a double edge */}
                  </View>
                ) : null}
                {/* EVERYTHING saved, fully unfolded (2026-07-22: the
                    suggestion headline and the all-activity door are
                    gone — this is the board's last section, so the
                    whole ledger just runs to the bottom). Routines
                    sharing an app fold under a category header with
                    their rows indented beneath; loners stay flat. */}
                {routineGroups.map((g, gi) => (
                  <View key={g.app}>
                    {gi > 0 ? (
                      <View
                        style={{ height: 1, backgroundColor: ROW_RULE }}
                      />
                    ) : null}
                    {/* EVERY group leads with its app (2026-07-22
                        "먼저 크게 어디랑 연결된 거를 위에"): the
                        connection reads first, rows tuck beneath —
                        singles included */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        paddingHorizontal: 18,
                        paddingTop: 14,
                      }}>
                      <Ionicons
                        name={
                          NEXTUP_APP_ICON[g.app as keyof typeof NEXTUP_APP_ICON] ??
                          'apps-outline'
                        }
                        size={16}
                        color={AINK.dim}
                      />
                      <Text
                        style={{
                          fontSize: 11,
                          fontFamily: fontFamily.mono,
                          letterSpacing: 0.3,
                          color: AINK.dim,
                        }}>
                        {g.app.toUpperCase()}
                      </Text>
                    </View>
                    {g.rows.map((row) => (
                      <Pressable
                        key={row.key}
                        onPress={() => router.push(`/chat/${row.threadId}`)}
                        style={({ pressed }) => ({
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 12,
                          // indented under the category, the
                          // reference's sub-row rhythm
                          paddingLeft: 46,
                          paddingRight: 18,
                          paddingVertical: 11,
                          opacity: pressed ? 0.5 : 1,
                        })}>
                        <View style={{ flex: 1 }}>
                          <Text
                            numberOfLines={1}
                            style={{
                              color: AINK.text,
                              fontSize: fontSize.body,
                              fontFamily: fontFamily.regular,
                            }}>
                            {row.name}
                          </Text>
                          {/* PROOF OF LIFE (2026-07-29): a routine runs while
                              you are not looking, so the row says when it
                              last fired. A bare check only said it existed. */}
                          {row.lastRun ? (
                            <Text
                              style={{
                                marginTop: 2,
                                fontSize: 11,
                                fontFamily: fontFamily.mono,
                                color: row.lastRun.ok ? AINK.dim : sysColor.fail,
                              }}>
                              {row.lastRun.ok
                                ? `last ran ${row.lastRun.ago}`
                                : `last run failed, ${row.lastRun.ago}`}
                            </Text>
                          ) : null}
                        </View>
                        <Text
                          style={{ fontSize: 11, fontFamily: fontFamily.mono, color: AINK.dim }}>
                          {row.when}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ))}
                {!ruleSuggested && routineGroups.length === 0 ? (
                  <EmptyNote text="None yet" />
                ) : null}
                <View style={{ height: 4 }} />
              </Animated.View>

            </Animated.ScrollView>

          {/* Connection status popover (over the board) */}
            {/* DEV TOOLBOX (2026-07-30): jump to any first-run step while
                designing. Delete this and its component to ship. */}
            {statusOpen ? (
              <StatusPopover
                services={services}
                runs={activityRuns}
                onOpenRun={(threadId) => {
                  setStatusOpen(false);
                  router.push(`/chat/${threadId}`);
                }}
                onClose={() => setStatusOpen(false)}
                onManageAccess={() => {
                  setStatusOpen(false);
                  router.push('/access?focus=issue');
                }}
                onOpenSettings={() => {
                  setStatusOpen(false);
                  router.push('/settings');
                }}
                // the panel's top edge takes the >_ key's own footprint
                // (2026-07-28): header padding lg (14) + row marginTop 4
                // = the key's resting top, so opening reads as the key
                // unfolding rather than a card docking beneath it
                topOffset={18}
              />
            ) : null}


          </View>

          {/* +N MORE's rising folder: the hero card's queue, opened */}
          <TaskSheet
            visible={taskSheet !== null}
            onClose={() => setTaskSheet(null)}
            title={taskSheet === 'running' ? 'Running' : 'Your turn'}
            rows={taskSheet === 'running' ? runningRows : needsYouRows}
          />
        </>
      ) : (
        // ──────────────────── Onboarding · Step 1 (agent mark) ────────────────────
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 110, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}>
          <View style={{ flex: 1 }} />
          {/* nudged below true center (2026-07-16): the lockup rides
              the fan's lower-third axis instead of splitting it */}
          <View style={{ alignItems: 'center', transform: [{ translateY: 32 }] }}>
            {/* Name set only — the mascot left the start screen; the
                wordmark sits on the panel fan's bright axis instead */}
            {/* Headline: Instrument Serif — the sans family's own
                display serif, vintage voice from the same foundry */}
            <Text
              style={{
                color: '#121417',
                fontFamily: 'InstrumentSerif-Regular',
                fontSize: 42,
                letterSpacing: 0,
                lineHeight: 48,
                textAlign: 'center',
                // optical nudge: the serif sat high on the fan axis
                // (1px was imperceptible; 8 actually lands it)
                marginTop: 8,
                // the serif ships one weight; a same-color micro
                // shadow thickens the strokes a touch
                textShadowColor: '#121417',
                textShadowRadius: 0.9,
                textShadowOffset: { width: 0, height: 0 },
              }}>
              Clawstin
            </Text>

            {/* Subtitle: same serif voice as the wordmark, one size
                down and quiet */}
            <Text
              style={{
                color: 'rgba(22,24,28,0.6)',
                fontFamily: 'InstrumentSerif-Regular',
                fontSize: 20,
                lineHeight: 26,
                textAlign: 'center',
                marginTop: spacing.sm,
              }}>
              Stay close to your agent.
            </Text>
          </View>
          <View style={{ flex: 1 }} />

          {/* CTA → connect (v4, 2026-07-16 "그냥 버튼 배경없애기"):
              no panel, no fill at all — just the text sitting directly
              on the fan, the same weight as "Clawstin" above it. */}
          <Pressable
            onPress={() => setPairing('scan')}
            hitSlop={12}
            style={({ pressed }) => ({
              paddingVertical: spacing.lg,
              alignItems: 'center',
              opacity: pressed ? 0.55 : 1,
            })}>
            <Text
              style={{
                color: CTA_SLAB_INK,
                fontSize: fontSize.bodyLg,
                fontFamily: fontFamily.semibold,
              }}>
              Get started
            </Text>
          </Pressable>
        </ScrollView>
      )}

      {/* DEV ONLY (2026-07-30): jump between the splash, the three pairing
          steps and the board without reinstalling. Delete this block and
          step-toolbox.tsx to ship. */}
      <StepToolbox
        steps={[
          {
            key: 'splash',
            label: 'Splash',
            active: !connected && !pairing,
            onPress: () => {
              setConnected(false);
              setPairing(null);
            },
          },
          {
            key: 'scan',
            label: '1 · Scan',
            active: pairing === 'scan',
            onPress: () => {
              setConnected(false);
              setPairing('scan');
            },
          },
          {
            key: 'handshake',
            label: '2 · Handshake',
            active: pairing === 'handshake',
            onPress: () => {
              setConnected(false);
              setPairing('handshake');
            },
          },
          {
            key: 'crew',
            label: '3 · Crew wakes',
            active: pairing === 'crew',
            onPress: () => {
              setConnected(false);
              setPairing('crew');
            },
          },
          {
            key: 'board',
            label: 'Home board',
            active: connected,
            onPress: () => {
              setPairing(null);
              setConnected(true);
            },
          },
        ]}
      />
    </SafeAreaView>
  );
}
