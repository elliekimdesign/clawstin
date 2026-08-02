import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import type { ServiceState, ServiceStatus } from '@/mock/services';
import { fontFamily, fontSize, spacing, sysColor } from '@/theme/theme';


// ACTIVITY PANEL (2026-07-28 "가장 최근에 러닝된거부터 그 systemactivity가
// 챗에 나오는거처럼"): the >_ key stopped opening a service healthcheck and
// now answers "what has the system been DOING" — the same receipt language
// as the chat run panel, on the same near-black face, newest run first.
// The service rows (Connection / models) live on in /settings; the frosted
// light plate and its title band live in git.
const PANEL_BG = '#0E1626'; // the >_ key's own face — one object, two states
const PANEL_TEXT = 'rgba(255,255,255,0.92)';
const PANEL_DIM = 'rgba(255,255,255,0.6)';
const PANEL_FAINT = 'rgba(255,255,255,0.4)';
const DIVIDER = 'rgba(255,255,255,0.1)';
// how far the scrim reaches ABOVE its container, to cover the status bar
const SCRIM_REACH = 120;

// Exactly three states, 1:1 with the semantic system colors — the dot
// alone should read, and it must match the header chip's grammar.
const STATE_COLOR: Record<ServiceState, string> = {
  operational: sysColor.ready,
  degraded: sysColor.degraded,
  down: sysColor.fail,
};

/** Worst (most severe) state across services — drives the header dot + summary. */
export function worstServiceState(services: ServiceStatus[]): ServiceState {
  const ORDER: ServiceState[] = ['operational', 'degraded', 'down'];
  return services.reduce<ServiceState>(
    (w, s) => (ORDER.indexOf(s.state) > ORDER.indexOf(w) ? s.state : w),
    'operational'
  );
}

/** the run's whole cost, summed from the trailing per-step timings the
 * archive lines carry ("… 1.54s") — one number where three used to be */
function totalTime(lines: string[]): string {
  let total = 0;
  let found = false;
  for (const l of lines) {
    const m = l.match(/(\d+(?:\.\d+)?)s\s*$/);
    if (m) {
      total += parseFloat(m[1]);
      found = true;
    }
  }
  if (!found) return '';
  return total >= 10 ? `${Math.round(total)}s` : `${total.toFixed(1)}s`;
}

/** one run block in the activity roll — the chat run panel's own anatomy */
export type ActivityRun = {
  key: string;
  threadId: string;
  /** the ask that triggered the run, or the thread's title as fallback */
  label?: string;
  lines: string[];
  failed?: boolean;
  /** still writing itself */
  live?: boolean;
};

type Props = {
  services: ServiceStatus[];
  /** newest first — the live run (if any) leads */
  runs: ActivityRun[];
  onClose: () => void;
  onManageAccess: () => void;
  /** the panel is a readout with doors; this is the door to system settings */
  onOpenSettings: () => void;
  /** tapping a run opens the thread it ran in */
  onOpenRun: (threadId: string) => void;
  /** distance from the top of the containing SafeAreaView to the panel */
  topOffset: number;
};

/**
 * System ACTIVITY panel behind the >_ key: the recent runs across every
 * thread as a receipt roll (newest first, chat run-panel grammar), one
 * quiet health line, and the settings door. Tapping the scrim dismisses.
 */
export function StatusPopover({
  services,
  runs,
  onClose,
  onManageAccess,
  onOpenSettings,
  onOpenRun,
  topOffset,
}: Props) {
  const worst = worstServiceState(services);
  const healthy = worst === 'operational';
  // ONE wording with the Home System card (2026-07-29): the card is the door
  // to this panel, so the two must not greet you with different sentences.
  const summary =
    worst === 'down'
      ? 'Some services are unreachable'
      : worst === 'degraded'
        ? 'Responses may be slower than usual'
        : 'All systems normal';

  return (
    <Pressable
      onPress={onClose}
      // a quiet scrim: mutes the busy cards behind so the dark panel
      // floats cleanly. It over-reaches past the container's top so the
      // status-bar strip dims too (the panel's own offset compensates).
      style={{
        position: 'absolute',
        top: -SCRIM_REACH,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(12,14,18,0.18)',
      }}>
      <Animated.View
        entering={FadeInUp.duration(160)}
        style={{
          position: 'absolute',
          top: topOffset + SCRIM_REACH,
          right: spacing.lg,
          // wider than the old status list (300): step lines carry their
          // right-aligned timings, same as the chat panel
          width: 344,
          borderRadius: 16,
          backgroundColor: PANEL_BG,
          shadowColor: '#16181C',
          shadowOpacity: 0.28,
          shadowRadius: 28,
          shadowOffset: { width: 0, height: 10 },
          elevation: 12,
        }}>
        <View style={{ paddingHorizontal: spacing.lg }}>
          {/* HEADER ROW = the >_ key's own footprint (2026-07-28 "붙어
              있는게 이상해"): the panel's top edge now sits exactly where
              the key sits, and the glyph re-renders HERE, in the same
              optical spot — so opening reads as the key unfolding into
              the panel, not a second surface docking under it. The health
              line rides the same row; tapping the glyph folds it back. */}
          <View
            style={{
              height: 40,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  backgroundColor: STATE_COLOR[worst],
                }}
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
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: -spacing.lg + 2,
                opacity: pressed ? 0.6 : 1,
              })}>
              <Text
                style={{
                  fontFamily: fontFamily.mono,
                  fontSize: 13,
                  color: healthy ? '#7ED9A0' : STATE_COLOR[worst],
                }}>
                {'>_'}
              </Text>
            </Pressable>
          </View>
          {/* ONE LINE PER RUN (2026-07-30 "좀 더 정리해줘", no dot lists):
              the full step trace was the chat panel's anatomy repeated
              in a peek window — twice the ask, three stages, timings.
              Here each run is just its ask and how long the whole thing
              took; hairlines separate, nothing leads the row. The trace
              lives where it always did: in the thread the row opens. */}
          <View style={{ marginTop: 2 }}>
            {runs.length === 0 ? (
              <Text
                style={{
                  color: PANEL_FAINT,
                  fontFamily: fontFamily.mono,
                  fontSize: 12,
                  paddingBottom: spacing.md,
                }}>
                Nothing has run yet.
              </Text>
            ) : (
              runs.map((run, idx) => (
                <Pressable
                  key={run.key}
                  onPress={() => onOpenRun(run.threadId)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 11,
                    borderTopWidth: idx > 0 ? 1 : 0,
                    borderTopColor: DIVIDER,
                    opacity: pressed ? 0.6 : 1,
                  })}>
                  <Text
                    numberOfLines={1}
                    style={{
                      flex: 1,
                      fontSize: 13,
                      fontFamily: fontFamily.regular,
                      color: PANEL_TEXT,
                    }}>
                    {run.label ?? run.lines[0] ?? ''}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: fontFamily.mono,
                      color: run.failed
                        ? sysColor.fail
                        : run.live
                          ? PANEL_DIM
                          : PANEL_FAINT,
                    }}>
                    {run.failed ? '✗' : run.live ? '…' : totalTime(run.lines)}
                  </Text>
                </Pressable>
              ))
            )}
          </View>
        </View>
        {/* footer doors — hairline-separated rows. When something is
            wrong the loud row is about the problem; the settings door is
            always there. */}
        <View style={{ height: 1, backgroundColor: DIVIDER, marginHorizontal: spacing.lg }} />
        {!healthy ? (
          <>
            <Pressable
              onPress={onManageAccess}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: spacing.md,
                opacity: pressed ? 0.55 : 1,
              })}>
              <Text
                style={{
                  color: PANEL_TEXT,
                  fontFamily: fontFamily.semibold,
                  fontSize: fontSize.small,
                }}>
                View issue
              </Text>
              <Ionicons name="arrow-forward" size={14} color={PANEL_TEXT} />
            </Pressable>
            <View
              style={{ height: 1, backgroundColor: DIVIDER, marginHorizontal: spacing.lg }}
            />
          </>
        ) : null}
        <Pressable
          onPress={onOpenSettings}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            opacity: pressed ? 0.55 : 1,
          })}>
          <Text
            style={{ color: PANEL_DIM, fontFamily: fontFamily.medium, fontSize: fontSize.small }}>
            System settings
          </Text>
          <Ionicons name="chevron-forward" size={13} color={PANEL_FAINT} />
        </Pressable>
      </Animated.View>
    </Pressable>
  );
}

export default StatusPopover;
