import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Rect, Stop } from 'react-native-svg';

import { GRAIN_DOTS } from './frosted-glass-fill';

/**
 * "mosaic_tiles" — the desk blue as a QUIET MOSAIC (2026-07-17 "배경은
 * 같은색인데 약간 모자이크 처리 질감으로 큰 타일로"): large tiles in
 * near-identical cuts of the desk color, so the field reads as one
 * calm plane with a hand-set tile texture — the MosaicDot language at
 * architectural scale. Deterministic shade picks (no randomness), and
 * the steps stay within ±3% lightness so legibility never pays for
 * the texture.
 */
/** 2026-07-25, two passes.
 * First ("체크 패턴은 나두고 배경을 좀더 흰색에 가까운거로하기") lifted the five
 * desk-blue cuts 78% toward white — but lifting COMPRESSED them: the original
 * ±3% lightness steps became ±0.7%, so the tiles vanished into one flat plane
 * ("체크 패턴들이 사라지고 단일 배경인데").
 * Second pass (this set) keeps the pale feel but spreads the steps ~8x wider,
 * and holds more blue so the pattern reads as COLOUR rather than grey. Ink
 * still measures 12.3:1 on the darkest tile, 14.4:1 on the lightest.
 * LESSON for any future recolour: a percentage lift toward white shrinks the
 * gaps between shades. The spread has to be re-widened by hand afterwards, or
 * the texture disappears.
 * The old deep set was ['#4E83B8','#5287BC','#4A7EB2','#5185BA','#4C80B5']. */
const SHADES = ['#D8E4EF', '#DEE9F4', '#D3E0EE', '#DBE7F2', '#D6E3F0'];
/** exported so the ask pane's corner decoration can nibble at its edges in the
 * field's OWN shades (2026-07-25) — the pattern has to be the same pattern, not
 * a lookalike, or the "일관성" this was all for is lost */
export const MOSAIC_SHADES = SHADES;
const COLS = 5;

/** GLASS TILES (2026-07-25 "배경컬러 타일들이 여기 폴더 유리 폴더느낌이면더
 * 좋겠어. 일관성이 느껴지게"): the tiles were flat fills while the folder cards
 * above them are frosted glass, so the two materials did not belong to each
 * other. Each tile now wears the SAME two layers frosted-glass-fill.tsx gives
 * its folders — a white sheen raking off the top-left corner, and the shared
 * GRAIN_DOTS scatter — at a much lower strength, because a full-screen field
 * has to stay quiet under content that a 300px card does not.
 * Sheen 0.30 -> 0 (the folders run 0.55 -> 0) and grain at a third opacity. */
export function MosaicTilesBg() {
  const { width, height } = useWindowDimensions();
  const tile = Math.ceil(width / COLS);
  const rows = Math.ceil(height / tile) + 1;
  const tiles: { x: number; y: number; c: string }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < COLS; c++) {
      // LCG-ish scatter keeps neighbors from repeating in runs
      tiles.push({ x: c * tile, y: r * tile, c: SHADES[(r * 7 + c * 3 + ((r * c) % 4)) % SHADES.length] });
    }
  }
  const H = rows * tile;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: SHADES[0] }]} pointerEvents="none">
      <Svg width={width} height={H} style={StyleSheet.absoluteFill}>
        <Defs>
          {/* one sheen gradient, reused by every tile via objectBoundingBox
              units so each tile lights from its OWN top-left — that per-tile
              rake is what makes them read as separate panes of glass rather
              than one gradient laid over a grid */}
          <LinearGradient id="tileSheen" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.3} />
            <Stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0.06} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {tiles.map((t, i) => (
          <Rect key={`f${i}`} x={t.x} y={t.y} width={tile} height={tile} fill={t.c} />
        ))}
        {/* the glass sheen, one rake per tile */}
        {tiles.map((t, i) => (
          <Rect
            key={`s${i}`}
            x={t.x}
            y={t.y}
            width={tile}
            height={tile}
            fill="url(#tileSheen)"
          />
        ))}
        {/* the folders' own grain, tiled across the field at a third strength
            so it reads as frosting rather than dirt */}
        <G>
          {tiles.map((t, ti) =>
            GRAIN_DOTS.filter((_, di) => di % 3 === ti % 3).map((dot, di) => (
              <Circle
                key={`g${ti}-${di}`}
                cx={t.x + (dot.x / 100) * tile}
                cy={t.y + (dot.y / 100) * tile}
                r={dot.r}
                fill="#16181C"
                fillOpacity={dot.o * 0.34}
              />
            ))
          )}
        </G>
      </Svg>
    </View>
  );
}

export default MosaicTilesBg;
