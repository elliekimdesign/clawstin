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
  /** constant tint painted over the glass so the button keeps ONE stable
   * look instead of adapting to whatever scrolls behind it (use the crew
   * pill's ink for rest state, the console navy for active states) */
  tint?: string;
  /** outer positioning (e.g. absolute placement for FABs) */
  style?: StyleProp<ViewStyle>;
  hitSlop?: number;
  /** tinted buttons draw a white hairline by default; pass false for
   * surfaces that must match a borderless pill (the chat header) */
  bordered?: boolean;
  /** THE HEADER CIRCLE (2026-07-29 "이 버튼으로 고정하면 돼 어떤 상황에서도"):
   * clear Liquid Glass, no border, no shadow — the pale circle the chat
   * header's back arrow wears. Every round button in a header is this, so
   * the header cannot change style as you move through a screen. */
  clear?: boolean;
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
  tint,
  style,
  hitSlop = 8,
  bordered = true,
  clear = false,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }, style]}>
      <GlassOrFallback
        {...(GLASS_AVAILABLE
          ? {
              glassEffectStyle: (clear ? 'clear' : 'regular') as 'clear' | 'regular',
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
          // THE HEADER MATERIAL, one recipe (2026-07-29 "이건 디자인
          // 시스템이야"): clear Liquid Glass plus the crew pill's own
          // whisper of white veil (0.14). Solid white is never used, and
          // the pill, the back circle and the compose circle now come from
          // the same two layers so the header row reads as one material.
          backgroundColor: clear
            ? GLASS_AVAILABLE
              // the veil rides as its own layer below (like the pill)
              ? undefined
              : 'rgba(255,255,255,0.14)'
            : tint ??
              (GLASS_AVAILABLE
                ? undefined
                : onDark
                  ? darkChat.glassBg
                  : 'rgba(22,24,29,0.05)'),
          borderWidth: clear || !bordered ? 0 : tint ? 1 : GLASS_AVAILABLE ? 0 : 1,
          borderColor: tint
            ? 'rgba(255,255,255,0.5)'
            : onDark
              ? darkChat.glassBorder
              : colors.border,
        }}>
        {/* the crew pill's own whisper of veil, as a separate layer so
            the glass keeps its blur underneath (2026-07-29 design system) */}
        {clear && GLASS_AVAILABLE ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.14)',
            }}
          />
        ) : null}
        <Ionicons name={icon} size={iconSize} color={iconColor} />
      </GlassOrFallback>
    </Pressable>
  );
}

export default GlassIconButton;
