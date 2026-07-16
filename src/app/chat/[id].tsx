import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, FadeOutUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnalogKey } from '@/components/ui/analog-key';
import { ApprovalCard } from '@/components/ui/approval-card';
import { CrewDots } from '@/components/ui/crew-dots';
import { NewChatSeed, type SeedPhase } from '@/components/ui/new-chat-seed';
import { CREW_DEEP } from '@/components/ui/crew-pixel';
import { CrewSwitch } from '@/components/ui/crew-switch';
import { AquaBg } from '@/components/ui/aqua-bg';
import { ButterBg } from '@/components/ui/butter-bg';
import { CloudBg } from '@/components/ui/cloud-bg';
import { DeskGradientBg } from '@/components/ui/desk-gradient-bg';
import { MeshBg } from '@/components/ui/mesh-bg';
import { MintBg } from '@/components/ui/mint-bg';
import { MonthOverlay } from '@/components/ui/month-overlay';
import { MessageBubble } from '@/components/ui/message-bubble';
import { PipelineCard } from '@/components/ui/pipeline-card';
import { PRConsole } from '@/components/ui/pr-console';
import { ResultCard } from '@/components/ui/result-card';
import { ScheduleProposalCard } from '@/components/ui/schedule-proposal-card';
import { ScheduleCard } from '@/components/ui/schedule-card';
import { SuggestionChips } from '@/components/ui/suggestion-chips';
import { ThinkingConsole } from '@/components/ui/thinking-console';
import { TOOL_DEFS, ToolSwitch } from '@/components/ui/tool-switch';
import { WeekStrip } from '@/components/ui/week-strip';
import { TypingIndicator } from '@/components/ui/typing-indicator';
import { routeCrew, type CrewKey } from '@/mock/crew-routing';
import { UNDOABLES } from '@/mock/undoables';
import { useAppStore } from '@/store/app-store';
import { brandBlue, darkChat, fontFamily, fontSize, radius, shadow, spacing , sysColor } from '@/theme/theme';

const GLASS_AVAILABLE = Platform.OS === 'ios' && isGlassEffectAPIAvailable();

/** The conversation view for one thread. Rendered two ways: pushed over
 * the tabs (with a back button) and inside the Chat tab's slider
 * (showBack=false; the history drawer is the way out there). */
export function ChatThreadView({
  id,
  showBack = true,
  onShowHistory,
  composeNew = false,
  initialDraft,
}: {
  id: string;
  showBack?: boolean;
  /** tab mode: the left slot becomes the history-drawer button */
  onShowHistory?: () => void;
  /** Home ask bar entry (2026-07-12): the screen IS the new chat. It
   * starts unbound (empty thread, keyboard up); the first send creates
   * the thread in place, so the routing pill fills with no screen jump. */
  composeNew?: boolean;
  initialDraft?: string;
}) {
  const {
    getThread,
    createThread,
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
    runScheduleOnce,
    confirmSchedule,
    crewSelected,
    crewManual,
    crewBusy,
    selectCrew,
    focusCrew,
  } = useAppStore();
  const [draft, setDraft] = useState(initialDraft ?? '');
  // compose-new binds to a real thread on the first send
  const [boundId, setBoundId] = useState<string | null>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  // header tool context: user-pinned override wins over the thread's own
  const [toolPinned, setToolPinned] = useState<string | null>(null);
  // calendar rail (2026-07-12): with the week strip on screen, the
  // calendar tap shrinks the strip left and drops a vertical rail of
  // calendar actions in the freed column — staggered, one by one
  const [calRail, setCalRail] = useState(false);
  const toggleCalRail = () => {
    LayoutAnimation.configureNext(LayoutAnimation.create(220, 'easeInEaseOut', 'opacity'));
    setCalRail((v) => !v);
  };
  const [crewExpanded, setCrewExpanded] = useState(false);
  // tool row open: the center crew pill steps aside (mirror of the
  // crew pill hiding the side buttons)
  const [toolExpanded, setToolExpanded] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const effId = boundId ?? id;
  const thread = composeNew && !boundId ? undefined : getThread(effId);

  // Opening the thread picks up the delivery: the Done shelf's unread
  // dot clears, but the thread itself is never locked or archived away.
  // The pill also flips to the crew who OWNS this thread.
  const threadCrew = thread?.crew;
  useEffect(() => {
    if (!thread) return;
    markThreadRead(effId);
    if (threadCrew) focusCrew(threadCrew);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effId, !thread, markThreadRead, threadCrew, focusCrew]);

  const activeToolKey = toolPinned ?? thread?.tool ?? 'calendar';

  const isTyping = typingThreadId === effId;
  const thinkingHere = thinking?.threadId === effId ? thinking : null;
  // the floating console's measured height, so the scroll's content
  // starts below it at rest but slides BEHIND it when scrolling
  const [consoleH, setConsoleH] = useState(0);
  // console fold: expanded = full log floating up top (chat slides
  // behind); folded = a small circle docked at the right, above the
  // composer. Seeded threads arrive folded; folding/unfolding reflows
  // the chat naturally (LayoutAnimation in the console's toggle).
  const [consoleFolded, setConsoleFolded] = useState(true);
  useEffect(() => {
    // fresh runs open loud, seeded histories arrive quiet
    setConsoleFolded(!thinkingHere);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effId]);
  useEffect(() => {
    if (thinkingHere && !thinkingHere.done) setConsoleFolded(false);
  }, [thinkingHere]);

  // The chat-start boot lines (gateway + tools) merged INTO the seeded
  // run console — they must never float bare in the scroll ("무조건 이
  // 안에 들어가서 나오는 걸로")
  const bootLog = thread
    ? [
        ...(thread.messages.find((m) => m.terminalLog)?.terminalLog ?? []),
        ...(thread.consoleLog ?? []),
      ]
    : [];

  // multi-tool tasks ("check email, find a slot, book it"): every tool
  // the ask touches opens as its own circle on a line under the header
  const lastUserText =
    [...(thread?.messages ?? [])].reverse().find((m) => m.from === 'user')?.text ?? '';
  const multiTools = TOOL_DEFS.filter((t) => {
    if (t.key === 'gmail')
      return /mail|inbox|email|이메일|메일/i.test(lastUserText);
    if (t.key === 'calendar')
      return /calendar|book|schedule|meeting|time|캘린더|달력|부킹|시간|예약/i.test(lastUserText);
    if (t.key === 'contacts') return /contact|address book|연락처|주소록/i.test(lastUserText);
    if (t.key === 'github') return /github|pr\b|pull request/i.test(lastUserText);
    return false;
  });
  const showToolRow = multiTools.length >= 2 && !calOpen;
  // where the floating console sits: expanded = top overlay (below the
  // tool row when that's out); folded = docked circle above the composer
  const consoleTop = showToolRow ? spacing.sm + 48 : spacing.sm;
  const consoleDone = thinkingHere ? thinkingHere.done : bootLog.length > 0;
  const consoleDocked = consoleDone && consoleFolded;
  const consoleExpandedVisible =
    !calOpen && !consoleDocked && (thinkingHere !== null || bootLog.length > 0);

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
    !stripHidden && prReveal?.threadId !== effId ? pendingSchedule?.date ?? null : null;

  const onSend = () => {
    const text = draft.trim();
    if (!text) return;
    if (!thread) {
      if (!composeNew) return;
      // undo speaks to the original executor in the original thread
      // (product rule) — everything else seeds a fresh thread HERE,
      // so the reply lands where you typed
      if (/undo|revert/i.test(text)) {
        const target = UNDOABLES.find((u) => u.re.test(text));
        if (target) {
          sendMessage(target.threadId, text);
          setBoundId(target.threadId);
          setDraft('');
          return;
        }
      }
      // the seed lockup metamorphoses into the routing indicator:
      // ripple in four colors, flood with the router's pick, lift, THEN
      // the thread binds and the conversation starts
      const picked = called?.key ?? routeCrew(text)?.key ?? 'orchestrator';
      setSeedKey(picked);
      // the routing pill flips the moment routing exists — the header,
      // the seed gauge, and the crew dot all say the same name
      focusCrew(picked);
      LayoutAnimation.configureNext(LayoutAnimation.create(220, 'easeInEaseOut', 'opacity'));
      setSeedPhase('routing');
      setDraft('');
      setTimeout(() => setSeedPhase('handoff'), 1100);
      setTimeout(() => setBoundId(createThread(text)), 1850);
      return;
    }
    sendMessage(thread.id, draft);
    setDraft('');
  };

  const scrollToEnd = () => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  // Task ticks (2026-07-12): the right rail collects one small line per
  // task in this thread — a quiet vertical index of where tasks began.
  // The CURRENT task's tick wears the main task accent; older ones fade.
  const taskStarts: string[] = [];
  thread?.messages.forEach((m, i) => {
    if (i === 0 || m.taskDivider) taskStarts.push(m.id);
  });
  const currentTaskStart = taskStarts[taskStarts.length - 1];

  // Slash calls (2026-07-12): typing /research etc. CALLS a crew member.
  // Once the word completes, their standby dot wakes and the token
  // itself turns their deep signature color, small and bold.
  const SLASH_CALLS: Record<string, { key: CrewKey; pixel: string }> = {
    // by role...
    research: { key: 'researcher', pixel: 'scout' },
    scribe: { key: 'writer', pixel: 'quill' },
    operator: { key: 'triage', pixel: 'pilot' },
    orchestrator: { key: 'orchestrator', pixel: 'muppet' },
    // ...or by name, like calling a teammate
    specs: { key: 'researcher', pixel: 'scout' },
    wink: { key: 'writer', pixel: 'quill' },
    crop: { key: 'triage', pixel: 'pilot' },
    beanie: { key: 'orchestrator', pixel: 'muppet' },
  };
  const slashToken = draft.match(/^\/(\w+)/)?.[1]?.toLowerCase();
  const called = slashToken ? SLASH_CALLS[slashToken] ?? null : null;
  const calledLen = called && slashToken ? slashToken.length + 1 : 0;

  // New-chat seed state machine: idle -> routing (crew-color ripple) ->
  // handoff (routed color floods, lockup lifts) -> thread binds
  const [seedPhase, setSeedPhase] = useState<SeedPhase>('idle');
  const [seedKey, setSeedKey] = useState<CrewKey | null>(null);

  // A completed slash call flips the header routing pill LIVE; erasing
  // the token hands the pill back (thread owner, or the New Chat badge
  // on an unbound compose). Never fights an in-flight run.
  useEffect(() => {
    if (crewBusy) return;
    if (called) {
      focusCrew(called.key);
      return;
    }
    // while the seed is routing/handing off, IT owns the pill
    if (seedPhase !== 'idle') return;
    if (threadCrew) {
      focusCrew(threadCrew);
    } else if (composeNew && !thread) {
      focusCrew(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [called?.key, threadCrew, crewBusy, seedPhase]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: darkChat.base }} edges={['top', 'bottom']}>
      {/* blue desk: light status icons */}
      <StatusBar style="light" />
      {/* Background art follows the active chat colorway (see chatThemes) */}
      {darkChat.background === 'aqua' ? (
        <AquaBg />
      ) : darkChat.background === 'mint' ? (
        <MintBg />
      ) : darkChat.background === 'butter' ? (
        <ButterBg />
      ) : darkChat.background === 'clouds' ? (
        <CloudBg />
      ) : darkChat.background === 'desk' ? (
        <DeskGradientBg />
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
            {showBack ? (
            // the Settings screen's exact back button: solid white
            // chip, ink chevron — one back button across the app
            <Pressable
              // deep-linked chats have no history: fall back to Home
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              hitSlop={10}
              style={({ pressed }) => ({
                // sized to match the header's other circles (the
                // 40pt history/tool chips) — was 30
                width: 40,
                height: 40,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.85)',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.6 : 1,
              })}>
              <Ionicons name="chevron-back" size={19} color="#16181C" />
            </Pressable>
            ) : onShowHistory ? (
            <Pressable
              onPress={onShowHistory}
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
              <Ionicons name="list" size={18} color="#16181C" />
            </Pressable>
            ) : null}
          </Animated.View>
        ) : null}
        <View style={{ flex: 1, alignItems: 'center' }}>
          {toolExpanded ? null : (
            <CrewSwitch
              selected={crewSelected}
              manual={crewManual}
              busy={crewBusy}
              onSelect={selectCrew}
              onExpandChange={setCrewExpanded}
            />
          )}
        </View>
        {!crewExpanded ? (
          <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(120)}
            style={{ width: 48, alignItems: 'flex-end' }}>
            {composeNew && !thread ? (
              // empty new chat: the calendar means nothing yet — this
              // slot is the HISTORY door instead, for the hand that
              // reaches for an LLM-style history list (it lives in
              // Activity, our receipt ledger)
              <Pressable
                onPress={() => router.navigate('/(tabs)/chat')}
                hitSlop={8}
                style={({ pressed }) => ({
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  backgroundColor: 'rgba(46,80,121,0.5)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.7 : 1,
                })}>
                <Ionicons name="time-outline" size={19} color={darkChat.text} />
              </Pressable>
            ) : (
              // bound thread: the tool circle unfolds into the tool row
              <ToolSwitch
                tool={activeToolKey}
                calOpen={calOpen}
                directCalendar={stripTarget != null}
                onExpandChange={setToolExpanded}
                onPick={setToolPinned}
                onCalendarTap={() => {
                  if (calOpen) {
                    setCalOpen(false);
                  } else if (stripTarget != null) {
                    toggleCalRail();
                  } else {
                    setCalOpen(true);
                  }
                }}
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
          {/* instrument row: the machine's line under the header. A
              complex ask opens every touched tool as its own circle,
              and the FOLDED console docks here as the rightmost seat
              (user: the composer-corner dock was 뜬금없음 — the top is
              the machine zone) */}
          {showToolRow || (consoleDocked && !calOpen) ? (
            <View
              style={
                showToolRow
                  ? {
                      flexDirection: 'row',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      gap: 8,
                      paddingHorizontal: spacing.lg,
                      marginTop: spacing.xs,
                      marginBottom: spacing.xs,
                    }
                  : {
                      // circle alone: costs NO flow height — floats in
                      // the top-right corner and the chat rises fully
                      // ("내용은 자동으로 위로 올라와야 해")
                      position: 'absolute',
                      top: spacing.sm,
                      right: spacing.lg,
                      zIndex: 20,
                      flexDirection: 'row',
                      gap: 8,
                    }
              }>
              {showToolRow
                ? multiTools.map((t) => (
                    <View
                      key={t.key}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 999,
                        backgroundColor: 'rgba(46,80,121,0.5)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Ionicons name={t.icon} size={19} color={darkChat.text} />
                    </View>
                  ))
                : null}
              {consoleDocked && !calOpen ? (
                thinkingHere ? (
                  <ThinkingConsole
                    threadId={thinkingHere.threadId}
                    lines={thinkingHere.lines}
                    done={thinkingHere.done}
                    failed={thinkingHere.failed}
                    folded
                    onToggleFold={() => setConsoleFolded(false)}
                  />
                ) : (
                  <ThinkingConsole
                    threadId={effId}
                    lines={bootLog}
                    done
                    folded
                    onToggleFold={() => setConsoleFolded(false)}
                  />
                )
              ) : null}
            </View>
          ) : null}
          {/* Thinking console: an OVERLAY now (2026-07-14) — the chat
              scrolls BEHIND it ("모든 대화 내용은 콘솔 뒤로"); the scroll
              gets measured top padding so content clears it at rest.
              Hidden while the month view is open. */}
          {thinkingHere && !calOpen && !consoleDocked ? (
            <Animated.View
              entering={FadeInDown.duration(280)}
              exiting={FadeOutUp.duration(220)}
              onLayout={(e) => setConsoleH(e.nativeEvent.layout.height)}
              style={{
                position: 'absolute',
                top: consoleTop,
                left: spacing.lg,
                // this console cedes the rail column too — every dark
                // panel steps left when the rail is out
                right: calRail ? spacing.lg + 52 : spacing.lg,
                zIndex: 20,
              }}>
              <ThinkingConsole
                threadId={thinkingHere.threadId}
                lines={thinkingHere.lines}
                done={thinkingHere.done}
                failed={thinkingHere.failed}
                folded={false}
                onToggleFold={() => setConsoleFolded(true)}
              />
            </Animated.View>
          ) : null}

          {/* Seeded run log: the background run that produced this
              thread's ask (folds to the right-edge circle). The gateway
              boot lines ("Gateway connected | E2E...") ALWAYS live
              inside this console — never as bare text in the scroll. */}
          {!thinkingHere && bootLog.length > 0 && !calOpen && !consoleDocked ? (
            <View
              onLayout={(e) => setConsoleH(e.nativeEvent.layout.height)}
              style={{
                position: 'absolute',
                top: consoleTop,
                left: spacing.lg,
                right: calRail ? spacing.lg + 52 : spacing.lg,
                zIndex: 20,
              }}>
              <ThinkingConsole
                threadId={effId}
                lines={bootLog}
                done
                folded={false}
                onToggleFold={() => setConsoleFolded(true)}
              />
            </View>
          ) : null}

          {/* PR console: the dynamic console as a GitHub micro-app —
              pulled DATA up here, the calendar ACTION down in the chat. */}
          {prReveal?.threadId === effId && !calOpen ? (
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
              {/* the strip cedes a button-wide column when the rail is out */}
              <View style={{ marginRight: calRail ? 52 : 0 }}>
                <Pressable
                  onPress={() => setCalOpen(true)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
                  <WeekStrip targetDate={stripTarget} scanning={false} />
                </Pressable>
              </View>
            </Animated.View>
          ) : null}

          {/* the calendar rail: starts right under the header, in the
              column both the console and the strip ceded */}
          {calRail && stripTarget != null && !calOpen ? (
            <View
              style={{
                position: 'absolute',
                top: spacing.sm,
                right: spacing.lg,
                gap: 10,
                zIndex: 30,
              }}>
              {/* the integrated tools drop in first, then ONE mark
                  that leads to settings, where the tool list lives */}
              {(
                [
                  { icon: 'logo-github', action: 'github' },
                  { icon: 'people-outline', action: 'contacts' },
                  { icon: 'settings-outline', action: 'settings' },
                ] as const
              ).map((r, i) => (
                <Animated.View key={r.icon} entering={FadeInDown.delay(i * 90).duration(220)}>
                  <Pressable
                    onPress={() => {
                      setCalRail(false);
                      if (r.action === 'settings') router.push('/settings');
                      else setToolPinned(r.action);
                    }}
                    hitSlop={6}
                    style={({ pressed }) => ({
                      width: 40,
                      height: 40,
                      borderRadius: 999,
                      // the calendar tab button's exact translucent navy
                      backgroundColor: 'rgba(46,80,121,0.5)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: pressed ? 0.7 : 1,
                    })}>
                    <Ionicons name={r.icon} size={17} color={darkChat.text} />
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          ) : null}
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{
              paddingLeft: spacing.lg,
              // right rail reserved for a future vertical element
              paddingRight: 32,
              // clear the floating console at rest (it overlays the
              // scroll; content passes behind it once you scroll). A
              // docked (folded) console frees the top — content rises.
              paddingTop: consoleExpandedVisible
                ? consoleH + consoleTop + spacing.md
                : spacing.lg,
              // room to scroll past the floating command pill: the
              // conversation flows BEHIND it, no wall
              paddingBottom: 118,
            }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToEnd}>
            {/* unbound new chat: quiet starter chips where the first
                message will land; routing is automatic, so there is
                nothing to configure up here */}
            {composeNew && !thread ? (
              <View
                style={{
                  // idle: centered invitation; once sent it snaps up to
                  // the slot between the header and the coming console
                  marginTop: seedPhase === 'idle' ? 96 : 4,
                  alignItems: 'center',
                  gap: 10,
                }}>
                <NewChatSeed phase={seedPhase} />
                {(seedPhase === 'idle'
                  ? ['Plan my day', 'Find time Friday', 'Summarize my inbox']
                  : []
                ).map((chip) => (
                  <Pressable
                    key={chip}
                    onPress={() => setDraft(chip)}
                    style={({ pressed }) => ({
                      borderRadius: 999,
                      // thin glass, like the desk's motion panes: real
                      // refraction under a veil far lighter than the
                      // composer's, so the room shows through
                      overflow: 'hidden',
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.45)',
                      opacity: pressed ? 0.7 : 1,
                    })}>
                    {GLASS_AVAILABLE ? (
                      <GlassView
                        glassEffectStyle="clear"
                        colorScheme="light"
                        style={StyleSheet.absoluteFill}
                        pointerEvents="none"
                      />
                    ) : null}
                    <View
                      pointerEvents="none"
                      style={[
                        StyleSheet.absoluteFill,
                        { backgroundColor: 'rgba(255,255,255,0.14)' },
                      ]}
                    />
                    <Text
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 9,
                        fontSize: 13,
                        fontFamily: fontFamily.regular,
                        color: 'rgba(255,255,255,0.92)',
                      }}>
                      {chip}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            {thread?.messages.map((m) => (
              <View key={m.id}>
                {/* the task tick experiment is retired ("이 흰색 바는
                    지워") — the chop divider + console task line carry
                    the context split on their own */}
                {/* chop boundary: the orchestrator cut a new task here —
                    one scroll, visibly segmented */}
                {m.taskDivider ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      marginVertical: spacing.lg,
                    }}>
                    <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.22)' }} />
                    <Text
                      numberOfLines={1}
                      style={{
                        maxWidth: '60%',
                        fontFamily: fontFamily.mono,
                        fontSize: 10,
                        letterSpacing: 0.3,
                        color: 'rgba(255,255,255,0.6)',
                      }}>
                      {`task  ${m.taskDivider}`}
                    </Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.22)' }} />
                  </View>
                ) : null}
                {/* terminalLog no longer renders here — those boot
                    lines live inside the top run console (bootLog) */}
                {m.taskDivider ? null : (
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
                {m.scheduleProposal ? (
                  <ScheduleProposalCard
                    proposal={m.scheduleProposal}
                    onRunOnce={() => runScheduleOnce(thread.id, m.id)}
                    onSchedule={() => confirmSchedule(thread.id, m.id)}
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
                )}
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
          {/* floating command dock: the conversation scrolls
              underneath — no floor, no wall */}
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
          {/* crew standby dots: four signature colors sleeping over the
              command pill; the routed agent's dot wakes and pulses */}
          <View style={{ marginBottom: 8 }}>
            <CrewDots
              activeKey={
                called
                  ? called.key
                  : seedPhase !== 'idle'
                    ? seedKey
                    : crewBusy || isTyping || thinkingHere
                      ? crewSelected
                      : null
              }
              wave={draft.trim().length > 0}
            />
          </View>
          {/* Command KEY row (2026-07-16, Home-consistency pass):
              attach lives OUTSIDE as a mini keycap (iMessage grammar
              kept, material updated); the bar itself is the Home ask
              bar's exact ANALOG KEY — bevel, sheen, square. */}
          <View
            style={{
              marginHorizontal: spacing.lg,
              marginBottom: spacing.sm,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}>
          <AnalogKey
            onPress={() => setAttachOpen((v) => !v)}
            hitSlop={10}
            style={{
              width: 36,
              height: 36,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="add" size={20} color="rgba(22,24,28,0.6)" />
          </AnalogKey>
          <View
            style={{
              flex: 1,
              // the Home ask bar's expanded FIELD skin, exactly (2026-
              // 07-16 "챗 봇안에는 그게 똑같이"): square writable glass
              // — the keycap look belongs only to the COLLAPSED bar
              height: 52,
              borderRadius: 0,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.55)',
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              paddingLeft: 16,
              paddingRight: 7,
            }}>
              {GLASS_AVAILABLE ? (
                <GlassView
                  glassEffectStyle="clear"
                  colorScheme="light"
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />
              ) : null}
              <View
                pointerEvents="none"
                style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.62)' }]}
              />
              <Pressable
                hitSlop={10}
                onPress={() => {
                  if (!draft.startsWith('/')) setDraft('/' + draft);
                }}
                style={({ pressed }) => ({
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  backgroundColor: 'rgba(59,118,196,0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.6 : 1,
                })}>
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: fontFamily.semibold,
                    color: sysColor.accent,
                  }}>
                  /
                </Text>
              </Pressable>
              <TextInput
                onChangeText={setDraft}
                autoFocus={composeNew}
                onFocus={() => setAttachOpen(false)}
                placeholder="What needs doing?"
                placeholderTextColor="rgba(22,24,28,0.5)"
                style={{
                  flex: 1,
                  paddingVertical: spacing.md,
                  fontSize: 15,
                  fontFamily: fontFamily.regular,
                  color: '#16181C',
                }}
                returnKeyType="send"
                onSubmitEditing={onSend}>
                {called ? (
                  <Text>
                    <Text
                      style={{
                        color: CREW_DEEP[called.pixel],
                        fontSize: 14,
                        fontFamily: fontFamily.bold,
                      }}>
                      {draft.slice(0, calledLen)}
                    </Text>
                    {draft.slice(calledLen)}
                  </Text>
                ) : (
                  draft
                )}
              </TextInput>
              <Pressable
                onPress={() => (draft.trim() ? onSend() : Alert.alert('Coming soon'))}
                style={({ pressed }) => ({
                  // bare glyph, no chip — the Home ask key's exact mic
                  // (2026-07-16 "마이크도 그렇고"); the accent color
                  // carries send-readiness, not a plate
                  width: 38,
                  height: 38,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.6 : 1,
                })}>
                <Ionicons
                  name={draft.trim() ? 'arrow-up' : 'mic'}
                  size={21}
                  color={sysColor.accent}
                />
              </Pressable>
          </View>
          </View>
          </View>
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


      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Pushed route wrapper (deep links, Home rows, sheet rows).
 * /chat/new is the Home ask bar's destination: the empty-thread compose
 * mode; ?draft prefills the composer (the slash chip sends "undo "). */
export default function ChatThreadScreen() {
  const { id, draft } = useLocalSearchParams<{ id: string; draft?: string }>();
  return <ChatThreadView id={id!} composeNew={id === 'new'} initialDraft={draft} />;
}
