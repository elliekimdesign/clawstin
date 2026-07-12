import Svg, { Rect } from 'react-native-svg';

/** The Clawstin mark, pixel edition v4 (2026-07-11): simplified on
 * Ellie's direction — a ROUND pixel ring (no white fill, background
 * shows through), thin tall slit eyes, the accent-blue cap, long
 * smile. Two colors total: ink + cap blue. Extracted from the Home
 * screen 2026-07-12 so the chat routing pill can wear the same face. */
const MARK_INK = '#101214';
const MARK_EYE = MARK_INK; // monochrome: the color came out

/** pixel circle ring on an n-grid: cells whose center falls in the
 * ring band (computed once at module load; deterministic) */
function pixelRing(n: number, rInner: number, rOuter: number): [number, number][] {
  const cells: [number, number][] = [];
  const mid = n / 2;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const d = Math.hypot(x + 0.5 - mid, y + 0.5 - mid);
      if (d >= rInner && d <= rOuter) cells.push([x, y]);
    }
  }
  return cells;
}
const HERO_RING = pixelRing(24, 10.4, 11.9);
// her pixel bob: jagged fringe on top + hair falling down both
// sides of the ring (an inner band hugging the curve) ending in
// blunt bob tips at cheek level.
const HERO_HAIR: [number, number][] = [
  // bangs peeking out under the cap: one solid row + jagged teeth
  ...[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((c) => [c, 5] as [number, number]),
  ...[6, 8, 10, 12, 14, 16].map((c) => [c, 6] as [number, number]),
];
// the cap: an accent-blue dome over the crown (drawn OVER the hair so
// the fringe peeks below it) + a 2-pixel button poking through on top
const HERO_CAP: [number, number][] = [];
for (let y = 1; y <= 4; y++) {
  for (let x = 0; x < 24; x++) {
    const d = Math.hypot(x + 0.5 - 12, y + 0.5 - 12);
    if (d <= 11.5) HERO_CAP.push([x, y]);
  }
}
const HERO_CAP_BUTTON: [number, number][] = [[11, 0], [12, 0]];
for (let y = 4; y <= 15; y++) {
  for (let x = 0; x < 24; x++) {
    const d = Math.hypot(x + 0.5 - 12, y + 0.5 - 12);
    if (d >= 8.9 && d <= 10.35 && (x < 6 || x > 17)) HERO_HAIR.push([x, y]);
  }
}
// blunt bob ends
HERO_HAIR.push([3, 16], [4, 16], [19, 16], [20, 16]);
// a long smile: raised pixel corners, flat middle (sits lower)
const HERO_MOUTH: [number, number][] = [
  [8, 15], [9, 16], [10, 16], [11, 16], [12, 16], [13, 16], [14, 16], [15, 15],
];

export function ClawstinMark({ size, tint }: { size: number; tint?: string }) {
  const grid = 24;
  const c = size / grid;
  // pixels overlap a hair so no shimmer lines appear between cells
  const w = c * 1.06;
  const px = (cells: [number, number][], fill: string) =>
    cells.map(([x, y], i) => (
      <Rect key={`${fill}${i}`} x={x * c} y={y * c} width={w} height={w} fill={fill} />
    ));
  return (
    <Svg width={size} height={size}>
      {px(HERO_RING, tint ?? MARK_INK)}
      {px(HERO_HAIR, tint ?? MARK_INK)}
      {px(HERO_CAP, tint ?? '#3B76C4')}
      {px(HERO_CAP_BUTTON, tint ?? '#3B76C4')}
      <Rect x={6.75 * c} y={9 * c} width={1.5 * c} height={4 * c} fill={tint ?? MARK_EYE} />
      <Rect x={15.75 * c} y={9 * c} width={1.5 * c} height={4 * c} fill={tint ?? MARK_EYE} />
      {px(HERO_MOUTH, tint ?? MARK_INK)}
    </Svg>
  );
}

export default ClawstinMark;
