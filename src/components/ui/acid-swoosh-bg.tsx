import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

/**
 * "acid_swoosh" — the field art of the V Acid Pop colorway (Figma board
 * node 30:13): pale sage light melting diagonally into acid meadow green,
 * with the same swoosh ribbons and dreamy glows as bliss_swoosh and
 * lavender_swoosh. Same geometry, only the tones differ.
 * Fixed 390x844 viewBox.
 */

/** One soft glow: a rotated elliptical radial wash that fades to nothing. */
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

// Dreamy underlayer, matched to the Figma V Acid Pop frame.
// [cx, cy, rx, ry, rotation, color, peak opacity]
const GLOWS: [number, number, number, number, number, string, number][] = [
  [100, 200, 360, 300, 0, '#FFFFFF', 0.3], // top-left light source
  [330, 450, 200, 150, 0, '#EFF5B0', 0.5], // pale lime shimmer mid-right
  [150, 750, 230, 170, 0, '#6FA344', 0.3], // meadow pool at the bottom
];

export function AcidSwooshBg() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <Defs>
          {/* pale sage light (top-left) melting into acid meadow green.
              2026-07-07: brighter, milky MacBook-Air pastel lime (clean,
              not electric); previous stops #F8FAE6 / #E2EABC / #B4CB93
              live at commit 3739da4 for rollback. */}
          <LinearGradient id="acidfield" x1="0" y1="0" x2="0.7" y2="1">
            {/* 2026-07-08: near-white, barest lime cast; swoosh ribbons
                and glows stay as the pattern. Previous butter-lime
                stops #F7FAC6 / #EFF4A8 / #D3E28C for recall. */}
            <Stop offset="0%" stopColor="#FEFEF9" />
            <Stop offset="33%" stopColor="#FBFCEE" />
            <Stop offset="74%" stopColor="#F3F6DE" />
          </LinearGradient>
          {GLOWS.map((g, i) => glow(`ag${i}`, g[0], g[1], g[2], g[3], g[4], g[5], g[6]))}

          {/* swoosh ribbon fills: strongest in the heart, melting at the rims */}
          <LinearGradient id="acidDeepRibbon" x1="0" y1="0" x2="0.5" y2="1">
            <Stop offset="0%" stopColor="#6FA344" stopOpacity={0.3} />
            <Stop offset="60%" stopColor="#6FA344" stopOpacity={0.12} />
            <Stop offset="100%" stopColor="#6FA344" stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id="acidLightArc" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.05} />
            <Stop offset="50%" stopColor="#FFFFFF" stopOpacity={0.16} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width="390" height="844" fill="url(#acidfield)" />
        {GLOWS.map((_, i) => (
          <Rect key={i} x="0" y="0" width="390" height="844" fill={`url(#ag${i})`} />
        ))}

        {/* deep ribbon: enters at the top, swells down through the
            left half and exits through the left edge */}
        <Path
          d="M -80 -80 L 470 -80 L 470 140
             C 300 190, 160 300, 90 460
             C 55 540, 0 580, -80 600 Z"
          fill="url(#acidDeepRibbon)"
        />
        {/* wide light arc sweeping from the bottom edge up and off the
            top right — the counter-curve crossing the deep ribbon */}
        <Path
          d="M 60 900
             C 220 640, 300 380, 300 -80
             L 430 -80
             C 430 400, 330 700, 190 900 Z"
          fill="url(#acidLightArc)"
        />
      </Svg>
    </View>
  );
}

export default AcidSwooshBg;
