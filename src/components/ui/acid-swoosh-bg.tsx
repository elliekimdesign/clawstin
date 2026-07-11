import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

/**
 * "acid_swoosh" — the field art, re-inked 2026-07-11 for the titanium
 * skin: brushed-silver metal (white light melting into cool aluminum
 * gray) with the same swoosh ribbons and dreamy glows as bliss_swoosh
 * and lavender_swoosh; the ribbons now read as machined light arcs on
 * the lid. Same geometry, only the tones differ. Fixed 390x844 viewBox.
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

// Dreamy underlayer.
// [cx, cy, rx, ry, rotation, color, peak opacity]
// 2026-07-11 "titanium": teal-cast metallic glows — the accent's own
// hue breathed into the metal so the field reads faintly energized
// (fullback neutral-silver: #E9EBED sheen, #AEB4BA pool).
const GLOWS: [number, number, number, number, number, string, number][] = [
  [100, 200, 360, 300, 0, '#FFFFFF', 0.28], // top-left light source
  [330, 450, 200, 150, 0, '#8FC0E8', 0.35], // aqua shimmer mid-right
  [150, 750, 230, 170, 0, '#33689C', 0.24], // deep pool at the bottom
];

export function AcidSwooshBg() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <Defs>
          {/* aqua desktop (2026-07-11 late, per the Mac OS X 10.2
              reference): the deep refreshing blue the silver windows
              float on; the swoosh ribbons below play the wallpaper's
              light waves. Fullback white-tone: #FDFDFD / #F9FAFA /
              #F2F4F4. */}
          <LinearGradient id="acidfield" x1="0" y1="0" x2="0.7" y2="1">
            <Stop offset="0%" stopColor="#6297CE" />
            <Stop offset="33%" stopColor="#4E83B8" />
            <Stop offset="74%" stopColor="#4074A5" />
          </LinearGradient>
          {GLOWS.map((g, i) => glow(`ag${i}`, g[0], g[1], g[2], g[3], g[4], g[5], g[6]))}

          {/* swoosh ribbon fills: strongest in the heart, melting at the rims */}
          {/* (fullback: neutral-silver ribbon #B9BEC4) */}
          <LinearGradient id="acidDeepRibbon" x1="0" y1="0" x2="0.5" y2="1">
            <Stop offset="0%" stopColor="#94C4F0" stopOpacity={0.3} />
            <Stop offset="60%" stopColor="#94C4F0" stopOpacity={0.12} />
            <Stop offset="100%" stopColor="#94C4F0" stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id="acidLightArc" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.06} />
            <Stop offset="50%" stopColor="#FFFFFF" stopOpacity={0.2} />
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
