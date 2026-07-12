import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, LinearGradient, Rect, Stop } from 'react-native-svg';

import type { GatewayStatus } from '@/store/app-store';
import { fontFamily, fontSize, spacing, sysColor } from '@/theme/theme';

/**
 * The CONNECTION section's soul, revived 2026-07-12 (born in the old
 * Access tab, commit 6dc6930): this phone talking to the local Mac mini
 * gateway. Two soft devices, a dotted connector whose breathing pulse
 * travels toward the center — data quietly flowing — retinted for the
 * aquaos glass windows.
 */
const DEVICE_FILL_TOP = '#FDFDFD';
const DEVICE_FILL_BOTTOM = '#E9EDF2';
const DEVICE_STROKE = 'rgba(22,24,28,0.45)';
const LABEL = 'rgba(22,24,28,0.55)';

const STATUS_DOT: Record<GatewayStatus, string> = {
  online: sysColor.ready,
  unstable: sysColor.degraded,
  offline: sysColor.fail,
};

/** One connector dot that breathes toward the accent and back. `delayMs`
 * staggers the row so the brightening travels like a quiet pulse. */
function ConnectorDot({ delayMs }: { delayMs: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(withTiming(1, { duration: 900 }), withTiming(0, { duration: 900 })),
        -1
      )
    );
  }, [t, delayMs]);
  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(t.value, [0, 1], ['rgba(59,118,196,0.25)', sysColor.accent]),
  }));
  return <Animated.View style={[{ width: 4.5, height: 4.5, borderRadius: 2.25 }, style]} />;
}

/** Small elegant phone with a top speaker notch, soft gradient fill. */
function PhoneGlyph() {
  return (
    <Svg width={40} height={68} viewBox="0 0 40 68">
      <Defs>
        <LinearGradient id="phoneFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={DEVICE_FILL_TOP} />
          <Stop offset="1" stopColor={DEVICE_FILL_BOTTOM} />
        </LinearGradient>
      </Defs>
      <Rect
        x={1.75}
        y={1.75}
        width={36.5}
        height={64.5}
        rx={10}
        fill="url(#phoneFill)"
        stroke={DEVICE_STROKE}
        strokeWidth={1.3}
      />
      <Rect x={15.5} y={6.5} width={9} height={2.6} rx={1.3} fill={DEVICE_STROKE} opacity={0.85} />
    </Svg>
  );
}

/** Small Mac-mini-style box with a port seam + LIVE status dot. */
function MacMiniGlyph({ dotColor }: { dotColor: string }) {
  return (
    <Svg width={54} height={54} viewBox="0 0 54 54">
      <Defs>
        <LinearGradient id="miniFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={DEVICE_FILL_TOP} />
          <Stop offset="1" stopColor={DEVICE_FILL_BOTTOM} />
        </LinearGradient>
      </Defs>
      <Rect
        x={1.75}
        y={1.75}
        width={50.5}
        height={50.5}
        rx={8}
        fill="url(#miniFill)"
        stroke={DEVICE_STROKE}
        strokeWidth={1.3}
      />
      {/* front port-strip seam */}
      <Line x1={10} y1={40} x2={44} y2={40} stroke={DEVICE_STROKE} strokeWidth={1.2} opacity={0.85} />
      {/* the gateway's real state, on the box itself */}
      <Circle cx={42} cy={11} r={2.4} fill={dotColor} />
    </Svg>
  );
}

const CONNECTOR_W = 6 * 4.5 + 5 * 5; // 6 dots + 5 gaps

export function ConnectionDiagram({ status }: { status: GatewayStatus }) {
  return (
    <View style={{ paddingTop: 14, paddingBottom: 12 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.lg,
        }}>
        <PhoneGlyph />
        {/* dotted connector: each dot breathes accent-bright, staggered
            so the pulse peaks at the center and fades toward both ends */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <ConnectorDot key={i} delayMs={Math.abs(i - 2.5) * 150} />
          ))}
        </View>
        <MacMiniGlyph dotColor={STATUS_DOT[status]} />
      </View>

      {/* device names, each truly centered under its own icon: fixed
          anchors mirror the icon row's widths, the labels float over
          them so long text overflows outward without shifting layout */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'flex-start',
          gap: spacing.lg,
          marginTop: spacing.sm,
          height: 16,
        }}>
        <View style={{ width: 40 }}>
          <Text
            numberOfLines={1}
            style={{
              position: 'absolute',
              left: -60,
              right: -60,
              textAlign: 'center',
              color: LABEL,
              fontSize: fontSize.caption,
              fontFamily: fontFamily.medium,
            }}>
            iPhone 17 Pro
          </Text>
        </View>
        <View style={{ width: CONNECTOR_W }} />
        <View style={{ width: 54 }}>
          <Text
            numberOfLines={1}
            style={{
              position: 'absolute',
              left: -40,
              right: -40,
              textAlign: 'center',
              color: LABEL,
              fontSize: fontSize.caption,
              fontFamily: fontFamily.medium,
            }}>
            Mac mini
          </Text>
        </View>
      </View>
    </View>
  );
}

export default ConnectionDiagram;
