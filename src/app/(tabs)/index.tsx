import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Image,
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
import Svg, { Defs, LinearGradient as SvgGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
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
function AcidGlassFill({ effect = 'clear' }: { effect?: 'clear' | 'regular' | 'none' }) {
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
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none" preserveAspectRatio="none">
        <Defs>
          {/* brushed-steel veil: bright silver up top settling into a
              lime-green cast, more opaque than plain glass */}
          <SvgGradient id="acidveil" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#F3F6EF" stopOpacity={0.6} />
            <Stop offset="55%" stopColor="#E7EFD8" stopOpacity={0.5} />
            <Stop offset="100%" stopColor="#D9E6C2" stopOpacity={0.45} />
          </SvgGradient>
          {/* cold silver sheen sweeping off the top-left corner */}
          <SvgGradient id="acidsheen" x1="0" y1="0" x2="0.85" y2="0.9">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.22} />
            <Stop offset="45%" stopColor="#FFFFFF" stopOpacity={0.05} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </SvgGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#acidveil)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#acidsheen)" />
      </Svg>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 12,
          right: 12,
          height: 1.5,
          borderRadius: 1,
          backgroundColor: 'rgba(255,255,255,0.7)',
        }}
      />
    </>
  );
}

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
  text: '#26301F',
  dim: 'rgba(38,48,31,0.55)',
  divider: 'rgba(38,48,31,0.08)',
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
    borderRadius: 22,
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
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.55)',
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
      style={{ flex: 1, backgroundColor: connected ? '#EEF1E8' : '#EEF1E8' }}
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
          <View style={{ flex: 1 }}>
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
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
                      same pair as the hero's arrow orb */}
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 7,
                      // softened olive; the wordmark uses the same ink
                      backgroundColor: 'rgba(35,48,24,0.85)',
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
                  <Text
                    style={{
                      color: 'rgba(35,48,24,0.85)',
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
                    backgroundColor: 'rgba(255,255,255,0.5)',
                    borderWidth: 1.2,
                    borderColor: 'rgba(255,255,255,0.8)',
                    opacity: pressed ? 0.6 : 1,
                  })}>
                  <Text
                    style={{
                      color: 'rgba(38,48,31,0.8)',
                      fontSize: 11,
                    }}>
                    {statusLabel.toLowerCase()}
                  </Text>
                  <Ionicons name="chevron-down" size={11} color="rgba(38,48,31,0.5)" />
                </Pressable>
              </View>

              {/* just the greeting, floating on the sky — the tab counts
                  already carry the numbers */}
              <Text
                style={{
                  marginTop: 10,
                  fontSize: 24,
                  lineHeight: 30,
                  fontFamily: fontFamily.bold,
                  letterSpacing: -0.5,
                  // the wordmark's previous shadow ink, one step softer
                  color: 'rgba(38,48,31,0.7)',
                }}>
                {hello}, {USER_NAME}
              </Text>

              {/* ── Acid dashboard (V Acid Pop grammar): lime hero ask
                  card + two frosted state tiles. Hero = the one chat
                  entry; tiles carry the 3-state counts and filter the
                  list below on tap. ── */}
              <Pressable
                onPress={startChat}
                style={({ pressed }) => ({
                  marginTop: 24,
                  height: 135,
                  borderRadius: 22,
                  borderWidth: 1.2,
                  borderColor: 'rgba(255,255,255,0.8)',
                  overflow: 'hidden',
                  shadowColor: '#26301F',
                  shadowOpacity: 0.14,
                  shadowRadius: 20,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: 6,
                  opacity: pressed ? 0.88 : 1,
                })}>
                <AcidGlassFill />
                <Text
                  style={{
                    position: 'absolute',
                    top: 14,
                    left: 15,
                    fontSize: 11,
                    fontWeight: fontWeight.semibold,
                    letterSpacing: 1,
                    color: 'rgba(35,48,24,0.9)',
                  }}>
                  CREW
                </Text>
                <View
                  style={{
                    position: 'absolute',
                    top: 14,
                    right: 14,
                    width: 30,
                    height: 30,
                    borderRadius: 999,
                    backgroundColor: '#233018',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Ionicons
                    name="arrow-forward"
                    size={15}
                    color="#CCFF00"
                    style={{ transform: [{ rotate: '-45deg' }] }}
                  />
                </View>
                <Text
                  style={{
                    position: 'absolute',
                    left: 16,
                    bottom: 24,
                    fontSize: 26,
                    fontFamily: fontFamily.bold,
                    letterSpacing: -0.5,
                    color: '#233018',
                  }}>
                  Ask your crew
                </Text>
              </Pressable>

              {/* live-focus widgets: not counters (the nav below carries
                  the counts) but the thing itself — the running task's
                  pulse, and the front of the needs-you queue. Tap = jump
                  straight into that chat. */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                {(
                  [
                    {
                      key: 'running',
                      label: 'RUNNING',
                      title: runningTask ? runningTask.label : 'No tasks running',
                      caption: runningTask
                        ? (runningTask.progress ?? 'crew at work')
                        : 'all clear',
                      live: !!runningTask,
                      alert: false,
                      threadId: runningTask?.threadId,
                    },
                    {
                      key: 'needsYou',
                      label: 'NEEDS YOU',
                      title: nextAsk ? nextAsk.label : 'Nothing waiting',
                      caption: nextAsk ? 'next' : 'all clear',
                      live: false,
                      alert: !!nextAsk,
                      threadId: nextAsk?.threadId,
                    },
                  ] as const
                ).map((w) => (
                  <Pressable
                    key={w.key}
                    onPress={() => w.threadId && router.push(`/chat/${w.threadId}`)}
                    style={({ pressed }) => ({
                      flex: 1,
                      height: 100,
                      borderRadius: 22,
                      borderWidth: 1.2,
                      borderColor: 'rgba(255,255,255,0.8)',
                      overflow: 'hidden',
                      padding: 14,
                      shadowColor: '#26301F',
                      shadowOpacity: 0.14,
                      shadowRadius: 20,
                      shadowOffset: { width: 0, height: 8 },
                      elevation: 6,
                      opacity: pressed ? 0.85 : 1,
                    })}>
                    <AcidGlassFill />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: fontWeight.semibold,
                        letterSpacing: 1,
                        color: 'rgba(58,74,44,0.9)',
                      }}>
                      {w.label}
                    </Text>
                    {w.alert ? (
                      <View
                        style={{
                          position: 'absolute',
                          top: 14,
                          right: 14,
                          width: 8,
                          height: 8,
                          borderRadius: 999,
                          backgroundColor: sysColor.actionDot,
                        }}
                      />
                    ) : null}
                    {w.live ? (
                      <View style={{ position: 'absolute', top: 14, right: 14 }}>
                        <RunningDot color={sysColor.running} size={8} />
                      </View>
                    ) : null}
                    <Text
                      numberOfLines={2}
                      style={{
                        marginTop: 8,
                        fontSize: 13,
                        lineHeight: 17,
                        fontWeight: fontWeight.semibold,
                        color: AINK.text,
                      }}>
                      {w.title}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        marginTop: 'auto' as const,
                        alignSelf: 'flex-end' as const,
                        fontSize: 11,
                        color: 'rgba(38,48,31,0.6)',
                      }}>
                      {w.caption}
                    </Text>
                  </Pressable>
                ))}
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
                    ['needsYou', 'Needs you', needsYou],
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
                        color: homeTab === key ? AINK.text : 'rgba(38,48,31,0.45)',
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
                    borderRadius: 22,
                    borderWidth: 1.2,
                    borderColor: 'rgba(255,255,255,0.8)',
                    overflow: 'hidden',
                    shadowColor: '#26301F',
                    shadowOpacity: 0.14,
                    shadowRadius: 20,
                    shadowOffset: { width: 0, height: 8 },
                    elevation: 6,
                  }}>
                  {/* tall card: 'regular' frost avoids clear-glass edge
                      lensing showing as a dark band at the bottom */}
                  <AcidGlassFill effect="regular" />
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
                              fontSize: fontSize.small,
                              fontWeight: fontWeight.semibold,
                            }}>
                            {row.label}
                          </Text>
                          <Text
                            style={{
                              fontSize: 11,
                              color: row.waiting ? AINK.warn : AINK.running,
                            }}>
                            {row.waiting
                              ? statusSuffix
                                ? `needs you  ${statusSuffix}`
                                : 'needs you'
                              : 'running'}
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
                                fontSize: fontSize.small,
                                fontWeight: fontWeight.semibold,
                              }}>
                              {t.title}
                            </Text>
                            {t.unread ? (
                              <View
                                style={{
                                  width: 7,
                                  height: 7,
                                  borderRadius: 999,
                                  backgroundColor: AINK.accent,
                                }}
                              />
                            ) : null}
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
                  backgroundColor: 'rgba(35,48,24,0.85)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#26301F',
                  shadowOpacity: 0.22,
                  shadowRadius: 20,
                  shadowOffset: { width: 0, height: 10 },
                  elevation: 6,
                }}>
                {/* Eyes: bright lime; mouth stays quiet gray-green */}
                <View style={{ flexDirection: 'row', gap: 15, marginBottom: 11 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: '#DEFF4F' }} />
                  <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: '#DEFF4F' }} />
                </View>
                {/* Mouth */}
                <View
                  style={{
                    width: 27,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: 'rgba(226,234,216,0.55)',
                  }}
                />
              </View>
            </PulseMark>

            {/* Headline */}
            <Text
              style={{
                color: 'rgba(35,48,24,0.85)',
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
                color: 'rgba(38,48,31,0.6)',
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
                // calm olive, same family as the mark; lime stays an
                // accent (eyes), not a surface
                backgroundColor: '#2B3A1D',
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
