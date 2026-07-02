import { Text, View } from 'react-native';
import { colors, fontSize, fontWeight, spacing } from '@/theme/theme';

type Props = {
  title: string;
  trailing?: string;
};

/** Small uppercase-ish section label used above lists. */
export function SectionHeader({ title, trailing }: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
        marginTop: spacing.lg,
      }}>
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: fontSize.small,
          fontWeight: fontWeight.semibold,
          letterSpacing: 0.3,
        }}>
        {title}
      </Text>
      {trailing ? (
        <Text style={{ color: colors.textTertiary, fontSize: fontSize.small }}>{trailing}</Text>
      ) : null}
    </View>
  );
}

export default SectionHeader;
