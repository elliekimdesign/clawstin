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
// Words appear only for exceptions, as TRANSLATIONS not verdicts;
// the green dot alone says healthy.
const STATE_LABEL: Record<ServiceState, string> = {
  operational: '',
  degraded: 'slow',
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
  /** the popover is a summary with doors; this is the door to system settings */
  onOpenSettings: () => void;
  /** distance from the top of the containing SafeAreaView to the panel */
  topOffset: number;
};

function ServiceRow({
  s,
  onIssue,
  onOpen,
}: {
  s: ServiceStatus;
  onIssue: () => void;
  /** healthy rows are doors too: they open their settings home */
  onOpen: () => void;
}) {
  const broken = s.state !== 'operational';
  // the user's world: the core service IS the connection to the server.
  // Sentence case throughout — model names are proper nouns, so the
  // lowercase terminal grammar read as a mistake next to them.
  const displayName = s.id === 'core' ? 'Connection' : s.name;
  return (
    <Pressable
      onPress={broken ? onIssue : onOpen}
      style={({ pressed }) => ({ paddingVertical: 10, opacity: pressed ? 0.55 : 1 })}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <Text
          style={{ color: PANEL_TEXT, fontFamily: fontFamily.mono, fontSize: 13, flexShrink: 1 }}
          numberOfLines={1}>
          {displayName}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 }}>
          {s.pingMs != null ? (
            <Text style={{ color: PANEL_DIM, fontFamily: fontFamily.mono, fontSize: 12 }}>
              {`${s.pingMs}ms`}
            </Text>
          ) : null}
          {broken ? (
            <Text
              style={{ color: STATE_COLOR[s.state], fontFamily: fontFamily.mono, fontSize: 12 }}>
              {STATE_LABEL[s.state]}
            </Text>
          ) : null}
          <View
            style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: STATE_COLOR[s.state] }}
          />
          <Ionicons name="chevron-forward" size={12} color={PANEL_FAINT} />
        </View>
      </View>
      {/* exceptions carry their cause; healthy rows say nothing */}
      {broken && s.reason ? (
        <Text
          style={{
            color: STATE_COLOR[s.state],
            fontFamily: fontFamily.mono,
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
export function StatusPopover({
  services,
  agentsReady,
  onClose,
  onManageAccess,
  onOpenSettings,
  topOffset,
}: Props) {
  const worst = worstServiceState(services);
  const healthy = worst === 'operational';
  // the headline speaks human: what it MEANS for you, not a verdict
  const summary =
    worst === 'down'
      ? 'Some services are unreachable'
      : worst === 'degraded'
        ? 'Responses may be slower than usual'
        : "Everything's running";

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
          borderColor: 'rgba(22,24,28,0.1)',
          shadowColor: '#16181C',
          shadowOpacity: 0.22,
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
          <Text
            style={{
              color: 'rgba(22,24,28,0.55)',
              fontFamily: fontFamily.mono,
              fontSize: 10,
              letterSpacing: 0.3,
            }}>
            SYSTEM STATUS
          </Text>
        </View>
        <View style={{ height: 1, backgroundColor: 'rgba(22,24,28,0.1)' }} />
        <View style={{ paddingVertical: spacing.md, paddingHorizontal: spacing.lg }}>
        {/* the summary is a CONCLUSION, not a title: the "Online" pill
            already declared health, so this line sits small and quiet
            next to its dot — the detail rows are the stars here */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 2 }}>
          <View
            style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: STATE_COLOR[worst] }}
          />
          <Text
            style={{
              color: healthy ? PANEL_DIM : STATE_COLOR[worst],
              fontFamily: fontFamily.mono,
              fontSize: 11,
            }}>
            {summary}
          </Text>
        </View>

        {/* SYSTEM: core services + one agents summary (details = Crew tab) */}
        <View style={{ marginTop: spacing.sm }}>
          {core.map((s) => (
            <ServiceRow key={s.id} s={s} onIssue={onManageAccess} onOpen={onOpenSettings} />
          ))}
          <Pressable
            onPress={openCrew}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 9,
              opacity: pressed ? 0.55 : 1,
            })}>
            <Text style={{ color: PANEL_TEXT, fontFamily: fontFamily.mono, fontSize: 13 }}>
              Crew
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: PANEL_DIM, fontFamily: fontFamily.mono, fontSize: 12 }}>
                {`${agentsReady} ready`}
              </Text>
              <View
                style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: sysColor.ready }}
              />
              <Ionicons name="chevron-forward" size={12} color={PANEL_FAINT} />
            </View>
          </Pressable>

          {llm.map((s) => (
            <ServiceRow key={s.id} s={s} onIssue={onManageAccess} onOpen={onOpenSettings} />
          ))}
        </View>

        </View>
        {/* White footer strip, the title bar's twin. When something is
            wrong the loud row is about the problem; the settings door
            is always there — status is where you come to act. */}
        <View style={{ height: 1, backgroundColor: 'rgba(22,24,28,0.1)' }} />
        {!healthy ? (
          <>
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
            <View style={{ height: 1, backgroundColor: DIVIDER }} />
          </>
        ) : null}
        <Pressable
          onPress={onOpenSettings}
          style={({ pressed }) => ({
            backgroundColor: 'rgba(255,255,255,0.9)',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            opacity: pressed ? 0.55 : 1,
          })}>
          <Text style={{ color: PANEL_DIM, fontFamily: fontFamily.medium, fontSize: fontSize.small }}>
            System settings
          </Text>
          <Ionicons name="chevron-forward" size={13} color={PANEL_FAINT} />
        </Pressable>
      </Animated.View>
    </Pressable>
  );
}

export default StatusPopover;
