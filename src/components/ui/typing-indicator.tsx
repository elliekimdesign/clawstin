import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, spacing } from '@/theme/theme';

function Dot({ delay }: { delay: number }) {
  const o = useSharedValue(0.3);
  useEffect(() => {
    o.value = withDelay(
      delay,
      withRepeat(withSequence(withTiming(1, { duration: 350 }), withTiming(0.3, { duration: 350 })), -1)
    );
  }, [delay, o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      style={[{ width: 7, height: 7, borderRadius: 999, backgroundColor: colors.textTertiary }, style]}
    />
  );
}

/** Three pulsing dots inside an agent-style bubble. */
export function TypingIndicator() {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: colors.bubbleAgent,
        borderRadius: radius.lg,
        borderBottomLeftRadius: 6,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
        flexDirection: 'row',
        gap: spacing.xs + 1,
      }}>
      <Dot delay={0} />
      <Dot delay={150} />
      <Dot delay={300} />
    </View>
  );
}

export default TypingIndicator;
