import { useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/**
 * AuroraLine — a thin gradient accent line (blue → teal → warm). The app's
 * signature accent. By default it's static (matches the Figma spec); set
 * `animated` to make the gradient slowly drift left↔right for a shimmer.
 *
 * Reusable: drop it at the top of any screen. Uses react-native-svg +
 * react-native-reanimated (both already installed) — no native rebuild needed.
 */

// Color stops — warm brand gradient (orange → amber → soft peach).
const BLUE = '#FF4A32';
const TEAL = '#FF8A4C';
const WARM = '#FFB37A';

// When animated, the bar is drawn wider than its container so it can slide
// without revealing an edge (mirrored ramp for a seamless loop).
const OVERSCAN = 2.4;

type Props = {
  /** Line thickness in px. Default 3. */
  height?: number;
  /** Render a soft glow layer underneath. Default false. */
  glow?: boolean;
  /** Animate the shimmer (gradient drift). Default false (static, Figma-accurate). */
  animated?: boolean;
  /** Seconds for one drift cycle when animated. Default 7. */
  durationSec?: number;
  /** Overall opacity. Default 0.55 (Figma spec). */
  opacity?: number;
  /** Container width in px. Default 320 (caller can override to match layout). */
  width?: number;
  style?: ViewStyle;
};

function GradientBar({
  height,
  barWidth,
  animated,
}: {
  height: number;
  barWidth: number;
  animated: boolean;
}) {
  // Static: a single left→right ramp. Animated: mirrored ramp so a slide loops.
  const stops = animated
    ? [
        { o: '0', c: BLUE },
        { o: '0.25', c: TEAL },
        { o: '0.5', c: WARM },
        { o: '0.75', c: TEAL },
        { o: '1', c: BLUE },
      ]
    : [
        { o: '0', c: BLUE },
        { o: '0.5', c: TEAL },
        { o: '1', c: WARM },
      ];
  return (
    <Svg width={barWidth} height={height}>
      <Defs>
        <LinearGradient id="aurora" x1="0" y1="0" x2="1" y2="0">
          {stops.map((s) => (
            <Stop key={s.o} offset={s.o} stopColor={s.c} />
          ))}
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={barWidth} height={height} rx={height / 2} fill="url(#aurora)" />
    </Svg>
  );
}

export function AuroraLine({
  height = 3,
  glow = false,
  animated = false,
  durationSec = 7,
  opacity = 0.55,
  width = 320,
  style,
}: Props) {
  const containerW = width;
  const barWidth = animated ? containerW * OVERSCAN : containerW;
  const shift = containerW;

  const tx = useSharedValue(0);
  useEffect(() => {
    if (!animated) return;
    tx.value = withRepeat(
      withTiming(-shift, { duration: durationSec * 1000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [animated, durationSec, shift, tx]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));

  return (
    <View
      style={[
        { width: containerW, height: glow ? height + 12 : height, justifyContent: 'center', opacity },
        style,
      ]}
      pointerEvents="none">
      {/* Optional soft glow: a taller, low-opacity copy behind the crisp line. */}
      {glow ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: height + 10,
            top: 1,
            overflow: 'hidden',
            opacity: 0.45,
          }}>
          <Animated.View style={[{ width: barWidth, height: height + 10 }, animated && animStyle]}>
            <GradientBar height={height + 10} barWidth={barWidth} animated={animated} />
          </Animated.View>
        </View>
      ) : null}

      {/* The line */}
      <View style={{ height, overflow: 'hidden' }}>
        <Animated.View style={[{ width: barWidth, height }, animated && animStyle]}>
          <GradientBar height={height} barWidth={barWidth} animated={animated} />
        </Animated.View>
      </View>
    </View>
  );
}

export default AuroraLine;
