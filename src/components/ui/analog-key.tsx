import { Pressable, StyleProp, View, ViewStyle } from 'react-native';

/**
 * The ANALOG KEY material (born on the Home header status bar,
 * 2026-07-16): white glass cut like a physical keycap — lit top edge,
 * inked bottom edge, a sheen across the upper face, and a press that
 * visibly sinks. Shared here once the >_ lens toggle and Crew's
 * Info/Perf switch adopted it too.
 */

/** the key's face chrome; spread into any square container */
export function keyChrome(pressed: boolean, active?: boolean): ViewStyle {
  return {
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: active
      ? 'rgba(255,255,255,0.92)'
      : pressed
        ? 'rgba(255,255,255,0.5)'
        : 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.95)',
    borderLeftColor: 'rgba(255,255,255,0.8)',
    borderRightColor: 'rgba(255,255,255,0.6)',
    borderBottomColor: 'rgba(22,24,28,0.25)',
    shadowColor: '#16181C',
    shadowOpacity: pressed ? 0.08 : 0.18,
    shadowRadius: pressed ? 1.5 : 3,
    shadowOffset: { width: 0, height: pressed ? 1 : 2 },
    transform: [{ translateY: pressed ? 1 : 0 }],
  };
}

/** the curved upper face: a brighter wash over the key's top half */
export function KeySheen() {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '45%',
        backgroundColor: 'rgba(255,255,255,0.4)',
      }}
    />
  );
}

/** a pressable key: chrome + sheen around any content */
export function AnalogKey({
  onPress,
  active,
  hitSlop,
  style,
  children,
}: {
  onPress: () => void;
  /** held-down look (e.g. the lens toggle while the lens is on) */
  active?: boolean;
  hitSlop?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      style={({ pressed }) => [
        // centered by default (2026-07-16 "다 가운데로") — callers'
        // own style can override, but every key face starts centered
        { alignItems: 'center', justifyContent: 'center' },
        keyChrome(pressed, active),
        style,
      ]}>
      <KeySheen />
      {children}
    </Pressable>
  );
}

export default AnalogKey;
