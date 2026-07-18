import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

/**
 * "mosaic_tiles" — the desk blue as a QUIET MOSAIC (2026-07-17 "배경은
 * 같은색인데 약간 모자이크 처리 질감으로 큰 타일로"): large tiles in
 * near-identical cuts of the desk color, so the field reads as one
 * calm plane with a hand-set tile texture — the MosaicDot language at
 * architectural scale. Deterministic shade picks (no randomness), and
 * the steps stay within ±3% lightness so legibility never pays for
 * the texture.
 */
const SHADES = ['#4E83B8', '#5287BC', '#4A7EB2', '#5185BA', '#4C80B5'];
const COLS = 5;

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
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: SHADES[0] }]} pointerEvents="none">
      <Svg width={width} height={rows * tile} style={StyleSheet.absoluteFill}>
        {tiles.map((t, i) => (
          <Rect key={i} x={t.x} y={t.y} width={tile} height={tile} fill={t.c} />
        ))}
      </Svg>
    </View>
  );
}

export default MosaicTilesBg;
