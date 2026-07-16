import { StyleSheet, View } from 'react-native';

/** Pixel chrome: a window frame drawn in the crew-pixel ink language —
 * 2pt edges with classic stepped corners (edge → two 2×2 step blocks →
 * edge), reserved for windows that ask something of the user (Home's
 * YOUR TURN, Crew's open slot). Overlays the glass fill; no layout
 * cost. Born on Home 2026-07-16, shared once Crew wanted it too. */
// near-black read as a foreign edge on the blue desk (2026-07-16
// "어우러지는 색으로") — the frame now speaks a deep desk-blue ink
const PX_INK = 'rgba(40,66,97,0.9)';

export function PixelChrome() {
  const bar = { position: 'absolute' as const, backgroundColor: PX_INK };
  const px = (
    l: number | undefined,
    r: number | undefined,
    t: number | undefined,
    b: number | undefined
  ) => ({
    ...bar,
    left: l,
    right: r,
    top: t,
    bottom: b,
    width: 2,
    height: 2,
  });
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* edges, held back 6pt from each corner */}
      <View style={{ ...bar, top: 0, left: 6, right: 6, height: 2 }} />
      <View style={{ ...bar, bottom: 0, left: 6, right: 6, height: 2 }} />
      <View style={{ ...bar, left: 0, top: 6, bottom: 6, width: 2 }} />
      <View style={{ ...bar, right: 0, top: 6, bottom: 6, width: 2 }} />
      {/* stepped corner blocks: two 2×2 cells per corner */}
      <View style={px(4, undefined, 2, undefined)} />
      <View style={px(2, undefined, 4, undefined)} />
      <View style={px(undefined, 4, 2, undefined)} />
      <View style={px(undefined, 2, 4, undefined)} />
      <View style={px(4, undefined, undefined, 2)} />
      <View style={px(2, undefined, undefined, 4)} />
      <View style={px(undefined, 4, undefined, 2)} />
      <View style={px(undefined, 2, undefined, 4)} />
    </View>
  );
}

export default PixelChrome;
