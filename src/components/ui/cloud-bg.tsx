import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

/**
 * "bluecloud_os" background art — the skyBlueOs blue family, but as a
 * calm open sky instead of the swoosh artwork: a rich vertical blue field
 * with wispy cirrus clouds clustered in the TOP third, like the classic
 * Windows-era sky wallpapers. Clouds are stacked soft elliptical radial
 * gradients (rotated, varied sizes), so everything is seamless by
 * construction: no paths, no strokes, no edges. Fixed 390x844 viewBox.
 */

/** One soft cloud puff: an elliptical radial wash that fades to nothing. */
function cloudGrad(
  id: string,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rot: number,
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
      <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={opacity} />
      <Stop offset="60%" stopColor="#FFFFFF" stopOpacity={opacity * 0.45} />
      <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
    </RadialGradient>
  );
}

// Wispy cirrus cluster in the top third + two faint streaks for depth.
// [cx, cy, rx, ry, rotation, peak opacity]
const CLOUDS: [number, number, number, number, number, number][] = [
  [70, 60, 180, 60, -14, 0.3],
  [250, 40, 200, 55, -8, 0.26],
  [390, 110, 220, 70, -18, 0.22],
  [150, 150, 240, 60, -10, 0.2],
  [10, 220, 170, 50, -16, 0.16],
  [300, 230, 200, 45, -6, 0.14],
  [200, 90, 120, 34, -22, 0.24],
  [420, 260, 160, 40, -12, 0.12],
  // faint distant streaks lower down
  [120, 430, 260, 40, -8, 0.05],
  [330, 560, 240, 36, -12, 0.04],
];

export function CloudBg() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <Defs>
          {/* open sky: richer overhead, paler toward the horizon below */}
          <LinearGradient id="sky" x1="0" y1="0" x2="0.15" y2="1">
            <Stop offset="0%" stopColor="#5D89BE" />
            <Stop offset="45%" stopColor="#4F7CB4" />
            <Stop offset="100%" stopColor="#7FA6CF" />
          </LinearGradient>
          {CLOUDS.map((c, i) => cloudGrad(`c${i}`, c[0], c[1], c[2], c[3], c[4], c[5]))}
        </Defs>

        <Rect x="0" y="0" width="390" height="844" fill="url(#sky)" />
        {CLOUDS.map((_, i) => (
          <Rect key={i} x="0" y="0" width="390" height="844" fill={`url(#c${i})`} />
        ))}
      </Svg>
    </View>
  );
}

export default CloudBg;
