import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

/** how far the fold cuts in from the top-right corner, in px. Small on
 * purpose: at 30px tall these chips have very little corner to give, and a
 * deeper cut starts eating the label. */
const FOLD = 9;

/**
 * A chip shaped like a sheet of paper with its TOP-RIGHT CORNER FOLDED DOWN
 * (2026-07-25 "이 세개 스타일을 약간 위에 오른쪽 모서리 접힌 서류처럼 해볼래?").
 *
 * Two paths, not one: the BODY is the sheet with that corner clipped off, and
 * the FLAP is the little triangle that fold leaves behind — drawn a shade
 * darker so it reads as the underside of paper catching less light. One path
 * could not do this, since the fold needs its own fill.
 *
 * Absolutely positioned behind the chip's own content, like FrostedGlassFill,
 * so callers keep their existing padding and children.
 */
export function DogearChip({
  fill,
  flap,
  radius = 8,
}: {
  /** the sheet's face */
  fill: string;
  /** the folded triangle — pass a darker cut of `fill` */
  flap: string;
  /** corner rounding on the three UNFOLDED corners */
  radius?: number;
}) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const { w, h } = box;
  const r = Math.min(radius, h / 2);

  // sheet: rounded top-left, straight run to the fold, diagonal in, then
  // rounded bottom-right and bottom-left
  const body =
    w && h
      ? `M ${r},0
         L ${w - FOLD},0
         L ${w},${FOLD}
         L ${w},${h - r}
         Q ${w},${h} ${w - r},${h}
         L ${r},${h}
         Q 0,${h} 0,${h - r}
         L 0,${r}
         Q 0,0 ${r},0
         Z`
      : '';
  // the fold itself: the triangle between the cut and the corner it left
  const ear = w ? `M ${w - FOLD},0 L ${w},${FOLD} L ${w - FOLD},${FOLD} Z` : '';

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width !== box.w || height !== box.h) setBox({ w: width, h: height });
      }}>
      {w && h ? (
        <Svg width={w} height={h}>
          <Path d={body} fill={fill} />
          <Path d={ear} fill={flap} />
        </Svg>
      ) : null}
    </View>
  );
}

export default DogearChip;
