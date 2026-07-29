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
 * WORK IN PROGRESS, in the board's OWN language (2026-07-29 "디자인
 * 스타일이 우리 bold 네모랑 비슷해야해").
 *
 * The same 2×2 mosaic cluster the board uses for every state mark
 * (MosaicDot, MosaicCheck), except the four cells hand their weight around
 * the square in a slow loop. Nothing fills, nothing completes: the cluster
 * just breathes, so it says "this is moving" and nothing more.
 *
 * Two shapes were tried and rejected the same day: a run of segmented
 * dashes (read as a loading SKELETON) and a rounded rail with a travelling
 * light (read as a generic progress bar from any other app). Neither was
 * this board's vocabulary — hard square cells are.
 */

/** cell weights as the pulse travels: each cell peaks a beat apart */
const CELLS: { x: number; y: number }[] = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
];

/** the dim floor and the lit peak: a narrow range keeps it quiet */
const REST = 0.18;
const PEAK = 0.62;
/** one cell's rise and fall; slow enough to read as breathing */
const BEAT_MS = 620;

function Cell({
  x,
  y,
  i,
  color,
  c,
}: {
  x: number;
  y: number;
  i: number;
  color: string;
  c: number;
}) {
  const o = useSharedValue(REST);

  useEffect(() => {
    o.value = withDelay(
      i * BEAT_MS,
      withRepeat(
        withTiming(PEAK, { duration: BEAT_MS, easing: Easing.inOut(Easing.sin) }),
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

export function ProgressCells({ color, size = 10 }: { color: string; size?: number }) {
  const c = Math.floor(size / 2);
  return (
    <View style={{ width: c * 2, height: c * 2 }}>
      {CELLS.map((cell, i) => (
        <Cell key={i} x={cell.x} y={cell.y} i={i} color={color} c={c} />
      ))}
    </View>
  );
}

export default ProgressCells;
