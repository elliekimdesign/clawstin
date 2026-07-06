import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BlissSwooshBg } from '@/components/ui/bliss-swoosh-bg';
import { useAppStore } from '@/store/app-store';
import { fontSize, fontWeight, spacing } from '@/theme/theme';

// blissxp ink tones (see the GLASS palette in the home tab).
const INK = '#1F3A57';
const INK_DIM = 'rgba(31,58,87,0.6)';
const INK_SOFT = 'rgba(31,58,87,0.06)';

// Same face chips as the Crew tab (assets are face-centered card canvases).
const CREW_ART: Record<string, ImageSourcePropType> = {
  muppet: require('../../../../assets/crew/muppet.jpeg'),
  scout: require('../../../../assets/crew/beaker.jpeg'),
  quill: require('../../../../assets/crew/misspiggy.jpeg'),
  pilot: require('../../../../assets/crew/gonzo.jpeg'),
};

/** Every prompt one agent has handled, newest first. Tapping a row opens
 * the real conversation it came from (the chat lands on its last line),
 * so the full prompt history is always reachable from here. */
export default function CrewHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { crew, activity } = useAppStore();

  const member = crew.find((m) => m.id === id);
  const entries = activity.filter((a) => a.agentId === id);
  const art = id ? CREW_ART[id] : undefined;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#8EC9F0' }} edges={['top']}>
      <StatusBar style="dark" />
      <BlissSwooshBg />
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>
        {/* Header: back, face + name + role, count */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            marginTop: spacing.md,
            marginBottom: spacing.lg,
          }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              width: 34,
              height: 34,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.7)',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.6 : 1,
            })}>
            <Ionicons name="chevron-back" size={18} color={INK} />
          </Pressable>
          {art ? (
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                overflow: 'hidden',
                backgroundColor: '#FFFFFF',
              }}>
              <Image source={art} style={{ width: 34, height: 34, resizeMode: 'cover' }} />
            </View>
          ) : null}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: INK,
                fontSize: fontSize.title,
                fontWeight: fontWeight.bold,
                letterSpacing: -0.3,
              }}>
              {member?.name ?? 'Crew'}
            </Text>
            <Text style={{ color: INK_DIM, fontSize: fontSize.small }}>
              {member?.role.split(' · ')[0] ?? ''}
            </Text>
          </View>
          <Text style={{ color: INK_DIM, fontSize: fontSize.small }}>
            {entries.length} prompts
          </Text>
        </View>

        {/* Every conversation this agent handled, newest first */}
        <View
          style={{
            borderRadius: 22,
            backgroundColor: '#FFFFFF',
            shadowColor: '#2E3252',
            shadowOpacity: 0.13,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 6,
          }}>
          {entries.length === 0 ? (
            <Text
              style={{
                color: INK_DIM,
                fontSize: fontSize.body,
                padding: spacing.lg,
              }}>
              No prompts handled yet.
            </Text>
          ) : (
            entries.map((entry, i) => (
              <Pressable
                key={entry.id}
                onPress={() => router.push(`/chat/${entry.threadId}`)}
                style={({ pressed }) => ({
                  paddingVertical: 13,
                  paddingHorizontal: spacing.lg,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: 'rgba(31,58,87,0.08)',
                  opacity: pressed ? 0.6 : 1,
                })}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                  }}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: INK,
                        fontSize: fontSize.body,
                        fontWeight: fontWeight.semibold,
                      }}
                      numberOfLines={2}>
                      {entry.prompt}
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        marginTop: 4,
                      }}>
                      <Text style={{ color: 'rgba(31,58,87,0.35)', fontSize: 12 }}>
                        {'↳'}
                      </Text>
                      <Text style={{ color: INK_DIM, fontSize: fontSize.small }}>
                        {entry.day === 'today' ? entry.time : 'Yesterday'} · {entry.ago}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 999,
                      backgroundColor: INK_SOFT,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Ionicons name="chevron-forward" size={14} color={INK_DIM} />
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
