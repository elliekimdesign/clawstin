import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AUTOPILOT_RULES } from '@/mock/autopilot';
import { useAppStore } from '@/store/app-store';
import { fontFamily, fontSize } from '@/theme/theme';

import { FrostedGlassFill } from './frosted-glass-fill';
import { RisingSheet } from './rising-sheet';

const INK = '#16181C';
const INK_DIM = 'rgba(22,24,28,0.55)';
const DIVIDER = 'rgba(22,24,28,0.08)';

/** app slug -> monochrome Ionicon: the left slot answers "what does it
 * touch", so Gmail-ness / GitHub-ness scans instantly. */
const APP_ICON = {
  gmail: 'mail-outline',
  github: 'logo-github',
  drive: 'folder-outline',
  calendar: 'calendar-clear-outline',
} as const;

/**
 * The ROUTINES folder, opened (SIMPLIFIED 2026-07-17 "그냥 루틴되고
 * 있는 리스트들만"): no summary metrics, no proposal buttons, no run
 * counts — the sheet is nothing but the list of standing routines,
 * each row the app's logo and exactly what runs. Every row is a door
 * back to the conversation the routine lives in; pausing or changing
 * it happens THERE by just asking (conversation is the universal
 * fallback), so the sheet carries no controls of its own.
 */
export function AutopilotSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { schedules } = useAppStore();
  const insets = useSafeAreaInsets();
  // the folder flap hugs the ROUTINES label (2026-07-17 folder sweep)
  const [titleW, setTitleW] = useState(0);

  const openThread = (threadId: string) => {
    onClose();
    router.push(`/chat/${threadId}`);
  };

  // rules (event-triggered) and schedules (time-triggered) are both
  // just "the agent working without you" — one flat list
  const rows = [
    ...AUTOPILOT_RULES.map((r) => ({
      key: r.key,
      app: r.app as string,
      name: r.name,
      sub: r.recent[0]?.label ?? '',
      threadId: r.threadId,
    })),
    ...schedules.map((s) => ({
      key: s.id,
      app: s.permissionKey ?? 'calendar',
      name: s.name,
      sub: s.cadence,
      threadId: s.threadId,
    })),
  ];

  return (
    <RisingSheet visible={visible} onClose={onClose}>
      <View
        style={{
          marginHorizontal: 10,
          marginBottom: Math.max(insets.bottom, 10),
          maxHeight: '78%',
          paddingBottom: 14,
          shadowColor: '#16181C',
          shadowOpacity: 0.2,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: -8 },
          elevation: 16,
        }}>
        <FrostedGlassFill
          radius={16}
          tint="rgba(255,255,255,0.8)"
          tabWidth={titleW ? 18 + titleW + 18 : 110}
        />
        {/* the flap names the opened folder; the strip IS the handle */}
        <View style={{ height: 26, justifyContent: 'center', paddingHorizontal: 18 }}>
          <Text
            onTextLayout={(e) => {
              const w = Math.ceil(e.nativeEvent.lines[0]?.width ?? 0);
              if (w !== titleW) setTitleW(w);
            }}
            style={{
              alignSelf: 'flex-start',
              fontSize: 11,
              fontFamily: fontFamily.mono,
              letterSpacing: 0.3,
              color: INK_DIM,
            }}>
            ROUTINES
          </Text>
        </View>
        <ScrollView style={{ flexGrow: 0 }}>
          {rows.length === 0 ? (
            <Text
              style={{
                paddingHorizontal: 18,
                paddingVertical: 16,
                fontSize: 13,
                color: INK_DIM,
              }}>
              No routines yet
            </Text>
          ) : (
            rows.map((row, idx) => (
              <View key={row.key}>
                {idx > 0 ? (
                  <View
                    style={{ height: 1, marginHorizontal: 18, backgroundColor: DIVIDER }}
                  />
                ) : null}
                <Pressable
                  onPress={() => openThread(row.threadId)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingHorizontal: 18,
                    paddingTop: idx === 0 ? 18 : 14,
                    paddingBottom: 14,
                    opacity: pressed ? 0.5 : 1,
                  })}>
                  <Ionicons
                    name={APP_ICON[row.app as keyof typeof APP_ICON] ?? 'apps-outline'}
                    size={16}
                    color={INK_DIM}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        color: INK,
                        fontSize: fontSize.body,
                        fontFamily: fontFamily.regular,
                      }}>
                      {row.name}
                    </Text>
                    {row.sub ? (
                      <Text
                        numberOfLines={1}
                        style={{ marginTop: 3, fontSize: 12, color: INK_DIM }}>
                        {row.sub}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={13} color={INK_DIM} />
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </RisingSheet>
  );
}

export default AutopilotSheet;
