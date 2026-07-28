import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import type { ServiceState, ServiceStatus } from '@/mock/services';
import { fontFamily, fontSize, spacing, sysColor } from '@/theme/theme';

import { ThinkingConsole } from './thinking-console';

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
  // the headline speaks human: what it MEANS for you, not a verdict
  const summary =
    worst === 'down'
      ? 'Some services are unreachable'
      : worst === 'degraded'
        ? 'Responses may be slower than usual'
        : "Everything's running";

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
          {/* the receipt roll: the NEWEST runs, whole blocks only — a
              clipped receipt read as a layout bug (2026-07-28 "간격이랑
              뭔가 좀 어색한"), so the panel shows what fits and the full
              ledger lives in the Activity tab. Each block is the chat
              panel's own anatomy (ask line + steps) and a door to the
              thread it ran in. */}
          <View style={{ marginTop: 4 }}>
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
                    // the last block hands off to the footer hairline at
                    // the same rhythm the rows keep among themselves
                    marginBottom: idx === runs.length - 1 ? 10 : 18,
                    opacity: pressed ? 0.6 : 1,
                  })}>
                  {run.label ? (
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 12,
                        lineHeight: 17,
                        fontFamily: fontFamily.regular,
                        color: PANEL_DIM,
                        marginBottom: 8,
                      }}>
                      {run.label}
                    </Text>
                  ) : null}
                  <ThinkingConsole
                    threadId={`activity-${run.key}`}
                    lines={run.lines}
                    done={!run.live}
                    failed={run.failed}
                    folded={false}
                    stepsOnly
                    onDark
                  />
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
