import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Rect, RadialGradient, Stop } from 'react-native-svg';

const BASE = '#FBFAF8'; // warm near-white
const PEACH = '#F4DCCD';
const LAVENDER = '#EAD9EC';
const SKY = '#C9DDF0';
const SKY_SOFT = '#D6E4F2';

/**
 * Subtle "pearl" pastel gradient — warm cream/peach at the top melting into
 * pale lavender and soft sky blue at the bottom. Low-saturation sheen, not a
 * colorful mesh. Absolutely positioned fill; used behind chat + onboarding.
 */
export function MeshBg() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          {/* warm peach glow, top-left */}
          <RadialGradient id="g1" cx="15%" cy="8%" r="75%">
            <Stop offset="0%" stopColor={PEACH} stopOpacity={0.7} />
            <Stop offset="55%" stopColor={PEACH} stopOpacity={0.16} />
            <Stop offset="100%" stopColor={PEACH} stopOpacity={0} />
          </RadialGradient>
          {/* soft lavender-pink, top-right */}
          <RadialGradient id="g2" cx="90%" cy="18%" r="65%">
            <Stop offset="0%" stopColor={LAVENDER} stopOpacity={0.5} />
            <Stop offset="60%" stopColor={LAVENDER} stopOpacity={0.12} />
            <Stop offset="100%" stopColor={LAVENDER} stopOpacity={0} />
          </RadialGradient>
          {/* pale sky blue, bottom-right */}
          <RadialGradient id="g3" cx="85%" cy="95%" r="75%">
            <Stop offset="0%" stopColor={SKY} stopOpacity={0.7} />
            <Stop offset="60%" stopColor={SKY} stopOpacity={0.16} />
            <Stop offset="100%" stopColor={SKY} stopOpacity={0} />
          </RadialGradient>
          {/* fainter blue wash, bottom-left */}
          <RadialGradient id="g4" cx="10%" cy="88%" r="65%">
            <Stop offset="0%" stopColor={SKY_SOFT} stopOpacity={0.45} />
            <Stop offset="65%" stopColor={SKY_SOFT} stopOpacity={0.1} />
            <Stop offset="100%" stopColor={SKY_SOFT} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        <Rect x="0" y="0" width="100%" height="100%" fill={BASE} />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#g1)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#g2)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#g3)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#g4)" />
      </Svg>
    </View>
  );
}

export default MeshBg;
