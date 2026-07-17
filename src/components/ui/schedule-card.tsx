import { Pressable, Text, View } from 'react-native';

import type { CalendarEvent, ScheduleSuggestion } from '@/mock/calendar';
import { darkChat, fontFamily, fontSize, radius, spacing } from '@/theme/theme';

const MONO = fontFamily.mono;

/** Sort key: all-day items first, then by clock time. */
function timeKey(e: CalendarEvent): number {
  if (!e.start) return -1;
  const m = e.start.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return 0;
  const h = (parseInt(m[1], 10) % 12) + (m[3].toUpperCase() === 'PM' ? 12 : 0);
  return h * 60 + parseInt(m[2], 10);
}

/**
 * Mini timeline card Muppet drops into a chat after scanning the calendar:
 * that day's events + up to 3 suggested free slots to book.
 */
export function ScheduleCard({
  schedule,
  weekday,
  events,
  onBook,
}: {
  schedule: ScheduleSuggestion;
  weekday: string;
  events: CalendarEvent[];
  onBook: (slot: string) => void;
}) {
  const sorted = [...events].sort((a, b) => timeKey(a) - timeKey(b));

  return (
    <View
      style={{
        minWidth: 232,
        backgroundColor: darkChat.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: darkChat.glassBorder,
        padding: spacing.lg,
      }}>
      {/* Big date + weekday */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text
          style={{
            fontSize: 30,
            lineHeight: 34,
            fontFamily: fontFamily.bold,
            letterSpacing: -0.5,
            color: darkChat.text,
          }}>
          {schedule.date}
        </Text>
        <Text
          style={{
            fontSize: fontSize.small,
            fontFamily: fontFamily.semibold,
            color: darkChat.text,
            paddingTop: 4,
          }}>
          {weekday}
        </Text>
      </View>

      {/* That day's timeline (live — a booked slot shows up here) */}
      <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
        {sorted.length === 0 ? (
          <Text style={{ color: darkChat.textTertiary, fontSize: fontSize.small }}>
            Nothing scheduled yet.
          </Text>
        ) : (
          sorted.map((e) => (
            <View key={e.id} style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text
                style={{
                  width: 72,
                  fontFamily: MONO,
                  fontSize: 12.5,
                  letterSpacing: 0.4,
                  color: darkChat.textSecondary,
                }}>
                {e.start ?? 'TODO'}
              </Text>
              <Text
                numberOfLines={1}
                style={{ flex: 1, fontSize: fontSize.body, color: darkChat.text }}>
                {e.title}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Suggested free slots, or the booked confirmation. A pure
          "check" answer has no slots — then the timeline alone is the
          reply and this whole block stays out. */}
      {schedule.booked ? (
        <Text
          style={{
            marginTop: spacing.md,
            color: 'rgba(255,255,255,0.9)',
            fontSize: fontSize.small,
            fontFamily: fontFamily.semibold,
          }}>
          ✓ Booked at {schedule.booked}
        </Text>
      ) : schedule.slots.length > 0 ? (
        <View style={{ marginTop: spacing.lg }}>
          <Text
            style={{
              color: darkChat.textTertiary,
              fontSize: fontSize.caption,
              fontFamily: fontFamily.semibold,
              letterSpacing: 1,
            }}>
            SUGGESTED
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm }}>
            {schedule.slots.map((slot) => (
              <Pressable
                key={slot}
                onPress={() => onBook(slot)}
                style={({ pressed }) => ({
                  // fixed white pill (2026-07-16 fix): this exploited
                  // darkChat.text's OLD white value as a solid button
                  // fill — now that token means "body ink," not "light
                  // surface," so the pill needs its own explicit color
                  backgroundColor: '#FFFFFF',
                  borderRadius: radius.pill,
                  paddingVertical: 7,
                  paddingHorizontal: spacing.md,
                  opacity: pressed ? 0.85 : 1,
                })}>
                <Text
                  style={{
                    color: darkChat.onLight,
                    fontSize: fontSize.small,
                    fontFamily: fontFamily.semibold,
                  }}>
                  Book {slot}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}
