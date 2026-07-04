import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

/**
 * TRIAL swoosh artwork — "indigo dusk": the opposite mood of skyblue_os.
 * A deep twilight indigo field with one giant luminous aqua-to-periwinkle
 * ribbon sweeping bottom-left to top-right, a soft counter band, and a
 * glow rising from the bottom. Same composition rules as AquaBg: every
 * band flows off the screen edges (never stopping mid-screen) and every
 * curve is tangent-smooth. Fixed 390x844 viewBox, sliced to fill.
 */
export function IndigoBg() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <Defs>
          {/* twilight field: near-night up top, softer indigo below */}
          <LinearGradient id="base" x1="0" y1="0" x2="0.3" y2="1">
            <Stop offset="0%" stopColor="#232B4A" />
            <Stop offset="55%" stopColor="#39466F" />
            <Stop offset="100%" stopColor="#56679C" />
          </LinearGradient>

          {/* the luminous ribbon: aqua glow melting into periwinkle */}
          <LinearGradient id="glowRibbon" x1="0" y1="1" x2="0.8" y2="0">
            <Stop offset="0%" stopColor="#7FD8E8" stopOpacity={0} />
            <Stop offset="35%" stopColor="#7FD8E8" stopOpacity={0.3} />
            <Stop offset="70%" stopColor="#8E9BFF" stopOpacity={0.22} />
            <Stop offset="100%" stopColor="#8E9BFF" stopOpacity={0} />
          </LinearGradient>

          {/* soft counter band, cool white */}
          <LinearGradient id="counter" x1="1" y1="1" x2="0" y2="0">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0} />
            <Stop offset="50%" stopColor="#FFFFFF" stopOpacity={0.08} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>

          {/* dawn glow rising from the bottom edge */}
          <LinearGradient id="dawn" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0%" stopColor="#9FB4E8" stopOpacity={0.35} />
            <Stop offset="60%" stopColor="#9FB4E8" stopOpacity={0.08} />
            <Stop offset="100%" stopColor="#9FB4E8" stopOpacity={0} />
          </LinearGradient>

          {/* deep shadow band hugging the top edge */}
          <LinearGradient id="nightTop" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#161C36" stopOpacity={0.55} />
            <Stop offset="100%" stopColor="#161C36" stopOpacity={0} />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width="390" height="844" fill="url(#base)" />

        {/* night shadow settling over the top */}
        <Path
          d="M -80 -80 L 470 -80 L 470 120
             C 300 180, 120 170, -80 90 Z"
          fill="url(#nightTop)"
        />

        {/* the big luminous ribbon: enters bottom-left, swells through the
            middle, exits off the top-right corner */}
        <Path
          d="M -80 900
             C 40 700, 120 560, 240 420
             C 360 280, 420 140, 440 -80
             L 250 -80
             C 230 100, 160 260, 60 420
             C 0 520, -50 640, -80 780 Z"
          fill="url(#glowRibbon)"
        />

        {/* soft counter band crossing the other diagonal */}
        <Path
          d="M 470 640
             C 300 560, 140 580, -80 720
             L -80 860
             C 140 700, 320 680, 470 760 Z"
          fill="url(#counter)"
        />

        {/* dawn glow at the very bottom, edge to edge */}
        <Path
          d="M -80 900 L -80 700
             C 100 640, 290 640, 470 700
             L 470 900 Z"
          fill="url(#dawn)"
        />
      </Svg>
    </View>
  );
}

export default IndigoBg;
