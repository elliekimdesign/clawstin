import { Platform, StyleSheet, View } from 'react-native';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import Svg, { Rect } from 'react-native-svg';

import { sysColor } from '@/theme/theme';

// expo-glass-effect is iOS-only; fall back to a translucent dark fill.
const GLASS_AVAILABLE = Platform.OS === 'ios' && isGlassEffectAPIAvailable();

/** The aquaos section-window material, shared by Home and Activity:
 * liquid-glass lens under a "droplet tab" (near-bare gray plate strip
 * where the lens shows through) over a solid white body, with a 1px
 * sill. effect: 'clear' shows the liquid lens; 'regular' is a uniform
 * frost; 'none' = veil only. */
export function AcidGlassFill({
  effect = 'clear',
  dense = false,
  bright = false,
  tone = 'gray',
  accentBar = false,
}: {
  effect?: 'clear' | 'regular' | 'none';
  /** taller tab strip for windows whose bar holds controls (the list) */
  dense?: boolean;
  /** kept for callers; the droplet material renders one way today */
  bright?: boolean;
  /** pastel section surfaces (2026-07-11); the whole board currently
   * wears one tone at a time */
  tone?: 'gray' | 'mint' | 'blue' | 'ivory' | 'citron' | 'blossom';
  /** the ONE differentiator for the card awaiting user input: a soft
   * accent wash over its title bar (YOUR TURN only) */
  accentBar?: boolean;
}) {
  const TONES: Record<string, [string, string, string]> = {
    gray: ['#F4F5F6', '#F0F1F3', '#E9EBED'],
    mint: ['#C8E7DF', '#BFE2D8', '#B3DBCF'],
    blue: ['#D5E7F6', '#CCE2F4', '#C0DAF1'],
    citron: ['#F2F6CD', '#EDF3C1', '#E4EEB1'],
    blossom: ['#FBE4E8', '#F9DCE1', '#F5D0D8'],
    ivory: ['#F6F3ED', '#F3F0E9', '#EEEAE0'],
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const stops = TONES[tone];
  return (
    <>
      {GLASS_AVAILABLE && effect !== 'none' ? (
        <GlassView
          glassEffectStyle={effect}
          colorScheme="light"
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}
      {/* "droplet tab": the BODY is a translucent white veil (the
          liquid-glass lens stays visible through it, 2026-07-12), and
          the title-bar strip stays nearly bare so the lens shows raw. */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none" preserveAspectRatio="none">
        {/* body: white veil thin enough that the desk breathes through
            — settled at 0.66 (2026-07-17, "더 state of the art 느낌",
            sections read too opaque at 0.74 and killed the wash glow) */}
        <Rect
          x="0"
          y={dense ? 42 : 26}
          width="100%"
          height="100%"
          fill="#FFFFFF"
          fillOpacity={0.66}
        />
        {/* the tab: tinted with the desk shader's own soft-light-blue
            pane (#B7D4EE, 2026-07-16 "one of the panel 컬러") — the
            title strip now carries a drop of the field's color instead
            of neutral chrome gray */}
        <Rect x="0" y="0" width="100%" height={dense ? 42 : 26} fill="#B7D4EE" fillOpacity={0.6} />
        {accentBar ? (
          <Rect
            x="0"
            y="0"
            width="100%"
            height={30}
            fill={sysColor.accent}
            fillOpacity={0.14}
          />
        ) : null}
        <Rect
          x="0"
          y={dense ? 42 : 26}
          width="100%"
          height={1}
          fill="#16181C"
          fillOpacity={0.06}
        />
      </Svg>
    </>
  );
}

/** Window dots: the three-dot trio in every title bar. Pure indicator
 * lights, no tap function — they GLOW in the accent on the window that
 * needs the user, and idle quietly everywhere else. */
export function WindowDots({ lit }: { lit?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3.5, marginRight: 8 }}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            width: 4.5,
            height: 4.5,
            borderRadius: 1.2,
            backgroundColor: lit ? sysColor.accent : 'rgba(59,118,196,0.32)',
          }}
        />
      ))}
    </View>
  );
}
