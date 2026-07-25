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
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutUp,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';

import { ApprovalCard } from '@/components/ui/approval-card';
import { type SeedPhase } from '@/components/ui/new-chat-seed';
import { CrewSwitch } from '@/components/ui/crew-switch';
import { AquaBg } from '@/components/ui/aqua-bg';
import { BackstageFlip, useDinnerRun } from '@/components/ui/backstage-flip';
import { ButterBg } from '@/components/ui/butter-bg';
import { CloudBg } from '@/components/ui/cloud-bg';
import { FrostedGlassFill } from '@/components/ui/frosted-glass-fill';
import { MosaicTilesBg } from '@/components/ui/mosaic-tiles-bg';
import { MeshBg } from '@/components/ui/mesh-bg';
import { MintBg } from '@/components/ui/mint-bg';
import { MonthOverlay } from '@/components/ui/month-overlay';
import { MessageBubble } from '@/components/ui/message-bubble';
import { PipelineCard } from '@/components/ui/pipeline-card';
import { PRConsole } from '@/components/ui/pr-console';
import { ResultCard } from '@/components/ui/result-card';
import { ScheduleProposalCard } from '@/components/ui/schedule-proposal-card';
import { ScheduleCard } from '@/components/ui/schedule-card';
import { ThinkingConsole } from '@/components/ui/thinking-console';
import { WeekStrip } from '@/components/ui/week-strip';
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
    // flip demo (2026-07-22): the backstage correction beat
    runDinnerReroute,
  } = useAppStore();
  const [draft, setDraft] = useState(initialDraft ?? '');
  // compose-new binds to a real thread on the first send
  const [boundId, setBoundId] = useState<string | null>(null);
  const [calOpen, setCalOpen] = useState(false);
  // header tool context: user-pinned override wins over the thread's own
  const [toolPinned, setToolPinned] = useState<string | null>(null);
  // calendar rail (2026-07-12): with the week strip on screen, the
  // calendar tap shrinks the strip left and drops a vertical rail of
  // calendar actions in the freed column — staggered, one by one
  const [calRail, setCalRail] = useState(false);
  // compose-only TOOLS rail (2026-07-17 "tools 들이 아래 동그랗게"):
  // the header's right circle drops the tool doors below it
  const toggleCalRail = () => {
    LayoutAnimation.configureNext(LayoutAnimation.create(220, 'easeInEaseOut', 'opacity'));
    setCalRail((v) => !v);
  };
  const [crewExpanded, setCrewExpanded] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const effId = boundId ?? id;
  // a screen that changes identity (new chat, bound thread) always
  // opens CLEAN — no inherited calendar panel (2026-07-24 "항상 새로
  // 열었을 때는 뉴 창으로")
  useEffect(() => {
    setCalOpen(false);
  }, [effId]);
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
  // the prompt's related tool, as a header context icon (2026-07-24
  // "해당하는 프롬프트 관련된 거를 동그란 아이콘으로"): only on a
  // bound thread that actually touched a tool
  const TOOL_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
    calendar: 'calendar-clear-outline',
    contacts: 'people-outline',
    github: 'logo-github',
    gmail: 'mail-outline',
  };
  const contextToolIcon =
    thread && thread.messages.some((m) => m.from === 'user')
      ? TOOL_ICON[activeToolKey] ?? null
      : null;

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

  // ── BACKSTAGE FLIP (2026-07-22, memory/flip-crew-graph): tap the
  // LIVE console on the dinner task and the whole screen flips to the
  // crew handoff graph. Hold freezes the run; the correction happens
  // back on the front side.
  const dinner = useDinnerRun();
  const [backstage, setBackstage] = useState(false);
  const flipSV = useSharedValue(0);
  const isDinnerThread = /dinner|jenna/i.test(thread?.title ?? '');
  const openBackstage = () => {
    if (dinner.phase === 'idle') dinner.start();
    setBackstage(true);
    flipSV.value = withTiming(1, { duration: 650, easing: Easing.inOut(Easing.cubic) });
  };
  const closeBackstage = () => {
    flipSV.value = withTiming(
      0,
      { duration: 650, easing: Easing.inOut(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(setBackstage)(false);
      }
    );
  };
  // Hold lands → carry the user back to the chat to type the fix
  useEffect(() => {
    if (dinner.phase === 'held' && backstage) {
      const t = setTimeout(closeBackstage, 1100);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dinner.phase]);
  // the ANALOG TV mark (2026-07-22 "아날로그 티비 마크"): a little
  // CRT with rabbit ears riding the console's empty right side — the
  // anytime on/off switch for the backstage screen behind the chat
  const TvMark = () => (
    <Pressable
      onPress={openBackstage}
      hitSlop={12}
      style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
      <Svg width={22} height={18} viewBox="0 0 22 18">
        <Path
          d="M 11 7 L 6 1.5 M 11 7 L 16 1.5"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={1.4}
          strokeLinecap="round"
        />
        <Rect
          x={2.5}
          y={7}
          width={17}
          height={9.5}
          rx={2.5}
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={1.4}
          fill="none"
        />
        <Rect x={16} y={10} width={1.6} height={1.6} fill="rgba(255,255,255,0.55)" />
        <Rect x={16} y={13} width={1.6} height={1.6} fill="rgba(255,255,255,0.55)" />
      </Svg>
    </Pressable>
  );

  const frontFlipStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${flipSV.value * 180}deg` }],
  }));
  const backFlipStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${(flipSV.value - 1) * 180}deg` }],
  }));
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

  // multi-tool ROW retired (2026-07-16, "이 디자인은 다 지우면 돼") —
  // every tool the ask touches now stacks vertically as its own circle
  // in the corner instead of a horizontal strip under the header; the
  // corner stack IS the tool switch, no separate multi-tool concept.
  // where the floating console sits: always the collapsed position now
  const consoleTop = spacing.sm;
  const consoleDone = thinkingHere ? thinkingHere.done : bootLog.length > 0;
  const consoleDocked = consoleDone && consoleFolded;
  // the calendar no longer hides the console (2026-07-17 "콘솔 위로
  // 달력패널이 오면 안되고") — the console owns the top slot whenever
  // it's expanded, and panels stack BELOW it
  const consoleExpandedVisible =
    !consoleDocked && (thinkingHere !== null || bootLog.length > 0);

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
    // the flip demo's correction: a held run + the missing context →
    // the reroute beat (ack, re-run, closing + send-invite approval)
    if (thread && isDinnerThread && dinner.phase === 'held' && /vegetarian|vegan/i.test(text)) {
      runDinnerReroute(thread.id, text);
      dinner.resume();
      setDraft('');
      return;
    }
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
      {/* FRONT of the card: the whole chat, flippable */}
      <Animated.View
        style={[{ flex: 1, backfaceVisibility: 'hidden' }, frontFlipStyle]}
        pointerEvents={backstage ? 'none' : 'auto'}>
      {/* blue desk: light status icons */}
      {/* v5 (2026-07-17, mosaic desk): white icons on the blue field,
          dark on the light colorways */}
      <StatusBar style={darkChat.background === 'desk' ? 'light' : 'dark'} />
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
        // v5 (2026-07-17, "이런 스타일로... 배경은 같은색인데 모자이크
        // 큰 타일로"): the other tabs' desk blue, laid as a quiet
        // large-tile mosaic — the MosaicDot language at field scale.
        <MosaicTilesBg />
      ) : (
        <MeshBg variant="dark" />
      )}
      {/* the near-white era's 4pt accent anchor rule retired
          (2026-07-17): the field itself is the desk blue again, so
          the identity needs no separate marker */}

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
            // both side slots share ONE fixed width (2026-07-24 "어떤
            // 상황에서도 가운데"): equal sides = the pill can't drift
            style={{ width: 88, alignItems: 'flex-start' }}>
            {showBack ? (
            // the nav bar's material (2026-07-22 "네비게이션 애플
            // 시스템 스타일이랑 똑같아야"): the back circle is clear
            // Liquid Glass like the tab capsule — same size as before
            <Pressable
              // deep-linked chats have no history: fall back to Home
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              hitSlop={10}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.6 : 1,
              })}>
              <GlassView
                glassEffectStyle="clear"
                colorScheme="light"
                style={[StyleSheet.absoluteFill, { borderRadius: 999 }]}
              />
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
          <CrewSwitch
            selected={crewSelected}
            manual={crewManual}
            busy={crewBusy}
            onSelect={selectCrew}
            onExpandChange={setCrewExpanded}
            // v3 (2026-07-17 "글자치면... 다 바껴야"): the folder-glass
            // face in EVERY state on this screen — typing, routing,
            // bound. The navy readout is retired here.
            light
          />
        </View>
        {!crewExpanded ? (
          <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(120)}
            style={{
              width: 88,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 8,
            }}>
            {/* the prompt's related TOOL, as a context circle beside
                the + (2026-07-24 "옆에 해당하는 프롬프트 관련된 거"):
                calendar here — the tool circle we had, now a context
                mark, not the header's main action */}
            {contextToolIcon ? (
              <Pressable
                onPress={() => setCalOpen(true)}
                hitSlop={8}
                style={({ pressed }) => ({
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.7 : 1,
                  shadowColor: '#16181C',
                  shadowOpacity: 0.12,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 3 },
                })}>
                <FrostedGlassFill flat radius={20} tint="rgba(242,245,248,0.82)" />
                <Ionicons name={contextToolIcon} size={18} color="rgba(22,24,28,0.7)" />
              </Pressable>
            ) : null}
            {/* ALWAYS the New chat + (2026-07-24 "항상 뉴 챗 버튼으로") */}
            <Pressable
              onPress={() =>
                router.replace({ pathname: '/chat/[id]', params: { id: 'new' } })
              }
              hitSlop={8}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 999,
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
                shadowColor: '#16181C',
                shadowOpacity: 0.12,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 3 },
              })}>
              <FrostedGlassFill flat radius={20} tint="rgba(242,245,248,0.82)" />
              <Ionicons name="add" size={22} color="rgba(22,24,28,0.7)" />
            </Pressable>
          </Animated.View>
        ) : null}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <View style={{ flex: 1 }}>
          {/* the FOLDED console docks in the corner as its own circle
              (user: the composer-corner dock was 뜬금없음 — the top is
              the machine zone). The multi-tool horizontal strip that
              used to share this row was retired 2026-07-16 — every
              tool now lives in the vertical corner stack instead. */}
          {/* docked >_ moved to the composer's left slot (2026-07-17
              "콘솔이 숨겨지는 자리") — see the command row below */}
          {/* Thinking console: an OVERLAY now (2026-07-14) — the chat
              scrolls BEHIND it ("모든 대화 내용은 콘솔 뒤로"); the scroll
              gets measured top padding so content clears it at rest.
              Hidden while the month view is open. */}
          {thinkingHere && !consoleDocked ? (
            <Animated.View
              entering={FadeInDown.duration(280)}
              exiting={FadeOutUp.duration(220)}
              onLayout={(e) => setConsoleH(e.nativeEvent.layout.height)}
              style={{
                position: 'absolute',
                top: consoleTop,
                left: spacing.lg,
                // rails OVERLAP now (2026-07-17 "오버래핑해서 앞에") —
                // no more ceding a column
                right: spacing.lg,
                zIndex: 20,
              }}>
              {/* mid-run, the console is the DOOR to backstage
                  (2026-07-22): tap flips; done consoles keep their
                  fold tap untouched */}
              <Pressable
                disabled={!isDinnerThread || thinkingHere.done}
                onPress={openBackstage}>
                <ThinkingConsole
                  threadId={thinkingHere.threadId}
                  lines={thinkingHere.lines}
                  done={thinkingHere.done}
                  failed={thinkingHere.failed}
                  folded={false}
                  onToggleFold={() => setConsoleFolded(true)}
                />
              </Pressable>
            </Animated.View>
          ) : null}

          {/* the anytime BACKSTAGE switch (2026-07-22 "언제든지
              켜지고 꺼지게"): the analog TV riding top-right under the
              tool circle, above whatever the console is doing */}
          {isDinnerThread && !backstage ? (
            <View
              pointerEvents="box-none"
              style={{
                position: 'absolute',
                top: consoleTop + 10,
                right: spacing.lg + 12,
                zIndex: 30,
              }}>
              <TvMark />
            </View>
          ) : null}

          {/* Seeded run log: the background run that produced this
              thread's ask (folds to the right-edge circle). The gateway
              boot lines ("Gateway connected | E2E...") ALWAYS live
              inside this console — never as bare text in the scroll. */}
          {!thinkingHere && bootLog.length > 0 && !consoleDocked ? (
            <View
              onLayout={(e) => setConsoleH(e.nativeEvent.layout.height)}
              style={{
                position: 'absolute',
                top: consoleTop,
                left: spacing.lg,
                right: spacing.lg,
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
              {/* rails overlap now — the strip keeps its full width */}
              <Pressable
                onPress={() => setCalOpen(true)}
                style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
                <WeekStrip targetDate={stripTarget} scanning={false} />
              </Pressable>
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
                    {/* fixed light ink (2026-07-16 fix): sits on the
                        navy circle fill, not the light desk */}
                    <Ionicons name={r.icon} size={17} color="#EAF4FF" />
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          ) : null}
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{
              // full width both sides (2026-07-17 "오른쪽에 남겨둔
              // 화면없이 다 쓰는걸로") — the reserved right rail retired
              paddingLeft: spacing.lg,
              paddingRight: spacing.lg,
              // clear the floating console at rest (it overlays the
              // scroll; content passes behind it once you scroll). A
              // docked (folded) console frees the top — content rises.
              // When a FLOW console (PR card / week strip) already
              // occupies the top, the absolute console overlays THAT,
              // so reserving consoleH again doubled the gap
              // (2026-07-24 "간격이 왜 크게 나오지")
              paddingTop:
                consoleExpandedVisible &&
                !(prReveal?.threadId === effId && !calOpen) &&
                !(stripTarget != null && !calOpen)
                  ? consoleH + consoleTop + spacing.md
                  : spacing.lg,
              // room to scroll past the floating command pill: the
              // conversation flows BEHIND it, no wall
              paddingBottom: 118,
            }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToEnd}>
            {/* unbound new chat: an EMPTY stage (2026-07-17 — starter
                chips, the routing gauge, and the crew dots all
                retired). The composer alone is the invitation; the
                console narrates the run once it starts. */}
            {thread?.messages.map((m, mi) => {
              // the last AGENT message in the thread gets the blob
              // glued to the end of its text — a quiet "at rest" mark
              // that hides the instant a new send starts thinking and
              // reappears once the fresh reply settles (2026-07-16,
              // "문장 끝에마다 붙여줘... 시작하면 사라지고 다시 활성화")
              const isLastAgentMessage =
                m.from === 'agent' &&
                !thread.messages.slice(mi + 1).some((later) => later.from === 'agent');
              return (
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
                    {/* the chop STAMP (2026-07-22 "태스크: 이름, 저장됨
                        콕 박히게"): the quiet mono whisper couldn't
                        carry "a NEW task now exists on Home" — the
                        boundary is a white chip that says exactly
                        that, in one read: the task's name, and the
                        receipt that it was saved. */}
                    <View style={{ flex: 1, height: 1, backgroundColor: darkChat.divider }} />
                    {/* quieter chip (2026-07-22 "흰색이 너무 많으니까"):
                        the popover band's blue-milk instead of bright
                        white, and the name alone — no receipt line */}
                    <View
                      style={{
                        maxWidth: '70%',
                        backgroundColor: 'rgba(191,213,236,0.9)',
                        borderRadius: 11,
                        paddingHorizontal: 13,
                        paddingVertical: 7,
                        alignItems: 'center',
                      }}>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontFamily: fontFamily.semibold,
                          fontSize: 13,
                          color: '#16181C',
                        }}>
                        {`New task: ${m.taskDivider}`}
                      </Text>
                    </View>
                    <View style={{ flex: 1, height: 1, backgroundColor: darkChat.divider }} />
                  </View>
                ) : null}
                {/* terminalLog no longer renders here — those boot
                    lines live inside the top run console (bootLog) */}
                {m.taskDivider ? null : (
                <MessageBubble
                  from={m.from}
                  text={m.text}
                  proactive={m.proactive}
                  caption={m.caption}
                  // the reply's face MUST match the marquee (2026-07-22
                  // "오퍼레이터가 나와야 해"): both derive from the same
                  // routing state — the thread's own agent when it has
                  // one, else whoever the pill currently names
                  agentId={
                    thread.agentId ??
                    (crewSelected
                      ? { researcher: 'scout', writer: 'quill', triage: 'pilot', orchestrator: 'muppet' }[
                          crewSelected
                        ]
                      : undefined)
                  }
                  showBlob={isLastAgentMessage && !isTyping}>
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
                {/* suggestion chips retired (2026-07-24 "앞에
                    프롬프트 나오는 것도 지워" — the composer alone
                    invites; behavior is freeform now) */}
                </MessageBubble>
                )}
              </View>
              );
            })}
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
                // STACK ORDER (2026-07-17): the console owns the top
                // slot while expanded — the month panel slides in
                // UNDER it; with the console docked away, the panel
                // takes the top slot itself, and recalling the console
                // pushes it back down (this style recomputes live)
                top: consoleExpandedVisible
                  ? consoleTop + consoleH + spacing.sm
                  : spacing.sm,
                left: spacing.lg,
                right: spacing.lg,
                zIndex: 15,
                elevation: 15,
              }}>
              <MonthOverlay
                days={calendarDays}
                initialDate={calendarReveal?.date ?? null}
                highlightTitle={calendarReveal?.title ?? null}
                onClose={() => setCalOpen(false)}
              />
            </Animated.View>
          ) : null}
          {/* floating command dock: the conversation scrolls
              underneath — no floor, no wall */}
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
          {/* crew standby dots retired (2026-07-17 "컬러바 없애기") —
              the routed crew shows in the header lockup instead */}
          {/* Command KEY row (2026-07-16, Home-consistency pass):
              attach lives OUTSIDE as a mini keycap (iMessage grammar
              kept, material updated); the bar itself is the Home ask
              bar's exact ANALOG KEY — bevel, sheen, square. */}
          <View
            style={{
              marginHorizontal: spacing.lg,
              marginBottom: spacing.sm,
              flexDirection: 'row',
              // bottom-aligned so the docked >_ console sits level with
              // the white input line, not floating against the tall
              // chips column (2026-07-24 "흰색 콘솔 옆에 잘 정리")
              alignItems: 'flex-end',
              gap: 8,
            }}>
          <View
            style={{
              flex: 1,
              // the field grew into a COLUMN (2026-07-24 "높이를 키워서
              // 안에 위로 인라인으로"): the tool chips ride INSIDE the
              // composer, in a row above the input line
              borderRadius: 16,
              overflow: 'hidden',
              paddingHorizontal: 7,
            }}>
              {GLASS_AVAILABLE ? (
                <GlassView
                  glassEffectStyle="clear"
                  colorScheme="light"
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />
              ) : null}
              {/* the outer band blends with the blue field (2026-07-24
                  "배경 컬러가 여기랑 맞아야"): only a whisper of veil,
                  the desk blue reads through; the white input row below
                  provides the two-band separation */}
              <FrostedGlassFill flat radius={16} tint="rgba(255,255,255,0.22)" />
              {/* TOOL CHIPS inside the composer (2026-07-24 v2): a
                  small scrollable row of SQUARISH OUTLINE chips —
                  border-only (no fill) so they read as tappable/
                  selectable; ALWAYS visible from the start (not toggled
                  by the +). System is the odd one out: icon-only. */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                  gap: 6,
                  paddingTop: 10,
                  paddingHorizontal: 6,
                }}>
                {(
                  [
                    { icon: 'calendar-clear-outline', label: 'Calendar', action: 'calendar' },
                    { icon: 'logo-github', label: 'GitHub', action: 'github' },
                    { icon: 'people-outline', label: 'Contacts', action: 'contacts' },
                    { icon: 'add', label: 'Add more', action: 'settings' },
                  ] as const
                ).map((r) => (
                  <Pressable
                    key={r.action}
                    onPress={() => {
                      if (r.action === 'settings') router.push('/settings');
                      else Alert.alert('Coming soon');
                    }}
                    hitSlop={4}
                    style={({ pressed }) => ({
                      height: 30,
                      // squarer chips (2026-07-24 "알약 말고 네모난"):
                      // small radius, not a pill. Tools = OUTLINE only;
                      // System (no label) = a GRAY-FILLED square well,
                      // set apart from the tool chips
                      width: r.label ? undefined : 30,
                      borderRadius: 8,
                      borderWidth: r.label ? 1 : 0,
                      borderColor: 'rgba(22,24,28,0.22)',
                      backgroundColor: r.label ? undefined : 'rgba(22,24,28,0.08)',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      paddingHorizontal: r.label ? 10 : 0,
                      opacity: pressed ? 0.5 : 1,
                    })}>
                    <Ionicons name={r.icon} size={r.label ? 13 : 15} color="rgba(22,24,28,0.7)" />
                    {r.label ? (
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: fontFamily.medium,
                          color: 'rgba(22,24,28,0.7)',
                        }}>
                        {r.label}
                      </Text>
                    ) : null}
                  </Pressable>
                ))}
              </ScrollView>
              {/* BOTTOM ROW (2026-07-24 "채팅이랑 같은 사이즈 라인으로"):
                  the white input surface + the docked >_ console sit
                  side by side, same line height. When a run docks, the
                  input shrinks and the console takes its slot beside it. */}
              <View
                style={{
                  marginTop: 8,
                  marginBottom: 6,
                  flexDirection: 'row',
                  alignItems: 'stretch',
                  gap: 8,
                }}>
              {/* the input's own WHITE surface (brighter than the chips
                  band above) */}
              <View
                style={{
                  flex: 1,
                  minHeight: 48,
                  borderRadius: 13,
                  overflow: 'hidden',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  paddingLeft: 9,
                }}>
                <View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: 'rgba(255,255,255,0.92)' },
                  ]}
                />
              {/* the + is "add more" (2026-07-24): straight to System
                  settings where the full tool list lives — the inline
                  chips are the quick doors, this is everything else */}
              <Pressable
                hitSlop={10}
                onPress={() => router.push('/settings')}
                style={({ pressed }) => ({
                  width: 30,
                  height: 30,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: -4,
                  opacity: pressed ? 0.6 : 1,
                })}>
                <Ionicons name="add" size={22} color="rgba(22,24,28,0.7)" />
              </Pressable>
              <TextInput
                onChangeText={setDraft}
                autoFocus={composeNew}

                placeholder="What needs doing?"
                placeholderTextColor="rgba(22,24,28,0.5)"
                multiline
                style={{
                  flex: 1,
                  // more room to type (2026-07-24 "창 자체를 조금 더
                  // 여유있게"): a taller, roomier input line
                  minHeight: 52,
                  maxHeight: 130,
                  paddingVertical: 14,
                  fontSize: 16,
                  lineHeight: 22,
                  fontFamily: fontFamily.regular,
                  color: '#16181C',
                }}
                returnKeyType="send"
                blurOnSubmit
                onSubmitEditing={onSend}>
                {/* the crew-color tag styling retired (2026-07-17
                    "컬러테그도") — a slash call still routes, the text
                    just stays plain */}
                {draft}
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
              {/* docked run console beside the input (2026-07-24): same
                  line height, sits in the slot the input shrinks to give */}
              {consoleDocked ? (
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
          </View>
          </View>
          </View>
        </View>

      </KeyboardAvoidingView>
      </Animated.View>
      {/* BACK of the card: the crew handoff graph */}
      {backstage ? (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backfaceVisibility: 'hidden' },
            backFlipStyle,
          ]}>
          <BackstageFlip
            taskTitle={thread?.title ?? 'dinner with Jenna'}
            run={dinner}
            onClose={closeBackstage}
            onOpenCrew={() => closeBackstage()}
          />
        </Animated.View>
      ) : null}
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
