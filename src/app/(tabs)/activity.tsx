import { ScrollView, Text, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { useAppStore } from '@/store/app-store';
import { colors, fontSize, spacing } from '@/theme/theme';

/** The agent's autonomous action log — what it did on its own. */
export default function ActivityScreen() {
  const { activity } = useAppStore();

  return (
    <Screen title="Activity" subtitle="What your agents did on their own">
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}>
        <SectionHeader title="RECENT ACTIVITY" trailing={`${activity.length}`} />
        {activity.map((item, i) => (
          <View
            key={item.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: spacing.md,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: colors.divider,
            }}>
            <Text style={{ flex: 1, color: colors.text, fontSize: fontSize.body }}>
              {item.title}
            </Text>
            <Text style={{ color: colors.textTertiary, fontSize: fontSize.caption }}>
              {item.time}
            </Text>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
