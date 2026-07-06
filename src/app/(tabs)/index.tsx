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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DevReset } from '@/components/dev/dev-reset';
import { ApprovalCard } from '@/components/ui/approval-card';
import { AuroraLine } from '@/components/ui/aurora-line';
import { Card } from '@/components/ui/card';
import { GlassIconButton } from '@/components/ui/glass-icon-button';
import { BlissSwooshBg } from '@/components/ui/bliss-swoosh-bg';
import { PulseMark } from '@/components/ui/pulse-mark';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusPopover, worstServiceState } from '@/components/ui/status-popover';
import { useAppStore } from '@/store/app-store';
import { colors, fontFamily, fontSize, fontWeight, radius, shadow, spacing } from '@/theme/theme';

const USER_NAME = 'Seohyeon';
const AGENT_NAME = 'Muppet';

// Onboarding step 2 — ways to pair with an agent.
const PAIR_OPTIONS: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
}[] = [
  {
    icon: 'qr-code-outline',
    title: 'Use a pairing code',
    desc: 'Scan a QR code or paste a link from your agent setup.',
  },
  {
    icon: 'create-outline',
    title: 'Enter connection details',
    desc: 'Use this if you already have an address or token.',
  },
  {
    icon: 'wifi-outline',
    title: 'Look nearby',
    desc: 'Find agents available on the same network.',
  },
];

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

// Cloud wisps for the hero card, as fractions of the card size.
// [cx, cy, rx, ry, rotation, peak opacity]
const CARD_CLOUDS: [number, number, number, number, number, number][] = [
  [0.12, 0.18, 0.42, 0.34, -10, 0.5],
  [0.62, 0.1, 0.46, 0.36, -8, 0.42],
  [0.34, 0.58, 0.5, 0.3, -12, 0.35],
  [0.82, 0.78, 0.4, 0.28, -6, 0.3],
];

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
  const base: ViewStyle = {
    borderRadius: 22,
    overflow: 'hidden',
    // One quiet hairline is the whole edge treatment: the material (blur +
    // translucency) does the rest. Stacked gradient rims read as a halo.
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    // A low-alpha base gives iOS a layer to draw the drop shadow from
    // (children are clipped by overflow, so they can't cast it).
    backgroundColor: onTint ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)',
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
      {GLASS_AVAILABLE ? (
        <GlassView
          // "regular" carries the real frost/blur; the light cards fade the
          // layer to ~half so the field still shows through — blurred AND
          // transparent, sitting between the frosty and clear extremes.
          glassEffectStyle="regular"
          colorScheme="light"
          style={[StyleSheet.absoluteFill, !onTint && { opacity: 0.55 }]}
          pointerEvents="none"
        />
      ) : null}
      {/* a whisper of white veil (light cards), or the blue tint for the
          hero, over the glass */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <SvgGradient id="veil" x1="0" y1="0" x2="0" y2="1">
            <Stop
              offset="0%"
              stopColor={tint ? tint[0] : '#FFFFFF'}
              stopOpacity={tint ? 0.92 : 0.06}
            />
            <Stop
              offset="100%"
              stopColor={tint ? tint[1] : '#FFFFFF'}
              stopOpacity={tint ? 0.92 : 0}
            />
          </SvgGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#veil)" />
      </Svg>
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
              color: onTint ? 'rgba(255,255,255,0.85)' : GLASS.title,
              fontSize: 11,
              fontFamily: fontFamily.semibold,
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

/** Round action circle pinned to the card content's top-right. */
function CornerCircle({
  icon,
  iconColor,
  bg,
  rotate,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bg: string;
  rotate?: boolean;
}) {
  return (
    <View
      style={{
        position: 'absolute',
        top: 12,
        right: spacing.lg,
        width: 30,
        height: 30,
        borderRadius: 999,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Ionicons
        name={icon}
        size={16}
        color={iconColor}
        style={rotate ? { transform: [{ rotate: '45deg' }] } : undefined}
      />
    </View>
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
    threads,
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

  // Onboarding has two steps: 0 = agent-mark intro, 1 = value-props list.
  const [onbStep, setOnbStep] = useState(0);
  // When disconnected (incl. dev reset), restart onboarding from step 1.
  useEffect(() => {
    if (!connected) setOnbStep(0);
  }, [connected]);

  const now = new Date();
  const hello = greeting(now.getHours());
  const dateLabel = `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`;

  const startChat = () => router.push(`/chat/${createThread()}`);
  const openThread = (id: string) => router.push(`/chat/${id}`);

  // Scroll-to-approvals (the charcoal count tile jumps here).
  const scrollRef = useRef<ScrollView>(null);
  const [approvalsY, setApprovalsY] = useState(0);
  const scrollToApprovals = () => scrollRef.current?.scrollTo({ y: approvalsY, animated: true });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: GLASS.bg }} edges={['top']}>
      {connected ? <StatusBar style="dark" /> : null}
      {/* The whole first-run flow lives on the same lavender_swoosh field */}
      {!connected && <BlissSwooshBg />}
      {connected ? (
        // ───────────────────────── State board ─────────────────────────
        <>
          <BlissSwooshBg />
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
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
                <GlassIconButton
                  icon="person-circle-outline"
                  onPress={() => router.push('/access')}
                  size={34}
                  iconSize={22}
                  iconColor={GLASS.blue}
                  style={{ marginTop: 2 }}
                />
                <Text
                  style={{
                    color: GLASS.text,
                    fontSize: fontSize.largeTitle,
                    fontWeight: fontWeight.bold,
                    letterSpacing: -0.5,
                    lineHeight: 32,
                  }}>
                  {hello},{'\n'}
                  {USER_NAME}
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end', paddingTop: 4 }}>
                <Text style={{ color: GLASS.faint, fontSize: fontSize.small }}>
                  {dateLabel}
                </Text>
                <Pressable
                  onPress={() => setStatusOpen(true)}
                  hitSlop={8}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 4,
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

            {/* HERO — the chat-blue tinted glass window, opens a new chat */}
            <LiquidCard
              title="ORCHESTRATE"
              tint={['#2E7CD6', '#1B5FB8']}
              clouds
              onPress={startChat}
              style={{ marginTop: spacing.xl, height: 150 }}
              contentStyle={{
                flex: 1,
                justifyContent: 'flex-end',
                paddingHorizontal: 20,
                paddingBottom: 32,
              }}>
              <CornerCircle icon="arrow-up" iconColor={GLASS.blue} bg="#FFFFFF" rotate />
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 30,
                  lineHeight: 34,
                  letterSpacing: -0.5,
                  fontFamily: fontFamily.bold,
                }}>
                Start a task
              </Text>
            </LiquidCard>

            {/* Action row: tasks state + approvals count */}
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
              <LiquidCard
                title={running.length > 0 ? 'RUNNING NOW' : 'ALL CLEAR'}
                onPress={() => router.navigate('/(tabs)/activity')}
                style={{ flex: 1, height: 124 }}
                contentStyle={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 21 }}>
                <CornerCircle
                  icon={running.length > 0 ? 'sync' : 'checkmark'}
                  iconColor="#FFFFFF"
                  bg={GLASS.blue}
                />
                <Text
                  style={{
                    color: GLASS.text,
                    fontSize: fontSize.title,
                    fontFamily: fontFamily.bold,
                  }}>
                  {running.length > 0 ? `${running.length} active` : 'No tasks'}
                </Text>
              </LiquidCard>

              <LiquidCard
                title="NEEDS APPROVAL"
                dot={approvals.length > 0 ? GLASS.dotAlert : undefined}
                onPress={scrollToApprovals}
                style={{ flex: 1, height: 124 }}
                contentStyle={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 21 }}>
                <Text
                  style={{
                    color: GLASS.blue,
                    fontSize: 38,
                    lineHeight: 42,
                    fontFamily: fontFamily.bold,
                  }}>
                  {approvals.length}
                </Text>
                <Text style={{ color: GLASS.dim, fontSize: fontSize.caption, marginTop: 2 }}>
                  waiting for you
                </Text>
              </LiquidCard>
            </View>

            {/* Agent voice window — opens Muppet's calendar view */}
            <LiquidCard
              title={AGENT_NAME.toUpperCase()}
              onPress={() => router.push('/calendar')}
              style={{ marginTop: spacing.md, height: 136 }}
              contentStyle={{ flex: 1, paddingBottom: 22 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                {/* Muppet's round character face (profile spot) */}
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 999,
                    backgroundColor: GLASS.avatar,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 4 }}>
                    <View
                      style={{ width: 4.5, height: 4.5, borderRadius: 999, backgroundColor: '#FFFFFF' }}
                    />
                    <View
                      style={{ width: 4.5, height: 4.5, borderRadius: 999, backgroundColor: '#FFFFFF' }}
                    />
                  </View>
                  <View
                    style={{
                      width: 11,
                      height: 2.5,
                      borderRadius: 2,
                      backgroundColor: 'rgba(255,255,255,0.9)',
                    }}
                  />
                </View>
                <Text
                  style={{
                    color: GLASS.text,
                    fontSize: fontSize.bodyLg,
                    fontFamily: fontFamily.semibold,
                    flex: 1,
                  }}
                  numberOfLines={1}>
                  {running.length > 0 ? running[0].label : 'Ready when you are.'}
                </Text>
              </View>
              <Pressable
                onPress={startChat}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  alignSelf: 'flex-start',
                  gap: 6,
                  marginTop: spacing.lg,
                  backgroundColor: GLASS.ink,
                  borderRadius: radius.pill,
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  opacity: pressed ? 0.9 : 1,
                })}>
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: fontSize.small,
                    fontFamily: fontFamily.semibold,
                  }}>
                  Ask {AGENT_NAME}
                </Text>
                <Ionicons
                  name="arrow-up"
                  size={13}
                  color="#FFFFFF"
                  style={{ transform: [{ rotate: '45deg' }] }}
                />
              </Pressable>
            </LiquidCard>

            {/* Recent (glass list window) */}
            <LiquidCard
              title="RECENT"
              style={{ marginTop: spacing.md }}
              contentStyle={{ padding: 0, paddingTop: spacing.sm, paddingBottom: spacing.xl }}>
              {threads.length === 0 ? (
                <Text
                  style={{
                    color: GLASS.dim,
                    fontSize: fontSize.body,
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
                      gap: spacing.md,
                      paddingHorizontal: spacing.lg,
                      paddingVertical: spacing.md,
                      borderTopWidth: i === 0 ? 0 : 1,
                      borderTopColor: GLASS.line,
                      opacity: pressed ? 0.5 : 1,
                    })}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: GLASS.text,
                          fontSize: fontSize.body,
                          fontWeight: fontWeight.semibold,
                        }}
                        numberOfLines={1}>
                        {t.title}
                      </Text>
                      <Text
                        style={{ color: GLASS.dim, fontSize: fontSize.small, marginTop: 2 }}
                        numberOfLines={1}>
                        {t.lastPreview}
                      </Text>
                    </View>
                    <Text
                      style={{ color: GLASS.faint, fontSize: fontSize.caption, marginTop: 1 }}>
                      {t.updatedAt}
                    </Text>
                  </Pressable>
                ))
              )}
            </LiquidCard>

            {/* Needs your approval — kept as ApprovalCard rows (Deny/Review intact) */}
            <View onLayout={(e) => setApprovalsY(e.nativeEvent.layout.y)}>
              <SectionHeader
                title="NEEDS YOUR APPROVAL"
                trailing={approvals.length ? `${approvals.length}` : undefined}
              />
              {approvals.length === 0 ? (
                <LiquidCard contentStyle={{ paddingTop: spacing.lg }}>
                  <Text style={{ color: GLASS.dim, fontSize: fontSize.body }}>
                    You’re all caught up.
                  </Text>
                </LiquidCard>
              ) : (
                <View style={{ gap: spacing.md }}>
                  {approvals.map((a) => (
                    <ApprovalCard
                      key={a.id}
                      approval={a}
                      onApprove={(x) => resolveApproval(x, true)}
                      onDeny={(x) => resolveApproval(x, false)}
                      onReview={(x) => router.push(`/approval/${x.id}`)}
                    />
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Connection status popover (over the board) */}
          {statusOpen ? (
            <StatusPopover
              services={services}
              onClose={() => setStatusOpen(false)}
              onManageAccess={() => {
                setStatusOpen(false);
                router.push('/access?focus=infra');
              }}
              topOffset={insets.top + 96}
            />
          ) : null}
        </>
      ) : onbStep === 0 ? (
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

          {/* CTA → next step */}
          <Pressable
            onPress={() => setOnbStep(1)}
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
      ) : (
        // ──────────────────── Onboarding · Step 2 (pairing) ────────────────────
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 110, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}>
          {/* Signature aurora line */}
          <View style={{ marginTop: 104 }}>
            <AuroraLine width={contentW} height={3} opacity={0.55} animated={false} glow={false} />
          </View>

          {/* Headline */}
          <Text
            style={{
              color: FIG_TEXT,
              fontSize: 34,
              fontFamily: fontFamily.semibold,
              letterSpacing: -0.85,
              lineHeight: 41,
              marginTop: spacing.xl,
            }}>
            How do you{'\n'}want to pair?
          </Text>

          {/* Pairing options */}
          <View style={{ marginTop: spacing.xxl, gap: spacing.md }}>
            {PAIR_OPTIONS.map((opt) => (
              <Pressable
                key={opt.title}
                onPress={() => setConnected(true)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.lg,
                  backgroundColor: colors.card,
                  borderRadius: radius.lg,
                  ...shadow.card,
                  opacity: pressed ? 0.7 : 1,
                })}>
                {/* Icon chip — soft blue, matches the agent mark */}
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: radius.md,
                    backgroundColor: BRAND_SOFT,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Ionicons name={opt.icon} size={22} color={BRAND} />
                </View>
                {/* Title + desc */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: FIG_TEXT,
                      fontSize: fontSize.bodyLg,
                      fontFamily: fontFamily.semibold,
                    }}>
                    {opt.title}
                  </Text>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: fontSize.small,
                      lineHeight: 18,
                      marginTop: 3,
                    }}>
                    {opt.desc}
                  </Text>
                </View>
                {/* Chevron */}
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
      <DevReset />
    </SafeAreaView>
  );
}
