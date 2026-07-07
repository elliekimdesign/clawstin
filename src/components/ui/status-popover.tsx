import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import type { ServiceState, ServiceStatus } from '@/mock/services';
import { colors, fontFamily, fontSize, radius, spacing } from '@/theme/theme';

// Dark-panel tokens — the SAME deep navy as the home Ask console and the
// calendar consoles: one system surface everywhere.
const PANEL_BG = '#0E1626';
const PANEL_TEXT = '#FFFFFF';
const PANEL_DIM = 'rgba(255,255,255,0.55)';
const PANEL_FAINT = 'rgba(255,255,255,0.38)';
const DIVIDER = 'rgba(255,255,255,0.08)';
const MONO = 'Menlo';

// Exactly three states, 1:1 with colors — the dot alone should read.
const STATE_COLOR: Record<ServiceState, string> = {
  operational: colors.success,
  degraded: colors.warning,
  down: colors.danger,
};
const STATE_LABEL: Record<ServiceState, string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  down: 'Offline',
};

/** Worst (most severe) state across services — drives the header dot + summary. */
export function worstServiceState(services: ServiceStatus[]): ServiceState {
  const ORDER: ServiceState[] = ['operational', 'degraded', 'down'];
  return services.reduce<ServiceState>(
    (w, s) => (ORDER.indexOf(s.state) > ORDER.indexOf(w) ? s.state : w),
    'operational'
  );
}

type Props = {
  services: ServiceStatus[];
  /** how many crew agents are active — one summary line, details live in Crew */
  agentsReady: number;
  onClose: () => void;
  onManageAccess: () => void;
  /** distance from the top of the containing SafeAreaView to the panel */
  topOffset: number;
};

function GroupLabel({ text, first }: { text: string; first?: boolean }) {
  return (
    <Text
      style={{
        color: PANEL_FAINT,
        fontFamily: MONO,
        fontSize: 10,
        letterSpacing: 1.2,
        marginTop: first ? 0 : spacing.md,
        marginBottom: 2,
        paddingTop: first ? 0 : spacing.md,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: DIVIDER,
      }}>
      {text}
    </Text>
  );
}

function ServiceRow({ s, onIssue }: { s: ServiceStatus; onIssue: () => void }) {
  const broken = s.state !== 'operational';
  return (
    <Pressable
      disabled={!broken}
      onPress={onIssue}
      style={({ pressed }) => ({ paddingVertical: 7, opacity: pressed ? 0.55 : 1 })}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <Text
          style={{ color: PANEL_TEXT, fontFamily: MONO, fontSize: 13, flexShrink: 1 }}
          numberOfLines={1}>
          {s.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8 }}>
          {s.pingMs != null ? (
            <Text style={{ color: PANEL_FAINT, fontFamily: MONO, fontSize: 11 }}>
              {s.pingMs}ms
            </Text>
          ) : null}
          <View
            style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: STATE_COLOR[s.state] }}
          />
          <Text style={{ color: PANEL_DIM, fontSize: 12 }}>{STATE_LABEL[s.state]}</Text>
        </View>
      </View>
      {/* the popover exists to answer "why is the header dot amber" —
          non-operational rows carry their cause */}
      {s.state !== 'operational' && s.reason ? (
        <Text
          style={{
            color: STATE_COLOR[s.state],
            fontFamily: MONO,
            fontSize: 11,
            marginTop: 3,
          }}>
          {'↳'} {s.reason}
        </Text>
      ) : null}
    </Pressable>
  );
}

/**
 * System/infra healthcheck panel: dark console-family dropdown grouped into
 * SYSTEM / MODELS, one Agents summary line (details live in Crew), causes on
 * unhealthy rows, and a conditional "View issue →" deep-link when something
 * is wrong. Tapping the scrim dismisses it.
 */
export function StatusPopover({ services, agentsReady, onClose, onManageAccess, topOffset }: Props) {
  const worst = worstServiceState(services);
  const healthy = worst === 'operational';
  const summary =
    worst === 'down'
      ? 'Service disruption'
      : worst === 'degraded'
        ? 'Partial degradation'
        : 'All systems operational';

  const core = services.filter((s) => s.group === 'core');
  const llm = services.filter((s) => s.group === 'llm');

  const openCrew = () => {
    onClose();
    router.navigate('/(tabs)/crew');
  };

  return (
    <Pressable
      onPress={onClose}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Animated.View
        entering={FadeInUp.duration(160)}
        style={{
          position: 'absolute',
          top: topOffset,
          right: spacing.lg,
          width: 300,
          backgroundColor: PANEL_BG,
          borderRadius: radius.lg,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.28)',
          shadowColor: '#000',
          shadowOpacity: 0.35,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 12 },
          elevation: 12,
        }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: STATE_COLOR[worst] }}
          />
          <Text style={{ color: PANEL_DIM, fontFamily: MONO, fontSize: 11, letterSpacing: 1.2 }}>
            SYSTEM STATUS
          </Text>
        </View>
        <Text
          style={{
            color: PANEL_TEXT,
            fontFamily: fontFamily.semibold,
            fontSize: fontSize.small,
            marginTop: 6,
          }}>
          {summary}
        </Text>

        {/* SYSTEM: core services + one agents summary (details = Crew tab) */}
        <View style={{ marginTop: spacing.md }}>
          <GroupLabel text="SYSTEM" first />
          {core.map((s) => (
            <ServiceRow key={s.id} s={s} onIssue={onManageAccess} />
          ))}
          <Pressable
            onPress={openCrew}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 7,
              opacity: pressed ? 0.55 : 1,
            })}>
            <Text style={{ color: PANEL_TEXT, fontFamily: MONO, fontSize: 13 }}>Agents</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View
                style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: colors.success }}
              />
              <Text style={{ color: PANEL_DIM, fontSize: 12 }}>{agentsReady} ready</Text>
              <Ionicons name="chevron-forward" size={12} color={PANEL_FAINT} />
            </View>
          </Pressable>

          <GroupLabel text="MODELS" />
          {llm.map((s) => (
            <ServiceRow key={s.id} s={s} onIssue={onManageAccess} />
          ))}
        </View>

        {/* When something is wrong the CTA is about the problem, not admin */}
        {!healthy ? (
          <Pressable
            onPress={onManageAccess}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              marginTop: spacing.md,
              paddingTop: spacing.md,
              borderTopWidth: 1,
              borderTopColor: DIVIDER,
              opacity: pressed ? 0.55 : 1,
            })}>
            <Text style={{ color: PANEL_TEXT, fontFamily: fontFamily.semibold, fontSize: fontSize.small }}>
              View issue
            </Text>
            <Ionicons name="arrow-forward" size={14} color={PANEL_TEXT} />
          </Pressable>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

export default StatusPopover;
