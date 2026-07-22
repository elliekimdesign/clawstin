import Svg, { Path } from 'react-native-svg';

/**
 * The waiting tab's plate on a two-tab frosted folder (born on the
 * CREW/YOU digest, 2026-07-21): a PARALLELOGRAM in the flap's grammar.
 * Its left edge runs parallel to the front flap's diagonal and tucks
 * flush underneath it (no ghost sliver between the tabs); its right
 * edge exits on the same 45° cut. Shaded ink, so it reads as the
 * folder resting behind the front one.
 *
 * The svg spans `h` wider than the label container and hangs `h` to
 * the left, so (0,0) lands exactly on the front diagonal's top point.
 */
export function TabFlapBg({ w }: { w: number }) {
  const h = 26;
  const d = `M 0,0 L ${w - h},0 L ${w},${h} L ${h},${h} Z`;
  return (
    <Svg
      width={w}
      height={h}
      pointerEvents="none"
      style={{ position: 'absolute', left: -h, top: 0 }}>
      <Path d={d} fill="rgba(22,24,28,0.07)" />
    </Svg>
  );
}

export default TabFlapBg;
