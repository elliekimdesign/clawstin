import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { MachinePixel } from '@/components/ui/machine-pixel';
import { fontFamily, sysColor } from '@/theme/theme';

/**
 * The pairing image, carried onto the board (2026-07-30).
 *
 * Onboarding ends on the two machines linked together, so the board's first
 * folder opens on the same picture. It sits in a row, not behind the
 * wordmark: as a ghosted watermark it had nothing to anchor to and read as
 * a stray mark on the header.
 *
 * The connection is not a task, so the folder stays one line — it states
 * the condition the board rests on without taking the room a task section
 * would. The link keeps pulsing, so "still connected" is ambient rather
 * than something you go and check.
 */

const GHOST = 1;

function LinkDot({ i, t }: { i: number; t: { value: number } }) {
  const style = useAnimatedStyle(() => {
    // a slow pulse travelling toward the machine, same motion as pairing
    const phase = (t.value * 5 - i + 5) % 5;
    return { opacity: 0.35 + 0.65 * Math.max(0, 1 - phase) };
  });
  return (
    <Animated.View
      style={[
        { width: 3, height: 3, borderRadius: 999, backgroundColor: sysColor.accent },
        style,
      ]}
    />
  );
}

export function ConnectionMark() {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [t]);

  return (
    <View
      pointerEvents="none"
      // IN THE FLOW, not absolutely placed: as a watermark beside the
      // wordmark it had nothing to anchor to and read as a stray mark
      // (2026-07-30). It is a row element in the Connection folder now.
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        // 44 → 52 machines, wider air (2026-07-30 "비주얼을 조금만 더
        // 키우고"): the mark is the card's whole body, so it can hold
        // more of the room it was given
        gap: 13,
      }}>
      <MachinePixel shape="phone" size={52} />
      <View style={{ alignItems: 'center', gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          {[0, 1, 2].map((i) => (
            <LinkDot key={i} i={i} t={t} />
          ))}
        </View>
        {/* the link SAYS what it is (2026-07-30 "연결이 되었다는 것을
            말해야"): the word sits inside the link itself, in ready
            green — the same LINKED the onboarding receipt teaches, so
            the card reads "these two are connected" at a glance. */}
        <Text
          style={{
            fontSize: 8.5,
            fontFamily: fontFamily.mono,
            letterSpacing: 0.6,
            color: sysColor.ready,
          }}>
          LINKED
        </Text>
      </View>
      <MachinePixel shape="mini" size={52} />
    </View>
  );
}

export default ConnectionMark;
