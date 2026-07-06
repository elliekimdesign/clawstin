import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

/**
 * "bliss_swoosh" — the field art of the "blissxp" home skin: a clear sky
 * blue melting diagonally into hill green (Windows XP wallpaper energy),
 * with the same swoosh ribbons and dreamy glows as lavender_swoosh
 * (defaultskin's field, kept in the repo as the fallback skin). Same
 * geometry, only the tones differ. Fixed 390x844 viewBox.
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

// Dreamy underlayer, matched to the Figma X Bliss frame.
// [cx, cy, rx, ry, rotation, color, peak opacity]
const GLOWS: [number, number, number, number, number, string, number][] = [
  [90, 170, 360, 300, 0, '#FFFFFF', 0.6], // top-left light source
  [330, 450, 200, 150, 0, '#A8D98A', 0.5], // meadow shimmer mid-right
  [150, 750, 230, 170, 0, '#3F8F3F', 0.35], // deep green pool at the bottom
];

export function BlissSwooshBg({ plain }: { plain?: boolean }) {
  // Plain variant (home tab): the exact same bliss gradient with NO art
  // on top — no glows, no ribbons, just the field.
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <Defs>
          {/* sky (top-left) melting into the green hill (bottom-right) */}
          <LinearGradient id="field" x1="0" y1="0" x2="0.7" y2="1">
            <Stop offset="0%" stopColor="#8EC9F0" />
            <Stop offset="33%" stopColor="#5FA8DE" />
            <Stop offset="74%" stopColor="#5DB14A" />
          </LinearGradient>
          {!plain && GLOWS.map((g, i) => glow(`g${i}`, g[0], g[1], g[2], g[3], g[4], g[5], g[6]))}

          {/* swoosh ribbon fills: strongest in the heart, melting at the rims */}
          <LinearGradient id="deepRibbon" x1="0" y1="0" x2="0.5" y2="1">
            <Stop offset="0%" stopColor="#2E7CD6" stopOpacity={0.3} />
            <Stop offset="60%" stopColor="#2E7CD6" stopOpacity={0.12} />
            <Stop offset="100%" stopColor="#2E7CD6" stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id="lightArc" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.05} />
            <Stop offset="50%" stopColor="#FFFFFF" stopOpacity={0.16} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width="390" height="844" fill="url(#field)" />
        {!plain &&
          GLOWS.map((_, i) => (
            <Rect key={i} x="0" y="0" width="390" height="844" fill={`url(#g${i})`} />
          ))}

        {!plain && (
          <>
            {/* deep ribbon: enters at the top, swells down through the
                left half and exits through the left edge */}
            <Path
              d="M -80 -80 L 470 -80 L 470 140
                 C 300 190, 160 300, 90 460
                 C 55 540, 0 580, -80 600 Z"
              fill="url(#deepRibbon)"
            />
            {/* wide light arc sweeping from the bottom edge up and off the
                top right — the counter-curve crossing the deep ribbon */}
            <Path
              d="M 60 900
                 C 220 640, 300 380, 300 -80
                 L 430 -80
                 C 430 400, 330 700, 190 900 Z"
              fill="url(#lightArc)"
            />
          </>
        )}
      </Svg>
    </View>
  );
}

export default BlissSwooshBg;
