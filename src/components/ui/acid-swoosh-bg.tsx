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
// 2026-07-08 pm "silverfield": glows in white + bright silver.
// Fullback (chartreuse keeper): shimmer #E9F296 @0.6, pool #A8BF3E @0.36.
// Older: meadow green #6FA344 @0.3-0.36, shimmer #EFF5B0 @0.5.
const GLOWS: [number, number, number, number, number, string, number][] = [
  [100, 200, 360, 300, 0, '#FFFFFF', 0.3], // top-left light source
  [330, 450, 200, 150, 0, '#EBEEE0', 0.6], // warm silver shimmer mid-right
  [150, 750, 230, 170, 0, '#ADB3A0', 0.32], // sage-silver pool at the bottom
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
            {/* 2026-07-08 pm "silverfield": white melting into bright
                silver so the lime sections carry all the color; swoosh
                stays as a silver pattern. Fullback (chartreuse field,
                the keeper candidate): #FEFEF7 / #FCFDEA / #F4F7D9.
                Older: pop-pass #FDFEEC / #F8FBD8 / #ECF3BE; near-white
                #FEFEF9 / #FBFCEE / #F3F6DE; butter-lime #F7FAC6 /
                #EFF4A8 / #D3E28C. */}
            {/* warmed a touch (fullback cool silver: #FFFFFF / #FAFBFB
                / #EDF0EF) */}
            <Stop offset="0%" stopColor="#FEFEFA" />
            <Stop offset="33%" stopColor="#F8F9F0" />
            <Stop offset="74%" stopColor="#EDEFE2" />
          </LinearGradient>
          {GLOWS.map((g, i) => glow(`ag${i}`, g[0], g[1], g[2], g[3], g[4], g[5], g[6]))}

          {/* swoosh ribbon fills: strongest in the heart, melting at the rims */}
          {/* (fullback: chartreuse ribbon #A8BF3E; older meadow #6FA344) */}
          <LinearGradient id="acidDeepRibbon" x1="0" y1="0" x2="0.5" y2="1">
            <Stop offset="0%" stopColor="#A6AC9B" stopOpacity={0.3} />
            <Stop offset="60%" stopColor="#A6AC9B" stopOpacity={0.12} />
            <Stop offset="100%" stopColor="#A6AC9B" stopOpacity={0} />
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
