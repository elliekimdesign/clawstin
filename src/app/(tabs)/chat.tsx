import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatThreadView } from '@/app/chat/[id]';
import { CloudBg } from '@/components/ui/cloud-bg';
import { useAppStore } from '@/store/app-store';
import { darkChat, fontSize, fontWeight, spacing } from '@/theme/theme';

/**
 * The Chat tab IS the conversation, with the COMPLETE ask history one
 * swipe away: sliding the chatbot screen left-to-right reveals every
 * conversation ever, newest first, times on the right. Home's list stays
 * curated (in progress, follow ups, fresh deliveries); this drawer is
 * the deliberately complete, duplicated record.
 */
export default function ChatTab() {
  const { threads, createThread } = useAppStore();
  const { width } = useWindowDimensions();
  const pagerRef = useRef<ScrollView>(null);
  const [selectedId, setSelectedId] = useState<string | null>(threads[0]?.id ?? null);
  // the drawer does not take the whole screen: the chat keeps a sliver
  // on the right edge, so the way back stays visible (and tappable)
  const drawerW = Math.round(width * 0.85);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openThread = (id: string) => {
    setSelectedId(id);
    pagerRef.current?.scrollTo({ x: drawerW, animated: true });
  };
  const closeDrawer = () => pagerRef.current?.scrollTo({ x: drawerW, animated: true });

  return (
    <ScrollView
      ref={pagerRef}
      horizontal
      snapToOffsets={[0, drawerW]}
      decelerationRate="fast"
      showsHorizontalScrollIndicator={false}
      // open on the conversation; a right-swipe slides it aside
      contentOffset={{ x: drawerW, y: 0 }}
      onScroll={(e) => setDrawerOpen(e.nativeEvent.contentOffset.x < drawerW / 2)}
      scrollEventThrottle={32}
      style={{ flex: 1 }}>
      {/* page 0: the full history, ~85% wide so the chat peeks beside it */}
      <View style={{ width: drawerW }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: darkChat.base }} edges={['top']}>
          <CloudBg />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: spacing.xl,
              paddingTop: spacing.lg,
              paddingBottom: spacing.sm,
            }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: fontWeight.semibold,
                letterSpacing: 1,
                color: darkChat.textSecondary,
              }}>
              CHATS
            </Text>
            <Pressable
              onPress={() => openThread(createThread())}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
              <Text
                style={{
                  fontSize: fontSize.small,
                  fontWeight: fontWeight.semibold,
                  color: darkChat.text,
                }}>
                New chat
              </Text>
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {threads.map((t, i) => (
              <Pressable
                key={t.id}
                onPress={() => openThread(t.id)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  paddingVertical: 13,
                  paddingHorizontal: spacing.xl,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: darkChat.divider,
                  opacity: pressed ? 0.6 : 1,
                })}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        flexShrink: 1,
                        fontSize: fontSize.body,
                        fontWeight: fontWeight.semibold,
                        color: darkChat.text,
                      }}>
                      {t.title}
                    </Text>
                    {t.unread ? (
                      <View
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 999,
                          backgroundColor: '#4285F4',
                        }}
                      />
                    ) : null}
                  </View>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: fontSize.caption,
                      color: darkChat.textTertiary,
                      marginTop: 3,
                    }}>
                    {t.lastPreview}
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: darkChat.textTertiary }}>{t.updatedAt}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </SafeAreaView>
      </View>

      {/* page 1: the conversation itself, no back button (the drawer is
          the way out) */}
      <View style={{ width }}>
        {selectedId ? (
          <>
            <ChatThreadView
              id={selectedId}
              showBack={false}
              onShowHistory={() => pagerRef.current?.scrollTo({ x: 0, animated: true })}
            />
            {/* while the drawer is open, the peeking chat dims and one
                tap anywhere on it slides the conversation back in */}
            {drawerOpen ? (
              <Pressable
                onPress={closeDrawer}
                style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(36,54,80,0.1)' }]}
              />
            ) : null}
          </>
        ) : (
          <SafeAreaView style={{ flex: 1, backgroundColor: darkChat.base }}>
            <CloudBg />
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: fontSize.body, color: darkChat.textSecondary }}>
                Swipe right and start a chat
              </Text>
            </View>
          </SafeAreaView>
        )}
      </View>
    </ScrollView>
  );
}
