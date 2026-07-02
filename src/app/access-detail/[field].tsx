import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { maskToken } from '@/mock/infra';
import { useAppStore } from '@/store/app-store';
import { colors, fontSize, fontWeight, radius, spacing } from '@/theme/theme';

const MONO = 'Menlo';

/** Modal editor for one infrastructure endpoint (gateway address or API token). */
export default function AccessDetailScreen() {
  const { field } = useLocalSearchParams<{ field: string }>();
  const { infra, setInfraValue } = useAppStore();
  const item = infra.find((e) => e.id === field);

  // Gateway prefills its current address; tokens start empty ("paste new").
  const [draft, setDraft] = useState(item && item.kind === 'gateway' ? item.value : '');

  const save = () => {
    if (item && draft.trim()) setInfraValue(item.id, draft.trim());
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      {/* Header: Cancel (left) + centered title */}
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
          <Text style={{ color: colors.textSecondary, fontSize: fontSize.bodyLg }}>Cancel</Text>
        </Pressable>
        <Text
          style={{
            flex: 1,
            textAlign: 'center',
            color: colors.text,
            fontSize: fontSize.bodyLg,
            fontWeight: fontWeight.semibold,
            marginRight: 52,
          }}
          numberOfLines={1}>
          {item ? item.label : 'Edit'}
        </Text>
      </View>

      {item == null ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.textSecondary }}>Endpoint not found.</Text>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
            <View style={{ gap: spacing.sm }}>
              <Text
                style={{
                  color: colors.textTertiary,
                  fontSize: fontSize.caption,
                  fontWeight: fontWeight.semibold,
                  letterSpacing: 0.5,
                }}>
                {item.kind === 'gateway' ? 'GATEWAY ADDRESS' : 'API TOKEN'}
              </Text>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={item.kind === 'gateway' ? 'http://host:port' : 'Paste new token'}
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                secureTextEntry={item.kind === 'token'}
                style={{
                  backgroundColor: colors.cardAlt,
                  borderRadius: radius.md,
                  padding: spacing.md,
                  fontFamily: MONO,
                  color: colors.text,
                  fontSize: fontSize.body,
                }}
              />
              {item.kind === 'token' ? (
                <Text style={{ color: colors.textSecondary, fontSize: fontSize.small }}>
                  Current: {maskToken(item.value)}. Paste a new token to replace it.
                </Text>
              ) : null}
            </View>
          </ScrollView>

          {/* Save */}
          <View style={{ padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.divider }}>
            <Pressable
              onPress={save}
              style={({ pressed }) => ({
                alignItems: 'center',
                paddingVertical: spacing.md,
                borderRadius: radius.md,
                backgroundColor: colors.accent,
                opacity: pressed ? 0.85 : 1,
              })}>
              <Text
                style={{ color: colors.accentText, fontWeight: fontWeight.semibold, fontSize: fontSize.bodyLg }}>
                Save
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
