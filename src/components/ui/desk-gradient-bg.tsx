import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/**
 * "desk_gradient" (2026-07-14 night) — the chat room's field: the flat
 * desk blue with a completely natural vertical light falloff, lighter
 * where the light falls from above, deeper toward the floor. Nothing
 * else — no ribbons, no glows, no motion ("공간감이 느껴지게...
 * 완전 자연스럽게"). Hue-locked to the desk family: lightness varies,
 * hue never does. The 45% stop IS darkChat.base (#4E83B8) so the
 * room's identity doesn't shift.
 */
export function DeskGradientBg() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="deskfall" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#5C8FC4" />
            <Stop offset="45%" stopColor="#4E83B8" />
            <Stop offset="100%" stopColor="#41709D" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="390" height="844" fill="url(#deskfall)" />
      </Svg>
    </View>
  );
}

export default DeskGradientBg;
