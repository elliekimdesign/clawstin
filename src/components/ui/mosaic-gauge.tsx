import { View } from 'react-native';
import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { sysColor } from '@/theme/theme';

import { MosaicDot } from './mosaic-dot';

/**
 * MOSAIC GAUGE (2026-07-22, v3 "painted grains"): the RUNNING card's
 * progress voice in the check-pattern language.
 *
 * Determinate (`done` given): a plain row of mosaic cells, N of total
 * lit — honest discrete steps, no motion.
 *
 * Indeterminate: ONE long, quiet gray check-pattern track; inside it,
 * blue mosaic grains FILL UP — loosely left to right with jitter,
 * never marching — the color rises until the line is full, then a
 * quick blink resets it and the filling begins again. The gray track
 * never moves.
 */
// compact by design (2026-07-22 "폴더 너비만큼 안 채워도 돼"): a short
// quiet strip in the corner, not a full-width bar
const COLS = 9;
const CELL = 5;
const GAP = 3;
const CYCLE_MS = 5200;

/** deterministic paint order: left bias + LCG jitter, normalized to a
 * fade-in start inside the cycle's first 75% (fill is the story) */
const GRAINS = Array.from({ length: COLS }, (_, k) => ({
  start:
    (((k / COLS) * 0.6 + (((k * 37 + (k % 5) * 13) % 10) / 10) * 0.4) % 1) * 0.75,
}));

function Grain({ start, sv, color }: {
  start: number;
  sv: SharedValue<number>;
  color: string;
}) {
  const style = useAnimatedStyle(() => {
    const v = sv.value;
    // this grain's own soft arrival — then the line HOLDS full and
    // only blinks empty right at the cycle's end (no slow vanish)
    let o = Math.min(Math.max((v - start) / 0.1, 0), 1);
    o *= 1 - Math.min(Math.max((v - 0.96) / 0.04, 0), 1);
    return { opacity: o * 0.9 };
  });
  return (
    <View style={{ width: CELL, height: CELL }}>
      {/* the quiet gray track cell, always there */}
      <View style={{ position: 'absolute' }}>
        <MosaicDot color="rgba(22,24,28,0.1)" size={CELL} />
      </View>
      <Animated.View style={[{ position: 'absolute' }, style]}>
        <MosaicDot color={color} size={CELL} />
      </Animated.View>
    </View>
  );
}

export function MosaicGauge({
  total = 8,
  done,
  color = sysColor.running,
}: {
  total?: number;
  /** lit cell count; omit for the painted-grains line */
  done?: number;
  color?: string;
}) {
  const sv = useSharedValue(0);

  useEffect(() => {
    if (done !== undefined) return;
    sv.value = withRepeat(withTiming(1, { duration: CYCLE_MS }), -1, false);
  }, [sv, done]);

  if (done !== undefined) {
    return (
      <View style={{ flexDirection: 'row', gap: GAP }}>
        {Array.from({ length: total }, (_, i) => (
          <MosaicDot
            key={i}
            color={i < done ? color : 'rgba(22,24,28,0.12)'}
            size={8}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', gap: GAP }}>
      {GRAINS.map((g, i) => (
        <Grain key={i} start={g.start} sv={sv} color={color} />
      ))}
    </View>
  );
}

export default MosaicGauge;
