import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Rect, RadialGradient, Stop } from 'react-native-svg';

import { chatThemes, darkChat } from '@/theme/theme';

const BASE = '#FBFAF8'; // warm near-white
const PEACH = '#F4DCCD';
const LAVENDER = '#EAD9EC';
const SKY = '#C9DDF0';
const SKY_SOFT = '#D6E4F2';

const PALETTES = {
  pearl: { base: BASE, g1: PEACH, g2: LAVENDER, g3: SKY, g4: SKY_SOFT },
  // dark variant follows the active chat colorway (see chatThemes in theme.ts)
  dark: darkChat.mesh,
  // the hazy sky blue colorway's corners — used on the intro/onboarding
  skyBlue: chatThemes.skyBlue.mesh,
};

type MeshBgProps = {
  variant?: 'pearl' | 'dark' | 'skyBlue';
};

/**
 * Subtle gradient mesh — a soft glow in each corner melting into the base.
 * Low-saturation sheen, not a colorful mesh. Absolutely positioned fill;
 * used behind chat + onboarding.
 *
 * `variant="pearl"` (default): warm cream/peach melting into pale lavender
 * and soft sky blue on near-white. `variant="dark"`: the active chat
 * colorway's corners. `variant="skyBlue"`: the hazy sky blue palette.
 */
export function MeshBg({ variant = 'pearl' }: MeshBgProps) {
  const { base, g1, g2, g3, g4 } = PALETTES[variant];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          {/* glow, top-left */}
          <RadialGradient id="g1" cx="15%" cy="8%" r="75%">
            <Stop offset="0%" stopColor={g1} stopOpacity={0.7} />
            <Stop offset="55%" stopColor={g1} stopOpacity={0.16} />
            <Stop offset="100%" stopColor={g1} stopOpacity={0} />
          </RadialGradient>
          {/* glow, top-right */}
          <RadialGradient id="g2" cx="90%" cy="18%" r="65%">
            <Stop offset="0%" stopColor={g2} stopOpacity={0.5} />
            <Stop offset="60%" stopColor={g2} stopOpacity={0.12} />
            <Stop offset="100%" stopColor={g2} stopOpacity={0} />
          </RadialGradient>
          {/* glow, bottom-right */}
          <RadialGradient id="g3" cx="85%" cy="95%" r="75%">
            <Stop offset="0%" stopColor={g3} stopOpacity={0.7} />
            <Stop offset="60%" stopColor={g3} stopOpacity={0.16} />
            <Stop offset="100%" stopColor={g3} stopOpacity={0} />
          </RadialGradient>
          {/* fainter wash, bottom-left */}
          <RadialGradient id="g4" cx="10%" cy="88%" r="65%">
            <Stop offset="0%" stopColor={g4} stopOpacity={0.45} />
            <Stop offset="65%" stopColor={g4} stopOpacity={0.1} />
            <Stop offset="100%" stopColor={g4} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        <Rect x="0" y="0" width="100%" height="100%" fill={base} />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#g1)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#g2)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#g3)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#g4)" />
      </Svg>
    </View>
  );
}

export default MeshBg;
