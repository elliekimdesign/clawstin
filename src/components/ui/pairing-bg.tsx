import { View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/**
 * The pairing field (2026-07-30 "저 그라데이션을 화면 중간 말고 위쪽 아래쪽
 * 으로만").
 *
 * The panel shader was tried first and rejected twice: at `fan` its edges
 * cut straight through the copy, and even flattened to `wash` the panel
 * seams still drew hard horizontal lines across the middle of the screen.
 *
 * So the colour leaves the middle entirely. Two soft washes bleed in from
 * the top and bottom edges and fade out well before the text, which frames
 * the content instead of competing with it. Reading area stays paper white.
 */

/** how far each wash reaches in, as a fraction of screen height */
const REACH = 0.34;
/** the desk blue, at the strength the splash's own fan settles to */
const TINT = '#8FC0E8';

export function PairingBg() {
  const { width, height } = useWindowDimensions();
  const band = Math.round(height * REACH);

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
      {/* paper base: the reading surface */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#FFFFFF' }} />

      {/* TOP wash: strongest at the very edge, gone by the headline */}
      <Svg width={width} height={band} style={{ position: 'absolute', top: 0, left: 0 }}>
        <Defs>
          <LinearGradient id="pairTop" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={TINT} stopOpacity="0.42" />
            <Stop offset="0.55" stopColor={TINT} stopOpacity="0.12" />
            <Stop offset="1" stopColor={TINT} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect width={width} height={band} fill="url(#pairTop)" />
      </Svg>

      {/* BOTTOM wash: the same, mirrored, so the screen is held at both ends */}
      <Svg width={width} height={band} style={{ position: 'absolute', bottom: 0, left: 0 }}>
        <Defs>
          <LinearGradient id="pairBottom" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor={TINT} stopOpacity="0.46" />
            <Stop offset="0.55" stopColor={TINT} stopOpacity="0.13" />
            <Stop offset="1" stopColor={TINT} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect width={width} height={band} fill="url(#pairBottom)" />
      </Svg>
    </View>
  );
}

export default PairingBg;
