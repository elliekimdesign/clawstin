import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { useAppStore } from '@/store/app-store';
import { colors, fontSize, fontWeight, spacing } from '@/theme/theme';

const HEIGHT = 64;

/**
 * App-wide notice that drops down from behind the notch, like iOS's system
 * in-call/recording banner — mounted once above the root Stack (not inside
 * any one screen's SafeAreaView) so it renders over every tab. Pure status
 * notice, no buttons here — Reconnect/Reboot live on the Access tab's
 * metrics widget per the spec this was built from.
 */
export function GatewayBanner() {
  const { gatewayStatus } = useAppStore();
  const insets = useSafeAreaInsets();
  const visible = gatewayStatus !== 'online';

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: withTiming(visible ? 0 : -HEIGHT - insets.top, { duration: 280 }) }],
  }));

  const tint = gatewayStatus === 'offline' ? colors.danger : colors.warning;
  const label = gatewayStatus === 'offline' ? 'Gateway Offline' : 'Gateway Unstable';

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 999,
          backgroundColor: tint,
          paddingTop: insets.top + spacing.xs,
          paddingBottom: spacing.sm,
          paddingHorizontal: spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.xs,
        },
        style,
      ]}>
      <Ionicons name="warning-outline" size={14} color="#FFFFFF" />
      <Text style={{ color: '#FFFFFF', fontSize: fontSize.small, fontWeight: fontWeight.semibold }}>
        {label}
      </Text>
    </Animated.View>
  );
}

export default GatewayBanner;
