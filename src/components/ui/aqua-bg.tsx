import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

/**
 * "skyblue_os" background art — 2000s Mac OS X Aqua-style swoosh for the
 * skyBlueOs chat colorway (see chatThemes in theme.ts). A bright sky-blue
 * field crossed by huge soft curved ribbons, like the classic OS update
 * screen artwork. Composition rules: every band FLOWS THROUGH the screen —
 * it enters from one edge and exits through another (or bleeds off-canvas),
 * never stopping mid-screen — and every curve is tangent-smooth (no cusps,
 * no pointed shapes). Fixed 390x844 viewBox, sliced to fill.
 */
export function AquaBg() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <Defs>
          {/* base field: deeper up top, airier toward the bottom */}
          <LinearGradient id="base" x1="0" y1="0" x2="0.4" y2="1">
            <Stop offset="0%" stopColor="#7CA3C2" />
            <Stop offset="55%" stopColor="#84AAC7" />
            <Stop offset="100%" stopColor="#A2C2DA" />
          </LinearGradient>

          {/* dark ribbon: strongest in its heart, melting at both rims */}
          <LinearGradient id="darkBand" x1="0" y1="0" x2="0.5" y2="1">
            <Stop offset="0%" stopColor="#3A6390" stopOpacity={0.5} />
            <Stop offset="60%" stopColor="#3A6390" stopOpacity={0.2} />
            <Stop offset="100%" stopColor="#24497A" stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id="darkBand2" x1="0" y1="0" x2="1" y2="0.6">
            <Stop offset="0%" stopColor="#3D6690" stopOpacity={0} />
            <Stop offset="50%" stopColor="#3D6690" stopOpacity={0.3} />
            <Stop offset="100%" stopColor="#3D6690" stopOpacity={0} />
          </LinearGradient>

          {/* light wash bands */}
          <LinearGradient id="lightBand" x1="0" y1="1" x2="0.6" y2="0">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0} />
            <Stop offset="50%" stopColor="#FFFFFF" stopOpacity={0.26} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id="lightBand2" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0} />
            <Stop offset="60%" stopColor="#FFFFFF" stopOpacity={0.18} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id="lightArc" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0} />
            <Stop offset="35%" stopColor="#FFFFFF" stopOpacity={0.15} />
            <Stop offset="72%" stopColor="#FFFFFF" stopOpacity={0.05} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width="390" height="844" fill="url(#base)" />

        {/* deep ribbon: enters at the top, swells down through the left half
            and exits through the right edge — one continuous flow */}
        <Path
          d="M -80 -80 L 470 -80 L 470 140
             C 300 190, 160 300, 90 460
             C 55 540, 0 580, -80 600 Z"
          fill="url(#darkBand)"
        />
        {/* softer dark band: rolls in from the left edge and exits through
            the bottom edge */}
        <Path
          d="M -80 640
             C 60 560, 200 620, 290 900
             L 120 900
             C 60 760, -10 720, -80 780 Z"
          fill="url(#darkBand2)"
        />

        {/* broad light band curving across the lower half, edge to edge */}
        <Path
          d="M -80 880
             C 40 620, 260 540, 470 600
             L 470 900 L -80 900 Z"
          fill="url(#lightBand)"
        />
        {/* light pool bleeding off the right edge */}
        <Path
          d="M 225 318
             C 340 235, 470 285, 470 440
             C 470 588, 330 602, 228 512
             C 168 458, 168 362, 225 318 Z"
          fill="url(#lightBand2)"
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

export default AquaBg;
