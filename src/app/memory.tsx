import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import type { Memory } from '@/mock/memories';
import { useAppStore } from '@/store/app-store';
import { colors, fontSize, radius, spacing } from '@/theme/theme';

export default function MemoryScreen() {
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
    <Screen
      title="Memory"
      subtitle="What your assistant knows about you"
      headerLeft={
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
      }>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
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
          <Card style={{ marginTop: spacing.lg }}>
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
                    <Text style={{ fontSize: 20 }}>{m.emoji}</Text>
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
                      <Pressable onPress={saveEdit} hitSlop={8}>
                        <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                      </Pressable>
                    ) : (
                      <View style={{ flexDirection: 'row', gap: spacing.md }}>
                        <Pressable onPress={() => startEdit(m)} hitSlop={8}>
                          <Ionicons name="pencil" size={18} color={colors.textTertiary} />
                        </Pressable>
                        <Pressable onPress={() => confirmDelete(m)} hitSlop={8}>
                          <Ionicons name="close" size={20} color={colors.textTertiary} />
                        </Pressable>
                      </View>
                    )}
                  </View>
                ))}
              </Card>
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
