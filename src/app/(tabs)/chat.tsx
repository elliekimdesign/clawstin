import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  LayoutAnimation,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ColorPanelsBg } from '@/components/ui/color-panels-bg';
import { AcidGlassFill, WindowDots } from '@/components/ui/window-fill';
import { useAppStore } from '@/store/app-store';
import { fontFamily, fontSize, sysColor } from '@/theme/theme';

/**
 * ACTIVITY — the Chat tab's landing layer (2026-07-11). The trust
 * loop's receipt ledger: one feed of "what the agent actually did",
 * result sentences grouped by day. Tapping a row opens that run's
 * conversation (/chat/[id]); the >_ toggle flips the SAME rows into a
 * mono console lens in place. New chats start from Home's ask bar —
 * this screen is a ledger, not a composer. (The old pager landing —
 * conversation + history drawer — lives in git.)
 */

const INK = '#16181C';
const DIM = 'rgba(22,24,28,0.55)';
const FAINT = 'rgba(22,24,28,0.4)';
const DIVIDER = 'rgba(22,24,28,0.08)';

const GROUPS = [
  { key: 'today', label: 'TODAY' },
  { key: 'yesterday', label: 'YESTERDAY' },
] as const;

export default function ActivityScreen() {
  const { activity, threads, crew, consoleLens, setConsoleLens } = useAppStore();
  const [query, setQuery] = useState('');

  const getThread = (id: string) => threads.find((t) => t.id === id);
  const agentName = (id: string) => crew.find((c) => c.id === id)?.name ?? id;
  /** console rows speak in ROLES (research, scribe...), not nicknames —
   * the machine logs the function, the humans keep the names */
  const roleName = (id: string) =>
    crew.find((c) => c.id === id)?.role.split(' · ')[0].toLowerCase() ?? id;
  /** the row's ANCHOR is the task title, not the agent's utterance —
   * titles differentiate rows where result sentences all sound alike */
  const title = (a: (typeof activity)[number]) => getThread(a.threadId)?.title ?? a.prompt;
  /** the second line: the RESULT when the thread has one, falling back
   * to the ask */
  const sentence = (a: (typeof activity)[number]) =>
    getThread(a.threadId)?.lastPreview ?? a.prompt;

  const q = query.trim().toLowerCase();
  const rows = activity.filter((a) => {
    if (!q) return true;
    const t = getThread(a.threadId);
    return (
      a.prompt.toLowerCase().includes(q) ||
      (t?.lastPreview ?? '').toLowerCase().includes(q) ||
      (t?.title ?? '').toLowerCase().includes(q) ||
      agentName(a.agentId).toLowerCase().includes(q)
    );
  });
  const needsYou = rows.some((a) => a.status === 'needs_approval');

  const flipLens = () => {
    LayoutAnimation.configureNext(LayoutAnimation.create(180, 'easeInEaseOut', 'opacity'));
    setConsoleLens(!consoleLens);
  };

  // In the terminal takeover the search field stays mounted but tucks
  // above the fold — pull down to reveal it, like iOS list search.
  const scrollRef = useRef<ScrollView>(null);
  const SEARCH_ZONE = 58; // marginTop 14 + field height 44
  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: consoleLens ? SEARCH_ZONE : 0, animated: false });
    });
  }, [consoleLens]);

  /** state dot: color carries state, same semantics as the Home list */
  const dotColor = (a: (typeof activity)[number]) => {
    if (a.status === 'failed') return sysColor.fail;
    if (a.status === 'needs_approval') return sysColor.action;
    if (getThread(a.threadId)?.unread) return sysColor.actionDot;
    return 'rgba(22,24,28,0.22)';
  };
  const glyph = (a: (typeof activity)[number]) =>
    a.status === 'failed' ? '✗' : a.status === 'needs_approval' ? '…' : '✓';

  // >_ raw view is a DARK TERMINAL (the Logs screen's family), so the
  // whole window flips palette with the lens
  const rowInk = consoleLens ? 'rgba(255,255,255,0.85)' : INK;
  const rowDim = consoleLens ? 'rgba(255,255,255,0.52)' : DIM;
  const rowFaint = consoleLens ? 'rgba(255,255,255,0.34)' : FAINT;
  const rowDivider = consoleLens ? 'rgba(255,255,255,0.08)' : DIVIDER;
  const AGENT_BLUE = '#8FBFF2';

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: consoleLens ? '#0D1B36' : '#4E83B8' }}
      edges={['top']}>
      <StatusBar style="light" />
      <ColorPanelsBg />
      {/* >_ takeover (2026-07-12): the lens is not a dark card on the
          desk, it IS the screen — the night plane swallows the desk */}
      {consoleLens ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0D1B36' }]} />
      ) : null}
      {/* header FIXED above the scroll: the >_ button never moves, and
          pulling the list down reveals only the search underneath */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: 4,
        }}>
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 20,
              letterSpacing: -0.3,
              fontFamily: fontFamily.bold,
            }}>
            Activity
          </Text>
          <Pressable
            onPress={flipLens}
            hitSlop={12}
            style={({ pressed }) => ({
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 0,
              backgroundColor: consoleLens ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.85)',
              borderWidth: 1,
              borderColor: consoleLens ? 'rgba(255,255,255,0.92)' : 'rgba(22,24,28,0.08)',
              opacity: pressed ? 0.7 : 1,
            })}>
            <Text
              style={{
                fontSize: 11,
                fontFamily: fontFamily.mono,
                letterSpacing: 0.3,
                color: consoleLens ? '#16181C' : DIM,
              }}>
              {'>_'}
            </Text>
          </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* search: the human asks, so the input speaks sans. In the
            terminal takeover it tucks above the fold (pull to reveal)
            and wears the night palette. */}
        <View
          style={{
            // the board's airy 28pt rhythm (2026-07-14), was 14
            marginTop: 28,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            height: 44,
            paddingHorizontal: 14,
            borderRadius: 0,
            backgroundColor: consoleLens ? 'rgba(255,255,255,0.08)' : '#F6F8FA',
            borderWidth: 1,
            borderColor: consoleLens ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.55)',
          }}>
          <Ionicons name="search" size={14} color={consoleLens ? rowFaint : FAINT} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search activity"
            placeholderTextColor={consoleLens ? rowFaint : FAINT}
            style={{ flex: 1, fontSize: fontSize.body, color: consoleLens ? rowInk : INK }}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={12}>
              <Ionicons name="close-circle" size={15} color={consoleLens ? rowFaint : FAINT} />
            </Pressable>
          ) : null}
        </View>

        {/* the feed window: a card on the desk, edge-to-edge in the
            terminal takeover */}
        <View
          style={
            consoleLens
              ? { marginTop: 8, marginHorizontal: -16 }
              : {
                  // 28pt rhythm here too (was 16)
                  marginTop: 28,
                  borderRadius: 0,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.55)',
                  shadowColor: '#16181C',
                  shadowOpacity: 0.07,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 5,
                }
          }>
          {consoleLens ? (
            // raw lens: dark terminal plane (the Logs screen's night)
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0D1B36' }]} />
          ) : (
            <AcidGlassFill key={`feed-${rows.length}`} effect="clear" bright tone="gray" />
          )}
          {/* title bar: dots glow while something needs you */}
          <View
            style={{
              height: 30,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 18,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <WindowDots lit={needsYou} />
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: fontFamily.mono,
                  letterSpacing: 0.3,
                  color: rowDim,
                }}>
                ACTIVITY
              </Text>
            </View>
            <Text style={{ fontSize: 10, fontFamily: fontFamily.mono, color: rowFaint }}>
              {/* today's pulse, not a lifetime vanity total */}
              {`${rows.filter((a) => a.day === 'today').length} today`}
            </Text>
          </View>

          {rows.length === 0 ? (
            <Text
              style={{
                padding: 18,
                fontSize: 11,
                fontFamily: fontFamily.mono,
                color: rowFaint,
              }}>
              no matches
            </Text>
          ) : (
            GROUPS.map(({ key, label }) => {
              const items = rows.filter((a) => a.day === key);
              if (items.length === 0) return null;
              return (
                <View key={key}>
                  <Text
                    style={{
                      paddingHorizontal: 18,
                      paddingTop: 14,
                      paddingBottom: 4,
                      fontSize: 10,
                      fontFamily: fontFamily.mono,
                      letterSpacing: 0.3,
                      color: rowFaint,
                    }}>
                    {label}
                  </Text>
                  {items.map((a, idx) => (
                    <View key={a.id}>
                      {idx > 0 ? (
                        <View
                          style={{ height: 1, marginHorizontal: 18, backgroundColor: rowDivider }}
                        />
                      ) : null}
                      <Pressable
                        onPress={() => router.push(`/chat/${a.threadId}`)}
                        style={({ pressed }) => ({
                          flexDirection: 'row',
                          alignItems: consoleLens ? 'center' : 'flex-start',
                          gap: 10,
                          paddingHorizontal: 18,
                          paddingVertical: 12,
                          opacity: pressed ? 0.5 : 1,
                        })}>
                        {consoleLens ? (
                          // >_ lens: the machine's own line, on the dark plane
                          <>
                            <Text
                              style={{
                                fontSize: 10.5,
                                fontFamily: fontFamily.mono,
                                color: rowFaint,
                              }}>
                              {a.time}
                            </Text>
                            <Text
                              numberOfLines={1}
                              style={{
                                flex: 1,
                                fontSize: 10.5,
                                fontFamily: fontFamily.mono,
                                color: rowDim,
                              }}>
                              <Text style={{ color: AGENT_BLUE }}>
                                {roleName(a.agentId)}
                              </Text>
                              {`  ${a.prompt}`}
                            </Text>
                            <Text
                              style={{
                                fontSize: 10.5,
                                fontFamily: fontFamily.mono,
                                color:
                                  a.status === 'failed'
                                    ? sysColor.fail
                                    : a.status === 'needs_approval'
                                      ? sysColor.action
                                      : rowFaint,
                              }}>
                              {glyph(a)}
                            </Text>
                          </>
                        ) : (
                          // sentence lens: task title anchors the row,
                          // the result sentence supports underneath
                          <>
                            <View
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: 999,
                                marginTop: 5,
                                backgroundColor: dotColor(a),
                              }}
                            />
                            <View style={{ flex: 1 }}>
                              <Text
                                numberOfLines={1}
                                style={{
                                  color: INK,
                                  fontSize: fontSize.body,
                                  fontFamily: fontFamily.medium,
                                }}>
                                {title(a)}
                              </Text>
                              {sentence(a) !== title(a) ? (
                                <Text numberOfLines={1} style={{ marginTop: 2, fontSize: 12, color: DIM }}>
                                  {sentence(a)}
                                  <Text
                                    style={{
                                      fontFamily: fontFamily.mono,
                                      fontSize: 10,
                                      color: FAINT,
                                    }}>
                                    {`  ${agentName(a.agentId)}`}
                                  </Text>
                                </Text>
                              ) : null}
                            </View>
                            <Text
                              style={{
                                fontSize: 10,
                                fontFamily: fontFamily.mono,
                                color: DIM,
                                marginTop: 3,
                              }}>
                              {a.ago}
                            </Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  ))}
                </View>
              );
            })
          )}
          <View style={{ height: 8 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
