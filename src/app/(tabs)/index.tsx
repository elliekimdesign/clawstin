import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuroraLine } from '@/components/ui/aurora-line';
import { Card } from '@/components/ui/card';
import { GlassIconButton } from '@/components/ui/glass-icon-button';
import { BlissSwooshBg } from '@/components/ui/bliss-swoosh-bg';
import { AcidSwooshBg } from '@/components/ui/acid-swoosh-bg';
import { PromptHistorySheet } from '@/components/ui/prompt-history-sheet';
import { PulseMark } from '@/components/ui/pulse-mark';
import { StatusPopover, worstServiceState } from '@/components/ui/status-popover';
import { TOOL_ACTION_PHRASE, useAppStore } from '@/store/app-store';
import {
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  radius,
  shadow,
  spacing,
  sysColor,
} from '@/theme/theme';

const USER_NAME = 'Ellie';

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

/** The V Acid Pop card material: liquid-glass blur under a translucent
 * white veil (0.35 -> 0.18, the field whispers through) with a thin rim
 * light along the top edge. Fill for any rounded overflow-hidden card.
 * effect: 'clear' shows the liquid lens (small cards); 'regular' is a
 * uniform frost for tall cards where clear's edge lensing reads as a
 * dark band; 'none' = veil only. */
function AcidGlassFill({
  effect = 'clear',
  dense = false,
  bright = false,
}: {
  effect?: 'clear' | 'regular' | 'none';
  /** denser veil for text-heavy cards (the list): more legible, still
   * one step lighter than the original 0.6/0.5/0.45 */
  dense?: boolean;
  /** one notch more white than dense: the dashboard cards, where the
   * small labels need the extra contrast */
  bright?: boolean;
}) {
  // soap-bubble veil: flat, membrane-like — barely darker at the foot,
  // so the surface reads as one smooth film over the blur
  // dashboard tier sits flatter and more solid (pastel-card feel);
  // the list keeps its clearer glass
  // dense (the list) sits between clear glass and the solid dashboard:
  // enough color to stand off the field, still lighter than the cards
  const veil = bright ? [0.85, 0.82, 0.8] : [0.22, 0.16, 0.12];
  return (
    <>
      {GLASS_AVAILABLE && effect !== 'none' ? (
        <GlassView
          glassEffectStyle={effect}
          colorScheme="light"
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}
      {dense ? (
        // the list: the dashboard cards' mid pastel laid perfectly
        // flat — one plain plane, paler, no gradient, no sheen
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none" preserveAspectRatio="none">
          <Rect x="0" y="0" width="100%" height="100%" fill="#EAEDD6" fillOpacity={0.68} />
        </Svg>
      ) : (
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none" preserveAspectRatio="none">
        <Defs>
          {/* pastel-card veil: pale yellow-green in the field's own
              family (not white, not mint) so sections read as solid
              soft cards cut from the same cloth as the background.
              2026-07-08 pm pop pass: one micro step brighter + more
              lime (fullback: #E6EDB8 / #DBE5A2 / #CEDA8C) */}
          <SvgGradient id="acidveil" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#F1F7C9" stopOpacity={veil[0]} />
            <Stop offset="55%" stopColor="#EAF3B7" stopOpacity={veil[1]} />
            <Stop offset="100%" stopColor="#E1ECA6" stopOpacity={veil[2]} />
          </SvgGradient>
          {/* whisper of internal light: the bubble's curvature, not an edge */}
          <SvgGradient id="acidsheen" x1="0" y1="0" x2="0.85" y2="0.9">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.08} />
            <Stop offset="45%" stopColor="#FFFFFF" stopOpacity={0.02} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </SvgGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#acidveil)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#acidsheen)" />
      </Svg>
      )}
    </>
  );
}

// Post-action control mock: the agent's most recent [WRITE] action and
// its rollback window. Trust = approvals (before) + undo (after).
const LAST_ACTION = {
  label: 'Archived 12 newsletter emails',
  ago: '2m ago',
  // t1 = Inbox cleanup: the thread whose crew actually ran the action.
  // Undo always routes back to its executor's thread.
  threadId: 't1',
};

// Recent [WRITE] actions, newest first. Each knows its executor thread;
// the keywords route free-form undo asks. No visible time windows: the
// user-facing rule is "actions can be undone; if one can't, the crew
// says so right there" (the past-undo ask will arrive as a popup later).
const UNDOABLES = [
  {
    label: 'Archived 12 newsletter emails',
    threadId: 't1',
    ask: 'Undo this: archived 12 newsletter emails',
    re: /archiv|email|newsletter/i,
  },
  {
    label: 'Held 2 dinner slots for Friday',
    threadId: 't5',
    ask: 'Undo this: held 2 dinner slots',
    re: /dinner|slot|hold/i,
  },
  {
    label: 'Labeled 6 GitHub notifications',
    threadId: 't4',
    ask: 'Undo this: labeled 6 GitHub notifications',
    re: /github|label|notification/i,
  },
];

// Autopilot ledger mock: what each auto-approved rule has been doing.
// The gauge earns trust by showing receipts; "undone" is the honest
// counter-metric (an autopilot that never gets undone is working).
const AUTOPILOT_RULES = [
  {
    name: 'Contact merges',
    runs: 47,
    undone: 0,
    recent: [
      { label: 'Merged 3 dupes "Josh P."', ago: '2h', undone: false },
      { label: 'Merged 2 dupes "Sarah L."', ago: '1d', undone: false },
    ],
  },
  {
    name: 'Newsletter archiving',
    runs: 31,
    undone: 1,
    recent: [
      { label: 'Archived 12 emails', ago: '2m', undone: false },
      { label: 'Archived 8 emails', ago: '1d', undone: true },
    ],
  },
  {
    name: 'GitHub labeling',
    runs: 12,
    undone: 0,
    recent: [{ label: 'Labeled 6 notifs', ago: '4m', undone: false }],
  },
];

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

// Ink for the acid glass surfaces (light field): dark olive text, quiet
// hairlines, and state colors deep enough to hold contrast on pale glass.
const AINK = {
  text: '#16241B',
  dim: 'rgba(22,36,27,0.55)',
  divider: 'rgba(22,36,27,0.08)',
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
function RunningDot({ color = GLASS.blue, size = 7 }: { color?: string; size?: number }) {
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
      style={[{ width: size, height: size, borderRadius: 999, backgroundColor: color }, style]}
    />
  );
}

/** Donut ring in the army fade: the filled arc sweeps clockwise from
 * 12 o'clock over a quiet track, same palette as the progress strips. */
function TrustDonut({ pct, size = 34, stroke = 9 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <Svg width={size} height={size}>
      <Defs>
        <SvgGradient id="donutgrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#46583B" />
          <Stop offset="1" stopColor="#93A181" />
        </SvgGradient>
      </Defs>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="rgba(22,36,27,0.1)"
        strokeWidth={stroke}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="url(#donutgrad)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${c * pct} ${c}`}
        fill="none"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
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
    borderRadius: 18,
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

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function greeting(hour: number) {
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
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
  const statusLabel = worst === 'down' ? 'Issue' : worst === 'degraded' ? 'Degraded' : 'Online';

  const now = new Date();
  const hello = greeting(now.getHours());
  const dateLabel = `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`;

  const startChat = () => router.push(`/chat/${createThread()}`);
  const openThread = (id: string) => router.push(`/chat/${id}`);

  // Scroll-to-approvals (the charcoal count tile jumps here).
  const scrollRef = useRef<ScrollView>(null);
  const [approvalsY, setApprovalsY] = useState(0);
  // measured so the ask bar's gradient rim SVG can be drawn at exact size
  const [askBarSize, setAskBarSize] = useState<{ w: number; h: number } | null>(null);
  // type-first compose: keyboard rises over the board; submit lands in
  // a new chat with the message already sent
  const [askOpen, setAskOpen] = useState(false);
  const [askText, setAskText] = useState('');
  const [askPanelSize, setAskPanelSize] = useState<{ w: number; h: number } | null>(null);
  // TRUST widget: calibration proposal -> autonomy summary. 'allowed'
  // promotes the pattern to auto-approve; 'kept' snoozes the proposal.
  const [trustHandled, setTrustHandled] = useState<null | 'allowed' | 'kept'>(null);
  const askInputRef = useRef<TextInput>(null);
  // while the keyboard is down the panel clears the floating tab bar;
  // once it rises, KeyboardAvoidingView takes over the spacing
  const [kbUp, setKbUp] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKbUp(true)
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKbUp(false)
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  // autoFocus alone can silently fail right after mount; nudge focus
  // once the overlay is actually up
  useEffect(() => {
    if (!askOpen) return;
    const t = setTimeout(() => askInputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [askOpen]);

  const submitAsk = () => {
    const text = askText.trim();
    if (!text) return;
    setAskOpen(false);
    setAskText('');
    // undo speaks to the original executor in the original thread. The
    // router matches keywords against recent undoable actions; with no
    // match, the new chat's router asks back with chips. Everything
    // else is a normal new chat.
    if (/undo|revert/i.test(text)) {
      const target = UNDOABLES.find((u) => u.re.test(text));
      if (target) {
        sendMessage(target.threadId, text);
        router.push(`/chat/${target.threadId}`);
        return;
      }
    }
    router.push(`/chat/${createThread(text)}`);
  };

  // LAST ACTION expands in place: the card grows downward into the
  // full undoable queue instead of opening a separate sheet
  const [lastActionOpen, setLastActionOpen] = useState(false);
  const [autopilotOpen, setAutopilotOpen] = useState(false);
  const undoAction = (u: (typeof UNDOABLES)[number]) => {
    setLastActionOpen(false);
    sendMessage(u.threadId, u.ask);
    router.push(`/chat/${u.threadId}`);
  };
  // Full prompt-history bottom sheet, opened from the RECENT card
  const [historyOpen, setHistoryOpen] = useState(false);
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
      style={{ flex: 1, backgroundColor: '#F8FAE6' }}
      edges={['top']}>
      <StatusBar style="dark" />
      {/* start field: the app's quiet sage-lime theme, but livelier — an
          Apple-style mesh of soft bright glows (warm light behind the
          mark, lime top-left, meadow low-right, a whisper of sky) */}
      {!connected && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 390 844"
            preserveAspectRatio="xMidYMid slice">
            <Defs>
              <SvgGradient id="onbase" x1="0" y1="0" x2="0.4" y2="1">
                <Stop offset="0%" stopColor="#F2F5EC" />
                <Stop offset="50%" stopColor="#E4ECD6" />
                <Stop offset="100%" stopColor="#D3E2BC" />
              </SvgGradient>
              <RadialGradient
                id="onwarm"
                gradientUnits="userSpaceOnUse"
                cx="195"
                cy="330"
                rx="250"
                ry="270">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.75} />
                <Stop offset="60%" stopColor="#FFFFFF" stopOpacity={0.28} />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
              </RadialGradient>
              <RadialGradient
                id="onlime"
                gradientUnits="userSpaceOnUse"
                cx="50"
                cy="150"
                rx="230"
                ry="210">
                <Stop offset="0%" stopColor="#CCFF00" stopOpacity={0.2} />
                <Stop offset="60%" stopColor="#CCFF00" stopOpacity={0.07} />
                <Stop offset="100%" stopColor="#CCFF00" stopOpacity={0} />
              </RadialGradient>
              <RadialGradient
                id="onmeadow"
                gradientUnits="userSpaceOnUse"
                cx="340"
                cy="720"
                rx="270"
                ry="250">
                <Stop offset="0%" stopColor="#6FA344" stopOpacity={0.22} />
                <Stop offset="60%" stopColor="#6FA344" stopOpacity={0.08} />
                <Stop offset="100%" stopColor="#6FA344" stopOpacity={0} />
              </RadialGradient>
              <RadialGradient
                id="onsky"
                gradientUnits="userSpaceOnUse"
                cx="360"
                cy="110"
                rx="200"
                ry="180">
                <Stop offset="0%" stopColor="#A7CBEF" stopOpacity={0.16} />
                <Stop offset="60%" stopColor="#A7CBEF" stopOpacity={0.06} />
                <Stop offset="100%" stopColor="#A7CBEF" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="390" height="844" fill="url(#onbase)" />
            <Rect x="0" y="0" width="390" height="844" fill="url(#onlime)" />
            <Rect x="0" y="0" width="390" height="844" fill="url(#onsky)" />
            <Rect x="0" y="0" width="390" height="844" fill="url(#onmeadow)" />
            <Rect x="0" y="0" width="390" height="844" fill="url(#onwarm)" />
          </Svg>
        </View>
      )}
      {connected ? (
        // ───────────────────────── State board ─────────────────────────
        <>
          <AcidSwooshBg />
          {/* silk veil: a white film over the field so content reads
              first; thinner since the pop pass so the lime breathes
              (fullback: 0.4) */}
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.28)' }]}
          />
          <View style={{ flex: 1 }}>
            <ScrollView
              ref={scrollRef}
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {/* the square face mark, tiny: dark olive + lime, the
                      original mascot pairing */}
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 7,
                      backgroundColor: '#0B1A10',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <View style={{ flexDirection: 'row', gap: 3.5, marginBottom: 3 }}>
                      <View
                        style={{ width: 3, height: 3, borderRadius: 999, backgroundColor: '#DEFF4F' }}
                      />
                      <View
                        style={{ width: 3, height: 3, borderRadius: 999, backgroundColor: '#DEFF4F' }}
                      />
                    </View>
                    <View
                      style={{
                        width: 8,
                        height: 1.5,
                        borderRadius: 1,
                        backgroundColor: 'rgba(226,234,216,0.55)',
                      }}
                    />
                  </View>
                  {/* wordmark: flat, the face mark's own olive ink */}
                  <Text
                    style={{
                      color: '#0B1A10',
                      fontSize: 20,
                      letterSpacing: -0.3,
                      fontFamily: fontFamily.bold,
                    }}>
                    Clawstin
                  </Text>
                </View>
                {/* status lives in a tag (crew-pill grammar, light mode)
                    so it stays readable on the pale sky */}
                <Pressable
                  onPress={() => setStatusOpen(true)}
                  hitSlop={8}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 999,
                    // dashboard pastel: the pill pops as a solid chip
                    // of the same cloth as the cards (edgeless)
                    backgroundColor: '#EAF3B7',
                    opacity: pressed ? 0.6 : 1,
                  })}>
                  <Text
                    style={{
                      color: 'rgba(22,36,27,0.8)',
                      fontSize: 11,
                    }}>
                    {statusLabel.toLowerCase()}
                  </Text>
                  <Ionicons name="chevron-down" size={11} color="rgba(22,36,27,0.5)" />
                </Pressable>
              </View>

              {/* just the greeting, floating on the sky — the tab counts
                  already carry the numbers */}
              {/* greeting: the army fade again — deep green on the
                  left dissolving to pale khaki; SVG text so the fill
                  can be a gradient */}
              <Svg width="100%" height={30} style={{ marginTop: 10 }}>
                <Defs>
                  <SvgGradient id="greetgrad" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor="#46583B" />
                    <Stop offset="1" stopColor="#93A181" />
                  </SvgGradient>
                </Defs>
                <SvgText
                  x={0}
                  y={23}
                  fontSize={24}
                  fontFamily={fontFamily.bold}
                  letterSpacing={-0.5}
                  fill="url(#greetgrad)">
                  {`${hello}, ${USER_NAME}`}
                </SvgText>
              </Svg>

              {/* ── Control-tower dashboard: the trust cycle as a board.
                  YOUR TURN asks (pre-action), RUNNING shows delegation
                  at work, TRUST calibrates what stops needing approval,
                  LAST ACTION below undoes what went through. Every
                  approval feeds TRUST; TRUST slims YOUR TURN; undo makes
                  the added autonomy safe. ── */}
              {nextAsk || !trustHandled ? (
                <Pressable
                  disabled={!trustHandled}
                  onPress={() => nextAsk && router.push(`/chat/${nextAsk.threadId}`)}
                  style={({ pressed }) => ({
                    marginTop: 24,
                    borderRadius: 18,
                    overflow: 'hidden',
                    padding: 18,
                    shadowColor: '#16241B',
                    shadowOpacity: 0.16,
                    shadowRadius: 28,
                    shadowOffset: { width: 0, height: 14 },
                    elevation: 9,
                    opacity: pressed ? 0.85 : 1,
                  })}>
                  {/* keyed: this card also changes height when the
                      proposal resolves */}
                  <AcidGlassFill
                    key={trustHandled ? 'resolved' : 'proposal'}
                    effect="regular"
                    bright
                  />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: fontWeight.semibold,
                        color: 'rgba(22,36,27,0.55)',
                      }}>
                      YOUR TURN
                    </Text>
                    {(!trustHandled ? needsYou : needsYou - 1) > 0 ? (
                      <Pressable
                        onPress={() => {
                          setHomeTab('needsYou');
                          scrollRef.current?.scrollTo({ y: approvalsY, animated: true });
                        }}
                        hitSlop={10}>
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: fontWeight.semibold,
                            color: AINK.text,
                          }}>
                          {`+${!trustHandled ? needsYou : needsYou - 1} more`}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                  {!trustHandled ? (
                    // a system proposal waits in the same queue as crew
                    // asks: decisions have exactly one home
                    <>
                      <Text
                        numberOfLines={1}
                        style={{
                          marginTop: 14,
                          fontSize: fontSize.body,
                          fontWeight: fontWeight.semibold,
                          color: AINK.text,
                        }}>
                        Auto-approve contact merges?
                      </Text>
                      <View
                        style={{
                          marginTop: 12,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 12,
                        }}>
                        {/* one button size everywhere: 36pt visual pill
                            + hitSlop reaching the 44pt HIG touch target */}
                        <Pressable
                          onPress={() => setTrustHandled('allowed')}
                          hitSlop={8}
                          style={({ pressed }) => ({
                            // outlined pill: border carries the weight,
                            // the field shows through
                            borderWidth: 2,
                            borderColor: '#0A2814',
                            borderRadius: 999,
                            paddingHorizontal: 15,
                            paddingVertical: 7,
                            opacity: pressed ? 0.7 : 1,
                          })}>
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: fontWeight.semibold,
                              color: '#0A2814',
                            }}>
                            Allow
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => setTrustHandled('kept')}
                          hitSlop={8}
                          style={({ pressed }) => ({
                            paddingVertical: 9,
                            opacity: pressed ? 0.5 : 1,
                          })}>
                          <Text style={{ fontSize: 13, color: AINK.dim }}>Keep asking</Text>
                        </Pressable>
                      </View>
                    </>
                  ) : (
                    <Text
                      numberOfLines={1}
                      style={{
                        marginTop: 14,
                        fontSize: fontSize.body,
                        fontWeight: fontWeight.semibold,
                        color: AINK.text,
                      }}>
                      {nextAsk?.label}
                    </Text>
                  )}
                </Pressable>
              ) : null}

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                {/* AUTOPILOT: the calibration gauge. Collapsed = how much
                    runs alone; tap expands the card in place (full width)
                    into the receipts, rule by rule. Proposals queue in
                    YOUR TURN, never here. */}
                <Pressable
                  disabled={autopilotOpen}
                  onPress={() => setAutopilotOpen(true)}
                  style={({ pressed }) => ({
                    flex: 1,
                    height: autopilotOpen ? undefined : 124,
                    borderRadius: 18,
                    overflow: 'hidden',
                    padding: 18,
                    shadowColor: '#16241B',
                    shadowOpacity: 0.16,
                    shadowRadius: 28,
                    shadowOffset: { width: 0, height: 14 },
                    elevation: 9,
                    opacity: pressed ? 0.85 : 1,
                  })}>
                  {/* keyed so the native glass layer remounts at the new
                      size when the card expands/collapses */}
                  <AcidGlassFill
                    key={autopilotOpen ? 'open' : 'closed'}
                    effect="regular"
                    bright
                  />
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: fontWeight.semibold,
                          color: 'rgba(22,36,27,0.55)',
                        }}>
                        AUTOPILOT
                      </Text>
                      {autopilotOpen ? (
                        <Text style={{ fontSize: 11, color: AINK.dim }}>this week</Text>
                      ) : null}
                    </View>
                    {autopilotOpen ? (
                      <Pressable hitSlop={10} onPress={() => setAutopilotOpen(false)}>
                        <Ionicons name="close" size={15} color={AINK.dim} />
                      </Pressable>
                    ) : (
                      <Text style={{ fontSize: 11, color: AINK.dim }}>this week</Text>
                    )}
                  </View>
                  {autopilotOpen ? (
                    <>
                      {/* the gauge, unabbreviated: raw count first, then
                          the percent it compresses into */}
                      <Text
                        style={{
                          marginTop: 4,
                          paddingVertical: 12,
                          fontSize: fontSize.body,
                          fontWeight: fontWeight.semibold,
                          color: AINK.text,
                        }}>
                        {trustHandled === 'allowed'
                          ? '19 of 24 on its own · 78%'
                          : '17 of 24 on its own · 71%'}
                      </Text>
                      {AUTOPILOT_RULES.map((rule) => (
                        <View
                          key={rule.name}
                          style={{
                            paddingVertical: 12,
                            borderTopWidth: 1,
                            borderTopColor: AINK.divider,
                          }}>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}>
                            <Text
                              style={{
                                fontSize: fontSize.body,
                                fontWeight: fontWeight.semibold,
                                color: AINK.text,
                              }}>
                              {rule.name}
                            </Text>
                            <Text style={{ fontSize: 11, color: AINK.dim }}>
                              {`${rule.runs} runs · ${rule.undone} undone`}
                            </Text>
                          </View>
                          {rule.recent.map((r) => (
                            <View
                              key={r.label}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginTop: 7,
                                paddingLeft: 10,
                              }}>
                              <Text
                                numberOfLines={1}
                                style={{ flex: 1, fontSize: 12, color: AINK.dim }}>
                                {'↳ '}
                                {r.label}
                                {r.undone ? '  ✗ undone' : ''}
                              </Text>
                              <Text style={{ fontSize: 11, color: AINK.dim, marginLeft: 8 }}>
                                {r.ago}
                              </Text>
                            </View>
                          ))}
                        </View>
                      ))}
                    </>
                  ) : (
                    <View
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                      }}>
                      {/* the autonomy share as a filled ring, text beside */}
                      <TrustDonut pct={trustHandled === 'allowed' ? 0.78 : 0.71} />
                      <View>
                        <Text
                          style={{
                            fontSize: fontSize.body,
                            fontWeight: fontWeight.semibold,
                            color: AINK.text,
                          }}>
                          {trustHandled === 'allowed' ? '78% on its own' : '71% on its own'}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                          <Text style={{ fontSize: 11, color: AINK.dim }}>
                            {trustHandled === 'allowed' ? '4 rules' : '3 rules'}
                          </Text>
                          <Ionicons
                            name="chevron-forward"
                            size={11}
                            color={AINK.dim}
                            style={{ marginLeft: 2 }}
                          />
                        </View>
                      </View>
                    </View>
                  )}
                </Pressable>
                {/* RUNNING tucks away while the autopilot ledger is open;
                    the expanded card takes the whole row */}
                {autopilotOpen
                  ? null
                  : (
                  [
                    {
                      key: 'running',
                      label: 'RUNNING',
                      title: runningTask ? runningTask.label : 'No tasks running',
                      // "2 of 4 sites" -> 0.5; quiet fallback when the
                      // task has no parsable progress line
                      progress: (() => {
                        const m = runningTask?.progress?.match(/(\d+)\s+of\s+(\d+)/);
                        return m ? Number(m[1]) / Number(m[2]) : runningTask ? 0.4 : null;
                      })(),
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
                      borderRadius: 18,
                      overflow: 'hidden',
                      padding: 18,
                      shadowColor: '#16241B',
                      shadowOpacity: 0.16,
                      shadowRadius: 28,
                      shadowOffset: { width: 0, height: 14 },
                      elevation: 9,
                      opacity: pressed ? 0.85 : 1,
                    })}>
                    <AcidGlassFill effect="regular" bright />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: fontWeight.semibold,
                        color: 'rgba(22,36,27,0.55)',
                      }}>
                      {w.label}
                    </Text>
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
                          top: 12,
                          right: 14,
                          opacity: pressed ? 0.5 : 1,
                        })}>
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: fontWeight.semibold,
                            color: w.moreColor,
                          }}>
                          {`+${w.more} more`}
                        </Text>
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
                          fontWeight: fontWeight.semibold,
                          color: AINK.text,
                        }}>
                        {w.title}
                      </Text>
                    </View>
                    {w.progress != null ? (
                      // progress strip: a little thicker, lifted off the
                      // bottom edge, quiet dark gray
                      <View
                        style={{
                          position: 'absolute',
                          left: 18,
                          right: 18,
                          bottom: 18,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: 'rgba(22,36,27,0.1)',
                          overflow: 'hidden',
                        }}>
                        {/* the greeting's army fade, reused: dark head,
                            pale tail across the filled part */}
                        <Svg width="100%" height={6}>
                          <Defs>
                            <SvgGradient id={`proggrad-${w.key}`} x1="0" y1="0" x2="1" y2="0">
                              <Stop offset="0" stopColor="#46583B" />
                              <Stop offset="1" stopColor="#93A181" />
                            </SvgGradient>
                          </Defs>
                          <Rect
                            x={0}
                            y={0}
                            width={`${Math.round(w.progress * 100)}%`}
                            height={6}
                            rx={3}
                            fill={`url(#proggrad-${w.key})`}
                          />
                        </Svg>
                      </View>
                    ) : null}
                  </Pressable>
                ))}
              </View>

              {/* post-action control: the agent's most recent write
                  action stays undoable here instead of scrolling away
                  in chat. "+N more" expands the card in place into the
                  full undoable queue; the descending minutes column
                  explains itself, no caption needed. */}
              <View
                style={{
                  marginTop: 12,
                  borderRadius: 18,
                  overflow: 'hidden',
                  padding: 18,
                  shadowColor: '#16241B',
                  shadowOpacity: 0.16,
                  shadowRadius: 28,
                  shadowOffset: { width: 0, height: 14 },
                  elevation: 9,
                }}>
                {/* keyed so the native glass layer remounts at the new
                    size when the card expands/collapses */}
                <AcidGlassFill
                  key={lastActionOpen ? 'expanded' : 'collapsed'}
                  effect="regular"
                  bright
                />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: fontWeight.semibold,
                      color: 'rgba(22,36,27,0.55)',
                    }}>
                    LAST ACTION
                  </Text>
                  {lastActionOpen ? (
                    <Pressable hitSlop={10} onPress={() => setLastActionOpen(false)}>
                      <Ionicons name="close" size={15} color={AINK.dim} />
                    </Pressable>
                  ) : UNDOABLES.length > 1 ? (
                    <Pressable hitSlop={10} onPress={() => setLastActionOpen(true)}>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: fontWeight.semibold,
                          color: AINK.text,
                        }}>
                        {`+${UNDOABLES.length - 1} more undoable`}
                      </Text>
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
                        fontWeight: fontWeight.semibold,
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
                        backgroundColor: 'rgba(10,40,20,0.09)',
                        borderRadius: 999,
                        paddingHorizontal: 16,
                        paddingVertical: 9,
                        opacity: pressed ? 0.6 : 1,
                      })}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: fontWeight.semibold,
                          color: '#0A2814',
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
                      setAskText('undo ');
                      setAskOpen(true);
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
              </View>

              {/* sorting nav: the 3-state model as navigation (counts
                  live here now, not in the widgets). Indented to the
                  cards' inner content line, quiet type, fat hit area. */}
              <View
                style={{
                  flexDirection: 'row',
                  gap: 18,
                  marginTop: 26,
                  marginBottom: 10,
                }}>
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
                    hitSlop={10}
                    style={{ paddingVertical: 6 }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: homeTab === key ? fontFamily.bold : fontFamily.semibold,
                        color: homeTab === key ? AINK.text : 'rgba(22,36,27,0.45)',
                      }}>
                      {`${label} ${count}`}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* one steel-glass container; every chat is a hairline-
                  divided row inside. Priority reads top to bottom. */}
              {activeRows.length + visibleDone.length > 0 ? (
                <View
                  onLayout={(e) => setApprovalsY(e.nativeEvent.layout.y)}
                  style={{
                    borderRadius: 18,
                                        overflow: 'hidden',
                    shadowColor: '#16241B',
                    shadowOpacity: 0.16,
                    shadowRadius: 28,
                    shadowOffset: { width: 0, height: 14 },
                    elevation: 9,
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
                    effect="regular"
                    dense
                  />
                  {activeRows.map((row, idx) => {
                    const aged = row.age?.endsWith('d') ?? false;
                    // no deadline in the tag (it reads as noise); only
                    // soft-aged rows show their age
                    const statusSuffix = aged ? row.age : null;
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
                            paddingVertical: 15,
                            opacity: pressed ? 0.5 : aged ? 0.5 : 1,
                          })}>
                          <Text
                            numberOfLines={1}
                            style={{
                              flex: 1,
                              color: AINK.text,
                              fontSize: fontSize.body,
                              // only the front of the queue shouts;
                              // the tail settles into regular weight
                              fontWeight: idx < 3 ? fontWeight.semibold : fontWeight.regular,
                            }}>
                            {row.label}
                            {homeTab === 'all' && row.waiting && !aged ? (
                              // your-turn mark: a small pop-lime dot with a
                              // real space gap (inline margins are ignored),
                              // riding just above the text center. Aged rows
                              // are past asking, so no dot.
                              <>
                                {'  '}
                                <View
                                  style={{
                                    width: 5,
                                    height: 5,
                                    borderRadius: 999,
                                    backgroundColor: '#A3D700',
                                    transform: [{ translateY: -9 }],
                                  }}
                                />
                              </>
                            ) : null}
                          </Text>
                          {homeTab === 'all' ? (
                            // right side: spinner while running, age for
                            // soft-aged asks; states only mix in All
                            row.waiting ? (
                              statusSuffix ? (
                                <Text style={{ fontSize: 11, color: AINK.dim }}>
                                  {statusSuffix}
                                </Text>
                              ) : null
                            ) : (
                              <RunningDot color="rgba(22,36,27,0.35)" size={5} />
                            )
                          ) : null}
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
                          paddingVertical: 13,
                          opacity: pressed ? 0.5 : t.outcome === 'expired' ? 0.6 : 1,
                        })}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text
                              numberOfLines={1}
                              style={{
                                flexShrink: 1,
                                color: AINK.text,
                                fontSize: fontSize.body,
                                fontWeight: fontWeight.regular,
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
                            fontSize: 11,
                            color: AINK.dim,
                          }}>
                          {t.outcome === 'expired' ? 'expired' : t.updatedAt}
                        </Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}
              {visibleDone.length > 0 ? (
                <Pressable
                  onPress={() => setHistoryOpen(true)}
                  style={({ pressed }) => ({
                    marginTop: 14,
                    alignSelf: 'flex-start' as const,
                    opacity: pressed ? 0.6 : 1,
                  })}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: AINK.dim,
                    }}>
                    {'full history ›'}
                  </Text>
                </Pressable>
              ) : null}
            </ScrollView>

            {/* floating ask bar: the one chat entry, pinned above the
                tab bar. A dark console (mascot-face family) under an
                aurora rim: eyeball lime sweeping into meadow green.
                The slash chip hints at commands (undo, pause, status)
                to come. */}
            <View
              pointerEvents="box-none"
              style={{
                position: 'absolute',
                left: 16,
                right: 16,
                bottom: 90,
                // lime glow instead of a gray drop: the bar emits light
                shadowColor: '#C9DC7A',
                shadowOpacity: 0.22,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 3 },
                elevation: 10,
                opacity: askOpen ? 0 : 1,
              }}>
              <Pressable
                onPress={() => setAskOpen(true)}
                disabled={askOpen}
                onLayout={(e) =>
                  setAskBarSize({
                    w: e.nativeEvent.layout.width,
                    h: e.nativeEvent.layout.height,
                  })
                }
                style={({ pressed }) => ({
                  height: 52,
                  borderRadius: 999,
                  overflow: 'hidden',
                  backgroundColor: '#0B2113',
                  opacity: pressed ? 0.85 : 1,
                })}>
                <View
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 18,
                  }}>
                  <Text style={{ flex: 1, fontSize: fontSize.body, color: 'rgba(230,240,220,0.65)' }}>
                    Ask anything
                  </Text>
                  {/* command entry: opens compose already holding
                      "undo " — the input is never a blank page */}
                  <Pressable
                    hitSlop={10}
                    onPress={() => {
                      setAskText('undo ');
                      setAskOpen(true);
                    }}
                    style={({ pressed }) => ({
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: pressed ? 0.6 : 1,
                    })}>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: fontWeight.semibold,
                        color: '#DEFF4F',
                      }}>
                      /
                    </Text>
                  </Pressable>
                </View>
              </Pressable>
              {askBarSize ? (
                <Svg
                  pointerEvents="none"
                  width={askBarSize.w}
                  height={askBarSize.h}
                  style={{ position: 'absolute', top: 0, left: 0 }}>
                  <Defs>
                    {/* P3-ring neon, worn quietly: full spectrum sweep,
                        soft pastel stops so it reads as a glow, not a toy */}
                    <SvgGradient id="askrim" x1="0" y1="0" x2="1" y2="0">
                      <Stop offset="0" stopColor="#E3EFA9" />
                      <Stop offset="0.5" stopColor="#A9C57C" />
                      <Stop offset="1" stopColor="#D9E794" />
                    </SvgGradient>
                  </Defs>
                  {/* soft aurora bleed under the crisp rim */}
                  <Rect
                    x={0.75}
                    y={0.75}
                    width={askBarSize.w - 1.5}
                    height={askBarSize.h - 1.5}
                    rx={(askBarSize.h - 1.5) / 2}
                    fill="none"
                    stroke="url(#askrim)"
                    strokeWidth={5}
                    opacity={0.1}
                  />
                  <Rect
                    x={0.75}
                    y={0.75}
                    width={askBarSize.w - 1.5}
                    height={askBarSize.h - 1.5}
                    rx={(askBarSize.h - 1.5) / 2}
                    fill="none"
                    stroke="url(#askrim)"
                    strokeWidth={1.5}
                  />
                </Svg>
              ) : null}
            </View>

            {/* compose layer: board dims, keyboard rises, the console
                expands in place. Submit seeds a new chat and jumps in. */}
            {askOpen ? (
              <View style={StyleSheet.absoluteFill}>
                <Pressable
                  onPress={() => setAskOpen(false)}
                  style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: 'rgba(10,18,12,0.35)' },
                  ]}
                />
                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                  pointerEvents="box-none"
                  style={{ flex: 1, justifyContent: 'flex-end' }}>
                  <View
                    pointerEvents="box-none"
                    style={{ padding: 16, paddingBottom: kbUp ? 16 : 104, gap: 10 }}>
                    {/* prompt starters: prefill, stay editable */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {['Plan my day', 'Find time Friday', 'Summarize my inbox'].map((chip) => (
                        <Pressable
                          key={chip}
                          onPress={() => setAskText(chip)}
                          style={({ pressed }) => ({
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderRadius: 999,
                            backgroundColor: 'rgba(11,33,19,0.9)',
                            opacity: pressed ? 0.7 : 1,
                          })}>
                          <Text style={{ fontSize: 13, color: 'rgba(230,240,220,0.85)' }}>
                            {chip}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    {/* expanded console: same aurora rim, room to think */}
                    <View
                      style={{
                        shadowColor: '#C9DC7A',
                        shadowOpacity: 0.22,
                        shadowRadius: 12,
                        shadowOffset: { width: 0, height: 3 },
                        elevation: 10,
                      }}>
                      <View
                        onLayout={(e) =>
                          setAskPanelSize({
                            w: e.nativeEvent.layout.width,
                            h: e.nativeEvent.layout.height,
                          })
                        }
                        style={{
                          borderRadius: 26,
                          backgroundColor: '#0B2113',
                          padding: 14,
                          flexDirection: 'row',
                          alignItems: 'flex-end',
                          gap: 10,
                        }}>
                        <TextInput
                          ref={askInputRef}
                          autoFocus
                          multiline
                          value={askText}
                          onChangeText={setAskText}
                          placeholder="Ask anything"
                          placeholderTextColor="rgba(230,240,220,0.5)"
                          style={{
                            flex: 1,
                            minHeight: 72,
                            maxHeight: 120,
                            fontSize: fontSize.body,
                            lineHeight: 21,
                            color: 'rgba(230,240,220,0.92)',
                            paddingTop: 4,
                          }}
                        />
                        <Pressable
                          onPress={submitAsk}
                          disabled={!askText.trim()}
                          hitSlop={8}
                          style={({ pressed }) => ({
                            width: 34,
                            height: 34,
                            borderRadius: 999,
                            backgroundColor: '#A3D700',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: !askText.trim() ? 0.4 : pressed ? 0.7 : 1,
                          })}>
                          <Ionicons name="arrow-up" size={18} color="#152A1E" />
                        </Pressable>
                        {askPanelSize ? (
                          <Svg
                            pointerEvents="none"
                            width={askPanelSize.w}
                            height={askPanelSize.h}
                            style={{ position: 'absolute', top: 0, left: 0 }}>
                            <Defs>
                              <SvgGradient id="askpanelrim" x1="0" y1="0" x2="1" y2="0">
                                <Stop offset="0" stopColor="#E3EFA9" />
                                <Stop offset="0.5" stopColor="#A9C57C" />
                                <Stop offset="1" stopColor="#D9E794" />
                              </SvgGradient>
                            </Defs>
                            <Rect
                              x={0.75}
                              y={0.75}
                              width={askPanelSize.w - 1.5}
                              height={askPanelSize.h - 1.5}
                              rx={25}
                              fill="none"
                              stroke="url(#askpanelrim)"
                              strokeWidth={5}
                              opacity={0.1}
                            />
                            <Rect
                              x={0.75}
                              y={0.75}
                              width={askPanelSize.w - 1.5}
                              height={askPanelSize.h - 1.5}
                              rx={25}
                              fill="none"
                              stroke="url(#askpanelrim)"
                              strokeWidth={1.5}
                            />
                          </Svg>
                        ) : null}
                      </View>
                    </View>
                  </View>
                </KeyboardAvoidingView>
              </View>
            ) : null}

          </View>

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
              topOffset={insets.top + 96}
            />
          ) : null}

          {/* Full prompt history, slid up from the RECENT card */}
          <PromptHistorySheet visible={historyOpen} onClose={() => setHistoryOpen(false)} />
        </>
      ) : (
        // ──────────────────── Onboarding · Step 1 (agent mark) ────────────────────
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 110, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}>
          <View style={{ flex: 1 }} />
          <View style={{ alignItems: 'center' }}>
            {/* Agent mark inside pulsing rings */}
            <PulseMark size={140}>
              <View
                style={{
                  width: 80.5,
                  height: 80.5,
                  borderRadius: 24,
                  // the home header mark, hero size: soft olive square,
                  // electric lime face
                  backgroundColor: '#081D35',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#16241B',
                  shadowOpacity: 0.22,
                  shadowRadius: 20,
                  shadowOffset: { width: 0, height: 10 },
                  elevation: 6,
                }}>
                {/* Eyes: bright lime; mouth stays quiet gray-green */}
                <View style={{ flexDirection: 'row', gap: 15, marginBottom: 11 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: '#8FBFF2' }} />
                  <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: '#8FBFF2' }} />
                </View>
                {/* Mouth */}
                <View
                  style={{
                    width: 27,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: 'rgba(143,191,242,0.6)',
                  }}
                />
              </View>
            </PulseMark>

            {/* Headline */}
            <Text
              style={{
                color: '#081D35',
                fontSize: 35,
                fontFamily: fontFamily.bold,
                letterSpacing: -0.8,
                lineHeight: 41,
                textAlign: 'center',
                marginTop: spacing.sm,
              }}>
              Clawstin
            </Text>

            {/* Subtitle */}
            <Text
              style={{
                color: 'rgba(22,36,27,0.6)',
                fontSize: fontSize.bodyLg,
                lineHeight: 23,
                textAlign: 'center',
                marginTop: spacing.sm,
              }}>
              Stay close to your agent.
            </Text>
          </View>
          <View style={{ flex: 1 }} />

          {/* CTA → connect */}
          <Pressable
            onPress={() => setConnected(true)}
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
            <View
              style={{
                // exactly the mark's face color, so CTA and logo read
                // as one material
                backgroundColor: '#081D35',
                borderRadius: radius.lg,
                paddingVertical: spacing.lg,
                alignItems: 'center',
              }}>
              <Text
                style={{
                  color: '#F4F8EC',
                  fontSize: fontSize.bodyLg,
                  fontFamily: fontFamily.semibold,
                }}>
                Get started
              </Text>
            </View>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
