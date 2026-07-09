import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, FadeOutUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApprovalCard } from '@/components/ui/approval-card';
import { AuroraRim } from '@/components/ui/aurora-rim';
import { CrewSwitch } from '@/components/ui/crew-switch';
import { GlassIconButton } from '@/components/ui/glass-icon-button';
import { AquaBg } from '@/components/ui/aqua-bg';
import { ButterBg } from '@/components/ui/butter-bg';
import { CloudBg } from '@/components/ui/cloud-bg';
import { MeshBg } from '@/components/ui/mesh-bg';
import { MintBg } from '@/components/ui/mint-bg';
import { MonthOverlay } from '@/components/ui/month-overlay';
import { MessageBubble } from '@/components/ui/message-bubble';
import { PipelineCard } from '@/components/ui/pipeline-card';
import { PRConsole } from '@/components/ui/pr-console';
import { ResultCard } from '@/components/ui/result-card';
import { ScheduleCard } from '@/components/ui/schedule-card';
import { SuggestionChips } from '@/components/ui/suggestion-chips';
import { ThinkingConsole } from '@/components/ui/thinking-console';
import { WeekStrip } from '@/components/ui/week-strip';
import { TypingIndicator } from '@/components/ui/typing-indicator';
import { useAppStore } from '@/store/app-store';
import { brandBlue, darkChat, fontFamily, fontSize, radius, shadow, spacing } from '@/theme/theme';

/** Full-screen conversation view for one thread (pushed over the tabs). */
export default function ChatThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    getThread,
    markThreadRead,
    typingThreadId,
    thinking,
    calendarReveal,
    activeTool,
    prReveal,
    sendMessage,
    resolveChatApproval,
    calendarDays,
    bookScheduleSlot,
    crewSelected,
    crewManual,
    crewBusy,
    selectCrew,
    focusCrew,
  } = useAppStore();
  const [draft, setDraft] = useState('');
  const [attachOpen, setAttachOpen] = useState(false);
  // measured composer pill, so the aurora rim can trace it exactly
  const [composerSize, setComposerSize] = useState<{ w: number; h: number } | null>(null);
  const [calOpen, setCalOpen] = useState(false);
  const [crewExpanded, setCrewExpanded] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const thread = getThread(id);

  // Opening the thread picks up the delivery: the Done shelf's unread
  // dot clears, but the thread itself is never locked or archived away.
  // The pill also flips to the crew who OWNS this thread.
  const threadCrew = thread?.crew;
  useEffect(() => {
    markThreadRead(id);
    if (threadCrew) focusCrew(threadCrew);
  }, [id, markThreadRead, threadCrew, focusCrew]);

  const isTyping = typingThreadId === id;
  const thinkingHere = thinking?.threadId === id ? thinking : null;

  // The dark week-strip console: NOT during thinking (the console narrates
  // that) — it appears with the calendar answer, right under the console.
  // Tapping it swaps it for the big month view; closing that dismisses both.
  const pendingScheduleMsg = [...(thread?.messages ?? [])]
    .reverse()
    .find((m) => m.schedule && !m.schedule.booked);
  const pendingSchedule = pendingScheduleMsg?.schedule;
  const [stripHidden, setStripHidden] = useState(false);
  useEffect(() => {
    // a NEW calendar answer brings the strip back
    setStripHidden(false);
  }, [pendingScheduleMsg?.id]);

  // Right after a booking, pop the month view open on that date so the
  // receipt is visible immediately (the fresh event blinks in).
  useEffect(() => {
    if (calendarReveal) {
      setStripHidden(true);
      setCalOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarReveal?.seq]);
  // While the PR console owns the pinned slot, the strip stays out — the
  // schedule proposal already shows its day view down in the chat card.
  const stripTarget =
    !stripHidden && prReveal?.threadId !== id ? pendingSchedule?.date ?? null : null;

  const onSend = () => {
    if (!draft.trim() || !thread) return;
    sendMessage(thread.id, draft);
    setDraft('');
  };

  const scrollToEnd = () => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: darkChat.base }} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      {/* Background art follows the active chat colorway (see chatThemes) */}
      {darkChat.background === 'aqua' ? (
        <AquaBg />
      ) : darkChat.background === 'mint' ? (
        <MintBg />
      ) : darkChat.background === 'butter' ? (
        <ButterBg />
      ) : darkChat.background === 'clouds' ? (
        <CloudBg />
      ) : (
        <MeshBg variant="dark" />
      )}

      {/* Slim header: back pinned left, crew switch truly centered on the
          screen (not just centered in the space left of the arrow) — a
          matching invisible spacer on the right balances the arrow's width. */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        }}>
        {/* Side buttons hide entirely while the crew pill is expanded so the
            row can stretch to the full header width without overlapping. */}
        {!crewExpanded ? (
          <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(120)}
            style={{ width: 48, alignItems: 'flex-start' }}>
            <GlassIconButton
              icon="chevron-back"
              // deep-linked chats have no history: fall back to Home
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              onDark
              tint="rgba(255,255,255,0.55)"
              iconColor={darkChat.text}
              iconSize={22}
              hitSlop={10}
            />
          </Animated.View>
        ) : null}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <CrewSwitch
            selected={crewSelected}
            manual={crewManual}
            busy={crewBusy}
            onSelect={selectCrew}
            onExpandChange={setCrewExpanded}
          />
        </View>
        {!crewExpanded ? (
          <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(120)}
            style={{ width: 48, alignItems: 'flex-end' }}>
            {activeTool === 'both' && !calOpen ? (
              // Two tools in play: calendar tucked back-left, GitHub
              // front-right — same tinted circle as the single-tool button.
              <Pressable
                onPress={() => setCalOpen(true)}
                hitSlop={8}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 999,
                    backgroundColor: prReveal ? '#4285F4' : 'rgba(255,255,255,0.55)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.5)',
                  }}>
                  <Ionicons
                    name="calendar-clear-outline"
                    size={15}
                    color={prReveal ? 'rgba(255,255,255,0.75)' : 'rgba(36,54,80,0.6)'}
                    style={{ position: 'absolute', top: 9, left: 9 }}
                  />
                  <Ionicons
                    name="logo-github"
                    size={19}
                    color={prReveal ? '#FFFFFF' : darkChat.text}
                    style={{ position: 'absolute', bottom: 7, right: 7 }}
                  />
                </View>
              </Pressable>
            ) : thread?.tool === 'contacts' || thread?.tool === 'github' || activeTool === 'github' ? (
              // Non-calendar context: the button is the TOOL BADGE for this
              // conversation (Contacts, Devtools) — no month view here.
              <GlassIconButton
                icon={thread?.tool === 'contacts' ? 'people-outline' : 'logo-github'}
                onPress={() => {}}
                onDark
                tint="rgba(255,255,255,0.55)"
                iconColor={darkChat.text}
                iconSize={20}
              />
            ) : (
              <GlassIconButton
                icon={calOpen ? 'close' : 'calendar-clear-outline'}
                onPress={() => {
                  if (calOpen) {
                    // X closes the whole calendar moment: month view AND strip
                    setCalOpen(false);
                    setStripHidden(true);
                  } else {
                    setCalOpen(true);
                  }
                }}
                onDark
                // console navy while the calendar console is up: the color
                // says the button and the floating console are one system
                tint={calOpen || stripTarget != null ? '#4285F4' : 'rgba(255,255,255,0.55)'}
                iconColor={calOpen || stripTarget != null ? '#FFFFFF' : darkChat.text}
                iconSize={20}
              />
            )}
          </Animated.View>
        ) : null}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <View style={{ flex: 1 }}>
          {/* Thinking console: in the FLOW, not an overlay — it pushes the
              conversation down instead of covering it. Hidden while the
              month view is open so dark edges never stack. */}
          {thinkingHere && !calOpen ? (
            <Animated.View
              entering={FadeInDown.duration(280)}
              exiting={FadeOutUp.duration(220)}
              style={{
                marginHorizontal: spacing.lg,
                marginTop: spacing.sm,
                marginBottom: spacing.xs,
                // the expanded full-log dropdown must float OVER the chat
                zIndex: 20,
              }}>
              <ThinkingConsole
                threadId={thinkingHere.threadId}
                lines={thinkingHere.lines}
                done={thinkingHere.done}
                failed={thinkingHere.failed}
              />
            </Animated.View>
          ) : null}

          {/* Seeded run log: the background run that produced this
              thread's ask, folded to the slim bar (it finished before
              the user arrived — expand on demand). */}
          {!thinkingHere && thread?.consoleLog && !calOpen ? (
            <View
              style={{
                marginHorizontal: spacing.lg,
                marginTop: spacing.sm,
                marginBottom: spacing.xs,
                zIndex: 20,
              }}>
              <ThinkingConsole threadId={id} lines={thread.consoleLog} done startCollapsed />
            </View>
          ) : null}

          {/* PR console: the dynamic console as a GitHub micro-app —
              pulled DATA up here, the calendar ACTION down in the chat. */}
          {prReveal?.threadId === id && !calOpen ? (
            <Animated.View
              entering={FadeInDown.duration(280)}
              exiting={FadeOutUp.duration(220)}
              style={{
                marginHorizontal: spacing.lg,
                marginTop: spacing.xs,
                marginBottom: spacing.xs,
              }}>
              <PRConsole />
            </Animated.View>
          ) : null}

          {/* Week-strip console: in the flow right below the thinking
              console. Tap = trade up: the small strip goes away and the
              big month view opens in front. */}
          {stripTarget != null && !calOpen ? (
            <Animated.View
              entering={FadeInDown.duration(280)}
              exiting={FadeOutUp.duration(220)}
              style={{
                marginHorizontal: spacing.lg,
                marginTop: spacing.xs,
                marginBottom: spacing.xs,
              }}>
              <Pressable
                onPress={() => {
                  setStripHidden(true);
                  setCalOpen(true);
                }}
                style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
                <WeekStrip targetDate={stripTarget} scanning={false} />
              </Pressable>
            </Animated.View>
          ) : null}
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{
              paddingLeft: spacing.lg,
              // right rail reserved for a future vertical element
              paddingRight: 32,
              paddingTop: spacing.lg,
              paddingBottom: spacing.md,
            }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToEnd}>
            {thread?.messages.map((m) => (
              <View key={m.id}>
                {m.terminalLog ? (
                  <View style={{ marginBottom: spacing.sm }}>
                    {m.terminalLog.map((line, i) => (
                      <Text
                        key={i}
                        style={{
                          fontFamily: 'Menlo',
                          fontSize: 10,
                          lineHeight: 14,
                          color: darkChat.textTertiary,
                        }}>
                        {line}
                      </Text>
                    ))}
                  </View>
                ) : null}
                <MessageBubble
                  from={m.from}
                  text={m.text}
                  proactive={m.proactive}
                  caption={m.caption}>
                {m.approval ? (
                  <ApprovalCard
                    compact
                    onDark
                    approval={m.approval}
                    onApprove={(a) => resolveChatApproval(thread.id, m.id, a, true)}
                    onDeny={(a) => resolveChatApproval(thread.id, m.id, a, false)}
                  />
                ) : null}
                {m.schedule ? (
                  <ScheduleCard
                    schedule={m.schedule}
                    weekday={
                      calendarDays.find((d) => d.date === m.schedule?.date)?.weekday ?? ''
                    }
                    events={calendarDays.find((d) => d.date === m.schedule?.date)?.events ?? []}
                    onBook={(slot) => bookScheduleSlot(thread.id, m.id, slot)}
                  />
                ) : null}
                {m.pipeline ? <PipelineCard pipeline={m.pipeline} /> : null}
                {m.result ? <ResultCard result={m.result} /> : null}
                {m.suggestions ? (
                  <SuggestionChips
                    suggestions={m.suggestions}
                    onPick={(text) => sendMessage(thread.id, text)}
                  />
                ) : null}
                </MessageBubble>
              </View>
            ))}
            {isTyping ? <TypingIndicator /> : null}
          </ScrollView>

          {/* The week strip retired from this flow: the thinking console
              narrates the scan and the in-chat day card answers — one
              calendar, not two. The month overlay below stays as the
              deliberate on-demand view. */}

          {/* Month calendar: floats over the chat, pinned in place — the
              conversation keeps scrolling underneath. Toggled by the list
              button; technically just an absolutely-positioned sibling of
              the ScrollView, so chat scroll never moves it. */}
          {calOpen ? (
            <Animated.View
              pointerEvents="box-none"
              entering={FadeInDown.duration(280)}
              exiting={FadeOutUp.duration(220)}
              style={{
                position: 'absolute',
                top: spacing.sm,
                left: spacing.lg,
                right: spacing.lg,
                // frontmost: the month view overlaps everything, including
                // the thinking console and week strip
                zIndex: 30,
                elevation: 30,
              }}>
              <MonthOverlay
                days={calendarDays}
                initialDate={calendarReveal?.date ?? null}
                highlightTitle={calendarReveal?.title ?? null}
              />
            </Animated.View>
          ) : null}
        </View>

        {/* Attachment popover (+ button): Camera / Photos / Files */}
        {attachOpen ? (
          <>
            <Pressable
              onPress={() => setAttachOpen(false)}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20 }}
            />
            <Animated.View
              entering={FadeInDown.duration(160)}
              style={{
                position: 'absolute',
                left: spacing.lg + 6,
                bottom: 64,
                zIndex: 21,
                minWidth: 180,
                backgroundColor: darkChat.solidSurface,
                borderRadius: radius.lg,
                paddingVertical: spacing.xs,
                ...shadow.card,
              }}>
              {(
                [
                  { icon: 'camera-outline', label: 'Camera' },
                  { icon: 'image-outline', label: 'Photos' },
                  { icon: 'folder-outline', label: 'Files' },
                ] as const
              ).map((item) => (
                <Pressable
                  key={item.label}
                  onPress={() => {
                    setAttachOpen(false);
                    Alert.alert('Coming soon');
                  }}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.lg,
                    opacity: pressed ? 0.5 : 1,
                  })}>
                  <Ionicons name={item.icon} size={18} color={darkChat.text} />
                  <Text
                    style={{
                      fontSize: fontSize.body,
                      fontFamily: fontFamily.regular,
                      color: darkChat.text,
                    }}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </Animated.View>
          </>
        ) : null}


        {/* Input: the home command bar's design transplanted — azure
            fill, aurora rim, blue glow. Only the voice circle is its
            own element and stays as before. */}
        <View
          style={{
            marginHorizontal: spacing.lg,
            marginBottom: spacing.sm,
            marginTop: spacing.xs,
            shadowColor: '#C9DC7A',
            shadowOpacity: 0.22,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 3 },
            elevation: 10,
          }}>
        <View
          onLayout={(e) =>
            setComposerSize({
              w: e.nativeEvent.layout.width,
              h: e.nativeEvent.layout.height,
            })
          }
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            paddingLeft: spacing.md,
            paddingRight: 4,
            paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: '#0B2113',
          }}>
            <Pressable
              onPress={() => setAttachOpen((v) => !v)}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
              <Ionicons name="add" size={24} color="rgba(230,240,220,0.9)" />
            </Pressable>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              onFocus={() => setAttachOpen(false)}
              placeholder="Assign a task to your crew"
              placeholderTextColor="rgba(230,240,220,0.5)"
              style={{
                flex: 1,
                paddingVertical: spacing.md,
                fontSize: 15,
                fontFamily: fontFamily.regular,
                color: 'rgba(230,240,220,0.95)',
              }}
              returnKeyType="send"
              onSubmitEditing={onSend}
            />
            <Pressable
              onPress={() => (draft.trim() ? onSend() : Alert.alert('Coming soon'))}
              style={({ pressed }) => ({
                width: 38,
                height: 38,
                borderRadius: 999,
                backgroundColor: brandBlue,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.8 : 1,
              })}>
              <Ionicons
                name={draft.trim() ? 'arrow-up' : 'mic'}
                size={19}
                color={darkChat.onLight}
              />
            </Pressable>
        </View>
        {composerSize ? <AuroraRim w={composerSize.w} h={composerSize.h} /> : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
