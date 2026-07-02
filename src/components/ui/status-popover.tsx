import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import type { ServiceState, ServiceStatus } from '@/mock/services';
import { colors, fontFamily, fontSize, radius, spacing } from '@/theme/theme';

// Dark-panel-local tokens (theme is a light palette).
const PANEL_BG = 'rgba(26,28,33,0.98)';
const PANEL_TEXT = '#FFFFFF';
const PANEL_DIM = 'rgba(255,255,255,0.55)';
const PANEL_FAINT = 'rgba(255,255,255,0.38)';
const DIVIDER = 'rgba(255,255,255,0.08)';
const GROUP_DIVIDER = 'rgba(255,255,255,0.18)';
const MONO = 'Menlo';

const STATE_COLOR: Record<ServiceState, string> = {
  operational: colors.success,
  ready: colors.success,
  connected: colors.success,
  degraded: colors.warning,
  down: colors.danger,
};

const HEALTHY: ServiceState[] = ['operational', 'ready', 'connected'];

/** Worst (most severe) state across services — drives the header dot + summary. */
export function worstServiceState(services: ServiceStatus[]): ServiceState {
  const ORDER: ServiceState[] = ['operational', 'ready', 'connected', 'degraded', 'down'];
  return services.reduce<ServiceState>(
    (w, s) => (ORDER.indexOf(s.state) > ORDER.indexOf(w) ? s.state : w),
    'operational'
  );
}

type Props = {
  services: ServiceStatus[];
  onClose: () => void;
  onManageAccess: () => void;
  /** distance from the top of the containing SafeAreaView to the panel */
  topOffset: number;
};

function ServiceRow({ s, boundary }: { s: ServiceStatus; boundary?: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 7,
        // Only the group boundary gets a faint divider + a little breathing room;
        // rows within a group are separated by whitespace alone.
        marginTop: boundary ? spacing.md : 0,
        paddingTop: boundary ? spacing.md : 7,
        borderTopWidth: boundary ? 1 : 0,
        borderTopColor: GROUP_DIVIDER,
      }}>
      <Text style={{ color: PANEL_TEXT, fontFamily: MONO, fontSize: 13, flexShrink: 1 }} numberOfLines={1}>
        {s.name}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8 }}>
        {s.pingMs != null ? (
          <Text style={{ color: PANEL_FAINT, fontFamily: MONO, fontSize: 11 }}>{s.pingMs}ms</Text>
        ) : null}
        <View style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: STATE_COLOR[s.state] }} />
        <Text style={{ color: PANEL_DIM, fontSize: 12 }}>{s.detail}</Text>
      </View>
    </View>
  );
}

/**
 * Engineer-style connection status panel: a dark, dense dropdown grouped into
 * CORE SERVICES / LLM INFRASTRUCTURE. When anything is degraded/down it offers a
 * "Manage access →" deep-link to the Access tab. Tapping the scrim dismisses it.
 */
export function StatusPopover({ services, onClose, onManageAccess, topOffset }: Props) {
  const worst = worstServiceState(services);
  const healthy = HEALTHY.includes(worst);
  const summary =
    worst === 'down' ? 'Service disruption' : worst === 'degraded' ? 'Partial degradation' : 'All systems operational';

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
          borderColor: 'rgba(255,255,255,0.06)',
          shadowColor: '#000',
          shadowOpacity: 0.35,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 12 },
          elevation: 12,
        }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: STATE_COLOR[worst] }} />
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

        {/* Service rows — a single divider marks the CORE ↔ LLM boundary */}
        <View style={{ marginTop: spacing.md }}>
          {services.map((s, i) => (
            <ServiceRow
              key={s.id}
              s={s}
              boundary={i > 0 && services[i - 1].group !== s.group}
            />
          ))}
        </View>

        {/* Deep-link to Access when something is wrong */}
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
              Manage access
            </Text>
            <Ionicons name="arrow-forward" size={14} color={PANEL_TEXT} />
          </Pressable>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

export default StatusPopover;
