import { ReactNode, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { CalendarDay, CalendarEvent } from '@/mock/calendar';
import { CAL_MONTH } from '@/mock/calendar';
import { fontFamily, fontSize, spacing } from '@/theme/theme';

// The CALENDAR's own blue, matching the week strip (2026-07-24): tapping the
// strip opens this, so they have to be one surface growing — a color jump on
// tap would read as landing in a different screen. Split from the system dark
// the consoles keep.
const PANEL_BG = '#33689C';
const DIM = 'rgba(255,255,255,0.5)';
const LABEL = 'rgba(255,255,255,0.72)';
const DOT = 'rgba(255,255,255,0.9)';
const DIVIDER = 'rgba(255,255,255,0.18)';
const CIRCLE = 34;

const WEEKDAY_SHORT = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const WEEKDAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const EVENT_DOT: Record<CalendarEvent['color'], string> = {
  brand: '#FF4A32',
  yellow: '#F5C84B',
  mint: '#73D9CC',
};

/** Sort key: all-day items first, then by clock time. */
function timeKey(e: CalendarEvent): number {
  if (!e.start) return -1;
  const m = e.start.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return 0;
  const h = (parseInt(m[1], 10) % 12) + (m[3].toUpperCase() === 'PM' ? 12 : 0);
  return h * 60 + parseInt(m[2], 10);
}

/**
 * Full-month calendar panel that floats OVER the chat (same island style as
 * WeekStrip, grown to a month grid). It's pinned in place: the chat keeps
 * scrolling underneath. Tap a day to expand its schedule below the grid.
 * Events are not clawstin's own: the backend mirrors the user's Google and
 * Apple calendars, so the detail view tags each event with its source.
 */
/** Soft triple blink for a freshly landed row, settling solid. */
function BlinkIn({ children }: { children: ReactNode }) {
  const o = useSharedValue(1);
  useEffect(() => {
    o.value = withRepeat(
      withSequence(withTiming(0.25, { duration: 380 }), withTiming(1, { duration: 380 })),
      3
    );
  }, [o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

export function MonthOverlay({
  days,
  initialDate,
  highlightTitle,
 onClose,
}: {
  days: CalendarDay[];
  /** preselect this day (e.g. right after a booking) */
  initialDate?: number | null;
  /** the freshly booked event blinks in softly */
  highlightTitle?: string | null;
  /** renders the ✕ in the panel's corner — the panel must always
   * be closable no matter how it was opened (2026-07-24) */
  onClose?: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(initialDate ?? null);
  useEffect(() => {
    if (initialDate != null) setSelected(initialDate);
  }, [initialDate]);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Monday-first column of the 1st of the month.
  const firstCol = (new Date(year, month, 1).getDay() + 6) % 7;

  const eventDates = new Set(days.filter((d) => d.events.length > 0).map((d) => d.date));

  // Build week rows: nulls pad the leading/trailing blanks.
  const cells: (number | null)[] = [
    ...Array.from({ length: firstCol }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const selectedEvents = [...(days.find((d) => d.date === selected)?.events ?? [])].sort(
    (a, b) => timeKey(a) - timeKey(b)
  );
  const selectedWeekday =
    selected != null ? WEEKDAY_FULL[new Date(year, month, selected).getDay()] : '';
  const monthName = CAL_MONTH.split(' ')[0];

  return (
    <View
      style={{
        backgroundColor: PANEL_BG,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.28)',
        borderRadius: 16,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xl,
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.md,
        }}>
        <Text
          style={{
            color: LABEL,
            fontSize: fontSize.caption,
            fontFamily: fontFamily.medium,
          }}>
          {CAL_MONTH}
        </Text>
        {onClose ? (
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
            <Text style={{ color: LABEL, fontSize: 15 }}>✕</Text>
          </Pressable>
        ) : null}
      </View>

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

      {weeks.map((week, wi) => (
        <View key={wi} style={{ flexDirection: 'row', marginTop: spacing.sm }}>
          {week.map((d, di) => {
            const isToday = d === today;
            const isSelected = d != null && d === selected;
            return (
              <View key={di} style={{ flex: 1, alignItems: 'center' }}>
                <Pressable
                  disabled={d == null}
                  onPress={() => setSelected((cur) => (cur === d ? null : d))}
                  style={{
                    width: CIRCLE,
                    height: CIRCLE,
                    borderRadius: CIRCLE / 2,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isToday ? '#FFFFFF' : 'transparent',
                    borderWidth: isSelected && !isToday ? 1.5 : 0,
                    borderColor: DOT,
                  }}>
                  {d != null ? (
                    <>
                      <Text
                        style={{
                          // today's number sits INSIDE the white circle, so
                          // it stays dark — but as the panel's own blue now,
                          // not the retired system black (2026-07-24)
                          color: isToday ? PANEL_BG : eventDates.has(d) ? '#FFFFFF' : DIM,
                          fontSize: fontSize.body,
                          fontFamily: fontFamily.semibold,
                        }}>
                        {d}
                      </Text>
                      {!isToday && eventDates.has(d) ? (
                        <View
                          style={{
                            position: 'absolute',
                            bottom: 2,
                            width: 4,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: DOT,
                          }}
                        />
                      ) : null}
                    </>
                  ) : null}
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}

      {/* Day detail: expands the island downward; chat stays put behind. */}
      {selected != null ? (
        <Animated.View
          entering={FadeInDown.duration(200)}
          style={{
            marginTop: spacing.lg,
            borderTopWidth: 1,
            borderTopColor: DIVIDER,
            paddingTop: spacing.md,
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: spacing.sm,
            }}>
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: fontSize.body,
                fontFamily: fontFamily.semibold,
              }}>
              {selectedWeekday}, {monthName} {selected}
            </Text>
            <Text style={{ color: LABEL, fontSize: fontSize.caption, fontFamily: fontFamily.medium }}>
              {selectedEvents.length === 0
                ? ''
                : selectedEvents.length === 1
                  ? '1 event'
                  : `${selectedEvents.length} events`}
            </Text>
          </View>

          {selectedEvents.length === 0 ? (
            <Text style={{ color: DIM, fontSize: fontSize.small, paddingVertical: spacing.sm }}>
              Nothing scheduled.
            </Text>
          ) : (
            <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
              {selectedEvents.map((e) => {
                const row = (
                <View
                  key={e.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                    paddingVertical: spacing.sm,
                  }}>
                  <Text
                    style={{
                      width: 66,
                      fontFamily: fontFamily.mono,
                      fontSize: 11,
                      letterSpacing: 0.3,
                      color: LABEL,
                    }}>
                    {e.allDay || !e.start ? 'ALL DAY' : e.start}
                  </Text>
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: EVENT_DOT[e.color],
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        color: '#FFFFFF',
                        fontSize: fontSize.small,
                        fontFamily: fontFamily.medium,
                      }}>
                      {e.title}
                    </Text>
                    {e.location ? (
                      <Text
                        numberOfLines={1}
                        style={{ color: DIM, fontSize: fontSize.caption, marginTop: 1 }}>
                        {e.location}
                      </Text>
                    ) : null}
                  </View>
                  {e.source ? (
                    <Text
                      style={{
                        fontFamily: fontFamily.mono,
                        fontSize: 9,
                        letterSpacing: 0.6,
                        color: DIM,
                      }}>
                      {e.source.toUpperCase()}
                    </Text>
                  ) : null}
                </View>
                );
                return highlightTitle && e.title === highlightTitle ? (
                  <BlinkIn key={e.id}>{row}</BlinkIn>
                ) : (
                  row
                );
              })}
            </ScrollView>
          )}

          <Text
            style={{
              marginTop: spacing.sm,
              color: DIM,
              fontSize: 10,
              fontFamily: fontFamily.regular,
            }}>
            Synced from Google and Apple Calendar. Changes sync automatically.
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

export default MonthOverlay;
