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
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
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
import { BlissSwooshBg } from '@/components/ui/bliss-swoosh-bg';
import { ColorPanelsBg } from '@/components/ui/color-panels-bg';
import { CTA_SLAB_INK, CtaSlabFill } from '@/components/ui/cta-slab';
import { CrewPixel } from '@/components/ui/crew-pixel';
import { FrostedGlassFill } from '@/components/ui/frosted-glass-fill';
import { MosaicDot } from '@/components/ui/mosaic-dot';
import { FlowBar } from '@/components/ui/flow-bar';
import { MosaicGauge } from '@/components/ui/mosaic-gauge';
import { TaskSheet, type TaskSheetRow } from '@/components/ui/task-sheet';
import { PixelText } from '@/components/ui/pixel-text';
import { RasterCloud } from '@/components/ui/analog-key';
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
  divider: 'rgba(22,24,28,0.08)',
  running: sysColor.running,
  warn: sysColor.action,
  accent: sysColor.ready,
};

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

/** the face's YOUR-TURN variant (2026-07-22 "핑크 동그라미"): the
 * member's pixel face wearing a small pink dot at its top-right —
 * the same avatar-badge grammar as the digest's DoneFace check,
 * but a round "needs you" lamp instead of a check — MUTED LIME
 * (2026-07-22 swatch round 2): lime harmonizes with the blue
 * field where orange fought it, muted a step so it stays a
 * badge, not a highlighter. Used nowhere else on the board. */
function AskFace({ id }: { id: string }) {
  return (
    <View style={{ width: 16, height: 16 }}>
      <CrewPixel id={id} size={16} />
      <View
        style={{
          position: 'absolute',
          top: -3,
          right: -4,
          width: 6,
          height: 6,
          borderRadius: 3,
          // no stroke (2026-07-22 "색깔로 승부"): after a full color
          // safari (pink, lime, gold, vintage red) the lamp landed
          // home — the SAME action aqua as the DoneFace check, so
          // both face badges speak the one system-energy color
          backgroundColor: sysColor.action,
        }}
      />
    </View>
  );
}

/** the system key's DROP ARROW (2026-07-22 final: icons retired —
 * the key drops the status panel, so it says exactly that): a crisp
 * hand-drawn chevron, round caps, flips up while the panel is open. */
function SysDropGlyph({ color }: { color: string }) {
  return (
    <Svg width={15} height={13} viewBox="0 0 15 13">
      <Path
        d="M 3.5 4.5 L 7.5 8.5 L 11.5 4.5"
        stroke={color}
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function HomeScreen() {
  const {
    connected,
    setConnected,
    approvals,
    running,
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
  const { width: screenW } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentW = screenW - spacing.lg * 2; // screen padding is spacing.lg each side

  // Connection status popover (tap the "Online" label to inspect services).
  const [statusOpen, setStatusOpen] = useState(false);
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
  const nextAsk = [
    ...background
      .filter((t) => t.state === 'waiting')
      .map((t) => ({
        label: t.label,
        suffix: t.deadline ?? t.age,
        aged: t.age?.endsWith('d') ?? false,
        threadId: t.threadId as string | undefined,
      })),
    ...queueApprovals.map((a) => ({
      label: a.title,
      suffix: a.age === 'now' ? undefined : a.age,
      aged: a.age?.endsWith('d') ?? false,
      threadId: a.threadId,
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
    })),
    ...AUTOPILOT_RULES.map((r) => ({
      key: r.key,
      app: r.app as string,
      name: r.name,
      when: r.next ?? 'on event',
      threadId: r.threadId,
    })),
  ];

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
      {!connected && <ColorPanelsBg variant="paper" animated speed={0.125} />}
      {connected ? (
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
                {/* status = the RASTER CLOUD (2026-07-22 v4, matched
                    to the >_ lens key): no shape, no outline — a cloud
                    of glass cells dissolving into the field. Its
                    MATTER carries state: white at rest, amber/red when
                    a service is sick, accent-charged while System
                    Status is open. Tap sinks it, opens the panel. */}
                <Pressable
                  onPress={() => setStatusOpen(true)}
                  hitSlop={12}
                  style={({ pressed }) => ({
                    width: 84,
                    height: 28,
                    transform: [{ translateY: pressed ? 1 : 0 }],
                    opacity: pressed ? 0.75 : 1,
                  })}>
                  {({ pressed }) => (
                    <>
                      <RasterCloud
                        active={statusOpen}
                        pressed={pressed}
                        state={worst === 'operational' ? undefined : worst}
                      />
                      {/* the cloud's anchor: the DROP ARROW — the key
                          pulls the system panel down; flips up while
                          the panel is open */}
                      <View
                        pointerEvents="none"
                        style={[
                          StyleSheet.absoluteFill,
                          {
                            alignItems: 'center',
                            justifyContent: 'center',
                            transform: [
                              { rotate: statusOpen ? '180deg' : '0deg' },
                            ],
                          },
                        ]}>
                        <SysDropGlyph
                          color={statusOpen ? '#FFFFFF' : 'rgba(37,56,84,0.8)'}
                        />
                      </View>
                    </>
                  )}
                </Pressable>
              </View>

              {/* ── Control-tower dashboard: the trust cycle as a board.
                  YOUR TURN leads (2026-07-21 "your turn up"): the ask
                  outranks the briefing. RUNNING shows delegation at
                  work, TRUST calibrates what stops needing approval.
                  Every approval feeds TRUST; TRUST slims YOUR TURN;
                  undo makes the added autonomy safe. ── */}
              {nextAsk ? (
                // board entrance: each section floats in softly, top to
                // bottom (FadeInDown, 120ms stagger, the hero leads)
                <Animated.View
                  entering={FadeInDown.duration(420)}
                  style={{ marginTop: 28 }}>
                <Pressable
                  onPress={() => router.push('/chat/t1')}
                  style={({ pressed }) => ({
                    paddingHorizontal: 18,
                    paddingBottom: 18,
                    shadowColor: '#16181C',
                    shadowOpacity: 0.1,
                    shadowRadius: 20,
                    shadowOffset: { width: 0, height: 8 },
                    elevation: 5,
                    opacity: pressed ? 0.85 : 1,
                  })}>
                  {/* frosted glass folder (2026-07-17, "state of the
                      art" reference, "폴더스타일" notch): the shape
                      itself is drawn as one SVG path, so the outer box
                      stays unclipped/radius-less — no overflow:hidden
                      here, it would clip the notch off */}
                  {/* ONE folder again (2026-07-21 "탭 구분 말고 하나에"):
                      the clarification and the crew's pitch stack in
                      the same YOUR TURN card, split by a hairline */}
                  <FrostedGlassFill radius={16} tabWidth={flapW('yourturn', 108)} />
                  <View style={{ height: 26, flexDirection: 'row', alignItems: 'center' }}>
                    <Text
                      onTextLayout={measureTitle('yourturn')}
                      style={{
                        fontSize: 12,
                        fontFamily: fontFamily.mono,
                        letterSpacing: 0.3,
                        color: 'rgba(22,24,28,0.55)',
                      }}>
                      Your turn
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
                  {/* LIST-FIRST hero (2026-07-22 "리스트 위주"): rows,
                      not forms. Deciding (5:00? Go?) happens IN the
                      thread the row opens; the only buttons Home shows
                      are the annoyance-killers — Skip / Not now, the
                      "get this out of my face" verbs. */}
                  <ReanimatedSwipeable
                    friction={2}
                    rightThreshold={36}
                    overshootRight={false}
                    renderRightActions={(_p, _t, methods) =>
                      dinnerAnswered !== 'skip'
                        ? swipeKey('Skip', () => {
                            methods.close();
                            setDinnerAnswered('skip');
                            skipDinner();
                          })
                        : null
                    }>
                  <Pressable
                    onPress={() => toggleHeroItem('dinner')}
                    style={({ pressed }) => ({
                      marginTop: 14,
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: spacing.sm,
                      opacity: pressed ? 0.6 : 1,
                    })}>
                    {/* EVERY hero row fronts its executor's face
                        (2026-07-22 "전부 크루 페이스로"): Crop is on
                        the dinner — plain face = pending */}
                    <View style={{ width: 20, alignItems: 'flex-start', marginTop: 2 }}>
                      <AskFace id="pilot" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: fontSize.body,
                          // Home-body trial voice: futuristic-clean grotesk
                          fontFamily: fontFamily.medium,
                          color: AINK.text,
                        }}>
                        Dinner with Jenna, which time?
                      </Text>
                      {dinnerAnswered === 'skip' ? (
                        <Text
                          style={{
                            marginTop: 3,
                            fontFamily: fontFamily.mono,
                            fontSize: 11,
                            color: AINK.dim,
                          }}>
                          Skipped, nothing booked
                        </Text>
                      ) : null}
                    </View>
                    {/* collapsed rows carry only time meta — buttons
                        exist on the EXPANDED item alone */}
                    <Text style={{ fontSize: 10, fontFamily: fontFamily.mono, color: AINK.dim }}>
                      now
                    </Text>
                  </Pressable>
                  </ReanimatedSwipeable>
                  {heroExpanded === 'dinner' && dinnerAnswered !== 'skip' ? (
                    <View
                      style={{
                        marginTop: 10,
                        marginLeft: 28,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 14,
                      }}>
                      <Pressable
                        onPress={() => {
                          setDinnerAnswered('skip');
                          skipDinner();
                        }}
                        hitSlop={10}
                        style={({ pressed }) => ({
                          backgroundColor: 'rgba(22,24,28,0.06)',
                          borderRadius: 0,
                          paddingHorizontal: 14,
                          paddingVertical: 7,
                          opacity: pressed ? 0.6 : 1,
                        })}>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: fontWeight.semibold,
                            color: 'rgba(22,24,28,0.65)',
                          }}>
                          Skip
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => router.push('/chat/t1')}
                        hitSlop={10}
                        style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
                        <Text style={{ fontSize: 13, color: AINK.dim }}>{'Open ›'}</Text>
                      </Pressable>
                    </View>
                  ) : null}
                  {/* the rest of the queue, unfolded IN the folder
                      (2026-07-21, half-sheet retired): the promoted ask
                      stays above, the remainder cascades in below */}
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
                                alignItems: 'center',
                                gap: spacing.sm,
                                paddingVertical: 12,
                                borderTopWidth: 1,
                                borderTopColor: AINK.divider,
                                opacity: pressed ? 0.5 : 1,
                              })}>
                              {/* crew-initiated rows wear their member's
                                  face; your own asks keep the blue dot */}
                              <View style={{ width: 20, alignItems: 'flex-start' }}>
                                {r.agentId ? (
                                  <AskFace id={r.agentId} />
                                ) : (
                                  <MosaicDot color={sysColor.action} />
                                )}
                              </View>
                              <Text
                                numberOfLines={1}
                                style={{
                                  flex: 1,
                                  fontSize: fontSize.body,
                                  fontFamily: fontFamily.regular,
                                  color: AINK.text,
                                }}>
                                {r.label}
                              </Text>
                              {/* collapsed-row rule (2026-07-22): the
                                  right side is time meta, nothing else */}
                              <Text
                                style={{
                                  fontSize: 10,
                                  fontFamily: fontFamily.mono,
                                  color: AINK.dim,
                                }}>
                                {r.age ?? 'now'}
                              </Text>
                            </Pressable>
                          </Animated.View>
                        ))}
                    </View>
                  ) : null}
                  {/* ── ONE SECTION, a folder INSIDE it (2026-07-22
                      "하나의 섹션으로 묶고 안에 폴더"): the pitch is a
                      second folder layer DOCKED into the card's bottom,
                      spanning its full width — its flap rises out of
                      the shared glass, its bottom corners ARE the
                      section's. Non-blocking: Not now, dies alone. ── */}
                  <View style={{ marginTop: 16, marginHorizontal: -18, marginBottom: -18 }}>
                    <FrostedGlassFill
                      radius={16}
                      dock
                      tabWidth={flapW('pitch', 148)}
                      // the waiting-tab plate family, a touch lighter
                      tint="rgba(255,255,255,0.22)"
                    />
                    {/* no chevron of its own (2026-07-22): the corner
                        "N WAITING" is the ONE master toggle — folded,
                        every list shows just its first item */}
                    <View
                      style={{
                        height: 26,
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 18,
                      }}>
                      <Text
                        onTextLayout={measureTitle('pitch')}
                        style={{
                          fontSize: 12,
                          fontFamily: fontFamily.mono,
                          letterSpacing: 0.3,
                          color: 'rgba(22,24,28,0.55)',
                        }}>
                        Proposed by crew
                      </Text>
                    </View>
                  <ReanimatedSwipeable
                    friction={2}
                    rightThreshold={36}
                    overshootRight={false}
                    renderRightActions={(_p, _t, methods) =>
                      pitchAnswered !== 'later'
                        ? swipeKey('Not now', () => {
                            methods.close();
                            setPitchAnswered('later');
                          })
                        : null
                    }>
                  <Pressable
                    onPress={() => toggleHeroItem('pitch')}
                    style={({ pressed }) => ({
                      // same title→row breathing room as the hero list
                      // (2026-07-22 "간격이 좀 넓어야, 다른 데처럼")
                      marginTop: 14,
                      paddingHorizontal: 18,
                      flexDirection: 'row',
                      // top-aligned, not centered: when the title wraps,
                      // the face stays married to the FIRST line
                      alignItems: 'flex-start',
                      gap: spacing.sm,
                      opacity: pressed ? 0.6 : 1,
                    })}>
                    {/* the pitching member's FACE is the provenance
                        mark (the mosaic cell read too abstract): small,
                        column hugs the face so it stays connected to
                        the sentence it fronts; 2px nudge centers it on
                        the first line's 20pt box */}
                    <View style={{ width: 20, alignItems: 'flex-start', marginTop: 2 }}>
                      <CrewPixel id={PITCH.agentId} size={16} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        numberOfLines={2}
                        style={{
                          fontSize: fontSize.body,
                          fontFamily: fontFamily.medium,
                          color: AINK.text,
                        }}>
                        {PITCH.title}
                      </Text>
                      {pitchAnswered === 'later' ? (
                        <Text
                          style={{
                            marginTop: 3,
                            fontSize: 10,
                            fontFamily: fontFamily.mono,
                            color: AINK.dim,
                          }}>
                          Passed, it expires on its own
                        </Text>
                      ) : null}
                    </View>
                    {/* collapsed = time meta only */}
                    {pitchAnswered !== 'later' ? (
                      <Text
                        style={{ fontSize: 10, fontFamily: fontFamily.mono, color: AINK.dim }}>
                        {`expires ${PITCH.expires}`}
                      </Text>
                    ) : null}
                  </Pressable>
                  </ReanimatedSwipeable>
                  {heroExpanded === 'pitch' && pitchAnswered !== 'later' ? (
                    <View
                      style={{
                        marginTop: 10,
                        marginLeft: 46,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 14,
                      }}>
                      <Pressable
                        onPress={() => setPitchAnswered('later')}
                        hitSlop={10}
                        style={({ pressed }) => ({
                          backgroundColor: 'rgba(22,24,28,0.06)',
                          borderRadius: 0,
                          paddingHorizontal: 14,
                          paddingVertical: 7,
                          opacity: pressed ? 0.6 : 1,
                        })}>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: fontWeight.semibold,
                            color: 'rgba(22,24,28,0.65)',
                          }}>
                          Not now
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => router.push(`/chat/${PITCH.threadId}`)}
                        hitSlop={10}
                        style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
                        <Text style={{ fontSize: 13, color: AINK.dim }}>{'Open ›'}</Text>
                      </Pressable>
                    </View>
                  ) : null}
                  <View style={{ height: 16 }} />
                  </View>
                </Pressable>
                </Animated.View>
              ) : null}

              {/* the CREW/YOU digest rides SECOND now (2026-07-21 "your
                  turn up"): pure FYI yields to the live ask above */}
              {AWAY_DIGEST.auto.length + AWAY_DIGEST.asked.length > 0 ? (
                <AwayDigestCard
                  digest={AWAY_DIGEST}
                  undoables={UNDOABLES}
                  enterDelay={120}
                  onOpenThread={(id) => router.push(`/chat/${id}`)}
                  onUndo={undoAction}
                />
              ) : null}

              <Animated.View
                entering={FadeInDown.duration(420).delay(240)}
                style={{
                  flexDirection: 'row',
                  gap: 12,
                  marginTop: 28,
                }}>
                {/* RUNNING leads the row (2026-07-21 reshuffle): the
                    gauge card retired — routines' content moved to the
                    bottom ROUTINES section, and the right slot became
                    the compact NEXT UP card below */}
                {(
                  [
                    {
                      key: 'running',
                      label: 'Running',
                      title: runningTask ? runningTask.label : 'No tasks running',
                      // "2 of 4 sites" stays words + discrete steps; a
                      // percent would be a guess dressed as a measurement
                      progress: (() => {
                        const m = runningTask?.progress?.match(/(\d+)\s+of\s+(\d+)/);
                        return m
                          ? { done: Number(m[1]), total: Number(m[2]), phrase: runningTask!.progress! }
                          : null;
                      })(),
                      working: !!runningTask,
                      more: Math.max(runningCount - 1, 0),
                      moreColor: sysColor.running,
                      filter: 'running' as const,
                      threadId: runningTask?.threadId,
                    },
                  ] as const
                ).map((w) => (
                  <Pressable
                    key={w.key}
                    onPress={() => w.threadId && router.push(`/chat/${w.threadId}`)}
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
                    {/* while work actually runs the folder ITSELF glows
                        (2026-07-22): the silhouette breathes brighter,
                        the translucent folder look stays */}
                    <FrostedGlassFill
                      radius={14}
                      tabWidth={flapW(w.key, 90)}
                      tabHeight={22}
                      shine={w.working}
                    />
                    <View style={{ height: 26, flexDirection: 'row', alignItems: 'center' }}>
                      <Text
                        onTextLayout={measureTitle(w.key)}
                        style={{
                          fontSize: 12,
                          fontFamily: fontFamily.mono,
                          letterSpacing: 0.3,
                          color: 'rgba(22,24,28,0.55)',
                        }}>
                        {w.label}
                      </Text>
                    </View>
                    {w.more > 0 ? (
                      // "+N more": the rest of the queue, one tap away
                      <Pressable
                        onPress={() => setTaskSheet('running')}
                        hitSlop={10}
                        style={({ pressed }) => ({
                          position: 'absolute',
                          top: 9,
                          right: 14,
                          opacity: pressed ? 0.5 : 1,
                        })}>
                        <PixelText text={`+${w.more} MORE`} color={w.moreColor} />
                      </Pressable>
                    ) : null}
                    {/* title floats centered between the label above and
                        the progress bar; the margin is reserved even without
                        a bar so titles align across sibling cards */}
                    <View
                      style={{
                        flex: 1,
                        justifyContent: 'center',
                        marginBottom: 14,
                      }}>
                      <Text
                        numberOfLines={2}
                        style={{
                          fontSize: fontSize.body,
                          lineHeight: 20,
                          fontFamily: fontFamily.regular,
                          color: AINK.text,
                        }}>
                        {w.title}
                      </Text>
                    </View>
                    {/* honest progress: discrete step ticks + the raw
                        phrase; when steps are unknowable, a breathing dot
                        and the plain word "working" */}
                    <View
                      style={{
                        position: 'absolute',
                        left: 18,
                        right: 18,
                        bottom: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                      {w.progress ? (
                        <>
                          {/* mosaic block gauge (2026-07-22 "체크 패턴
                              살려서"): the check-pattern cells doing
                              honest discrete-step duty */}
                          <MosaicGauge
                            total={w.progress.total}
                            done={w.progress.done}
                          />
                          <Text
                            style={{ fontSize: 10, fontFamily: fontFamily.mono, color: AINK.dim }}>
                            {w.progress.phrase}
                          </Text>
                        </>
                      ) : w.working ? (
                        // steps unknowable: liquid light drifting left
                        // to right inside a gray glass tube — the
                        // 몽글몽글 blobs, progress direction, no pixels
                        <FlowBar />
                      ) : null}
                    </View>
                  </Pressable>
                ))}
                {/* NEXT UP, compact (2026-07-21): the future axis as a
                    card — ONE app mark + the soonest scheduled item,
                    its time pinned to the meta line. The full ledger
                    lives in the ROUTINES section below. */}
                <Pressable
                  onPress={() =>
                    nextUpRows[0] && router.push(`/chat/${nextUpRows[0].threadId}`)
                  }
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
                    tabWidth={flapW('nextup', 90)}
                    tabHeight={22}
                  />
                  <View style={{ height: 26, flexDirection: 'row', alignItems: 'center' }}>
                    <Text
                      onTextLayout={measureTitle('nextup')}
                      style={{
                        fontSize: 12,
                        fontFamily: fontFamily.mono,
                        letterSpacing: 0.3,
                        color: 'rgba(22,24,28,0.55)',
                      }}>
                      Next up
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      marginBottom: 14,
                    }}>
                    {nextUpRows[0] ? (
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
                          numberOfLines={2}
                          style={{
                            flexShrink: 1,
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
                        Nothing scheduled
                      </Text>
                    )}
                  </View>
                  {nextUpRows[0] ? (
                    // time meta lives BOTTOM-RIGHT (2026-07-22 "시간
                    // 부분은 바텀 오른쪽")
                    <View style={{ position: 'absolute', right: 18, bottom: 16 }}>
                      <Text
                        style={{ fontSize: 10, fontFamily: fontFamily.mono, color: AINK.dim }}>
                        {nextUpRows[0].when}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
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
              {AWAY_DIGEST.auto.length + AWAY_DIGEST.asked.length > 0 ? null : (
              <Animated.View
                entering={FadeInDown.duration(420).delay(360)}
                style={{
                  marginTop: 28,
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
                      borderTopWidth: lastActionOpen && idx > 0 ? 1 : 0,
                      borderTopColor: AINK.divider,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.sm,
                    }}>
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
                      borderTopWidth: 1,
                      borderTopColor: AINK.divider,
                      opacity: pressed ? 0.6 : 1,
                    })}>
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
                  rules after, every row a door to its home thread. */}
              <Animated.View
                entering={FadeInDown.duration(420).delay(480)}
                style={{
                  marginTop: 28,
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
                {/* the pattern IS the insight: what keeps needing you,
                    stated in the machine register (the crew cards'
                    role-tag voice, 2026-07-21) */}
                <Text
                  style={{
                    paddingHorizontal: 18,
                    marginTop: 14,
                    fontSize: 12,
                    fontFamily: fontFamily.mono,
                    letterSpacing: 0.3,
                    color: AINK.dim,
                  }}>
                  {trustHandled === 'allowed'
                    ? 'MORNING BRIEFING RUNS DAILY NOW'
                    : 'SUGGESTED RULE: INBOX SUMMARIES'}
                </Text>
                {nextUpRows.map((row, idx) => (
                  <View key={row.key}>
                    {idx > 0 ? (
                      <View
                        style={{ height: 1, marginHorizontal: 18, backgroundColor: AINK.divider }}
                      />
                    ) : null}
                    <Pressable
                      onPress={() => router.push(`/chat/${row.threadId}`)}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        paddingHorizontal: 18,
                        // the suggestion headline leads now, so the
                        // first row sits on the list rhythm, not 18
                        paddingTop: 14,
                        paddingBottom: 14,
                        opacity: pressed ? 0.5 : 1,
                      })}>
                      <Ionicons
                        name={NEXTUP_APP_ICON[row.app as keyof typeof NEXTUP_APP_ICON] ?? 'apps-outline'}
                        size={16}
                        color={AINK.dim}
                      />
                      <Text
                        numberOfLines={1}
                        style={{
                          flex: 1,
                          color: AINK.text,
                          fontSize: fontSize.body,
                          fontFamily: fontFamily.regular,
                        }}>
                        {row.name}
                      </Text>
                      {/* the future hook: a cadence for schedules, the
                          trigger for event rules — always mono */}
                      <Text style={{ fontSize: 10, fontFamily: fontFamily.mono, color: AINK.dim }}>
                        {row.when}
                      </Text>
                    </Pressable>
                  </View>
                ))}
                {/* the board's one exit to the ledger, in the door
                    grammar (survived the TASKS section it used to
                    live in) */}
                <Pressable
                  onPress={() => router.navigate('/(tabs)/chat')}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    alignSelf: 'flex-start',
                    paddingHorizontal: 18,
                    paddingTop: 6,
                    paddingBottom: 14,
                    opacity: pressed ? 0.5 : 1,
                  })}>
                  <Text style={{ fontSize: 10, fontFamily: fontFamily.mono, color: AINK.dim }}>
                    all activity
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={11}
                    color={AINK.dim}
                    style={{ marginLeft: 2 }}
                  />
                </Pressable>
              </Animated.View>

            </Animated.ScrollView>

          {/* Connection status popover (over the board) */}
            {statusOpen ? (
              <StatusPopover
                services={services}
                onClose={() => setStatusOpen(false)}
                onManageAccess={() => {
                  setStatusOpen(false);
                  router.push('/access?focus=issue');
                }}
                onOpenSettings={() => {
                  setStatusOpen(false);
                  router.push('/settings');
                }}
                topOffset={54}
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
            onPress={() => setConnected(true)}
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
    </SafeAreaView>
  );
}
