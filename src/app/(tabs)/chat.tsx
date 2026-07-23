import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
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

import { RasterCloud } from '@/components/ui/analog-key';
import { ColorPanelsBg } from '@/components/ui/color-panels-bg';
import { FrostedGlassFill } from '@/components/ui/frosted-glass-fill';
import { MosaicDot } from '@/components/ui/mosaic-dot';
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
// the >_ lens plane, recolored to the desk's own family (2026-07-16
// "홈탭스타일로 어둡게"): a deepened desk blue, not the old foreign navy
const DESK_NIGHT = '#1E3D63';

const GROUPS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
] as const;

/** the >_ key: the shared RASTER CLOUD (analog-key.tsx) with the
 * glyph holding its center — the same shapeless cell-matter as the
 * Home status key, plus the lens icon. */
function LensDitherKey({
  onPress,
  active,
}: {
  onPress: () => void;
  active: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      style={({ pressed }) => ({
        width: 84,
        height: 28,
        transform: [{ translateY: pressed ? 1 : 0 }],
        opacity: pressed ? 0.75 : 1,
      })}>
      {({ pressed }) => (
        <>
          <RasterCloud active={active} pressed={pressed} />
          {/* the glyph holds the cloud's center */}
          <Text
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 6,
              textAlign: 'center',
              fontSize: 12,
              fontFamily: fontFamily.mono,
              fontWeight: '700',
              letterSpacing: 0.5,
              color: active ? '#FFFFFF' : 'rgba(22,24,28,0.75)',
            }}>
            {'>_'}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export default function ActivityScreen() {
  const { activity, threads, crew, consoleLens, setConsoleLens } = useAppStore();
  const [query, setQuery] = useState('');
  // the ledger's TYPE lens (2026-07-22): chat turns vs task runs
  const [typeFilter, setTypeFilter] = useState<'all' | 'chat' | 'task'>('all');

  // drilldown intake (2026-07-20): doors elsewhere (crew sheet's "all
  // activity") open this tab with ?q=<member name> — the EXISTING
  // search field and its clear button are the whole filter UI. The
  // param is consumed after applying so the same door re-fires later.
  const { q: qParam } = useLocalSearchParams<{ q?: string }>();
  useEffect(() => {
    if (typeof qParam === 'string' && qParam.length > 0) {
      setQuery(qParam);
      router.setParams({ q: undefined });
    }
  }, [qParam]);

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
    // TYPE lens (2026-07-22, Notion-filter reference): the ledger
    // splits into chat turns vs task runs — All is the default
    if (typeFilter !== 'all' && (a.kind ?? 'chat') !== typeFilter)
      return false;
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
      style={{ flex: 1, backgroundColor: consoleLens ? DESK_NIGHT : '#4E83B8' }}
      edges={['top']}>
      <StatusBar style="light" />
      <ColorPanelsBg />
      {/* >_ takeover (2026-07-12): the lens is not a dark card on the
          desk, it IS the screen — the night plane swallows the desk */}
      {consoleLens ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: DESK_NIGHT }]} />
      ) : null}
      {/* header FIXED above the scroll: the >_ button never moves, and
          pulling the list down reveals only the search underneath */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          // header row sits at the SAME spot on every tab: 14 side
          // padding + 18 below the safe area (Home's 14+4 rhythm)
          paddingHorizontal: 14,
          paddingTop: 18,
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
          {/* the flag-dither lens key (2026-07-22): glyph + pixel wake
              straight on the field, same face in both lens states */}
          <LensDitherKey onPress={flipLens} active={consoleLens} />
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
            paddingHorizontal: 16,
            // day mode joined Home's frosted language (2026-07-17
            // "홈탭 스타일로"): rounded glass pill, no pixel frame;
            // the night lens keeps its own faint border
            borderRadius: 22,
            backgroundColor: consoleLens
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(255,255,255,0.62)',
            borderWidth: 1,
            borderColor: consoleLens
              ? 'rgba(255,255,255,0.14)'
              : 'rgba(255,255,255,0.7)',
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
                  // Home's frosted-folder card (2026-07-17 "홈탭
                  // 스타일로"): the shape is the SVG path, so no
                  // border/clip on the box itself
                  marginTop: 28,
                  shadowColor: '#16181C',
                  shadowOpacity: 0.1,
                  shadowRadius: 20,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: 5,
                }
          }>
          {consoleLens ? (
            // raw lens: dark terminal plane (the Logs screen's night)
            <View style={[StyleSheet.absoluteFill, { backgroundColor: DESK_NIGHT }]} />
          ) : (
            // FLAT plate (2026-07-20 "폴더 형태말고"): the feed keeps the
            // frosted skin but drops the folder flap — its header is a
            // straight title bar with a hairline, a window not a folder
            <FrostedGlassFill radius={16} flat />
          )}
          {/* title bar: dots glow while something needs you */}
          <View
            style={{
              height: 34,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 18,
              borderBottomWidth: 1,
              borderBottomColor: rowDivider,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: fontFamily.mono,
                  letterSpacing: 0.3,
                  color: rowDim,
                }}>
                Activity
              </Text>
              {/* TYPE lens (2026-07-22, Notion-filter reference): the
                  ledger splits chat turns from task runs, in the
                  title strip's machine voice */}
              {(['all', 'chat', 'task'] as const).map((k) => (
                <Pressable key={k} onPress={() => setTypeFilter(k)} hitSlop={8}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: fontFamily.mono,
                      letterSpacing: 0.3,
                      color: typeFilter === k ? rowInk : rowFaint,
                    }}>
                    {k === 'all' ? 'All' : k === 'chat' ? 'Chat' : 'Task'}
                  </Text>
                </Pressable>
              ))}
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
                      fontSize: 11,
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
                                fontSize: 12.5,
                                fontFamily: fontFamily.mono,
                                color: rowFaint,
                              }}>
                              {a.time}
                            </Text>
                            <Text
                              numberOfLines={1}
                              style={{
                                flex: 1,
                                fontSize: 12.5,
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
                                fontSize: 12.5,
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
                            {/* mosaic cluster (2026-07-17), matching the
                                Home list's state markers */}
                            <View style={{ marginTop: 5 }}>
                              <MosaicDot color={dotColor(a)} />
                            </View>
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
