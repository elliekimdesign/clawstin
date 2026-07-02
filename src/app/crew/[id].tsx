import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppStore } from '@/store/app-store';
import { colors, fontFamily, fontSize, fontWeight, radius, spacing } from '@/theme/theme';

const BRAND = '#FF4A32';
const BRAND_SOFT = 'rgba(255,74,50,0.12)';

/** A crew member's profile room — view + toggle their skills, pause/activate. */
export default function CrewDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getCrew, toggleCrewSkill, toggleCrewActive } = useAppStore();
  const member = getCrew(id);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      {/* Header */}
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
          {member ? member.name : 'Crew'}
        </Text>
      </View>

      {member == null ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.textSecondary }}>This crew member isn’t here.</Text>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
            {/* Profile block */}
            <View style={{ alignItems: 'center', gap: spacing.sm }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: radius.pill,
                  backgroundColor: BRAND_SOFT,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text style={{ fontSize: 36 }}>{member.emoji}</Text>
              </View>
              <Text
                style={{ color: colors.text, fontSize: fontSize.title, fontFamily: fontFamily.semibold }}>
                {member.name}
              </Text>
              <Text
                style={{ color: colors.textSecondary, fontSize: fontSize.body, textAlign: 'center' }}>
                {member.role}
              </Text>
            </View>

            {/* Skills — tappable tags */}
            <View style={{ gap: spacing.sm }}>
              <Text
                style={{
                  color: colors.textTertiary,
                  fontSize: fontSize.caption,
                  fontWeight: fontWeight.semibold,
                  letterSpacing: 0.5,
                }}>
                SKILLS
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {member.skills.map((s) => (
                  <Pressable
                    key={s.label}
                    onPress={() => toggleCrewSkill(member.id, s.label)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.md,
                      borderRadius: radius.pill,
                      backgroundColor: s.on ? BRAND_SOFT : colors.cardAlt,
                      opacity: pressed ? 0.6 : 1,
                    })}>
                    <Ionicons
                      name={s.on ? 'checkmark' : 'add'}
                      size={14}
                      color={s.on ? BRAND : colors.textTertiary}
                    />
                    <Text
                      style={{
                        color: s.on ? colors.text : colors.textSecondary,
                        fontSize: fontSize.small,
                        fontWeight: fontWeight.semibold,
                      }}>
                      {s.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Active / Pause footer */}
          <View style={{ padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.divider }}>
            <Pressable
              onPress={() => toggleCrewActive(member.id)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.sm,
                paddingVertical: spacing.md,
                borderRadius: radius.md,
                backgroundColor: member.active ? colors.cardAlt : colors.accent,
                opacity: pressed ? 0.85 : 1,
              })}>
              <Ionicons
                name={member.active ? 'pause' : 'play'}
                size={18}
                color={member.active ? colors.textSecondary : colors.accentText}
              />
              <Text
                style={{
                  color: member.active ? colors.textSecondary : colors.accentText,
                  fontSize: fontSize.bodyLg,
                  fontWeight: fontWeight.semibold,
                }}>
                {member.active ? 'Pause crew member' : 'Activate crew member'}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
