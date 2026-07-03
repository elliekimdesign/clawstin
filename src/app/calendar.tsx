import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CAL_MONTH, CalendarDay } from '@/mock/calendar';
import { useAppStore } from '@/store/app-store';
import { colors, fontFamily, fontSize, fontWeight, shadow, spacing } from '@/theme/theme';

const BRAND = '#FF4A32';
const CHARCOAL = '#1A1C21';
const DIM = '#D5D8DE'; // ghosted empty days, like the reference
const LABEL_W = 68;

function DayBlock({ day, today }: { day: CalendarDay; today: number }) {
  const isToday = day.date === today;
  const isPast = day.date < today;
  const empty = day.events.length === 0;
  const numColor = isToday ? BRAND : empty ? DIM : colors.text;
  const weekdayColor = isToday ? BRAND : empty ? DIM : colors.text;

  return (
    <View style={{ marginBottom: spacing.xxl }}>
      {/* Big date number left, weekday right (month lives once in the header) */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}>
        <Text
          style={{
            fontSize: 40,
            lineHeight: 44,
            fontFamily: fontFamily.bold,
            letterSpacing: -1,
            color: numColor,
          }}>
          {day.date}
        </Text>
        <Text
          style={{
            fontSize: fontSize.body,
            fontFamily: fontFamily.semibold,
            color: weekdayColor,
            paddingTop: 6,
          }}>
          {day.weekday}
        </Text>
      </View>

      {!empty && (
        <View style={{ marginTop: spacing.md, gap: spacing.md }}>
          {day.events.map((e) => {
            const label = isPast ? 'DONE' : (e.start ?? 'TODO');
            return (
              <View key={e.id} style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text
                  style={{
                    width: LABEL_W,
                    fontSize: fontSize.caption,
                    fontFamily: fontFamily.semibold,
                    letterSpacing: 0.8,
                    color: isPast ? colors.textTertiary : BRAND,
                  }}>
                  {label.toUpperCase()}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    flex: 1,
                    fontSize: fontSize.bodyLg,
                    fontFamily: fontFamily.medium,
                    color: isPast ? colors.textSecondary : colors.text,
                  }}>
                  {e.title}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

/** Muppet's view of your calendar — minimal day list; chat FAB adds events. */
export default function CalendarScreen() {
  const { calendarDays, createThread } = useAppStore();
  const today = new Date().getDate();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      {/* Header — the month appears once, here */}
      <View
        style={{
          height: 44,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.divider,
        }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            textAlign: 'center',
            color: colors.text,
            fontSize: fontSize.bodyLg,
            fontWeight: fontWeight.semibold,
            marginRight: 26,
          }}>
          {CAL_MONTH}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.xl,
            paddingBottom: 120, // clear the chat FAB
          }}
          showsVerticalScrollIndicator={false}>
          {calendarDays.map((day) => (
            <DayBlock key={day.id} day={day} today={today} />
          ))}
        </ScrollView>

        {/* Chat FAB — talk to Muppet; schedule-sounding messages land right here */}
        <Pressable
          onPress={() => router.push(`/chat/${createThread()}`)}
          style={({ pressed }) => ({
            position: 'absolute',
            right: spacing.xl,
            bottom: spacing.xl,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: CHARCOAL,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.9 : 1,
            ...shadow.card,
          })}>
          <Ionicons name="chatbubble-ellipses" size={22} color="#FFFFFF" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
