import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

/**
 * Home tab background — "control room": a near-black navy field with two
 * whisper-strength washes of blue and cyan light, giving the glass cards
 * above something to refract. Blue family keeps it related to the chat's
 * bluecloud sky. Same composition rules as the chat art: bands flow off
 * the screen edges, curves are tangent-smooth. Fixed 390x844 viewBox.
 */
export function HomeBg() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="base" x1="0" y1="0" x2="0.3" y2="1">
            <Stop offset="0%" stopColor="#0F1522" />
            <Stop offset="55%" stopColor="#141C2C" />
            <Stop offset="100%" stopColor="#101724" />
          </LinearGradient>

          <LinearGradient id="blueWash" x1="0" y1="0" x2="0.5" y2="1">
            <Stop offset="0%" stopColor="#5D89BE" stopOpacity={0.12} />
            <Stop offset="60%" stopColor="#5D89BE" stopOpacity={0.05} />
            <Stop offset="100%" stopColor="#5D89BE" stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id="cyanWash" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0%" stopColor="#5EEAFF" stopOpacity={0} />
            <Stop offset="40%" stopColor="#5EEAFF" stopOpacity={0.05} />
            <Stop offset="100%" stopColor="#5EEAFF" stopOpacity={0} />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width="390" height="844" fill="url(#base)" />

        {/* blue glow drifting from the top, exiting the left edge */}
        <Path
          d="M -80 -80 L 470 -80 L 470 140
             C 300 190, 160 300, 90 460
             C 55 540, 0 580, -80 600 Z"
          fill="url(#blueWash)"
        />
        {/* faint cyan counter-arc, bottom to top-right */}
        <Path
          d="M 60 900
             C 220 640, 300 380, 300 -80
             L 430 -80
             C 430 400, 330 700, 190 900 Z"
          fill="url(#cyanWash)"
        />
      </Svg>
    </View>
  );
}

export default HomeBg;
