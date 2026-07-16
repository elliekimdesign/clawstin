import { Fragment } from 'react';
import Svg, { Rect } from 'react-native-svg';

/**
 * The pixel crew (2026-07-11): the four crew members drawn in the main
 * logo's own 24-grid pixel language. Role mapping by Ellie:
 *   scout  (Research)     -> SPECS  — glasses = the reader
 *   pilot  (Operator)     -> CROP   — the doer, hands on the world
 *   quill  (Scribe)       -> WINK   — the most expressive face for the
 *                                     most expressive job
 *   muppet (Orchestrator) -> BEANIE — deadpan dispatch, no feelings
 * The main capped Clawstin girl stays the LOGO, not a crew member.
 * Each member carries exactly one accessory color over the shared ink.
 */

// pure black → deep desk-blue ink (2026-07-16), matching the pixel
// chrome frames so every pixel element shares one ink
const INK = '#284261';

/** each member's ONE accessory color (hat / frames / hair / blush) —
 * doubles as their accent in UI chrome (badge underlines etc.) */
export const CREW_ACCENT: Record<string, string> = {
  // truer, more primary green than the beanie itself so it reads on
  // the blue desk
  muppet: '#4BA65A', // Beanie's green (traffic-light green, dimmed a step)
  scout: '#E8655A', // Specs' red (the mac traffic-light coral)
  quill: '#F49FB6', // Wink's blush
  pilot: '#E8C244', // Crop's hair
};
/** ink-strength versions for text (slash-command tokens etc.) */
export const CREW_DEEP: Record<string, string> = {
  muppet: '#35573A',
  scout: '#A93229',
  quill: '#C05B7A',
  pilot: '#9A7A16',
};
const N = 24;

type Cell = [number, number];
type Layer = { color: string; cells?: Cell[]; rects?: [number, number, number, number][]; alpha?: number };

function ring(rIn: number, rOut: number, filter?: (x: number, y: number) => boolean): Cell[] {
  const cells: Cell[] = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const d = Math.hypot(x + 0.5 - 12, y + 0.5 - 12);
      if (d >= rIn && d <= rOut && (!filter || filter(x, y))) cells.push([x, y]);
    }
  }
  return cells;
}
const RING = ring(10.4, 11.9);
const span = (row: number, c0: number, c1: number): Cell[] =>
  Array.from({ length: c1 - c0 + 1 }, (_, i) => [c0 + i, row]);
const dome = (rows: number[], rMax: number) => ring(0, rMax, (_x, y) => rows.includes(y));

const CREW: Record<string, Layer[]> = {
  // SPECS — Research (scout): red frames, side-part fringe, quiet mouth
  scout: [
    { color: INK, cells: RING },
    {
      color: INK,
      cells: [
        ...span(2, 6, 17),
        ...span(3, 6, 8),
        ...span(3, 10, 17), // side-part notch at col 9
        ...[6, 8, 10, 12, 14, 16].map((c) => [c, 4] as Cell),
      ],
    },
    {
      color: '#D6453D',
      cells: [
        ...span(8, 4, 9), ...span(13, 4, 9),
        [4, 9], [4, 10], [4, 11], [4, 12], [9, 9], [9, 10], [9, 11], [9, 12],
        ...span(8, 14, 19), ...span(13, 14, 19),
        [14, 9], [14, 10], [14, 11], [14, 12], [19, 9], [19, 10], [19, 11], [19, 12],
        [10, 10], [11, 10], [12, 10], [13, 10],
        [3, 9], [20, 9],
      ],
    },
    { color: INK, cells: [[7, 10], [7, 11], [16, 10], [16, 11]] },
    { color: INK, cells: [[10, 16], [11, 16], [12, 16], [13, 16]] },
  ],
  // CROP — Operator (pilot): blond center-parted crop, small smile
  pilot: [
    { color: INK, cells: RING },
    { color: '#E8C244', cells: ring(8.6, 10.35, (x, y) => y <= 6 && !(x >= 11 && x <= 12 && y >= 3)) },
    { color: INK, rects: [[6.75, 9, 1.5, 4], [15.75, 9, 1.5, 4]] },
    { color: INK, cells: [[9, 15], [10, 16], [11, 16], [12, 16], [13, 16], [14, 15]] },
  ],
  // BEANIE — Orchestrator (muppet): forest-green beanie, deadpan dash
  muppet: [
    { color: '#4E7A52', cells: dome([0, 1, 2, 3, 4], 11.6) },
    { color: INK, cells: RING },
    { color: '#3A5C3E', cells: ring(0, 11.0, (_x, y) => y === 5) },
    { color: INK, cells: ring(0, 10.6, (_x, y) => y === 6) },
    { color: INK, rects: [[6.75, 10, 1.5, 4], [15.75, 10, 1.5, 4]] },
    { color: INK, cells: [[10, 17], [11, 17], [12, 17], [13, 17]] },
  ],
  // WINK — Scribe (quill): long hair, one wink, open grin, pink blush
  quill: [
    { color: INK, cells: RING },
    {
      color: INK,
      cells: [
        ...span(2, 6, 17), ...span(3, 6, 14), ...span(4, 6, 10), ...span(5, 6, 7),
        ...ring(8.9, 10.35, (x, y) => y >= 4 && y <= 16 && (x < 6 || x > 17)),
        [3, 16], [4, 16], [4, 17], [5, 17], [5, 18], [6, 18],
        [20, 16], [19, 16], [19, 17], [18, 17], [18, 18], [17, 18],
      ],
    },
    { color: INK, rects: [[6.75, 9, 1.5, 4]] },
    { color: INK, cells: [[15, 11], [16, 11], [17, 11]] },
    { color: INK, cells: [[8, 15], [15, 15], [9, 16], [10, 16], [11, 16], [12, 16], [13, 16], [14, 16]] },
    { color: INK, cells: [[10, 17], [11, 17], [12, 17], [13, 17]], alpha: 0.35 },
    { color: '#F49FB6', cells: [[4, 14], [19, 14]], alpha: 0.75 },
  ],
  // GHOST — the unhired seat on the roster: the same face ring with a
  // chunky pixel plus where a face will go (Add-crew slot). No plate
  // behind it, so the ring runs a little stronger to hold the edge.
  ghost: [
    { color: INK, cells: RING, alpha: 0.5 },
    { color: INK, alpha: 0.55, rects: [[10.75, 8, 2.5, 8], [8, 10.75, 8, 2.5]] },
  ],
};

export function CrewPixel({ id, size }: { id: string; size: number }) {
  const layers = CREW[id];
  if (!layers) return null;
  const c = size / N;
  // pixels overlap a hair so no shimmer lines appear between cells
  const w = c * 1.06;
  return (
    <Svg width={size} height={size}>
      {layers.map((layer, li) => (
        // a fragment in a list needs a key like anything else — this
        // bare <> was the phantom "unique key" warning on every boot
        <Fragment key={li}>
          {(layer.cells ?? []).map(([x, y], i) => (
            <Rect
              key={`c${li}-${i}`}
              x={x * c}
              y={y * c}
              width={w}
              height={w}
              fill={layer.color}
              opacity={layer.alpha}
            />
          ))}
          {(layer.rects ?? []).map(([x, y, rw, rh], i) => (
            <Rect
              key={`r${li}-${i}`}
              x={x * c}
              y={y * c}
              width={rw * c}
              height={rh * c}
              fill={layer.color}
              opacity={layer.alpha}
            />
          ))}
        </Fragment>
      ))}
    </Svg>
  );
}
