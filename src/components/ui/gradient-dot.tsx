import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

/**
 * GradientDot — a small round bullet with a blue→teal gradient (Figma Ellipse).
 * Used in the onboarding value-prop list.
 */

const BLUE = '#4D8CFA';
const TEAL = '#73D9CC';

export function GradientDot({ size = 7 }: { size?: number }) {
  const r = size / 2;
  return (
    <Svg width={size} height={size} viewBox="0 0 7 7">
      <Defs>
        <LinearGradient id="dot" x1="0" y1="3.5" x2="7" y2="3.5" gradientUnits="userSpaceOnUse">
          <Stop stopColor={BLUE} />
          <Stop offset="1" stopColor={TEAL} />
        </LinearGradient>
      </Defs>
      <Circle cx="3.5" cy="3.5" r="3.5" fill="url(#dot)" />
    </Svg>
  );
}

export default GradientDot;
