import { View } from 'react-native';
import Svg, { Defs, LinearGradient as SvgGradient, Rect, Stop } from 'react-native-svg';

/**
 * LUMINOUS POUR (2026-07-30 "fragile moment captured in blue"): the
 * board folders' shared "young blue" wash — a saturated sky-blue rising
 * from the card's floor, transparent by mid-face so the flap zone and
 * title stay calm. Pairs with the icy front-plate tint and the white
 * row hairlines; the three cues together are the whole treatment.
 */
export function LuminousPour({
  /** matches the card's FrostedGlassFill radius minus the 1pt rim inset */
  radius = 15,
}: {
  radius?: number;
}) {
  return (
    // inset past the rim so the card's lit hairline stays visible
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 2,
        right: 2,
        top: 2,
        bottom: 2,
        borderRadius: radius,
        overflow: 'hidden',
      }}>
      <Svg width="100%" height="100%">
        <Defs>
          <SvgGradient id="luminousPour" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#7AB2F0" stopOpacity={0} />
            <Stop offset="0.55" stopColor="#7AB2F0" stopOpacity={0.1} />
            <Stop offset="1" stopColor="#5E9FE8" stopOpacity={0.3} />
          </SvgGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#luminousPour)" />
      </Svg>
    </View>
  );
}

/** the board's shared row hairline color. Back to the family ink
 * (2026-07-30 "그냥 기존 컬러 느낌"): the white-line experiment read as
 * a different palette next to the frost; the quiet ink rule is the
 * board's own voice. */
export const ROW_RULE = 'rgba(22,24,28,0.08)';

/**
 * Full-bleed row hairline (2026-07-30 "선을 폴더 제일 끝부터 끝까지"):
 * the card shells pad their rows 18pt, so a borderTop always stopped
 * short of the folder's edges. This absolute line escapes the padding
 * and runs rim to rim instead. Render it as a row's first child.
 */
export function RowRule({
  /** the parent shell's horizontal padding to escape */
  inset = 18,
  /** extra left indent to cancel (e.g. an indented sub-row's margin) */
  extraLeft = 0,
}: {
  inset?: number;
  extraLeft?: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: -(inset + extraLeft),
        right: -inset,
        height: 1,
        backgroundColor: ROW_RULE,
      }}
    />
  );
}

export default LuminousPour;
