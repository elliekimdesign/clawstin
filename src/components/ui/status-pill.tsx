import { Text, View } from 'react-native';
import { colors, fontSize, fontWeight, radius, spacing } from '@/theme/theme';

export type StatusKind = 'running' | 'idle' | 'offline';

const MAP: Record<StatusKind, { label: string; dot: string; bg: string; fg: string }> = {
  running: { label: 'Running', dot: colors.success, bg: colors.successSoft, fg: colors.success },
  idle: { label: 'Idle', dot: colors.textTertiary, bg: colors.cardAlt, fg: colors.textSecondary },
  offline: { label: 'Offline', dot: colors.danger, bg: colors.dangerSoft, fg: colors.danger },
};

type Props = {
  kind: StatusKind;
  label?: string;
};

/** Tiny colored pill with a status dot (e.g. ● Running). */
export function StatusPill({ kind, label }: Props) {
  const s = MAP[kind];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: s.bg,
        borderRadius: radius.pill,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        gap: spacing.xs + 2,
      }}>
      <View
        style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: s.dot }}
      />
      <Text style={{ color: s.fg, fontSize: fontSize.caption, fontWeight: fontWeight.semibold }}>
        {label ?? s.label}
      </Text>
    </View>
  );
}

export default StatusPill;
