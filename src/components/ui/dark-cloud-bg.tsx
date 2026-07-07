import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop, RadialGradient } from 'react-native-svg';

/**
 * "dark_cloud" — the chat's bluecloud sky, turned down for evening: the
 * same hue family as CloudBg but deep, fading lighter toward the bottom
 * where the content cards sit. A few faint cloud puffs keep it alive.
 * Fixed 390x844 viewBox.
 */

const PUFFS: [number, number, number, number, number][] = [
  // [cx, cy, rx, ry, peak opacity]
  [110, 150, 190, 90, 0.1],
  [300, 90, 170, 80, 0.08],
  [220, 300, 220, 100, 0.07],
  [70, 430, 180, 90, 0.06],
];

export function DarkCloudBg() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="darksky" x1="0" y1="0" x2="0.15" y2="1">
            <Stop offset="0%" stopColor="#243A54" />
            <Stop offset="45%" stopColor="#335170" />
            <Stop offset="100%" stopColor="#6689B3" />
          </LinearGradient>
          {PUFFS.map((p, i) => (
            <RadialGradient
              key={i}
              id={`puff${i}`}
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
        <Rect x="0" y="0" width="390" height="844" fill="url(#darksky)" />
        {PUFFS.map((_, i) => (
          <Rect key={i} x="0" y="0" width="390" height="844" fill={`url(#puff${i})`} />
        ))}
      </Svg>
    </View>
  );
}

export default DarkCloudBg;
