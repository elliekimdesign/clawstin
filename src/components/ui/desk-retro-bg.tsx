import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { AcidSwooshBg } from './acid-swoosh-bg';

/**
 * "desk_retro" (2026-07-12) — the chat background: the Home tab's own
 * aqua desk (AcidSwooshBg, shared so the two screens stay one OS) with
 * a vintage-futuristic layer breathed on top: fine machined light arcs
 * (the Jaguar swoosh lines). The three window-button gels moved onto
 * the chat composer (minimal dots above the command pill).
 */


export function DeskRetroBg() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <AcidSwooshBg />
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 390 844"
        preserveAspectRatio="xMidYMid slice"
        style={StyleSheet.absoluteFill}>
        <Defs>
          {/* CRT vignette: clear center, faint ink toward the glass
              edges, so the desk reads as a lit screen */}
          <RadialGradient id="crt" gradientUnits="userSpaceOnUse" cx={195} cy={400} r={520}>
            <Stop offset="0%" stopColor="#16181C" stopOpacity={0} />
            <Stop offset="72%" stopColor="#16181C" stopOpacity={0} />
            <Stop offset="100%" stopColor="#16181C" stopOpacity={0.12} />
          </RadialGradient>
        </Defs>
        {/* machined light arcs: thin strokes tracing the big swoosh,
            the vintage aqua wallpaper's hairline waves */}
        <Path
          d="M 40 900 C 200 640, 285 380, 285 -80"
          stroke="#FFFFFF"
          strokeOpacity={0.12}
          strokeWidth={1.5}
          fill="none"
        />
        <Path
          d="M 110 900 C 262 650, 340 400, 340 -80"
          stroke="#FFFFFF"
          strokeOpacity={0.07}
          strokeWidth={3}
          fill="none"
        />
        <Path
          d="M -80 560 C 60 520, 170 420, 240 260"
          stroke="#FFFFFF"
          strokeOpacity={0.08}
          strokeWidth={1.5}
          fill="none"
        />
        <Rect x="0" y="0" width="390" height="844" fill="url(#crt)" />
      </Svg>
    </View>
  );
}

export default DeskRetroBg;
