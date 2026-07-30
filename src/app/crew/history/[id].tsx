import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ColorPanelsBg } from '@/components/ui/color-panels-bg';
import { CREW_ACCENT, CrewPixel } from '@/components/ui/crew-pixel';
import { PixelText } from '@/components/ui/pixel-text';
import { AcidGlassFill } from '@/components/ui/window-fill';
import { useAppStore } from '@/store/app-store';
import { fontFamily, fontSize, spacing } from '@/theme/theme';

const INK = '#16181C';
const INK_DIM = 'rgba(22,24,28,0.55)';
const DIVIDER = 'rgba(22,24,28,0.08)';

/** Every prompt one agent has handled, newest first. Tapping a row opens
 * the real conversation it came from (the chat lands on its last line),
 * so the full prompt history is always reachable from here.
 * REBUILT 2026-07-16 ("과거버전이네, 현재 스타일로 다 바꿔줘") — this
 * screen still carried the blissxp era's own ink palette, fontWeight
 * tokens, BlissSwooshBg, and round chevron chips; now the desk +
 * window system, terminal-bitmap registry name, and pixel state cells
 * used everywhere else. */
export default function CrewHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { crew, activity } = useAppStore();

  const member = crew.find((m) => m.id === id);
  const entries = activity.filter((a) => a.agentId === id);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#4E83B8' }} edges={['top']}>
      <StatusBar style="light" />
      <ColorPanelsBg />
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>
        {/* header: Apple-native back circle (kept, matches app-wide
            rule) + the crew registry anatomy — bare face, bitmap name,
            swatch — + prompt count in the plain machine voice */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            marginTop: spacing.md,
            marginBottom: 28,
          }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.85)',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.6 : 1,
            })}>
            <Ionicons name="chevron-back" size={19} color={INK} />
          </Pressable>
          {id ? <CrewPixel id={id} size={28} /> : null}
          <View style={{ flex: 1, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <PixelText
                text={(member?.name ?? 'CREW').toUpperCase()}
                cell={1.6}
                color="#FFFFFF"
                led
              />
              <View
                style={{
                  width: 6,
                  height: 6,
                  backgroundColor: id ? (CREW_ACCENT[id] ?? 'transparent') : 'transparent',
                }}
              />
            </View>
            <Text
              style={{
                color: 'rgba(255,255,255,0.72)',
                fontSize: fontSize.small,
                fontFamily: fontFamily.medium,
              }}>
              {member?.roleWord ?? ''}
            </Text>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontFamily: fontFamily.mono }}>
            {`${entries.length} PROMPTS`}
          </Text>
        </View>

        {/* the board's own window: glass fill + tinted title strip,
            square corners, no rounded card */}
        <View
          style={{
            borderRadius: 0,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.55)',
            shadowColor: '#16181C',
            shadowOpacity: 0.07,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 6 },
            elevation: 5,
          }}>
          <AcidGlassFill effect="regular" bright tone="gray" />
          <View style={{ height: 26, justifyContent: 'center', paddingHorizontal: 18 }}>
            <Text
              style={{
                fontSize: 11,
                fontFamily: fontFamily.mono,
                letterSpacing: 0.3,
                color: INK_DIM,
              }}>
              ALL PROMPTS
            </Text>
          </View>
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
                  paddingHorizontal: 18,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: DIVIDER,
                  opacity: pressed ? 0.5 : 1,
                })}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: INK,
                        fontSize: fontSize.body,
                        fontFamily: fontFamily.semibold,
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
                      <Text style={{ color: 'rgba(22,24,28,0.35)', fontSize: 12 }}>{'↳'}</Text>
                      <Text
                        style={{
                          color: INK_DIM,
                          fontSize: 10,
                          fontFamily: fontFamily.mono,
                        }}>
                        {entry.day === 'today' ? entry.time : 'Yesterday'} · {entry.ago}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={INK_DIM} />
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
