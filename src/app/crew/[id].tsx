import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { GlassIconButton } from '@/components/ui/glass-icon-button';
import type { Memory } from '@/mock/memories';
import { useAppStore } from '@/store/app-store';
import { colors, fontFamily, fontSize, fontWeight, radius, spacing } from '@/theme/theme';

const BRAND = '#FF4A32';
const BRAND_SOFT = 'rgba(255,74,50,0.12)';

type SubTab = 'skills' | 'memory';

/** Memory sub-tab pane — same searchable/editable global list as the old Memory tab.
    Shown identically for every crew member for now (memories aren't per-agent yet). */
function MemoryPane() {
  const { memories, updateMemory, deleteMemory } = useAppStore();
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const filtered = useMemo(
    () => memories.filter((m) => m.text.toLowerCase().includes(query.toLowerCase())),
    [memories, query]
  );

  const groups = useMemo(() => {
    const map: Record<string, Memory[]> = {};
    for (const m of filtered) (map[m.group] ??= []).push(m);
    return map;
  }, [filtered]);

  const startEdit = (m: Memory) => {
    setEditingId(m.id);
    setEditText(m.text);
  };
  const saveEdit = () => {
    if (editingId) updateMemory(editingId, editText.trim() || '…');
    setEditingId(null);
  };
  const confirmDelete = (m: Memory) => {
    Alert.alert('Forget this?', m.text, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Forget', style: 'destructive', onPress: () => deleteMemory(m.id) },
    ]);
  };

  return (
    <View style={{ gap: spacing.lg }}>
      {/* Search */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: colors.cardAlt,
          borderRadius: radius.pill,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        }}>
        <Ionicons name="search" size={18} color={colors.textTertiary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search memories…"
          placeholderTextColor={colors.textTertiary}
          style={{ flex: 1, fontSize: fontSize.body, color: colors.text }}
        />
      </View>

      {Object.keys(groups).length === 0 ? (
        <Card>
          <Text style={{ color: colors.textSecondary, fontSize: fontSize.body }}>
            No memories match “{query}”.
          </Text>
        </Card>
      ) : (
        Object.entries(groups).map(([group, items]) => (
          <View key={group}>
            <SectionHeader title={group.toUpperCase()} trailing={`${items.length}`} />
            <Card padded={false}>
              {items.map((m, i) => (
                <View
                  key={m.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                    padding: spacing.lg,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: colors.divider,
                  }}>
                  <Ionicons name={m.icon} size={18} color={colors.textSecondary} />
                  {editingId === m.id ? (
                    <TextInput
                      value={editText}
                      onChangeText={setEditText}
                      autoFocus
                      multiline
                      onBlur={saveEdit}
                      onSubmitEditing={saveEdit}
                      style={{
                        flex: 1,
                        fontSize: fontSize.body,
                        color: colors.text,
                        backgroundColor: colors.cardAlt,
                        borderRadius: radius.sm,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                      }}
                    />
                  ) : (
                    <Text style={{ flex: 1, color: colors.text, fontSize: fontSize.body }}>
                      {m.text}
                    </Text>
                  )}

                  {editingId === m.id ? (
                    <GlassIconButton
                      icon="checkmark"
                      onPress={saveEdit}
                      size={30}
                      iconSize={16}
                      iconColor={colors.success}
                    />
                  ) : (
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                      <GlassIconButton
                        icon="pencil"
                        onPress={() => startEdit(m)}
                        size={30}
                        iconSize={14}
                        iconColor={colors.textTertiary}
                      />
                      <GlassIconButton
                        icon="close"
                        onPress={() => confirmDelete(m)}
                        size={30}
                        iconSize={16}
                        iconColor={colors.textTertiary}
                      />
                    </View>
                  )}
                </View>
              ))}
            </Card>
          </View>
        ))
      )}
    </View>
  );
}

/** A crew member's profile room — view + toggle their skills, pause/activate, and inspect memory. */
export default function CrewDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getCrew, toggleCrewSkill, toggleCrewActive } = useAppStore();
  const member = getCrew(id);
  const [subTab, setSubTab] = useState<SubTab>('skills');

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
        <GlassIconButton
          icon="chevron-back"
          onPress={() => router.back()}
          iconColor={colors.text}
          iconSize={22}
          hitSlop={10}
        />
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            textAlign: 'center',
            color: colors.text,
            fontSize: fontSize.bodyLg,
            fontWeight: fontWeight.semibold,
            marginRight: 44,
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
                <Ionicons name={member.icon} size={32} color={colors.text} />
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

            {/* Sub-tab control — Skills / Memory */}
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: colors.cardAlt,
                borderRadius: radius.pill,
                padding: 3,
              }}>
              {(['skills', 'memory'] as SubTab[]).map((tab) => (
                <Pressable
                  key={tab}
                  onPress={() => setSubTab(tab)}
                  style={({ pressed }) => ({
                    flex: 1,
                    alignItems: 'center',
                    paddingVertical: spacing.sm,
                    borderRadius: radius.pill,
                    backgroundColor: subTab === tab ? colors.card : 'transparent',
                    opacity: pressed ? 0.7 : 1,
                  })}>
                  <Text
                    style={{
                      color: subTab === tab ? colors.text : colors.textSecondary,
                      fontSize: fontSize.small,
                      fontWeight: fontWeight.semibold,
                    }}>
                    {tab === 'skills' ? 'Skills' : 'Memory'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {subTab === 'skills' ? (
              /* Skills — tappable tags */
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
            ) : (
              <MemoryPane />
            )}
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
