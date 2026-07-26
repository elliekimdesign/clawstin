import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { fontFamily } from '@/theme/theme';

/** the idle console's FACE (2026-07-24 "깜빡이면서 그 표정 같은 거"): the >_
 * glyph mostly holds steady, then gives a quick wink — a cursor blink read as
 * an expression, the machine at rest.
 *
 * Extracted from (tabs)/index.tsx on 2026-07-25 so the chat thread's terminal
 * key can wear the identical face. Home still has its own inline copy of this
 * (ConsoleFace) — if the blink timing is ever retuned, change both or finish
 * the extraction by pointing Home at this file too. */
export function ConsoleFace({ color, size = 13 }: { color: string; size?: number }) {
  const o = useSharedValue(1);
  useEffect(() => {
    o.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2100 }),
        withTiming(0.12, { duration: 110 }),
        withTiming(1, { duration: 180 })
      ),
      -1
    );
  }, [o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.Text style={[{ fontFamily: fontFamily.mono, fontSize: size, color }, style]}>
      {'>_'}
    </Animated.Text>
  );
}

export default ConsoleFace;
