import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/** The command bar's neon lime rim: a soft aurora bleed under a crisp
 * hairline, traced around a pill of the given measured size. Overlay it
 * absolutely on top of a rounded container (pointer-transparent). */
export function AuroraRim({ w, h, r }: { w: number; h: number; r?: number }) {
  const rx = r ?? (h - 1.5) / 2;
  return (
    <Svg
      pointerEvents="none"
      width={w}
      height={h}
      style={{ position: 'absolute', top: 0, left: 0 }}>
      <Defs>
        <LinearGradient id="aurorarim" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#E3EFA9" />
          <Stop offset="0.5" stopColor="#A9C57C" />
          <Stop offset="1" stopColor="#D9E794" />
        </LinearGradient>
      </Defs>
      <Rect
        x={0.75}
        y={0.75}
        width={w - 1.5}
        height={h - 1.5}
        rx={rx}
        fill="none"
        stroke="url(#aurorarim)"
        strokeWidth={5}
        opacity={0.1}
      />
      <Rect
        x={0.75}
        y={0.75}
        width={w - 1.5}
        height={h - 1.5}
        rx={rx}
        fill="none"
        stroke="url(#aurorarim)"
        strokeWidth={1.5}
      />
    </Svg>
  );
}

export default AuroraRim;
