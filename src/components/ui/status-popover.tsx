import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import type { ServiceState, ServiceStatus } from '@/mock/services';
import { fontFamily, fontSize, radius, spacing, sysColor } from '@/theme/theme';

// Section-window tokens (2026-07-11): the popover is the status chip
// UNFOLDED — same silver pane + ink text as the Home board's section
// windows (the dark console version lives in git).
const PANEL_BG = '#EFF1F3';
const PANEL_TEXT = 'rgba(22,24,28,0.95)';
const PANEL_DIM = 'rgba(22,24,28,0.6)';
const PANEL_FAINT = 'rgba(22,24,28,0.42)';
const DIVIDER = 'rgba(22,24,28,0.08)';

// Exactly three states, 1:1 with the semantic system colors — the dot
// alone should read, and it must match the header chip's grammar.
const STATE_COLOR: Record<ServiceState, string> = {
  operational: sysColor.ready,
  degraded: sysColor.degraded,
  down: sysColor.fail,
};
// System rows (Core, Gateway, models) speak infra: operational /
// degraded / offline. Agents are people-like and say "ready" instead
// (the Agents row below formats its own `N ready` label).
// lowercase like every status word in the app (header `degraded`, card
// `needs you` / `running`) — one log language everywhere.
const STATE_LABEL: Record<ServiceState, string> = {
  operational: 'operational',
  degraded: 'degraded',
  down: 'offline',
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
        // a clear step below the SYSTEM STATUS title: fainter AND
        // smaller, so "title vs divider" reads as two layers
        color: PANEL_FAINT,
        fontWeight: '600',
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
          style={{ color: PANEL_TEXT, fontWeight: '600', fontSize: 13, flexShrink: 1 }}
          numberOfLines={1}>
          {s.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8 }}>
          {s.pingMs != null ? (
            <Text style={{ color: PANEL_FAINT, fontSize: 11 }}>{s.pingMs}ms</Text>
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
          borderRadius: 16,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(22,24,28,0.14)',
          shadowColor: '#16181C',
          shadowOpacity: 0.35,
          shadowRadius: 28,
          shadowOffset: { width: 0, height: 10 },
          elevation: 12,
        }}>
        {/* the sections' own chrome: white title bar with the window
            dots, then the hairline sill — this popover IS the status
            chip unfolded into a full section window */}
        <View
          style={{
            height: 30,
            backgroundColor: 'rgba(255,255,255,0.9)',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.lg,
          }}>
          <View style={{ flexDirection: 'row', gap: 3.5, marginRight: 8 }}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 999,
                  backgroundColor: '#9FC0EC',
                }}
              />
            ))}
          </View>
          <Text
            style={{
              color: 'rgba(22,24,28,0.55)',
              fontWeight: '600',
              fontSize: 11,
              letterSpacing: 1,
            }}>
            SYSTEM STATUS
          </Text>
        </View>
        <View style={{ height: 1, backgroundColor: 'rgba(22,24,28,0.1)' }} />
        <View style={{ paddingVertical: spacing.md, paddingHorizontal: spacing.lg }}>
        <Text
            style={{
            color: PANEL_TEXT,
            fontFamily: fontFamily.semibold,
            fontSize: fontSize.small,
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
            <Text style={{ color: PANEL_TEXT, fontWeight: '600', fontSize: 13 }}>Agents</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View
                style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: sysColor.ready }}
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

        </View>
        {/* When something is wrong the CTA is about the problem, not
            admin — a white footer strip, the title bar's twin */}
        {!healthy ? (
          <>
            <View style={{ height: 1, backgroundColor: 'rgba(22,24,28,0.1)' }} />
            <Pressable
              onPress={onManageAccess}
              style={({ pressed }) => ({
                backgroundColor: 'rgba(255,255,255,0.9)',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: spacing.md,
                opacity: pressed ? 0.55 : 1,
              })}>
              <Text style={{ color: PANEL_TEXT, fontFamily: fontFamily.semibold, fontSize: fontSize.small }}>
                View issue
              </Text>
              <Ionicons name="arrow-forward" size={14} color={PANEL_TEXT} />
            </Pressable>
          </>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

export default StatusPopover;
