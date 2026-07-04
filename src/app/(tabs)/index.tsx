import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DevReset } from '@/components/dev/dev-reset';
import { ApprovalCard } from '@/components/ui/approval-card';
import { AuroraLine } from '@/components/ui/aurora-line';
import { Card } from '@/components/ui/card';
import { GlassIconButton } from '@/components/ui/glass-icon-button';
import { MeshBg } from '@/components/ui/mesh-bg';
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

// Color-block bento palette (trakmac-style vivid tiles).
const BENTO = {
  orange: '#FF4A32',
  yellow: '#E8B93E',
  mint: '#C9E3DA',
  charcoal: '#1A1C21',
  cream: '#F2EFE9',
  onDark: '#FFFFFF',
  onDarkDim: 'rgba(255,255,255,0.72)',
  onLight: '#16181D',
  onLightDim: 'rgba(22,24,29,0.60)',
  creamLine: 'rgba(22,24,29,0.06)',
};

/** A flat color-block tile. Pressable when onPress is given. */
function Tile({
  bg,
  onPress,
  style,
  children,
}: {
  bg: string;
  onPress?: () => void;
  style?: ViewStyle;
  children: ReactNode;
}) {
  const base: ViewStyle = {
    backgroundColor: bg,
    borderRadius: radius.xl,
    padding: spacing.xl,
    overflow: 'hidden',
    ...style,
  };
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ ...base, opacity: pressed ? 0.9 : 1 })}>
      {children}
    </Pressable>
  );
}

/** Small uppercase eyebrow label used on every tile. */
function Eyebrow({ children, color }: { children: ReactNode; color: string }) {
  return (
    <Text
      style={{
        color,
        fontSize: fontSize.caption,
        fontFamily: fontFamily.semibold,
        letterSpacing: 0.8,
      }}>
      {children}
    </Text>
  );
}

/** Top-right corner affordance: a small circle holding an icon (or a dot). */
function Corner({
  icon,
  iconColor,
  bg,
  rotate,
  dot,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  bg?: string;
  rotate?: boolean;
  dot?: string;
}) {
  return (
    <View
      style={{
        position: 'absolute',
        top: spacing.lg,
        right: spacing.lg,
        width: dot ? 10 : 30,
        height: dot ? 10 : 30,
        borderRadius: 999,
        backgroundColor: dot ?? bg ?? 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {icon ? (
        <Ionicons
          name={icon}
          size={16}
          color={iconColor}
          style={rotate ? { transform: [{ rotate: '45deg' }] } : undefined}
        />
      ) : null}
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* Pearl gradient behind onboarding only (state board stays plain) */}
      {!connected && <MeshBg />}
      {connected ? (
        // ───────────────────────── State board ─────────────────────────
        <>
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
                  iconColor={colors.textSecondary}
                  style={{ marginTop: 2 }}
                />
                <Text
                  style={{
                    color: colors.text,
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
                <Text style={{ color: colors.textTertiary, fontSize: fontSize.small }}>
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
                  <Text style={{ color: colors.textSecondary, fontSize: fontSize.small }}>
                    {statusLabel}
                  </Text>
                  <Ionicons name="chevron-down" size={12} color={colors.textTertiary} />
                </Pressable>
              </View>
            </View>

            {/* HERO — Ask (orange color block) */}
            <Tile
              bg={BENTO.orange}
              onPress={startChat}
              style={{ marginTop: spacing.xl, paddingVertical: spacing.xxl }}>
              <Corner icon="arrow-up" iconColor={BENTO.orange} bg={BENTO.onDark} rotate />
              <Eyebrow color={BENTO.onDarkDim}>ORCHESTRATE</Eyebrow>
              <Text
                style={{
                  color: BENTO.onDark,
                  fontSize: 30,
                  lineHeight: 34,
                  minHeight: 68, // keep the original 2-line hero height
                  letterSpacing: -0.5,
                  fontFamily: fontFamily.bold,
                  marginTop: spacing.sm,
                }}>
                Start a task
              </Text>
            </Tile>

            {/* Action row: New task (yellow) + Approvals count (charcoal) */}
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
              <Tile
                bg={BENTO.yellow}
                onPress={() => router.navigate('/(tabs)/activity')}
                style={{ flex: 1 }}>
                <Corner
                  icon={running.length > 0 ? 'sync' : 'checkmark'}
                  iconColor={BENTO.onDark}
                  bg={BENTO.charcoal}
                />
                <Eyebrow color={BENTO.onLightDim}>
                  {running.length > 0 ? 'RUNNING NOW' : 'ALL CLEAR'}
                </Eyebrow>
                <Text
                  style={{
                    color: BENTO.onLight,
                    fontSize: fontSize.title,
                    fontFamily: fontFamily.bold,
                    marginTop: spacing.xl,
                  }}>
                  {running.length > 0 ? `${running.length} active` : 'No tasks'}
                </Text>
              </Tile>

              <Tile bg={BENTO.charcoal} onPress={scrollToApprovals} style={{ flex: 1 }}>
                {approvals.length > 0 ? (
                  <Corner dot={BENTO.orange} />
                ) : (
                  <Corner icon="checkmark" iconColor={BENTO.onDark} bg="rgba(255,255,255,0.14)" />
                )}
                <Eyebrow color={BENTO.onDarkDim}>NEEDS APPROVAL</Eyebrow>
                <Text
                  style={{
                    color: BENTO.onDark,
                    fontSize: 40,
                    lineHeight: 44,
                    fontFamily: fontFamily.bold,
                    marginTop: spacing.sm,
                  }}>
                  {approvals.length}
                </Text>
                <Text style={{ color: BENTO.onDarkDim, fontSize: fontSize.caption, marginTop: 2 }}>
                  waiting for you
                </Text>
              </Tile>
            </View>

            {/* Agent voice block (mint) — opens Muppet's calendar view */}
            <Tile
              bg={BENTO.mint}
              onPress={() => router.push('/calendar')}
              style={{ marginTop: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: radius.sm,
                    backgroundColor: BENTO.charcoal,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Ionicons name="sparkles" size={13} color={BENTO.onDark} />
                </View>
                <Eyebrow color={BENTO.onLightDim}>{AGENT_NAME.toUpperCase()}</Eyebrow>
              </View>
              <Text
                style={{
                  color: BENTO.onLight,
                  fontSize: fontSize.bodyLg,
                  fontFamily: fontFamily.semibold,
                  marginTop: spacing.md,
                }}>
                {running.length > 0 ? running[0].label : 'Ready when you are.'}
              </Text>
              <Pressable
                onPress={startChat}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  alignSelf: 'flex-start',
                  gap: 6,
                  marginTop: spacing.lg,
                  backgroundColor: BENTO.charcoal,
                  borderRadius: radius.pill,
                  paddingVertical: 8,
                  paddingHorizontal: spacing.md,
                  opacity: pressed ? 0.9 : 1,
                })}>
                <Text
                  style={{
                    color: BENTO.onDark,
                    fontSize: fontSize.small,
                    fontFamily: fontFamily.semibold,
                  }}>
                  Ask {AGENT_NAME}
                </Text>
                <Ionicons
                  name="arrow-up"
                  size={13}
                  color={BENTO.onDark}
                  style={{ transform: [{ rotate: '45deg' }] }}
                />
              </Pressable>
            </Tile>

            {/* Recent (cream list block) */}
            <Tile bg={BENTO.cream} style={{ marginTop: spacing.md, padding: 0 }}>
              <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm }}>
                <Eyebrow color={BENTO.onLightDim}>RECENT</Eyebrow>
              </View>
              {threads.length === 0 ? (
                <Text
                  style={{
                    color: BENTO.onLightDim,
                    fontSize: fontSize.body,
                    padding: spacing.lg,
                    paddingTop: 0,
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
                      borderTopColor: BENTO.creamLine,
                      opacity: pressed ? 0.5 : 1,
                    })}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: BENTO.onLight,
                          fontSize: fontSize.body,
                          fontWeight: fontWeight.semibold,
                        }}
                        numberOfLines={1}>
                        {t.title}
                      </Text>
                      <Text
                        style={{ color: BENTO.onLightDim, fontSize: fontSize.small, marginTop: 2 }}
                        numberOfLines={1}>
                        {t.lastPreview}
                      </Text>
                    </View>
                    <Text
                      style={{ color: colors.textTertiary, fontSize: fontSize.caption, marginTop: 1 }}>
                      {t.updatedAt}
                    </Text>
                  </Pressable>
                ))
              )}
            </Tile>

            {/* Needs your approval — kept as ApprovalCard rows (Deny/Review intact) */}
            <View onLayout={(e) => setApprovalsY(e.nativeEvent.layout.y)}>
              <SectionHeader
                title="NEEDS YOUR APPROVAL"
                trailing={approvals.length ? `${approvals.length}` : undefined}
              />
              {approvals.length === 0 ? (
                <Card>
                  <Text style={{ color: colors.textSecondary, fontSize: fontSize.body }}>
                    You’re all caught up.
                  </Text>
                </Card>
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
