import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import type { CrewMember } from '@/mock/crew';
import { useAppStore } from '@/store/app-store';
import { colors, fontSize, fontWeight, radius, spacing } from '@/theme/theme';

// Orange is a POINT color in this app; soft tint for the muppet avatar bg.
const BRAND_SOFT = 'rgba(255,74,50,0.12)';

/** One crew row: emoji avatar + name/role + active status + chevron. Tap → detail. */
function CrewRow({ member, first }: { member: CrewMember; first: boolean }) {
  return (
    <Pressable
      onPress={() => router.push(`/crew/${member.id}`)}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
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
          <Text style={{ fontSize: 18 }}>{member.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{ color: colors.text, fontSize: fontSize.body, fontWeight: fontWeight.semibold }}>
            {member.name}
          </Text>
          <Text
            style={{ color: colors.textSecondary, fontSize: fontSize.small, marginTop: 2 }}
            numberOfLines={1}>
            {member.role}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginRight: 4 }}>
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              backgroundColor: member.active ? colors.success : colors.textTertiary,
            }}
          />
          <Text
            style={{
              color: member.active ? colors.success : colors.textTertiary,
              fontSize: fontSize.caption,
              fontWeight: fontWeight.semibold,
            }}>
            {member.active ? 'Active' : 'Paused'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </View>
    </Pressable>
  );
}

/** The hired crew — assistant characters with pro skills. */
export default function CrewScreen() {
  const { crew } = useAppStore();

  return (
    <Screen title="Crew">
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}>
        <SectionHeader title="YOUR CREW" trailing={`${crew.length}`} />
        <Card padded={false}>
          {crew.map((m, i) => (
            <CrewRow key={m.id} member={m} first={i === 0} />
          ))}
        </Card>

        {/* Add crew — MVP placeholder */}
        <Pressable
          onPress={() => Alert.alert('Coming soon', 'Hiring new crew members is on the way.')}
          style={({ pressed }) => ({
            marginTop: spacing.lg,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            paddingVertical: spacing.lg,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: colors.border,
            opacity: pressed ? 0.6 : 1,
          })}>
          <Ionicons name="add" size={18} color={colors.textSecondary} />
          <Text
            style={{ color: colors.textSecondary, fontSize: fontSize.body, fontWeight: fontWeight.semibold }}>
            Add crew
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
