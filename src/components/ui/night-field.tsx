import { View, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

/** Aurora night for the Logs console: deep navy base, the command bar's
 * azure breathing in from the top, and the home field's lime rising from
 * the bottom edge like northern lights. Every glow stays quiet (<= 0.22)
 * so the mono text remains the loudest thing on screen. */
export function NightField() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <Defs>
          {/* base: near-black navy, bluest mid, green-leaning foot */}
          <LinearGradient id="auroraBase" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#0D1B36" />
            <Stop offset="48%" stopColor="#1E4278" />
            <Stop offset="100%" stopColor="#123324" />
          </LinearGradient>
          {/* azure halo, upper right: the command blue as ambient light */}
          <RadialGradient id="auroraAzure" cx="290" cy="120" r="420" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#4285F4" stopOpacity={0.4} />
            <Stop offset="55%" stopColor="#4285F4" stopOpacity={0.14} />
            <Stop offset="100%" stopColor="#4285F4" stopOpacity={0} />
          </RadialGradient>
          {/* faint azure wisp, mid left: keeps the middle from flattening */}
          <RadialGradient id="auroraWisp" cx="60" cy="380" r="260" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#4285F4" stopOpacity={0.16} />
            <Stop offset="100%" stopColor="#4285F4" stopOpacity={0} />
          </RadialGradient>
          {/* lime curtain: brightest at the lower lip, gone by mid-air */}
          <LinearGradient id="auroraLime" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0%" stopColor="#DEFF4F" stopOpacity={0.28} />
            <Stop offset="45%" stopColor="#A3D700" stopOpacity={0.12} />
            <Stop offset="100%" stopColor="#A3D700" stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id="auroraLimeFar" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0%" stopColor="#A3D700" stopOpacity={0.18} />
            <Stop offset="100%" stopColor="#A3D700" stopOpacity={0} />
          </LinearGradient>
          {/* lime under-glow pooled below the bottom edge */}
          <RadialGradient id="auroraPool" cx="195" cy="880" r="300" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#C9DC7A" stopOpacity={0.22} />
            <Stop offset="100%" stopColor="#C9DC7A" stopOpacity={0} />
          </RadialGradient>
          {/* top vignette: keeps the status bar + header crisp */}
          <LinearGradient id="auroraVignette" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#050B15" stopOpacity={0.5} />
            <Stop offset="100%" stopColor="#050B15" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="390" height="844" fill="url(#auroraBase)" />
        <Rect x="0" y="0" width="390" height="844" fill="url(#auroraAzure)" />
        <Rect x="0" y="0" width="390" height="844" fill="url(#auroraWisp)" />
        {/* two aurora ribbons in the acid-swoosh bezier language: a far
            band lying low and a near curtain sweeping up left-to-right */}
        <Path
          d="M0 780 C 90 750, 210 772, 300 742 C 340 732, 370 738, 390 726 L390 844 L0 844 Z"
          fill="url(#auroraLimeFar)"
        />
        <Path
          d="M0 844 C 60 716, 150 686, 250 714 C 320 734, 360 700, 390 652 L390 844 Z"
          fill="url(#auroraLime)"
        />
        <Rect x="0" y="0" width="390" height="844" fill="url(#auroraPool)" />
        <Rect x="0" y="0" width="390" height="120" fill="url(#auroraVignette)" />
      </Svg>
    </View>
  );
}

export default NightField;
