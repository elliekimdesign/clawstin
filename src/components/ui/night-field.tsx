import { View, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/** Full-screen night gradient: ink navy -> deep brand blue -> deep hill
 * green, on the same diagonal as the bliss field. Shared by the Logs tab
 * and the night home board — ONE adult, console-grade surface. */
export function NightField() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="night" x1="0" y1="0" x2="0.7" y2="1">
            <Stop offset="0%" stopColor="#141F33" />
            <Stop offset="45%" stopColor="#1A3550" />
            <Stop offset="100%" stopColor="#1E4029" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="390" height="844" fill="url(#night)" />
      </Svg>
    </View>
  );
}

export default NightField;
