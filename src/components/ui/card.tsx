import { View, ViewProps, ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing } from '@/theme/theme';

type Props = ViewProps & {
  padded?: boolean;
  style?: ViewStyle | ViewStyle[];
};

/** A soft white rounded card with a gentle shadow. */
export function Card({ children, padded = true, style, ...rest }: Props) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          padding: padded ? spacing.lg : 0,
          ...shadow.card,
        },
        style as ViewStyle,
      ]}
      {...rest}>
      {children}
    </View>
  );
}

export default Card;
