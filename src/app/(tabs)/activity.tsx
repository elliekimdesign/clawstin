import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import type { ActivityDay, ActivityItem } from '@/mock/activity';
import { useAppStore } from '@/store/app-store';
import { colors, fontSize, fontWeight, radius, spacing } from '@/theme/theme';

// Orange is a POINT color in this app (see Home). Soft tint for the crew avatar bg.
const BRAND_SOFT = 'rgba(255,74,50,0.12)';

const GROUPS: { key: ActivityDay; label: string }[] = [
  { key: 'today', label: 'TODAY' },
  { key: 'yesterday', label: 'YESTERDAY' },
];

/** One timeline row: circle icon avatar (crew) + title + "{crew} · {time}". */
function ActivityRow({ item, first }: { item: ActivityItem; first: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.lg,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: colors.divider,
      }}>
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: radius.pill,
          backgroundColor: BRAND_SOFT,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Ionicons name={item.icon} size={18} color={colors.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{ color: colors.text, fontSize: fontSize.body, fontWeight: fontWeight.semibold }}
          numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: fontSize.small, marginTop: 2 }}>
          {item.crew} · {item.time}
        </Text>
      </View>
    </View>
  );
}

/** The agent crew's autonomous action log — grouped by day. */
export default function ActivityScreen() {
  const { activity } = useAppStore();

  return (
    <Screen title="Activity">
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}>
        {GROUPS.map(({ key, label }) => {
          const items = activity.filter((a) => a.day === key);
          if (items.length === 0) return null;
          return (
            <View key={key}>
              <SectionHeader title={label} trailing={`${items.length}`} />
              <Card padded={false}>
                {items.map((item, i) => (
                  <ActivityRow key={item.id} item={item} first={i === 0} />
                ))}
              </Card>
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}
