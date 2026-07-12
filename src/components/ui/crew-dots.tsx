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

import { CREW_ACCENT } from '@/components/ui/crew-pixel';
import type { CrewKey } from '@/mock/crew-routing';

/**
 * The crew standby dots (2026-07-12): four dots over the command pill,
 * one per crew member in their own signature color (Beanie green,
 * Specs red, Wink pink, Crop yellow). At rest they sleep, dim; when a
 * message routes, the receiving agent's dot wakes and pulses — "Specs
 * picked it up" carried by color alone. Not window controls: OUR crew.
 */

/** route key -> crew-pixel character id (single source: crew lineup) */
const PIXEL_BY_ROUTE: Record<CrewKey, string> = {
  orchestrator: 'muppet', // Beanie
  researcher: 'scout', // Specs
  writer: 'quill', // Wink
  triage: 'pilot', // Crop
};
// display order: Beanie, Specs, Wink, Crop
const ORDER = ['muppet', 'scout', 'quill', 'pilot'] as const;

function Dot({
  color,
  awake,
  wave,
  waveDelay,
}: {
  color: string;
  awake: boolean;
  /** typing wave: every dot bobs, left to right — the whole crew leaning in */
  wave: boolean;
  waveDelay: number;
}) {
  const t = useSharedValue(0);
  const y = useSharedValue(0);
  useEffect(() => {
    if (awake) {
      t.value = withRepeat(
        withSequence(withTiming(1, { duration: 550 }), withTiming(0, { duration: 550 })),
        -1
      );
    } else {
      t.value = withTiming(0, { duration: 200 });
    }
  }, [awake, t]);
  useEffect(() => {
    if (wave) {
      // hop up, settle, wait for the wave to travel the row, repeat
      y.value = withDelay(
        waveDelay,
        withRepeat(
          withSequence(
            withTiming(-4, { duration: 260 }),
            withTiming(0, { duration: 260 }),
            withTiming(0, { duration: 560 })
          ),
          -1
        )
      );
    } else {
      y.value = withTiming(0, { duration: 180 });
    }
  }, [wave, waveDelay, y]);
  const style = useAnimatedStyle(() => ({
    opacity: awake ? 0.55 + 0.45 * t.value : wave ? 0.9 : 0.32,
    transform: [{ translateY: y.value }, { scale: awake ? 1 + 0.3 * t.value : 1 }],
  }));
  return (
    <Animated.View
      style={[{ width: 5, height: 5, borderRadius: 999, backgroundColor: color }, style]}
    />
  );
}

export function CrewDots({
  activeKey,
  wave = false,
}: {
  activeKey: CrewKey | null;
  /** true while the human is typing: all four wake and ripple */
  wave?: boolean;
}) {
  const awakeId = activeKey ? PIXEL_BY_ROUTE[activeKey] : null;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 7 }}>
      {ORDER.map((id, i) => (
        <Dot
          key={id}
          color={CREW_ACCENT[id]}
          awake={id === awakeId}
          wave={wave && !awakeId}
          waveDelay={i * 150}
        />
      ))}
    </View>
  );
}

export default CrewDots;
