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
import Svg, { Defs, LinearGradient as SvgGradient, Path, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import Animated, {
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AUTOPILOT_RULES } from '@/mock/autopilot';
import { UNDOABLES } from '@/mock/undoables';
import { AuroraLine } from '@/components/ui/aurora-line';
import { Card } from '@/components/ui/card';
import { GlassIconButton } from '@/components/ui/glass-icon-button';
import { BlissSwooshBg } from '@/components/ui/bliss-swoosh-bg';
import { ColorPanelsBg } from '@/components/ui/color-panels-bg';
import { AutopilotSheet } from '@/components/ui/autopilot-sheet';
import { CTA_SLAB_INK, CtaSlabFill } from '@/components/ui/cta-slab';
import { AcidGlassFill } from '@/components/ui/window-fill';
import { AnalogKey, KeySheen } from '@/components/ui/analog-key';
import { PixelChrome } from '@/components/ui/pixel-chrome';
import { PixelText } from '@/components/ui/pixel-text';
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
    confirmDinner,
    resolveApproval,
    createThread,
    sendMessage,
  } = useAppStore();
  const { width: screenW } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentW = screenW - spacing.lg * 2; // screen padding is spacing.lg each side

  // Connection status popover (tap the "Online" label to inspect services).
  const [statusOpen, setStatusOpen] = useState(false);
  // 3-state tabs on the dark board: which shelf is on screen
  const [homeTab, setHomeTab] = useState<'all' | 'running' | 'needsYou' | 'done'>('all');
  const worst = worstServiceState(services);
  const statusDot: string =
    worst === 'down' ? sysColor.fail : worst === 'degraded' ? sysColor.degraded : sysColor.ready;

  const startChat = () => router.push(`/chat/${createThread()}`);
  const openThread = (id: string) => router.push(`/chat/${id}`);

  // Scroll-to-approvals (the charcoal count tile jumps here).
  const scrollRef = useRef<ScrollView>(null);
  // Ask bar shrinks to a mic circle while reading (scroll down),
  // expands back on scroll-up or when the list comes to rest —
  // present but out of the way, Gmail-compose style.
  const askCollapse = useSharedValue(0);
  const lastScrollY = useSharedValue(0);
  const onBoardScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      const y = e.contentOffset.y;
      const dy = y - lastScrollY.value;
      if (y > 60 && dy > 4) {
        askCollapse.value = withTiming(1, { duration: 220 });
      } else if (dy < -4 || y <= 60) {
        askCollapse.value = withTiming(0, { duration: 220 });
      }
      lastScrollY.value = y;
    },
    onEndDrag: (e) => {
      // finger lifted with no fling to follow -> at rest, expand
      if (Math.abs(e.velocity?.y ?? 0) < 0.3) {
        askCollapse.value = withTiming(0, { duration: 220 });
      }
    },
    onMomentumEnd: () => {
      askCollapse.value = withTiming(0, { duration: 220 });
    },
  });
  const askBarStyle = useAnimatedStyle(() => ({
    // right edge stays anchored; the bar narrows into a 52pt key.
    // NOT full-bleed (2026-07-16 "반보다는 길게"): it's a button, not
    // a divider — anchored right at ~62% width so the list stays
    // visible beside it
    width: interpolate(askCollapse.value, [0, 1], [Math.round(screenW * 0.62), 52]),
  }));
  const askRowStyle = useAnimatedStyle(() => ({
    paddingLeft: interpolate(askCollapse.value, [0, 1], [16, 7]),
  }));
  const askSlashStyle = useAnimatedStyle(() => ({
    width: interpolate(askCollapse.value, [0, 1], [32, 0]),
    opacity: interpolate(askCollapse.value, [0, 0.5], [1, 0]),
  }));
  // two skins crossfade with the collapse (2026-07-16 "펼쳐질때는
  // 투명한, 접혔을땐 버튼"): expanded = the writable glass FIELD,
  // collapsed = the analog KEYCAP
  const askFieldSkin = useAnimatedStyle(() => ({
    opacity: interpolate(askCollapse.value, [0, 1], [1, 0]),
  }));
  const askKeySkin = useAnimatedStyle(() => ({
    opacity: askCollapse.value,
  }));
  const askHintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(askCollapse.value, [0, 0.5], [1, 0]),
  }));
  const [approvalsY, setApprovalsY] = useState(0);
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
  const [autopilotOpen, setAutopilotOpen] = useState(false);
  // which dinner slot was answered from the hero card (receipt stamp)
  const [dinnerAnswered, setDinnerAnswered] = useState<string | null>(null);
  // Accepting the pattern suggestion (YOUR TURN or the sheet) does one
  // real thing: the habit becomes a schedule with its own thread.
  const acceptMorningRoutine = () => {
    setTrustHandled('allowed');
    addRoutine({
      name: 'Morning briefing',
      cadence: '8 AM daily',
      threadId: 't4',
      permissionKey: 'gmail',
      scope: 'READ',
      runs: 0,
    });
  };
  const undoAction = (u: (typeof UNDOABLES)[number]) => {
    setLastActionOpen(false);
    sendMessage(u.threadId, u.ask);
    router.push(`/chat/${u.threadId}`);
  };
  const scrollToApprovals = () => scrollRef.current?.scrollTo({ y: approvalsY, animated: true });

  // The greeting speaks: the orchestrator's status line, terse and
  // count-first. A sentence, not a badge row.
  const runningCount = background.filter((t) => t.state === 'running').length;
  const needsYou = background.filter((t) => t.state === 'waiting').length + approvals.length;
  // Done shelf = threads that actually CLOSED (delivered or expired).
  // Open conversations live on the desk above, not here.
  const doneThreads = threads.filter((t) => t.outcome);

  // Rows for the list container, priority top to bottom; stale asks
  // (age in days) sink to the end. Approvals ARE "needs you".
  const activeRows =
    homeTab === 'done'
      ? []
      : [
          ...background
            .filter((t) =>
              homeTab === 'all'
                ? true
                : homeTab === 'running'
                  ? t.state === 'running'
                  : t.state === 'waiting'
            )
            .map((t) => ({
              key: t.id,
              label: t.label,
              waiting: t.state === 'waiting',
              deadline: t.deadline,
              age: t.age,
              onPress: () => router.push(`/chat/${t.threadId}`),
            })),
          ...(homeTab === 'all' || homeTab === 'needsYou'
            ? approvals.map((a) => ({
                key: a.id,
                label: a.title,
                waiting: true,
                deadline: undefined as string | undefined,
                age: a.age,
                onPress: () => a.threadId && router.push(`/chat/${a.threadId}`),
              }))
            : []),
        ].sort(
          (a, b) =>
            Number(a.age?.endsWith('d') ?? false) - Number(b.age?.endsWith('d') ?? false)
        );
  const visibleDone = homeTab === 'all' || homeTab === 'done' ? doneThreads : [];

  // Live focus for the dashboard widgets: the one running task (real-time
  // pulse) and the front of the needs-you queue (the next action).
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
    ...approvals.map((a) => ({
      label: a.title,
      suffix: a.age === 'now' ? undefined : a.age,
      aged: a.age?.endsWith('d') ?? false,
      threadId: a.threadId,
    })),
  ].sort((a, b) => Number(a.aged) - Number(b.aged))[0];

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
          {/* wash preset (2026-07-16): the fan flattened full-screen so
              every window — YOUR TURN at the top, the task list at the
              bottom — gets the same subtle turning light behind its
              glass; the mid-screen-only fan made outer sections read
              opaque. Other tabs keep the fan for now. */}
          <ColorPanelsBg variant="deskWash" preset="wash" />
          {/* no veil: the aqua desktop shows at full strength; the
              silver windows carry legibility (fullback: white 0.1) */}
          <View style={{ flex: 1 }}>
            <Animated.ScrollView
              ref={scrollRef}
              onScroll={onBoardScroll}
              scrollEventThrottle={16}
              contentContainerStyle={{ padding: spacing.lg, paddingBottom: 190 }}
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
                {/* status = the glass stamp stretched into a slim bar
                    (greeting retired 2026-07-16) — a blank ANALOG KEY on
                    the desk: beveled edges (lit top, inked bottom), a
                    sheen on the upper face, and a press that physically
                    sinks. Same glass palette as the section windows.
                    Tap opens System Status; warning states fill it. */}
                <Pressable
                  onPress={() => setStatusOpen(true)}
                  hitSlop={12}
                  style={({ pressed }) => ({
                    width: 84,
                    height: 22,
                    borderRadius: 0,
                    overflow: 'hidden',
                    backgroundColor:
                      worst === 'down' || worst === 'degraded'
                        ? statusDot
                        : statusOpen
                          ? 'rgba(255,255,255,0.92)'
                          : pressed
                            ? 'rgba(255,255,255,0.5)'
                            : 'rgba(255,255,255,0.62)',
                    borderWidth: 1,
                    borderTopColor: 'rgba(255,255,255,0.95)',
                    borderLeftColor: 'rgba(255,255,255,0.8)',
                    borderRightColor: 'rgba(255,255,255,0.6)',
                    borderBottomColor: 'rgba(22,24,28,0.25)',
                    shadowColor: '#16181C',
                    shadowOpacity: pressed ? 0.08 : 0.18,
                    shadowRadius: pressed ? 1.5 : 3,
                    shadowOffset: { width: 0, height: pressed ? 1 : 2 },
                    transform: [{ translateY: pressed ? 1 : 0 }],
                  })}>
                  {/* the key's curved face: brighter upper half */}
                  <View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 9,
                      backgroundColor: 'rgba(255,255,255,0.4)',
                    }}
                  />
                </Pressable>
              </View>

              {/* ── Control-tower dashboard: the trust cycle as a board.
                  YOUR TURN asks (pre-action), RUNNING shows delegation
                  at work, TRUST calibrates what stops needing approval,
                  LAST ACTION below undoes what went through. Every
                  approval feeds TRUST; TRUST slims YOUR TURN; undo makes
                  the added autonomy safe. ── */}
              {nextAsk ? (
                // board entrance: each section floats in softly, top to
                // bottom (FadeInDown, 120ms stagger), on connect/mount
                <Animated.View
                  entering={FadeInDown.duration(420)}
                  style={{ marginTop: 28 }}>
                <Pressable
                  onPress={() => router.push('/chat/t1')}
                  style={({ pressed }) => ({
                    borderRadius: 0,
                    overflow: 'hidden',
                    // the pixel frame replaces the white hairline on
                    // this ONE window — the ask wears the mascot's ink
                    paddingHorizontal: 18,
                    paddingBottom: 18,
                    shadowColor: '#16181C',
                    shadowOpacity: 0.07,
                    shadowRadius: 16,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 5,
                    opacity: pressed ? 0.85 : 1,
                  })}>
                  {/* keyed: this card also changes height when the
                      proposal resolves or the window folds */}
                  <AcidGlassFill
                    key="yourturn"
                    effect="clear"
                    bright
                    tone="gray"
                    accentBar
                  />
                  <PixelChrome />
                  <View
                    style={{
                      height: 26,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text
                        style={{
                          fontSize: 11,
                          fontFamily: fontFamily.mono,
                          letterSpacing: 0.3,
                          color: 'rgba(22,24,28,0.55)',
                        }}>
                        YOUR TURN
                      </Text>
                    </View>
                    {needsYou - 1 > 0 ? (
                      <Pressable
                        onPress={() => {
                          setHomeTab('needsYou');
                          scrollRef.current?.scrollTo({ y: approvalsY, animated: true });
                        }}
                        hitSlop={16}>
                        <PixelText text={`+${needsYou - 1} MORE`} color={AINK.dim} />
                      </Pressable>
                    ) : null}
                  </View>
                  {/* ONLY blocking asks live here: work YOU started that
                      is now waiting on an answer, so it survives you
                      wandering off. The pills preview the choice from
                      that conversation (max two); tapping any of them
                      simply returns you there to answer in context. */}
                  <Text
                    numberOfLines={1}
                    style={{
                      marginTop: 14,
                      fontSize: fontSize.body,
                      // Home-body trial voice: futuristic-clean grotesk
                      fontFamily: fontFamily.medium,
                      color: AINK.text,
                    }}>
                    Dinner with Jenna — which time?
                  </Text>
                  {dinnerAnswered ? (
                    <Text
                      style={{
                        marginTop: 14,
                        fontFamily: fontFamily.mono,
                        fontSize: 12,
                        color: AINK.dim,
                      }}>
                      {`✓ Booked ${dinnerAnswered}`}
                    </Text>
                  ) : (
                  <View
                    style={{
                      marginTop: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                    }}>
                    {/* v4 (2026-07-16, "우리가 쓴것중에서 깔끔하고
                        심플한걸로") — the app's ONE established simple
                        button: the analog keycap (status bar / >_ /
                        Info-Perf / chat +), not a new invented shape.
                        Slots match Use Case A's script exactly: "Jenna
                        is free at 5:00, 6:30, or 7:00." */}
                    {['5:00', '6:30'].map((slot) => (
                      <AnalogKey
                        key={slot}
                        onPress={() => {
                          // the tap IS the answer: it lands in the thread
                          // first, then we arrive to watch it confirm
                          setDinnerAnswered(slot);
                          confirmDinner(slot);
                          router.push('/chat/t1');
                        }}
                        style={{ paddingVertical: 9, paddingHorizontal: 17 }}>
                        <Text style={{ fontSize: 13, fontWeight: fontWeight.semibold, color: CTA_SLAB_INK }}>
                          {slot}
                        </Text>
                      </AnalogKey>
                    ))}
                    <Pressable
                      onPress={() => router.push('/chat/t1')}
                      hitSlop={8}
                      style={({ pressed }) => ({
                        paddingVertical: 9,
                        opacity: pressed ? 0.5 : 1,
                      })}>
                      <Text style={{ fontSize: 13, color: AINK.dim }}>Other</Text>
                    </Pressable>
                  </View>
                  )}
                </Pressable>
                </Animated.View>
              ) : null}

              <Animated.View
                entering={FadeInDown.duration(420).delay(120)}
                style={{
                  flexDirection: 'row',
                  gap: 12,
                  marginTop: 28,
                }}>
                {/* AUTOPILOT: the calibration gauge. The card is only the
                    gauge face; tapping opens the ledger as a bottom sheet
                    (the board never reflows). Proposals queue in YOUR
                    TURN, never here. */}
                <Pressable
                  onPress={() => setAutopilotOpen(true)}
                  style={({ pressed }) => ({
                    flex: 1,
                    height: 124,
                    borderRadius: 0,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.55)',
                    paddingHorizontal: 18,
                    paddingBottom: 18,
                    shadowColor: '#16181C',
                    shadowOpacity: 0.07,
                    shadowRadius: 16,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 5,
                    opacity: pressed ? 0.85 : 1,
                  })}>
                  <AcidGlassFill effect="clear" bright tone="gray" />
                  <View
                    style={{
                      height: 26,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text
                        style={{
                          fontSize: 11,
                          fontFamily: fontFamily.mono,
                          letterSpacing: 0.3,
                          color: 'rgba(22,24,28,0.55)',
                        }}>
                        ROUTINES
                      </Text>
                    </View>
                  </View>

                    {/* same skeleton as the RUNNING card: centered title
                        with the footer margin reserved, footer row pinned
                        to the same bottom line as "2 of 4 sites" */}
                    <View style={{ flex: 1, justifyContent: 'center', marginBottom: 14 }}>
                      {/* the pattern IS the insight: one line saying what
                          kept needing you. Numbers and the fix live one
                          tap deeper, in the sheet. */}
                      <Text
                        numberOfLines={2}
                        style={{
                          fontSize: fontSize.body,
                          lineHeight: 20,
                          fontFamily: fontFamily.regular,
                          color: AINK.text,
                        }}>
                        {trustHandled === 'allowed'
                          ? 'Morning briefing runs daily now'
                          : 'You keep asking for inbox summaries'}
                      </Text>
                    </View>
                    <View
                      style={{
                        position: 'absolute',
                        left: 18,
                        bottom: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}>
                      <Text style={{ fontSize: 10, fontFamily: fontFamily.mono, color: AINK.dim }}>
                        {/* one umbrella word: rules + schedules are both
                            just the agent acting without you */}
                        {`${AUTOPILOT_RULES.length + schedules.length} routines`}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={11}
                        color={AINK.dim}
                        style={{ marginLeft: 2 }}
                      />
                    </View>
                </Pressable>
                {(
                  [
                    {
                      key: 'running',
                      label: 'RUNNING',
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
                      borderRadius: 0,
                      overflow: 'hidden',
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.55)',
                      paddingHorizontal: 18,
                      paddingBottom: 18,
                      shadowColor: '#16181C',
                      shadowOpacity: 0.07,
                      shadowRadius: 16,
                      shadowOffset: { width: 0, height: 6 },
                      elevation: 5,
                      opacity: pressed ? 0.85 : 1,
                    })}>
                    <AcidGlassFill effect="clear" bright tone="gray" />
                    <View style={{ height: 26, flexDirection: 'row', alignItems: 'center' }}>
                      <Text
                        style={{
                          fontSize: 11,
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
                        onPress={() => {
                          setHomeTab(w.filter);
                          scrollRef.current?.scrollTo({ y: approvalsY, animated: true });
                        }}
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
                          {/* pixel block gauge: chunky 8pt cells in the
                              crew-pixel ink language — same honest
                              discrete steps, retro loading-bar body */}
                          <View style={{ flexDirection: 'row', gap: 3 }}>
                            {Array.from({ length: w.progress.total }, (_, i) => (
                              <View
                                key={i}
                                style={{
                                  width: 8,
                                  height: 8,
                                  backgroundColor:
                                    i < w.progress!.done
                                      ? 'rgba(22,24,28,0.6)'
                                      : 'rgba(22,24,28,0.12)',
                                }}
                              />
                            ))}
                          </View>
                          <Text
                            style={{ fontSize: 10, fontFamily: fontFamily.mono, color: AINK.dim }}>
                            {w.progress.phrase}
                          </Text>
                        </>
                      ) : w.working ? (
                        <>
                          <RunningDot color="rgba(22,24,28,0.35)" size={5} />
                          <Text
                            style={{ fontSize: 10, fontFamily: fontFamily.mono, color: AINK.dim }}>
                            working
                          </Text>
                        </>
                      ) : null}
                    </View>
                  </Pressable>
                ))}
              </Animated.View>

              {/* post-action control: the agent's most recent write
                  action stays undoable here instead of scrolling away
                  in chat. "+N more" expands the card in place into the
                  full undoable queue; the descending minutes column
                  explains itself, no caption needed. */}
              <Animated.View
                entering={FadeInDown.duration(420).delay(240)}
                style={{
                  marginTop: 28,
                  borderRadius: 0,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.55)',
                  paddingHorizontal: 18,
                  paddingBottom: 18,
                  shadowColor: '#16181C',
                  shadowOpacity: 0.07,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 5,
                }}>
                {/* keyed so the native glass layer remounts at the new
                    size when the card expands/collapses */}
                <AcidGlassFill
                  key={lastActionOpen ? 'expanded' : 'collapsed'}
                  effect="clear"
                  bright
                  tone="gray"
                />
                <View
                  style={{
                    height: 26,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text
                      style={{
                        fontSize: 11,
                        fontFamily: fontFamily.mono,
                        letterSpacing: 0.3,
                        color: 'rgba(22,24,28,0.55)',
                      }}>
                      LAST ACTION
                    </Text>
                  </View>
                  {lastActionOpen ? (
                    <Pressable hitSlop={16} onPress={() => setLastActionOpen(false)}>
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
                    <Text
                      numberOfLines={1}
                      style={{
                        flex: 1,
                        fontSize: fontSize.body,
                        fontFamily: fontFamily.regular,
                        color: AINK.text,
                      }}>
                      {u.label}
                    </Text>
                    {/* secondary by design: undo is the rare path.
                        Pressing it speaks to the executor in the
                        original thread. */}
                    <Pressable
                      hitSlop={8}
                      onPress={() => undoAction(u)}
                      style={({ pressed }) => ({
                        // secondary by design: quiet gray, not accent —
                        // undo is the rare path and should not compete
                        // with the blue action slabs above (square like
                        // the rest of the board, color unchanged)
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
                          color: 'rgba(22,24,28,0.65)',
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
                    <Text style={{ fontSize: 12, color: AINK.dim }}>
                      Older actions? Just ask your crew.
                    </Text>
                  </Pressable>
                ) : null}
              </Animated.View>

              {/* one glass section: filter chips as the header, then
                  every chat hangs off the thread rail below. Priority
                  reads top to bottom. */}
              {activeRows.length + visibleDone.length > 0 ? (
                <Animated.View
                  entering={FadeInDown.duration(420).delay(360)}
                  onLayout={(e) => setApprovalsY(e.nativeEvent.layout.y)}
                  style={{
                    marginTop: 28,
                    borderRadius: 0,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.55)',
                    shadowColor: '#16181C',
                    shadowOpacity: 0.07,
                    shadowRadius: 16,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 5,
                  }}>
                  {/* tall card: 'regular' frost avoids clear-glass edge
                      lensing showing as a dark band at the bottom;
                      denser veil for the text-heavy list */}
                  {/* keyed so the native glass layer remounts whenever
                      the list's height changes (tab switch, rows aging
                      in/out) — otherwise the fill keeps its old size
                      and a hard edge shows near the bottom rows */}
                  <AcidGlassFill
                    key={`list-${homeTab}-${activeRows.length}-${visibleDone.length}`}
                    effect="clear"
                    tone="gray"
                  />
                  {/* filter chips: the section's own header, like a
                      chat list's filter row */}
                  <View
                    style={{
                      // the Settings windows' 30pt title bar, everywhere
                      height: 26,
                      flexDirection: 'row',
                      gap: 18,
                      paddingHorizontal: 18,
                    }}>
                    {/* sorting = navigation, so it wears TAB grammar
                        (text + underline), never the pill grammar that
                        buttons own — the two must stay distinguishable */}
                    {(
                      [
                        ['all', 'All', runningCount + needsYou + doneThreads.length],
                        ['running', 'Running', runningCount],
                        ['needsYou', 'Your turn', needsYou],
                        ['done', 'Done', doneThreads.length],
                      ] as const
                    ).map(([key, label, count]) => (
                      <Pressable
                        key={key}
                        onPress={() => setHomeTab(key)}
                        hitSlop={12}
                        style={({ pressed }) => ({
                          justifyContent: 'center',
                          opacity: pressed ? 0.6 : 1,
                        })}>
                        <Text
                          style={{
                            fontSize: 11,
                            fontFamily: fontFamily.monoMedium,
                            letterSpacing: 0.3,
                            color: homeTab === key ? '#16181C' : 'rgba(22,24,28,0.5)',
                          }}>
                          {`${label.toUpperCase()} ${count}`}
                        </Text>
                        {/* the indicator IS the sill: a straight segment
                            of the title bar's own bottom line lights up
                            under the active tab (never a second line) */}
                        {homeTab === key ? (
                          <View
                            style={{
                              position: 'absolute',
                              left: 0,
                              right: 0,
                              bottom: 0,
                              height: 2,
                              backgroundColor: sysColor.accent,
                            }}
                          />
                        ) : null}
                      </Pressable>
                    ))}
                  </View>
                  {activeRows.map((row, idx) => {
                    const aged = row.age?.endsWith('d') ?? false;
                    return (
                      <View key={row.key}>
                        {idx > 0 ? (
                          <View
                            style={{
                              height: 1,
                              marginHorizontal: 18,
                              backgroundColor: AINK.divider,
                            }}
                          />
                        ) : null}
                        <Pressable
                          onPress={row.onPress}
                          style={({ pressed }) => ({
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: spacing.sm,
                            paddingHorizontal: 18,
                            paddingVertical: 11,
                            opacity: pressed ? 0.5 : aged ? 0.5 : 1,
                          })}>
                          {/* state cell zone (2026-07-16 "픽셀스타일"):
                              the round dots became 8×8 pixel cells, the
                              same block the RUNNING gauge uses — teal =
                              your turn, pulse = running, dim = resting */}
                          <View
                            style={{ width: 13, alignItems: 'flex-start', justifyContent: 'center' }}>
                            {row.waiting && !aged ? (
                              <View
                                style={{
                                  width: 8,
                                  height: 8,
                                  backgroundColor: sysColor.action,
                                }}
                              />
                            ) : !row.waiting ? (
                              // every state cell shares the gauge's 8px
                              // body; only color and motion differ
                              <RunningDot color="rgba(22,24,28,0.35)" size={8} square />
                            ) : (
                              <View
                                style={{
                                  width: 8,
                                  height: 8,
                                  backgroundColor: 'rgba(22,24,28,0.22)',
                                }}
                              />
                            )}
                          </View>
                          <Text
                            numberOfLines={1}
                            style={{
                              flex: 1,
                              color: AINK.text,
                              fontSize: fontSize.body,
                              // one flat weight: in the list only the
                              // ACTIVE TAB gets emphasis; rows never
                              // shout (user call 2026-07-14)
                              fontFamily: fontFamily.regular,
                            }}>
                            {row.label}
                          </Text>
                          {/* right column: always time, in every tab —
                              the list reads chronological at a glance */}
                          <Text
                            style={{ fontSize: 10, fontFamily: fontFamily.mono, color: AINK.dim }}>
                            {row.age ?? row.deadline ?? 'now'}
                          </Text>
                        </Pressable>
                      </View>
                    );
                  })}
                  {visibleDone.map((t, idx) => (
                    <View key={t.id}>
                      {idx > 0 || activeRows.length > 0 ? (
                        <View
                          style={{
                            height: 1,
                            marginHorizontal: 18,
                            backgroundColor: AINK.divider,
                          }}
                        />
                      ) : null}
                      <Pressable
                        onPress={() => openThread(t.id)}
                        style={({ pressed }) => ({
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: spacing.sm,
                          paddingHorizontal: 18,
                          paddingVertical: 11,
                          opacity: pressed ? 0.5 : t.outcome === 'expired' ? 0.6 : 1,
                        })}>
                        {/* no state mark on closed rows, so no reserved
                            column either — text starts flush (2026-07-16) */}
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text
                              numberOfLines={1}
                              style={{
                                flexShrink: 1,
                                color: AINK.text,
                                fontSize: fontSize.body,
                                fontFamily: fontFamily.regular,
                              }}>
                              {t.title}
                            </Text>
                          </View>
                          <Text
                            numberOfLines={1}
                            style={{ color: AINK.dim, fontSize: fontSize.caption, marginTop: 3 }}>
                            {t.lastPreview}
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontSize: 10,
                            fontFamily: fontFamily.mono,
                            color: AINK.dim,
                          }}>
                          {t.outcome === 'expired' ? 'expired' : t.updatedAt}
                        </Text>
                      </Pressable>
                    </View>
                  ))}
                  {/* door to Activity in the BOARD's own door grammar
                      (2026-07-16 "이런 규칙으로" = the ROUTINES window's
                      "5 routines ›"): quiet bottom-left mono meta with
                      an inline chevron — not the sheet's full-width row */}
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
              ) : null}
            </Animated.ScrollView>

          {/* Connection status popover (over the board) */}
            {statusOpen ? (
              <StatusPopover
                services={services}
                agentsReady={crew.filter((m) => m.active).length}
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

            {/* floating ask bar: the one chat entry, pinned above the
                tab bar. The section windows' own glass material with a
                white hairline; no ring (2026-07-12). The slash chip
                hints at commands (undo, pause, status) to come. */}
            <Animated.View
              pointerEvents="box-none"
              style={[
                {
                  position: 'absolute',
                  right: 10,
                  bottom: 90,
                  shadowColor: '#16181C',
                  shadowOpacity: 0.18,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: 8,
                },
                askBarStyle,
              ]}>
              <Pressable
                onPress={() => openNewChat()}
                style={({ pressed }) => ({
                  height: 52,
                  borderRadius: 0,
                  overflow: 'hidden',
                  opacity: pressed ? 0.85 : 1,
                })}>
                {/* blur under both skins: the bar floats over list
                    text — without it the rows bleed through */}
                {GLASS_AVAILABLE ? (
                  <GlassView
                    glassEffectStyle="clear"
                    colorScheme="light"
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                  />
                ) : null}
                {/* FIELD skin (expanded): the writable glass panel */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      backgroundColor: 'rgba(255,255,255,0.62)',
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.55)',
                    },
                    askFieldSkin,
                  ]}
                />
                {/* KEYCAP skin (collapsed): bevel + sheen */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      backgroundColor: 'rgba(255,255,255,0.62)',
                      borderWidth: 1,
                      borderTopColor: 'rgba(255,255,255,0.95)',
                      borderLeftColor: 'rgba(255,255,255,0.8)',
                      borderRightColor: 'rgba(255,255,255,0.6)',
                      borderBottomColor: 'rgba(22,24,28,0.25)',
                    },
                    askKeySkin,
                  ]}>
                  <KeySheen />
                </Animated.View>
                <Animated.View
                  style={[
                    {
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingRight: 7,
                    },
                    askRowStyle,
                  ]}>
                  {/* pill anatomy, app-wide: command on the LEFT ("/"
                      here, "+" in chat), voice circle on the RIGHT that
                      becomes send once you type — right thumb talks,
                      left hand commands. Slash chip + hint melt away
                      as the bar shrinks to its mic circle. */}
                  <Animated.View
                    style={[
                      {
                        overflow: 'hidden',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                      },
                      askSlashStyle,
                    ]}>
                    <Pressable
                      hitSlop={14}
                      onPress={() => openNewChat('undo ')}
                      style={({ pressed }) => ({
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        backgroundColor: 'rgba(59,118,196,0.12)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: pressed ? 0.6 : 1,
                      })}>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: fontWeight.semibold,
                          color: sysColor.accent,
                        }}>
                        /
                      </Text>
                    </Pressable>
                  </Animated.View>
                  <Animated.Text
                    numberOfLines={1}
                    style={[
                      {
                        flex: 1,
                        fontSize: fontSize.body,
                        fontFamily: fontFamily.regular,
                        color: 'rgba(22,24,28,0.55)',
                      },
                      askHintStyle,
                    ]}>
                    What needs doing?
                  </Animated.Text>
                  <Pressable
                    hitSlop={8}
                    onPress={() => openNewChat()}
                    style={({ pressed }) => ({
                      // bare glyph, no chip — the filled cyan circle was
                      // too bright for the quiet console; the mic itself
                      // carries the color, same register as the rim light
                      width: 38,
                      height: 38,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: pressed ? 0.6 : 1,
                    })}>
                    <Ionicons name="mic" size={21} color={sysColor.accent} />
                  </Pressable>
                </Animated.View>
              </Pressable>
            </Animated.View>


          </View>

          <AutopilotSheet
            visible={autopilotOpen}
            onClose={() => setAutopilotOpen(false)}
            routine={
              trustHandled === 'allowed' ? 'set' : trustHandled === 'kept' ? 'dismissed' : 'none'
            }
            onSetRoutine={acceptMorningRoutine}
            onNotNow={() => setTrustHandled('kept')}
            summary="Handled 17 things without you"
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
