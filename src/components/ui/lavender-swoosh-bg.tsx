import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

/**
 * "lavender_swoosh" — the home tab background art: the home's lavender melting
 * diagonally into the chat tab's bluecloud blue, with a few GRAPHIC swoosh
 * ribbons in the AquaBg style (see aqua-bg.tsx) over soft dreamy glows.
 * Composition rules shared with the chat art: every band flows THROUGH the
 * screen (enters one edge, exits another), every curve is tangent-smooth,
 * and every fill melts to transparent so nothing leaves a hard edge.
 * Palette is strictly the existing tone family. Fixed 390x844 viewBox.
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

// Soft dreamy underlayer. [cx, cy, rx, ry, rotation, color, peak opacity]
const GLOWS: [number, number, number, number, number, string, number][] = [
  [90, 170, 360, 300, 0, '#FFFFFF', 0.75], // top-left light source
  [360, 420, 220, 160, 20, '#D5D8EC', 0.5], // lavender shimmer mid-right
  [240, 760, 360, 150, -14, '#4F7CB4', 0.35], // deep blue band at the bottom
];

export function LavenderSwooshBg() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <Defs>
          {/* lavender (top-left) melting into the chat blue (bottom-right) */}
          <LinearGradient id="field" x1="0" y1="0" x2="0.7" y2="1">
            <Stop offset="0%" stopColor="#E8EAEF" />
            <Stop offset="45%" stopColor="#AFB7CB" />
            <Stop offset="100%" stopColor="#7E94B3" />
          </LinearGradient>
          {GLOWS.map((g, i) => glow(`g${i}`, g[0], g[1], g[2], g[3], g[4], g[5], g[6]))}

          {/* swoosh ribbon fills: strongest in the heart, melting at the rims */}
          <LinearGradient id="deepRibbon" x1="0" y1="0" x2="0.5" y2="1">
            <Stop offset="0%" stopColor="#4F7CB4" stopOpacity={0.32} />
            <Stop offset="60%" stopColor="#4F7CB4" stopOpacity={0.12} />
            <Stop offset="100%" stopColor="#4F7CB4" stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id="lightBand" x1="0" y1="1" x2="0.6" y2="0">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0} />
            <Stop offset="50%" stopColor="#FFFFFF" stopOpacity={0.2} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id="lightArc" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0} />
            <Stop offset="35%" stopColor="#FFFFFF" stopOpacity={0.16} />
            <Stop offset="72%" stopColor="#FFFFFF" stopOpacity={0.05} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width="390" height="844" fill="url(#field)" />
        {GLOWS.map((_, i) => (
          <Rect key={i} x="0" y="0" width="390" height="844" fill={`url(#g${i})`} />
        ))}

        {/* deep ribbon: enters at the top, swells down through the left half
            and exits through the left edge */}
        <Path
          d="M -80 -80 L 470 -80 L 470 140
             C 300 190, 160 300, 90 460
             C 55 540, 0 580, -80 600 Z"
          fill="url(#deepRibbon)"
        />
        {/* broad light band curving across the lower half, edge to edge */}
        <Path
          d="M -80 880
             C 40 620, 260 540, 470 600
             L 470 900 L -80 900 Z"
          fill="url(#lightBand)"
        />
        {/* wide light arc sweeping from the bottom edge up and off the top
            right — the counter-curve crossing the deep ribbon */}
        <Path
          d="M 60 900
             C 220 640, 300 380, 300 -80
             L 430 -80
             C 430 400, 330 700, 190 900 Z"
          fill="url(#lightArc)"
        />
      </Svg>
    </View>
  );
}

export default LavenderSwooshBg;
