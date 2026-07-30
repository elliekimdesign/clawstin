import Svg, { Circle, Line, Rect } from 'react-native-svg';

/**
 * The two machines, drawn as soft product silhouettes (2026-07-30).
 *
 * Earlier passes drew them as chunky 24-grid pixel art to match the crew
 * faces, but at card scale that read as blocky rather than as hardware, and
 * details like the port strip or a two-tone screen kept being mistaken for
 * chargers and battery meters. This version is quieter: a white body, a
 * hairline outline, generous corner rounding, and exactly one identifying
 * mark on each — the phone's speaker slot, the mini's power lamp and shelf
 * line. Nothing else, so nothing can be misread.
 */

const INK = 'rgba(22,24,28,0.30)';
const BODY = '#FFFFFF';
const DETAIL = 'rgba(22,24,28,0.35)';
const LAMP = '#5BAE7A';

export function MachinePixel({
  shape,
  size,
  /** kept for call-site parity with the old pixel version */
  light = false,
}: {
  shape: 'phone' | 'mini';
  size: number;
  light?: boolean;
}) {
  const body = light ? 'rgba(255,255,255,0.9)' : BODY;
  const line = light ? 'rgba(255,255,255,0.75)' : INK;
  const detail = light ? 'rgba(255,255,255,0.8)' : DETAIL;

  if (shape === 'phone') {
    // a tall rounded slab, narrower than the frame so the pair reads as
    // two objects of different proportion rather than two boxes
    const w = size * 0.58;
    const h = size * 0.92;
    const x = (size - w) / 2;
    const y = (size - h) / 2;
    return (
      <Svg width={size} height={size}>
        <Rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx={w * 0.26}
          fill={body}
          stroke={line}
          strokeWidth={size * 0.035}
        />
        {/* the speaker slot: the one mark that says "phone" */}
        <Rect
          x={x + w * 0.34}
          y={y + h * 0.075}
          width={w * 0.32}
          height={size * 0.028}
          rx={size * 0.014}
          fill={detail}
        />
      </Svg>
    );
  }

  // the mini: a wide, squat rounded box
  const w = size * 0.86;
  const h = size * 0.72;
  const x = (size - w) / 2;
  const y = (size - h) / 2;
  return (
    <Svg width={size} height={size}>
      <Rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={h * 0.22}
        fill={body}
        stroke={line}
        strokeWidth={size * 0.035}
      />
      {/* power lamp, top right */}
      <Circle cx={x + w * 0.82} cy={y + h * 0.22} r={size * 0.045} fill={LAMP} />
      {/* the shelf line across the lower face: reads as a machine front */}
      <Line
        x1={x + w * 0.18}
        y1={y + h * 0.7}
        x2={x + w * 0.82}
        y2={y + h * 0.7}
        stroke={detail}
        strokeWidth={size * 0.03}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default MachinePixel;
