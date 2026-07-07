import { useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/**
 * PulseMark — wraps a mark (e.g. the agent face) with soft rings that pulse
 * outward, giving an "alive / listening" feel. The rings expand and fade on a
 * loop; a couple of static faint rings sit underneath for depth.
 */

const RING_COLOR = '#FF4A32';

function Ring({ size, delay, duration }: { size: number; delay: number; duration: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.out(Easing.ease) }), -1, false)
    );
  }, [delay, duration, p]);

  const style = useAnimatedStyle(() => ({
    // Grow only slightly (a gentle "connecting" breath, not a wifi ripple).
    transform: [{ scale: 0.92 + p.value * 0.13 }],
    opacity: (1 - p.value) * 0.28,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1.5,
          borderColor: RING_COLOR,
        },
        style,
      ]}
    />
  );
}

type Props = {
  /** Diameter of the outermost ring. Default 220. */
  size?: number;
  children: React.ReactNode;
  style?: ViewStyle;
};

/** A faint, always-visible concentric ring (Figma S5 look). */
function StaticRing({ size }: { size: number }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        borderColor: RING_COLOR,
        opacity: 0.14,
      }}
    />
  );
}

export function PulseMark({ size = 220, children, style }: Props) {
  // Rings retired (her call: the mark stands alone) — the component keeps
  // its centered footprint so onboarding layout stays put.
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      {children}
    </View>
  );
}

export default PulseMark;
