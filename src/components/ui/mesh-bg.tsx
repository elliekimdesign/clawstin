import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Rect, RadialGradient, Stop } from 'react-native-svg';

import { colors } from '@/theme/theme';

const MINT = '#C7D2E8'; // soft blue aurora

/**
 * Soft mint "aurora" mesh background — several blurred radial blobs over a light
 * base, for a subtle (not flat) Apple-style gradient. Absolutely positioned fill.
 */
export function MeshBg() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          {/* top-left large mint blob */}
          <RadialGradient id="g1" cx="20%" cy="12%" r="70%">
            <Stop offset="0%" stopColor={MINT} stopOpacity={0.85} />
            <Stop offset="55%" stopColor={MINT} stopOpacity={0.18} />
            <Stop offset="100%" stopColor={MINT} stopOpacity={0} />
          </RadialGradient>
          {/* mid-right soft mint */}
          <RadialGradient id="g2" cx="95%" cy="45%" r="60%">
            <Stop offset="0%" stopColor={MINT} stopOpacity={0.55} />
            <Stop offset="60%" stopColor={MINT} stopOpacity={0.12} />
            <Stop offset="100%" stopColor={MINT} stopOpacity={0} />
          </RadialGradient>
          {/* bottom faint mint */}
          <RadialGradient id="g3" cx="40%" cy="100%" r="65%">
            <Stop offset="0%" stopColor={MINT} stopOpacity={0.5} />
            <Stop offset="65%" stopColor={MINT} stopOpacity={0.1} />
            <Stop offset="100%" stopColor={MINT} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* light base, then layered mint blobs */}
        <Rect x="0" y="0" width="100%" height="100%" fill={colors.background} />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#g1)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#g2)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#g3)" />
      </Svg>
    </View>
  );
}

export default MeshBg;
