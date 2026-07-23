import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import type { ServiceState, ServiceStatus } from '@/mock/services';
import { fontFamily, fontSize, radius, spacing, sysColor } from '@/theme/theme';

import { FrostedGlassFill } from './frosted-glass-fill';

// Ink-on-glass tokens (2026-07-22 frosted pass: the popover is the
// status pill UNFOLDED — the same frosted folder card as the Home
// board's sections; the silver pane era lives in git).
const PANEL_TEXT = 'rgba(22,24,28,0.95)';
const PANEL_DIM = 'rgba(22,24,28,0.6)';
const PANEL_FAINT = 'rgba(22,24,28,0.42)';
const DIVIDER = 'rgba(22,24,28,0.08)';
// how far the scrim reaches ABOVE its container, to cover the status bar
const SCRIM_REACH = 120;

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

  return (
    <Pressable
      onPress={onClose}
      // a quiet scrim: mutes the busy cards behind so the glass panel
      // stays readable without going opaque. It over-reaches past the
      // container's top so the status-bar strip dims too (the panel's
      // own offset compensates below).
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
          width: 300,
          shadowColor: '#16181C',
          shadowOpacity: 0.22,
          shadowRadius: 28,
          shadowOffset: { width: 0, height: 10 },
          elevation: 12,
        }}>
        {/* frosted PLATE, not a folder (2026-07-22 "폴더 스타일 안
            해도 돼"): the system's side surface. NEAR-OPAQUE (2026-07-22
            "뒷배경이랑 겹치는 것 같아"): a solid milk base under the
            frost skin so the board's text can't bleed through — a
            floating system panel sits solid, only its edges admitting
            the field. */}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: 16, backgroundColor: 'rgba(235,242,249,0.96)' },
          ]}
        />
        <FrostedGlassFill flat radius={16} tint="rgba(255,255,255,0.5)" />
        {/* title band in the VIAL's liquid (2026-07-22 "위에 버튼이랑
            통일감"): the same dusty running-blue the status pill holds,
            poured across the panel's top — with the pill's own soft
            vertical gradient, deeper at the top where it pools */}
        <View
          style={{
            height: 30,
            justifyContent: 'center',
            paddingHorizontal: spacing.lg,
            overflow: 'hidden',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}>
          <Svg
            width={300}
            height={30}
            style={StyleSheet.absoluteFill}
            pointerEvents="none">
            <Defs>
              <LinearGradient id="bandPour" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#5E87C4" stopOpacity="0.58" />
                <Stop offset="1" stopColor="#5E87C4" stopOpacity="0.26" />
              </LinearGradient>
            </Defs>
            <Rect width={300} height={30} fill="url(#bandPour)" />
          </Svg>
          <Text
            style={{
              color: 'rgba(22,24,28,0.6)',
              fontFamily: fontFamily.mono,
              fontSize: 12,
              letterSpacing: 0.3,
            }}>
            System status
          </Text>
        </View>
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
          {/* Crew row removed (2026-07-22 "크루가 필요할까 싶네"):
              this panel is infra only — agent state lives in the
              Crew tab */}
          {llm.map((s) => (
            <ServiceRow key={s.id} s={s} onIssue={onManageAccess} onOpen={onOpenSettings} />
          ))}
        </View>

        </View>
        {/* footer doors on the same glass — hairline-separated rows,
            no solid strips (they'd fight the frost and poke past the
            unclipped corners). When something is wrong the loud row
            is about the problem; the settings door is always there —
            status is where you come to act. */}
        <View
          style={{ height: 1, backgroundColor: DIVIDER, marginHorizontal: spacing.lg }}
        />
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
              <Text style={{ color: PANEL_TEXT, fontFamily: fontFamily.semibold, fontSize: fontSize.small }}>
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
