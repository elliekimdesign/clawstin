import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop, RadialGradient } from 'react-native-svg';

/**
 * "acid_cloud" — the dark_cloud gradient structure (diagonal field +
 * faint cloud puffs) recolored to the acidglass home field, so Crew
 * shares the home tab's daylight without duplicating its swoosh art.
 * Fixed 390x844 viewBox.
 */

const PUFFS: [number, number, number, number, number][] = [
  // [cx, cy, rx, ry, peak opacity]
  [110, 150, 190, 90, 0.5],
  [300, 90, 170, 80, 0.4],
  [220, 300, 220, 100, 0.35],
  [70, 430, 180, 90, 0.3],
];

export function AcidCloudBg() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="acidsky" x1="0" y1="0" x2="0.15" y2="1">
            <Stop offset="0%" stopColor="#F8FAE6" />
            <Stop offset="45%" stopColor="#E2EABC" />
            <Stop offset="100%" stopColor="#B4CB93" />
          </LinearGradient>
          {PUFFS.map((p, i) => (
            <RadialGradient
              key={i}
              id={`acidpuff${i}`}
              gradientUnits="userSpaceOnUse"
              cx={p[0]}
              cy={p[1]}
              rx={p[2]}
              ry={p[3]}>
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={p[4]} />
              <Stop offset="60%" stopColor="#FFFFFF" stopOpacity={p[4] * 0.45} />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        <Rect x="0" y="0" width="390" height="844" fill="url(#acidsky)" />
        {PUFFS.map((_, i) => (
          <Rect key={i} x="0" y="0" width="390" height="844" fill={`url(#acidpuff${i})`} />
        ))}
      </Svg>
    </View>
  );
}

export default AcidCloudBg;
