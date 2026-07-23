import { useState } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { sysColor } from '@/theme/theme';

/**
 * The ANALOG KEY material (born on the Home header status bar,
 * 2026-07-16; RESTORED 2026-07-22 "처음 그 아날로그 버튼 스타일" after
 * the vial/gel/frost safari): white glass cut like a physical keycap —
 * lit top edge, inked bottom edge, a sheen across the upper face, and
 * a press that visibly sinks. Used by Crew's Info/Perf switch. The
 * Home/Activity header keys wear RasterCloud below instead.
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

/** THE RASTER CLOUD (2026-07-22, Home/Activity header keys): a key
 * with NO shape — no outline, no container, no continuous edge. Built
 * entirely of cells on a 4px grid: a solid glass core whose cells
 * thin, shrink and scatter with distance until the key stops being.
 * The boundary is a probability, not a line. Elliptical falloff keeps
 * the read pill-adjacent. Sizes to its container; `state` re-colors
 * the matter amber/red (sick), `active` charges it accent-blue,
 * `pressed` charges it too. */
export function RasterCloud({
  active,
  state,
  pressed,
}: {
  active?: boolean;
  state?: 'degraded' | 'down';
  pressed?: boolean;
}) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h)
      setSize({ w: width, h: height });
  };
  const { w, h } = size;
  const cells: { x: number; y: number; s: number; o: number }[] = [];
  if (w > 0) {
    const kx = (w / h) * 0.73;
    const t1 = h * 0.29;
    const t2 = h * 0.41;
    const t3 = h * 0.555;
    const t4 = h * 0.68;
    for (let col = 0; col < Math.ceil(w / 4); col++)
      for (let row = 0; row < Math.ceil(h / 4); row++) {
        const x = col * 4;
        const y = row * 4;
        const d = Math.hypot((x + 2 - w / 2) / kx, y + 2 - h / 2);
        if (d < t1) {
          cells.push({ x, y, s: 4, o: 0.55 }); // touching core = glass
        } else if (d < t2) {
          if ((col + row) % 2 && d > (t1 + t2) / 2) continue; // first gaps
          cells.push({ x, y, s: 3.5, o: 0.45 });
        } else if (d < t3) {
          if ((col + row) % 2) continue; // checker: half the matter gone
          cells.push({ x, y, s: 3, o: 0.32 - (0.18 * (d - t2)) / (t3 - t2) });
        } else if (d < t4) {
          if ((col * 7 + row * 5) % 4 !== 0) continue; // stray quanta
          cells.push({ x, y, s: 2.5, o: 0.12 });
        }
      }
  }
  const matter =
    state === 'down'
      ? sysColor.fail
      : state === 'degraded'
        ? sysColor.degraded
        : active
          ? sysColor.accent
          : '#FFFFFF';
  const charged = active || pressed;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={onLayout}>
      {cells.map((c, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: c.x,
            top: c.y,
            width: c.s,
            height: c.s,
            backgroundColor: matter,
            opacity: charged ? Math.min(1, c.o + 0.3) : c.o,
          }}
        />
      ))}
    </View>
  );
}

export default AnalogKey;
