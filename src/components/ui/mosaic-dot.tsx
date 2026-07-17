import { View } from 'react-native';

/**
 * The list state mark as a tiny MOSAIC (2026-07-17 "점스타일을 약간더
 * 모자이크 스타일로"): the single flat square broken into a 2×2
 * cluster of cells at falling opacities — the crew-pixel language at
 * dot scale. One color in, four weights out.
 */
export function MosaicDot({ color, size = 10 }: { color: string; size?: number }) {
  const c = Math.floor(size / 2);
  const cell = (x: number, y: number, opacity: number) => (
    <View
      style={{
        position: 'absolute',
        left: x * c,
        top: y * c,
        width: c,
        height: c,
        backgroundColor: color,
        opacity,
      }}
    />
  );
  return (
    <View style={{ width: c * 2, height: c * 2 }}>
      {cell(0, 0, 1)}
      {cell(1, 0, 0.35)}
      {cell(0, 1, 0.55)}
      {cell(1, 1, 0.85)}
    </View>
  );
}

export default MosaicDot;
