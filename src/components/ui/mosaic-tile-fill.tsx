import { useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

/**
 * The checkered tile texture, sized to a CARD (2026-07-30).
 *
 * The System card had to read apart from the task folders around it — those
 * hold messages and work, this one reports on the machine. Rather than a
 * different shape, it gets a different SURFACE: the same checkered mosaic
 * the desk field uses, at card scale.
 *
 * MosaicTilesBg is the full-screen version of this; it measures the window
 * and cannot be used inside a card. Same idea, same near-identical shade
 * steps, laid out against the box it is given instead.
 */

/** near-identical cuts of white, so the grid reads as texture and never as
 * a pattern competing with the content on top */
const SHADES = [
  'rgba(255,255,255,0.50)',
  'rgba(255,255,255,0.38)',
  'rgba(255,255,255,0.46)',
  'rgba(255,255,255,0.33)',
  'rgba(255,255,255,0.43)',
];

export function MosaicTileFill({
  width,
  height,
  /** tile edge in pt: bigger reads calmer, smaller reads busier */
  tile = 26,
  radius = 14,
}: {
  width: number;
  height: number;
  tile?: number;
  radius?: number;
}) {
  // OVERSHOOT the box (2026-07-30 "엣지들이 완전히 배경으로 안 채워져있어"):
  // the grid is laid out inside a container inset 2pt on every side, so a
  // grid sized to the card left a bare strip at the right and bottom edges
  // and a gap in each rounded corner. One extra tile in each direction, and
  // the whole face is covered before the clip trims it.
  const cols = Math.ceil(width / tile) + 1;
  const rows = Math.ceil(height / tile) + 1;
  const cells: { x: number; y: number; c: string }[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // the same deterministic scatter the desk field uses, so neighbours
      // never repeat in runs and the grid never looks generated
      cells.push({
        x: c * tile,
        y: r * tile,
        c: SHADES[(r * 7 + c * 3 + ((r * c) % 4)) % SHADES.length],
      });
    }
  }

  return (
    // INSET, not absoluteFill (2026-07-30): filling the whole box painted
    // over the folder's flap and its drawn edges, so both cards lost their
    // outline. The texture belongs to the card's FACE only.
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        // INSET PAST THE RIM (2026-07-30 "여기 헤어라인이"): the card's own
        // bright white hairline is drawn by FrostedGlassFill underneath, and
        // at 1pt the tiles painted straight over it, so the System card lost
        // the lit edge every other card has. 2pt leaves the rim visible.
        left: 2,
        right: 2,
        top: 2,
        bottom: 2,
        borderRadius: radius - 1,
        overflow: 'hidden',
      }}>
      <Svg width={cols * tile} height={rows * tile}>
        {cells.map((t, i) => (
          <Rect key={i} x={t.x} y={t.y} width={tile} height={tile} fill={t.c} />
        ))}
      </Svg>
    </View>
  );
}

/** glass cuts for the dissolve: whites carry the core, light blues the
 * fringe, a rare accent-charged cell for life — all translucent so the
 * ghost material underneath keeps reading through */
const DISSOLVE_SHADES = [
  'rgba(255,255,255,0.45)',
  'rgba(255,255,255,0.30)',
  'rgba(255,255,255,0.18)',
  'rgba(183,212,238,0.48)',
  'rgba(183,212,238,0.30)',
  'rgba(122,164,214,0.28)',
  'rgba(59,118,196,0.18)',
];

/**
 * PARTIAL mosaic (2026-07-30 "부분부분 우리 색깔 컬러로, 유리느낌"):
 * not a full checkerboard — a corner of grid-aligned glass tiles that
 * breaks apart as it leaves the corner, RasterCloud-style: solid-ish
 * core, parity breakup, stray quanta. Deterministic, self-measuring.
 */
export function MosaicDissolveFill({
  /** tile edge in pt */
  tile = 10,
  radius = 13,
}: {
  tile?: number;
  radius?: number;
}) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) setSize({ w: width, h: height });
  };
  const { w, h } = size;
  const cells: { x: number; y: number; s: number; c: string }[] = [];
  if (w > 0 && h > 0) {
    const cols = Math.ceil(w / tile) + 1;
    const rows = Math.ceil(h / tile) + 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * tile;
        const y = r * tile;
        // distance from the TOP-RIGHT corner, normalized so ~1 spans
        // most of the card; the cloud lives in that corner
        const dx = (w - x) / w;
        const dy = y / h;
        const d = Math.hypot(dx * 1.25, dy * 1.05);
        // same LCG-ish spirit as the desk grid: stable, never random
        const hash = (r * 53 + c * 29 + ((r * c) % 17) * 11) % 100;
        // core → breakup → strays
        let p = 0;
        if (d < 0.2) p = 92;
        else if (d < 0.52) p = 78 * (1 - (d - 0.2) / 0.32);
        else if (d < 0.85 && hash % 23 < 2) p = 100; // lone stray quanta
        if (hash >= p) continue;
        // fringe cells shrink to half tiles so the edge reads dissolved,
        // not cropped
        const s = d > 0.34 && hash % 3 === 0 ? tile / 2 : tile;
        // color drifts white → blue as the cloud thins out
        const drift = Math.min(
          DISSOLVE_SHADES.length - 1,
          Math.floor(d * 5) + (hash % 3)
        );
        cells.push({ x, y, s, c: DISSOLVE_SHADES[drift] });
      }
    }
  }
  return (
    // inset past the rim for the same reason MosaicTileFill is: the
    // card's lit hairline must survive the texture
    <View
      pointerEvents="none"
      onLayout={onLayout}
      style={{
        position: 'absolute',
        left: 2,
        right: 2,
        top: 2,
        bottom: 2,
        borderRadius: radius,
        overflow: 'hidden',
      }}>
      {w > 0 && h > 0 ? (
        <Svg width={w} height={h}>
          {cells.map((t, i) => (
            <Rect key={i} x={t.x} y={t.y} width={t.s} height={t.s} fill={t.c} />
          ))}
        </Svg>
      ) : null}
    </View>
  );
}

export default MosaicTileFill;
