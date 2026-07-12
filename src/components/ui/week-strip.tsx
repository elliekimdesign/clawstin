import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { fontFamily, fontSize, spacing } from '@/theme/theme';

// The app's one system-surface dark: same deep navy as the home Ask
// console, the Logs field, and the status popover family.
const STRIP_BG = '#0E1626';
const CHARCOAL = '#0E1626';
const DIM = 'rgba(255,255,255,0.35)';
const LABEL = 'rgba(255,255,255,0.55)';
const RING = 'rgba(255,255,255,0.9)';
const CIRCLE = 30;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAY_SHORT = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

/**
 * Dynamic-Island-style week strip shown while Muppet "scans" the calendar.
 * Today is pinned with a white circle; a hollow ring slides back and forth
 * between today and the target date — the visible "searching" motion.
 * With `scanning` off, the ring settles on the target date and the strip
 * stays up as a reference while the user picks a slot.
 */
export function WeekStrip({
  targetDate,
  scanning = true,
}: {
  targetDate: number;
  scanning?: boolean;
}) {
  const [rowW, setRowW] = useState(0);
  const progress = useSharedValue(0); // 0 = today, 1 = target

  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const todayIdx = days.findIndex(
    (d) => d.getDate() === now.getDate() && d.getMonth() === now.getMonth()
  );
  const targetIdx = days.findIndex((d) => d.getDate() === targetDate);

  const colW = rowW / 7;
  // Plain numbers (not functions) so the animated style below stays a worklet.
  const fromX = todayIdx * colW + colW / 2 - CIRCLE / 2;
  const toIdx = targetIdx >= 0 ? targetIdx : todayIdx;
  const toX = toIdx * colW + colW / 2 - CIRCLE / 2;

  // Start the slide once we know the row width; when scanning stops, the
  // ring glides to the target date and rests there.
  useEffect(() => {
    if (rowW > 0 && targetIdx >= 0 && targetIdx !== todayIdx) {
      if (scanning) {
        progress.value = withRepeat(
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          -1,
          true
        );
      } else {
        progress.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.ease) });
      }
    }
  }, [rowW, targetIdx, todayIdx, scanning, progress]);

  const ringStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateX: fromX + (toX - fromX) * progress.value }],
    }),
    [fromX, toX]
  );

  return (
    <View
      style={{
        backgroundColor: STRIP_BG,
        // no hairline: over chat text the pale edge read as a stray
        // background line — the solid navy alone carries the shape
        borderRadius: 20,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xl,
      }}>
      <Text
        style={{
          color: LABEL,
          fontSize: fontSize.caption,
          fontFamily: fontFamily.medium,
          marginBottom: spacing.md,
        }}>
        {MONTH_NAMES[now.getMonth()]}
      </Text>

      {/* Weekday labels */}
      <View style={{ flexDirection: 'row' }}>
        {WEEKDAY_SHORT.map((w) => (
          <Text
            key={w}
            style={{
              flex: 1,
              textAlign: 'center',
              color: LABEL,
              fontSize: fontSize.caption,
              fontFamily: fontFamily.semibold,
            }}>
            {w}
          </Text>
        ))}
      </View>

      {/* Date row + scanning ring */}
      <View
        onLayout={(e) => setRowW(e.nativeEvent.layout.width)}
        style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, height: 34 }}>
        {rowW > 0 && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: CIRCLE,
                height: CIRCLE,
                borderRadius: CIRCLE / 2,
                borderWidth: 1.5,
                borderColor: RING,
              },
              ringStyle,
            ]}
          />
        )}
        {days.map((d, i) => {
          const isToday = i === todayIdx;
          const otherMonth = d.getMonth() !== now.getMonth();
          return (
            <View key={d.toISOString()} style={{ flex: 1, alignItems: 'center' }}>
              <View
                style={{
                  width: CIRCLE,
                  height: CIRCLE,
                  borderRadius: CIRCLE / 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isToday ? '#FFFFFF' : 'transparent',
                }}>
                <Text
                  style={{
                    color: isToday ? CHARCOAL : otherMonth ? DIM : '#FFFFFF',
                    fontSize: fontSize.body,
                    fontFamily: fontFamily.semibold,
                  }}>
                  {d.getDate()}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
