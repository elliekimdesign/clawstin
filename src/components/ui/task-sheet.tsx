import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fontFamily, fontSize, spacing, sysColor } from '@/theme/theme';

import { FrostedGlassFill } from './frosted-glass-fill';
import { MosaicDot } from './mosaic-dot';
import { RisingSheet } from './rising-sheet';

const INK = '#16181C';
const INK_DIM = 'rgba(22,24,28,0.55)';
const DIVIDER = 'rgba(22,24,28,0.08)';

export type TaskSheetRow = {
  key: string;
  label: string;
  /** right column: age or live progress line */
  age?: string;
  threadId?: string;
  /** running rows wear the resting cell, not the your-turn teal */
  running?: boolean;
};

/**
 * A hero card's "+N MORE" opened as a rising folder (2026-07-17): the
 * sheet wears the SAME frosted-folder face as the board sections —
 * flap, diagonal cut, blue ghost box — so tapping the card visibly
 * hands you the opened folder instead of teleport-scrolling the board
 * and remotely flipping a distant filter tab. Same grammar as
 * AutopilotSheet: the board never reflows; rows are doors to their
 * conversations.
 */
export function TaskSheet({
  visible,
  onClose,
  title,
  rows,
}: {
  visible: boolean;
  onClose: () => void;
  /** flap label in the section-title voice, e.g. "YOUR TURN" */
  title: string;
  rows: TaskSheetRow[];
}) {
  const insets = useSafeAreaInsets();
  const [titleW, setTitleW] = useState(0);
  const label = `${title} ${rows.length}`;

  const openThread = (threadId?: string) => {
    onClose();
    if (threadId) router.push(`/chat/${threadId}`);
  };

  return (
    <RisingSheet visible={visible} onClose={onClose}>
        <View
          style={{
            marginHorizontal: 10,
            marginBottom: Math.max(insets.bottom, 10),
            maxHeight: '70%',
            shadowColor: '#16181C',
            shadowOpacity: 0.2,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: -8 },
            elevation: 16,
          }}>
          {/* stronger veil than the board sections: this floats over
              the dimmed board, rows need the extra backing */}
          <FrostedGlassFill
            radius={16}
            tint="rgba(255,255,255,0.8)"
            tabWidth={titleW ? 18 + titleW + 18 : 132}
          />
          {/* the flap names the opened folder */}
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
              {label}
            </Text>
          </View>
          {/* rows: the board list's exact anatomy and 14 rhythm */}
          <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ paddingBottom: 14 }}>
            {rows.map((row, idx) => (
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
                    gap: spacing.sm,
                    paddingHorizontal: 18,
                    paddingTop: idx === 0 ? 18 : 14,
                    paddingBottom: 14,
                    opacity: pressed ? 0.5 : 1,
                  })}>
                  <View style={{ width: 14, alignItems: 'flex-start' }}>
                    <MosaicDot
                      color={row.running ? 'rgba(22,24,28,0.35)' : sysColor.action}
                    />
                  </View>
                  <Text
                    numberOfLines={1}
                    style={{
                      flex: 1,
                      color: INK,
                      fontSize: fontSize.body,
                      fontFamily: fontFamily.regular,
                    }}>
                    {row.label}
                  </Text>
                  <Text style={{ fontSize: 10, fontFamily: fontFamily.mono, color: INK_DIM }}>
                    {row.age ?? 'now'}
                  </Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>
    </RisingSheet>
  );
}

export default TaskSheet;
