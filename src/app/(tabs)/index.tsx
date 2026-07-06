import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ReactNode, useEffect, useRef, useState } from 'react';
import {
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

import { DevReset } from '@/components/dev/dev-reset';
import { AuroraLine } from '@/components/ui/aurora-line';
import { Card } from '@/components/ui/card';
import { GlassIconButton } from '@/components/ui/glass-icon-button';
import { BlissSwooshBg } from '@/components/ui/bliss-swoosh-bg';
import { PromptHistorySheet } from '@/components/ui/prompt-history-sheet';
import { PulseMark } from '@/components/ui/pulse-mark';
import { StatusPopover, worstServiceState } from '@/components/ui/status-popover';
import { useAppStore } from '@/store/app-store';
import { colors, fontFamily, fontSize, fontWeight, radius, shadow, spacing } from '@/theme/theme';

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

// Home section material. 'milk' = the Acid Pop recipe (blur + a strong
// milky veil, the field whispers through). Flip to 'paper' to restore
// solid white cards instantly.
const SECTION_MATERIAL: 'paper' | 'milk' = 'paper';
const MILK = (SECTION_MATERIAL as 'paper' | 'milk') === 'milk';

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
function MuppetFace({ size = 34 }: { size?: number }) {
  const k = size / 34;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 999,
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
function RunningDot() {
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
        { width: 7, height: 7, borderRadius: 999, backgroundColor: GLASS.blue },
        style,
      ]}
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
      : MILK
        ? {
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.35)',
            backgroundColor: 'rgba(255,255,255,0.18)',
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
      {GLASS_AVAILABLE && (onTint || MILK) ? (
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
      {tint || MILK ? (
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <SvgGradient id="veil" x1="0" y1="0" x2="0" y2="1">
              <Stop
                offset="0%"
                stopColor={tint ? tint[0] : '#FFFFFF'}
                stopOpacity={tint ? 0.92 : 0.46}
              />
              <Stop
                offset="100%"
                stopColor={tint ? tint[1] : '#FFFFFF'}
                stopOpacity={tint ? 0.92 : 0.26}
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
              color: onTint ? 'rgba(255,255,255,0.85)' : GLASS.dim,
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
  } = useAppStore();
  const { width: screenW } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentW = screenW - spacing.lg * 2; // screen padding is spacing.lg each side

  // Connection status popover (tap the "Online" label to inspect services).
  const [statusOpen, setStatusOpen] = useState(false);
  const worst = worstServiceState(services);
  const statusDot: string =
    worst === 'down' ? colors.danger : worst === 'degraded' ? colors.warning : colors.success;
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: GLASS.bg }} edges={['top']}>
      {connected ? <StatusBar style="dark" /> : null}
      {/* Home rides the bare bliss gradient; other tabs keep the swoosh art */}
      {!connected && <BlissSwooshBg plain />}
      {connected ? (
        // ───────────────────────── State board ─────────────────────────
        <>
          <BlissSwooshBg plain />
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{ padding: spacing.lg, paddingBottom: 110 }}
            showsVerticalScrollIndicator={false}>
            {/* Header: profile icon + 2-line greeting (left) + date / online status (right) */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginTop: spacing.xl,
              }}>
              <Text
                style={{
                  color: GLASS.textStrong,
                  fontSize: fontSize.largeTitle,
                  fontWeight: fontWeight.bold,
                  letterSpacing: -0.5,
                }}>
                {hello}, {USER_NAME}
              </Text>

              <View style={{ alignItems: 'flex-end', paddingTop: 4 }}>
                <Pressable
                  onPress={() => setStatusOpen(true)}
                  hitSlop={8}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    opacity: pressed ? 0.6 : 1,
                  })}>
                  <View
                    style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: statusDot }}
                  />
                  <Text style={{ color: GLASS.dim, fontSize: fontSize.small }}>
                    {statusLabel}
                  </Text>
                  <Ionicons name="chevron-down" size={12} color={GLASS.faint} />
                </Pressable>
              </View>
            </View>

            {/* The crew desk — one card, messenger grammar: a docked chat
                input sits as the natural first row ("Ask your crew"), and
                what the crew is already doing flows right beneath it.
                Only open work lives here (running, or blocked on you —
                approvals included); finished results fall further down
                into History. When nothing is open the card is just the
                quiet ask row. */}
            {/* ask console — the deep-dark command tower over the light
                cards (dark + mono = system surface, same family as the
                Logs tab and status popover). */}
            <Pressable
              onPress={startChat}
              style={({ pressed }) => ({
                marginTop: spacing.xl,
                height: 120,
                borderRadius: 22,
                backgroundColor: '#0E1626',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.28)',
                padding: spacing.lg,
                justifyContent: 'space-between',
                shadowColor: '#2E3252',
                shadowOpacity: 0.22,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 8 },
                elevation: 8,
                opacity: pressed ? 0.88 : 1,
              })}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.45)',
                    fontFamily: fontFamily.mono,
                    fontSize: 11,
                    letterSpacing: 1.2,
                  }}>
                  ~/crew
                </Text>
                {/* ghost arrow: oversized, near-silent launch mark */}
                <Ionicons
                  name="arrow-up"
                  size={40}
                  color="rgba(255,255,255,0.30)"
                  style={{
                    transform: [{ rotate: '45deg' }],
                    marginTop: -6,
                    marginRight: -4,
                  }}
                />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <MuppetFace size={26} />
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 25,
                    lineHeight: 29,
                    letterSpacing: -0.5,
                    fontFamily: fontFamily.bold,
                  }}>
                  Ask your crew
                </Text>
              </View>
            </Pressable>

            {/* The work desk — one mass: the glance tiles sit INSIDE the
                list card as its header (folder-tab grammar), and the open
                rows hang directly off them. "waiting for you" + the rows
                right beneath = these are the chats waiting on me. */}
            <View onLayout={(e) => setApprovalsY(e.nativeEvent.layout.y)}>
              <LiquidCard
                style={{ marginTop: spacing.md }}
                contentStyle={{ padding: 0, paddingBottom: spacing.sm }}>
                {/* header tiles */}
                <View
                  style={{
                    flexDirection: 'row',
                    gap: spacing.md,
                    padding: spacing.lg,
                    paddingBottom: spacing.md,
                  }}>
                  <Pressable
                    onPress={() => router.navigate('/(tabs)/activity')}
                    style={({ pressed }) => ({
                      flex: 1,
                      height: 72,
                      borderRadius: 16,
                      // same gray inner-bento as the Crew Perf stat tiles
                      backgroundColor: 'rgba(31,58,87,0.04)',
                      paddingHorizontal: 14,
                      paddingTop: 10,
                      paddingBottom: 10,
                      justifyContent: 'space-between',
                      opacity: pressed ? 0.7 : 1,
                    })}>
                    <Text
                      style={{
                        color: GLASS.dim,
                        fontSize: 11,
                        fontFamily: fontFamily.medium,
                        letterSpacing: 1,
                      }}>
                      {runningCount > 0 ? 'RUNNING NOW' : 'ALL CLEAR'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                      <Text
                        style={{
                          color: GLASS.textStrong,
                          fontSize: 22,
                          lineHeight: 26,
                          fontFamily: fontFamily.bold,
                        }}>
                        {runningCount}
                      </Text>
                      <Text style={{ color: GLASS.dim, fontSize: 11 }}>
                        {runningCount === 1 ? 'task' : 'tasks'}
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={scrollToApprovals}
                    style={({ pressed }) => ({
                      flex: 1,
                      height: 72,
                      borderRadius: 16,
                      // same gray inner-bento as the Crew Perf stat tiles
                      backgroundColor: 'rgba(31,58,87,0.04)',
                      paddingHorizontal: 14,
                      paddingTop: 10,
                      paddingBottom: 10,
                      justifyContent: 'space-between',
                      opacity: pressed ? 0.7 : 1,
                    })}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                      <Text
                        style={{
                          color: GLASS.dim,
                          fontSize: 11,
                          fontFamily: fontFamily.medium,
                          letterSpacing: 1,
                        }}>
                        NEEDS APPROVAL
                      </Text>
                      {needsYou > 0 ? (
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 999,
                            backgroundColor: GLASS.dotAlert,
                          }}
                        />
                      ) : null}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                      <Text
                        style={{
                          color: GLASS.textStrong,
                          fontSize: 22,
                          lineHeight: 26,
                          fontFamily: fontFamily.bold,
                        }}>
                        {needsYou}
                      </Text>
                      <Text style={{ color: GLASS.dim, fontSize: 11 }}>
                        waiting
                      </Text>
                    </View>
                  </Pressable>
                </View>

                {[
                  ...background.map((t) => ({
                    key: t.id,
                    agentId: t.agentId,
                    label: t.label,
                    waiting: t.state === 'waiting',
                    onPress: () => router.push(`/chat/${t.threadId}`),
                  })),
                  // approvals ARE "needs you" — same concept, one list.
                  // Home only indexes; the action happens on the detail.
                  ...approvals.map((a) => ({
                    key: a.id,
                    agentId: 'muppet',
                    label: a.title,
                    waiting: true,
                    onPress: () => router.push(`/approval/${a.id}`),
                  })),
                ].map((row, i) => {
                  return (
                    <Pressable
                      key={row.key}
                      onPress={row.onPress}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.sm,
                        paddingHorizontal: spacing.lg,
                        // comfortable touch rows: 13pt text + 16 top/bottom
                        // clears the 44pt minimum target
                        paddingVertical: 16,
                        borderTopWidth: i === 0 ? 0 : 1,
                        borderTopColor: GLASS.line,
                        opacity: pressed ? 0.5 : 1,
                      })}>
                      <Text
                        numberOfLines={1}
                        style={{
                          flex: 1,
                          color: GLASS.text,
                          fontSize: fontSize.small,
                          fontWeight: fontWeight.semibold,
                        }}>
                        {row.label}
                      </Text>
                      {row.waiting ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <View
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: 999,
                              backgroundColor: GLASS.dotAlert,
                            }}
                          />
                          <Text
                            style={{
                              color: GLASS.dotAlert,
                              fontSize: 11,
                              fontFamily: fontFamily.mono,
                            }}>
                            needs you
                          </Text>
                        </View>
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <RunningDot />
                          <Text
                            style={{
                              color: GLASS.dim,
                              fontSize: 11,
                              fontFamily: fontFamily.mono,
                            }}>
                            running
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </LiquidCard>
            </View>

            {/* Delivered — everything FINISHED, newest first. Blue dot =
                done but not yet opened (messenger grammar: the crew
                delivered, you haven't picked it up). Tap the card for the
                full prompt history; rows open their own thread. */}
            <LiquidCard
              title="DELIVERED"
              onPress={() => setHistoryOpen(true)}
              style={{ marginTop: spacing.lg }}
              contentStyle={{ padding: 0, paddingTop: spacing.sm, paddingBottom: spacing.xl }}>
              {threads.length === 0 ? (
                <Text
                  style={{
                    color: GLASS.dim,
                    fontSize: fontSize.small,
                    padding: spacing.lg,
                    paddingTop: spacing.sm,
                  }}>
                  No conversations yet.
                </Text>
              ) : (
                threads.map((t, i) => (
                  <Pressable
                    key={t.id}
                    onPress={() => openThread(t.id)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: spacing.sm,
                      paddingHorizontal: spacing.lg,
                      paddingVertical: 15,
                      borderTopWidth: i === 0 ? 0 : 1,
                      borderTopColor: GLASS.line,
                      opacity: pressed ? 0.5 : 1,
                    })}>
                    {/* unread dot column: finished, not yet opened */}
                    <View
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 999,
                        marginTop: 7,
                        backgroundColor: t.unread ? GLASS.blue : 'transparent',
                      }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: GLASS.text,
                          fontSize: fontSize.small,
                          fontWeight: fontWeight.semibold,
                        }}
                        numberOfLines={1}>
                        {t.title}
                      </Text>
                      <Text
                        style={{ color: GLASS.dim, fontSize: fontSize.caption, marginTop: 2 }}
                        numberOfLines={1}>
                        {t.lastPreview}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: GLASS.faint,
                        fontSize: 11,
                        fontFamily: fontFamily.mono,
                        marginTop: 2,
                      }}>
                      {t.updatedAt}
                    </Text>
                  </Pressable>
                ))
              )}
            </LiquidCard>

          </ScrollView>

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
            <PulseMark size={220}>
              <View
                style={{
                  width: 80.5,
                  height: 80.5,
                  borderRadius: 24,
                  backgroundColor: AGENT_MARK,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#1A1F3B',
                  shadowOpacity: 0.18,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: 6,
                }}>
                {/* Eyes */}
                <View style={{ flexDirection: 'row', gap: 15, marginBottom: 11 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: '#FFFFFF' }} />
                  <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: '#FFFFFF' }} />
                </View>
                {/* Mouth */}
                <View
                  style={{
                    width: 27,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: 'rgba(255,255,255,0.85)',
                  }}
                />
              </View>
            </PulseMark>

            {/* Headline */}
            <Text
              style={{
                color: FIG_TEXT,
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
                color: FIG_TEXT,
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
                backgroundColor: colors.accent,
                borderRadius: radius.lg,
                paddingVertical: spacing.lg,
                alignItems: 'center',
              }}>
              <Text
                style={{
                  color: colors.accentText,
                  fontSize: fontSize.bodyLg,
                  fontFamily: fontFamily.semibold,
                }}>
                Get started
              </Text>
            </View>
          </Pressable>
        </ScrollView>
      )}
      <DevReset />
    </SafeAreaView>
  );
}
