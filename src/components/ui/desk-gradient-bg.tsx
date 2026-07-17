import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/**
 * "desk_gradient" — the chat room's field: a natural vertical light
 * falloff, no ribbons, no glows, no panel motion ("배경을 더
 * 심플하게... 그라데이션은 있는게 좋을거같아", 2026-07-16 — the
 * moving-panel chatWash shader retired for this screen in favor of
 * this plain gradient). v2 same day ("near white"): pulled from a
 * bright blue to a near-white field with just a whisper of blue tint,
 * so the chat still feels like part of the desk world without
 * fighting the reply text for contrast. The 45% stop IS darkChat.base
 * (#EDF2F8) so the room's identity doesn't shift.
 */
export function DeskGradientBg() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="deskfall" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#F7FAFD" />
            <Stop offset="45%" stopColor="#EDF2F8" />
            <Stop offset="100%" stopColor="#DDE7F2" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="390" height="844" fill="url(#deskfall)" />
      </Svg>
    </View>
  );
}

export default DeskGradientBg;
