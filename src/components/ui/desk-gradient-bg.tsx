import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/**
 * "desk_gradient" — the chat room's field: a natural vertical light
 * falloff, no ribbons, no glows, no panel motion. v4 (2026-07-17,
 * "흰색에 가까운 투명한 스카이블루"): a near-white SKY — clearly blue,
 * clearly light — so the frosted glass surfaces carry the contrast
 * and the room still belongs to the desk's sky family.
 */
export function DeskGradientBg() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="deskfall" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#F2F8FD" />
            <Stop offset="45%" stopColor="#E3EEF9" />
            <Stop offset="100%" stopColor="#D3E4F4" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="390" height="844" fill="url(#deskfall)" />
      </Svg>
    </View>
  );
}

export default DeskGradientBg;
