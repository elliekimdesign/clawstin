import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/**
 * ANIMATED MOSAIC MARK (2026-07-24, the System card's "alive" mark):
 * the SAME 2×2 mosaic cluster the Settings "Connected" rows use
 * (MosaicDot), but each cell breathes on a staggered loop so the mark
 * shimmers — reads as "the system is active", in the board's own
 * mosaic language. One color in.
 */

// 2×2 cluster, ordered so the shimmer travels across the cells.
const CELLS: { x: number; y: number; base: number }[] = [
  { x: 0, y: 0, base: 1 },
  { x: 1, y: 1, base: 0.85 },
  { x: 0, y: 1, base: 0.55 },
  { x: 1, y: 0, base: 0.35 },
];

function Cell({ x, y, i, base, color, c }: {
  x: number;
  y: number;
  i: number;
  base: number;
  color: string;
  c: number;
}) {
  const o = useSharedValue(base);
  useEffect(() => {
    o.value = withDelay(
      i * 170,
      withRepeat(
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      )
    );
  }, [o, i]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x * c,
          top: y * c,
          width: c,
          height: c,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

export function MosaicCheck({ color, size = 10 }: { color: string; size?: number }) {
  const c = Math.floor(size / 2);
  return (
    <View style={{ width: c * 2, height: c * 2 }}>
      {CELLS.map((cell, i) => (
        <Cell key={i} x={cell.x} y={cell.y} i={i} base={cell.base} color={color} c={c} />
      ))}
    </View>
  );
}

export default MosaicCheck;
