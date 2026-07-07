import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

/**
 * "silk_swoosh" — the lavender_swoosh formula recolored blue-on-white:
 * a near-white field with translucent blue silk veils sweeping through,
 * crossed by a few hairline curves (her abstract-silk reference). Same
 * composition rules: every band flows THROUGH the screen and melts to
 * transparent; nothing leaves a hard edge. Fixed 390x844 viewBox.
 */

function glow(
  id: string,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rot: number,
  color: string,
  opacity: number
) {
  return (
    <RadialGradient
      key={id}
      id={id}
      gradientUnits="userSpaceOnUse"
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      gradientTransform={`rotate(${rot} ${cx} ${cy})`}>
      <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
      <Stop offset="60%" stopColor={color} stopOpacity={opacity * 0.45} />
      <Stop offset="100%" stopColor={color} stopOpacity={0} />
    </RadialGradient>
  );
}

// Soft airy underlayer. [cx, cy, rx, ry, rotation, color, peak opacity]
const GLOWS: [number, number, number, number, number, string, number][] = [
  [80, 140, 340, 280, 0, '#FFFFFF', 0.9], // top-left light source
  [340, 460, 260, 180, 18, '#BCD4EA', 0.5], // mid-right blue shimmer
  [180, 800, 340, 160, -10, '#8FB2D6', 0.4], // soft blue pool at the bottom
];

export function SilkSwooshBg() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <Defs>
          {/* ice white easing into a pale sky blue */}
          <LinearGradient id="silkField" x1="0" y1="0" x2="0.6" y2="1">
            <Stop offset="0%" stopColor="#FBFDFF" />
            <Stop offset="50%" stopColor="#EDF4FA" />
            <Stop offset="100%" stopColor="#D9E7F4" />
          </LinearGradient>
          {GLOWS.map((g, i) => glow(`sg${i}`, g[0], g[1], g[2], g[3], g[4], g[5], g[6]))}

          {/* silk veils: strongest in the heart, melting at the rims */}
          <LinearGradient id="silkDeep" x1="0" y1="0" x2="0.5" y2="1">
            <Stop offset="0%" stopColor="#4F7CB4" stopOpacity={0.26} />
            <Stop offset="60%" stopColor="#4F7CB4" stopOpacity={0.1} />
            <Stop offset="100%" stopColor="#4F7CB4" stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id="silkSoft" x1="0" y1="1" x2="0.6" y2="0">
            <Stop offset="0%" stopColor="#7FA6CF" stopOpacity={0} />
            <Stop offset="50%" stopColor="#7FA6CF" stopOpacity={0.18} />
            <Stop offset="100%" stopColor="#7FA6CF" stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id="silkSheen" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0} />
            <Stop offset="40%" stopColor="#FFFFFF" stopOpacity={0.35} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width="390" height="844" fill="url(#silkField)" />
        {GLOWS.map((_, i) => (
          <Rect key={i} x="0" y="0" width="390" height="844" fill={`url(#sg${i})`} />
        ))}

        {/* deep silk: enters top-right, folds through the middle, exits left */}
        <Path
          d="M -80 -80 L 470 -80 L 470 200
             C 320 240, 180 340, 100 500
             C 60 580, 0 620, -80 640 Z"
          fill="url(#silkDeep)"
        />
        {/* soft counter-veil rising across the lower half */}
        <Path
          d="M -80 880
             C 60 640, 280 560, 470 640
             L 470 900 L -80 900 Z"
          fill="url(#silkSoft)"
        />
        {/* white sheen arc crossing the veils */}
        <Path
          d="M 40 900
             C 200 640, 290 380, 290 -80
             L 420 -80
             C 420 400, 320 700, 170 900 Z"
          fill="url(#silkSheen)"
        />

        {/* hairline curves: the sharp silk threads from the reference */}
        <Path
          d="M -20 720 C 140 520, 300 300, 430 40"
          stroke="#4F7CB4"
          strokeOpacity={0.35}
          strokeWidth={1}
          fill="none"
        />
        <Path
          d="M -20 640 C 160 480, 320 320, 440 140"
          stroke="#4F7CB4"
          strokeOpacity={0.2}
          strokeWidth={1}
          fill="none"
        />
        <Path
          d="M -20 240 C 150 300, 320 420, 430 600"
          stroke="#2E5A8C"
          strokeOpacity={0.22}
          strokeWidth={1}
          fill="none"
        />
      </Svg>
    </View>
  );
}

export default SilkSwooshBg;
