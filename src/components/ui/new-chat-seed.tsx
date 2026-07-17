import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { CREW_ACCENT } from '@/components/ui/crew-pixel';
import { fontFamily } from '@/theme/theme';

/**
 * The new-chat seed lockup as a STATE MACHINE (2026-07-12): the Y2K
 * label + outlined gauge don't disappear on send — they metamorphose
 * into the routing indicator.
 *   idle     — "new chat", gauge resting at 40%, centered
 *   routing  — jumps up under the header, "routing", the gauge ripples
 *              in the crew's four colors
 *   handoff  — the whole lockup lifts away where the thinking console
 *              is about to appear, and the conversation begins
 * One set with the composer's crew dots.
 */
export type SeedPhase = 'idle' | 'routing' | 'handoff';

const ORDER = ['muppet', 'scout', 'quill', 'pilot'] as const;

function RippleSegment({ color, delayMs, on }: { color: string; delayMs: number; on: boolean }) {
  const t = useSharedValue(0.25);
  useEffect(() => {
    if (on) {
      t.value = withDelay(
        delayMs,
        withRepeat(
          withSequence(withTiming(1, { duration: 220 }), withTiming(0.25, { duration: 220 })),
          -1
        )
      );
    } else {
      t.value = withTiming(0.25, { duration: 120 });
    }
  }, [on, delayMs, t]);
  const style = useAnimatedStyle(() => ({ opacity: t.value }));
  return (
    <Animated.View style={[{ flex: 1, borderRadius: 1.5, backgroundColor: color }, style]} />
  );
}

export function NewChatSeed({ phase }: { phase: SeedPhase }) {
  // handoff: no color flood — the lockup simply lifts away
  const lift = useSharedValue(0);
  useEffect(() => {
    if (phase === 'handoff') {
      lift.value = withTiming(1, { duration: 380 });
    } else {
      lift.value = 0;
    }
  }, [phase, lift]);
  const liftStyle = useAnimatedStyle(() => ({
    opacity: 1 - lift.value,
    transform: [{ translateY: -36 * lift.value }],
  }));

  // idle "new chat" label + resting gauge RETIRED (2026-07-16, "로그
  // 지우고") — the idle screen shows nothing here now; only once
  // routing actually starts does the "routing" ripple lockup appear.
  if (phase === 'idle') return null;

  return (
    <Animated.View style={[{ alignItems: 'center', gap: 10 }, liftStyle]}>
      {/* v2 (2026-07-16, "near white" desk): ink instead of white —
          same as every other white-on-blue token flipped this pass */}
      <Text
        style={{
          fontFamily: fontFamily.mono,
          fontSize: 11,
          letterSpacing: 1,
          color: 'rgba(22,24,28,0.55)',
          transform: [{ skewX: '-8deg' }],
        }}>
        routing
      </Text>
      <View
        style={{
          width: 64,
          height: 8,
          borderRadius: 3,
          borderWidth: 1,
          borderColor: 'rgba(22,24,28,0.35)',
          padding: 1.5,
          marginBottom: 14,
        }}>
        <View style={{ flex: 1, flexDirection: 'row', gap: 1.5 }}>
          {ORDER.map((id, i) => (
            <RippleSegment key={id} color={CREW_ACCENT[id]} delayMs={i * 110} on />
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

export default NewChatSeed;
