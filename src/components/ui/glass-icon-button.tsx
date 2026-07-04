import { Ionicons } from '@expo/vector-icons';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { Platform, Pressable, StyleProp, View, ViewStyle } from 'react-native';

import { colors, darkChat } from '@/theme/theme';

// expo-glass-effect is iOS-only and can be unavailable on some iOS 26 betas —
// guard so the button still renders (via the rgba fallback below) everywhere else.
const GLASS_AVAILABLE = Platform.OS === 'ios' && isGlassEffectAPIAvailable();
const GlassOrFallback = GLASS_AVAILABLE ? GlassView : View;

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  /** circle diameter */
  size?: number;
  iconSize?: number;
  iconColor?: string;
  /** rendered on the chat screen's dark gradient — darker fallback tint */
  onDark?: boolean;
  /** outer positioning (e.g. absolute placement for FABs) */
  style?: StyleProp<ViewStyle>;
  hitSlop?: number;
};

/**
 * Circular Liquid Glass icon button — Apple's official glass material
 * (iOS 26) with an rgba fallback elsewhere. The one shape for every
 * icon-only button in the app: header back chevrons, FABs, row actions.
 */
export function GlassIconButton({
  icon,
  onPress,
  size = 44,
  iconSize = Math.round(size / 2),
  iconColor = colors.text,
  onDark,
  style,
  hitSlop = 8,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }, style]}>
      <GlassOrFallback
        {...(GLASS_AVAILABLE
          ? {
              glassEffectStyle: 'regular' as const,
              isInteractive: true,
              // Follow the screen's design, not the system theme: the chat
              // screen is always dark, the rest of the app always light.
              colorScheme: (onDark ? 'dark' : 'auto') as 'dark' | 'auto',
            }
          : {})}
        style={{
          width: size,
          height: size,
          borderRadius: 999,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: GLASS_AVAILABLE
            ? undefined
            : onDark
              ? darkChat.glassBg
              : 'rgba(22,24,29,0.05)',
          borderWidth: GLASS_AVAILABLE ? 0 : 1,
          borderColor: onDark ? darkChat.glassBorder : colors.border,
        }}>
        <Ionicons name={icon} size={iconSize} color={iconColor} />
      </GlassOrFallback>
    </Pressable>
  );
}

export default GlassIconButton;
