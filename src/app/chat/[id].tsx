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
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutUp,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApprovalCard } from '@/components/ui/approval-card';
import { type SeedPhase } from '@/components/ui/new-chat-seed';
import { CrewSwitch } from '@/components/ui/crew-switch';
import { AquaBg } from '@/components/ui/aqua-bg';
import { ButterBg } from '@/components/ui/butter-bg';
import { CloudBg } from '@/components/ui/cloud-bg';
import { FrostedGlassFill } from '@/components/ui/frosted-glass-fill';
import { MosaicTilesBg } from '@/components/ui/mosaic-tiles-bg';
import { MeshBg } from '@/components/ui/mesh-bg';
import { MintBg } from '@/components/ui/mint-bg';
import { MonthOverlay } from '@/components/ui/month-overlay';
import { DraftCard } from '@/components/ui/draft-card';
import { MessageBubble } from '@/components/ui/message-bubble';
import { PromptMast } from '@/components/ui/prompt-mast';
import { PipelineCard } from '@/components/ui/pipeline-card';
import { PRConsole } from '@/components/ui/pr-console';
import { ResultCard } from '@/components/ui/result-card';
import { ScheduleProposalCard } from '@/components/ui/schedule-proposal-card';
import { ScheduleCard } from '@/components/ui/schedule-card';
import { ThinkingBlob } from '@/components/ui/thinking-blob';
import { ThinkingConsole } from '@/components/ui/thinking-console';
import { WeekStrip } from '@/components/ui/week-strip';
import { routeCrew, type CrewKey } from '@/mock/crew-routing';
import { UNDOABLES } from '@/mock/undoables';
import { useAppStore } from '@/store/app-store';
import { brandBlue, darkChat, fontFamily, fontSize, radius, shadow, spacing , sysColor } from '@/theme/theme';

const GLASS_AVAILABLE = Platform.OS === 'ios' && isGlassEffectAPIAvailable();

/** First-frame stand-in for the prompt mast's height, before onLayout
 * measures it: one line of 16/22 type plus its 14px padding. Only used for
 * the occluder plate and the scroll-index line, both of which re-derive from
 * the real measurement a frame later. */
const MAST_MIN_H = 50;

/** THE TEXT COLUMN (2026-07-24 "전광판에 나오는 거랑 똑같은 데서 시작"):
 * every sentence on this screen — the mast's own words, the gray index lines,
 * the replies, the NEW TASK marker — starts this far in from the scroll's
 * edge padding. Set by the agent reply's own geometry (face chip 26 + gap 8),
 * because that face can't be shoved to the screen edge; the mast's padding
 * matches it. Grew 30 -> 34 when the face did (2026-07-24 "페이스부분들 더
 * 약간 크게하고 필요하면 글씨들 더 오른쪽으로"). Mirrors message-bubble.tsx. */
const TEXT_COL = 34;

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
    sendDraft,
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
  // the pinned prompt mast's measured height — the console stacks under
  // it, and the scroll clears both
  const [mastH, setMastH] = useState(0);
  // console fold: expanded = full log floating up top (chat slides
  // behind); folded = a small circle docked at the right, above the
  // composer. Seeded threads arrive folded; folding/unfolding reflows
  // the chat naturally (LayoutAnimation in the console's toggle).
  const [consoleFolded, setConsoleFolded] = useState(true);

  // BACKSTAGE FLIP retired 2026-07-24 ("티비 기능자체도 다 삭제해도
  // 플립하면 나오는것들"): the analog-TV mark, the flip-side crew graph it
  // opened, and the demo-only reroute beat that drove it are all gone.
  useEffect(() => {
    // fresh runs open loud, seeded histories arrive quiet
    setConsoleFolded(!thinkingHere);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effId]);
  useEffect(() => {
    if (thinkingHere && !thinkingHere.done) setConsoleFolded(false);
  }, [thinkingHere]);
  // ...and it FOLDS ITSELF once the run lands (2026-07-24 "핑퐁이 잘 말이
  // 되게"): while working, the console is the story; the moment it says Done
  // the answer below it is, so the log shrinks to its dock instead of
  // holding the top of the screen. A short beat lets the ✓ Done be read
  // first. Any manual fold/unfold after this still wins — this only fires
  // on the done edge.
  useEffect(() => {
    if (!thinkingHere?.done) return;
    const t = setTimeout(() => setConsoleFolded(true), 1400);
    return () => clearTimeout(t);
  }, [thinkingHere?.done, thinkingHere?.threadId]);

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
  // where the floating console sits: under the prompt mast when one is
  // pinned (2026-07-24 "크루 이름이랑 밑에 콘솔사이에"), else the
  // collapsed top position
  // PROMPT MAST (2026-07-24 "내가 프롬프트 친 모든것은 상단에 걸쳐줘"):
  // every ask in the CURRENT task, hoisted out of the scroll and pinned
  // under the crew pill. Sliced from the last chop so a new task gets a
  // clean mast instead of inheriting the previous task's asks.
  const currentTaskFrom = (() => {
    const msgs = thread?.messages ?? [];
    let start = 0;
    msgs.forEach((m, i) => {
      if (m.taskDivider) start = i;
    });
    return start;
  })();
  const currentTaskPrompts = (thread?.messages ?? [])
    .slice(currentTaskFrom)
    .filter((m) => m.from === 'user' && !!m.text)
    .map((m) => ({ id: m.id, text: m.text as string }));

  // THE MAST IS AN INDEX (2026-07-24 "그게 인덱스라서 스크롤 내릴때... 하나씩만"):
  // it shows ONE ask — whichever one you're currently reading the answer to —
  // and swaps as you scroll, like a sticky section header. So the small gray
  // prompt lines came BACK into the thread (they're the anchors this indexes),
  // and the mast stopped stacking every ask at once.
  const [activePromptId, setActivePromptId] = useState<string | null>(null);
  // measured y of each in-thread prompt line, keyed by message id
  const promptTops = useRef<Record<string, number>>({});
  const activePrompt =
    currentTaskPrompts.find((p) => p.id === activePromptId) ??
    currentTaskPrompts[currentTaskPrompts.length - 1];

  // Pick the ask whose ANSWER fills the screen right now: the last prompt
  // line that has scrolled up past the pinned band. Cheap comparison against
  // measured offsets, so it runs fine on every scroll frame.
  //
  // While the thread still FITS on screen there is nothing to index, so the
  // mast shows the newest ask (2026-07-24 "첫화면에서는 스크롤이 안넘어가기
  // 때문에 가장 마지막에 프롬프트 친게 나오면돼"). Tracking only takes over
  // once the content actually overflows — otherwise a short thread would pin
  // whichever ask happened to sit above the fold.
  const onScrollIndex = (y: number, viewH: number, contentH: number) => {
    // Nothing to index, or parked AT THE BOTTOM: the mast shows the newest
    // ask (2026-07-24 "항상 가장최근에 쓴 프롬프트가 그대로 오는거야"). The
    // bottom case is the bug fix — sending a message calls scrollToEnd, whose
    // scroll event then overwrote the "show newest" reset with whatever ask
    // happened to sit above the fold, so a fresh prompt never took the mast.
    const atBottom = y + viewH >= contentH - 24;
    if (contentH <= viewH + 4 || atBottom) {
      setActivePromptId(null); // null = "just show the newest"
      return;
    }
    const line = y + mastTop + (mastH || MAST_MIN_H);
    let next: string | null = null;
    currentTaskPrompts.forEach((p) => {
      const top = promptTops.current[p.id];
      if (top != null && top <= line) next = p.id;
    });
    // above the first prompt, hold the first one rather than blanking
    const resolved = next ?? currentTaskPrompts[0]?.id ?? null;
    if (resolved !== activePromptId) setActivePromptId(resolved);
  };

  // A FRESH ask takes the mast and HOLDS it (2026-07-24 "최신 프롬프트를 치면
  // 그게 계속 떠잇어야해"): sending scrolls the thread to the bottom, and the
  // index would otherwise keep pointing at whatever you had scrolled to.
  // Clearing to null hands the mast back to "newest", and normal scroll
  // tracking resumes the moment you scroll again.
  const newestPromptId = currentTaskPrompts[currentTaskPrompts.length - 1]?.id;
  useEffect(() => {
    setActivePromptId(null);
  }, [newestPromptId]);
  // a different thread's offsets must not survive into this one — they'd
  // point the index at rows that no longer exist
  useEffect(() => {
    promptTops.current = {};
    setActivePromptId(null);
  }, [effId]);

  const mastTop = spacing.sm;
  // only RESERVE the band while a mast is actually up: a stale mastH
  // from a previous thread would leave the console floating in a gap
  const mastVisible = currentTaskPrompts.length > 0 && !calOpen;
  const mastBand = mastVisible && mastH ? mastH + spacing.sm : 0;
  const consoleTop = mastTop + mastBand;
  const consoleDone = thinkingHere ? thinkingHere.done : bootLog.length > 0;
  const consoleDocked = consoleDone && consoleFolded;
  // ONE source for whichever log the console is showing (2026-07-24): a live
  // run if there is one, else this thread's boot lines. Both the mast's
  // folded dock and its expanded panel read from this, so the two states can
  // never disagree about what they're narrating.
  const consoleSource: {
    threadId: string;
    lines: string[];
    done: boolean;
    failed?: boolean;
  } | null = thinkingHere
    ? {
        threadId: thinkingHere.threadId,
        lines: thinkingHere.lines,
        done: thinkingHere.done,
        failed: thinkingHere.failed,
      }
    : bootLog.length > 0
      ? { threadId: effId, lines: bootLog, done: true }
      : null;

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
    // the flip demo's "vegetarian" reroute branch retired with backstage
    // (2026-07-24) — a message like that is now just an ordinary message
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
      {/* the whole chat. Was the flippable FRONT of a card until the
          backstage flip retired (2026-07-24); now a plain wrapper. */}
      <Animated.View style={{ flex: 1 }}>
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
              {/* gated like every other glass surface (2026-07-24): the
                  API is iOS 26+, and an ungated GlassView leaves this
                  circle with no material at all on older builds */}
              {GLASS_AVAILABLE ? (
                <GlassView
                  glassEffectStyle="clear"
                  colorScheme="light"
                  style={[StyleSheet.absoluteFill, { borderRadius: 999 }]}
                />
              ) : (
                <FrostedGlassFill flat radius={20} tint="rgba(255,255,255,0.5)" />
              )}
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
          {/* THE MASK behind the pinned band (2026-07-24 "여기사이 글씨가
              보이는데 안보이게"): the mast floats with 8px of air above it
              and 14px down each side, and the thread scrolls THROUGH those
              gaps — so sentences were sliding past in the seam between the
              header and the mast. A desk-blue plate spanning the full width
              swallows them. It reads as nothing (same color as the field);
              it's purely an occluder, so it sits just under the mast. */}
          {currentTaskPrompts.length && !calOpen ? (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                // covers the air above AND the seam right below the box; on
                // the very first frame mastH is still 0, so fall back to the
                // mast's own min height rather than flashing an 8px sliver
                height: mastTop + (mastH || MAST_MIN_H) + spacing.xs,
                backgroundColor: darkChat.base,
                // just under the mast (21). This plate is now the ONLY thing
                // stopping the thread showing through, since the mast's face
                // went translucent to match the crew pill (2026-07-24) — its
                // height tracks the measured mast, so it grows with the
                // console that now lives inside it.
                zIndex: 20,
              }}
            />
          ) : null}
          {/* PROMPT MAST: the current task's asks, pinned in the band
              between the crew pill and the console (2026-07-24). Hidden
              while the month view is open, like the console — a panel
              that big owns the screen. */}
          {currentTaskPrompts.length && !calOpen ? (
            <View
              style={{
                position: 'absolute',
                top: mastTop,
                left: spacing.lg,
                right: spacing.lg,
                zIndex: 21,
              }}>
              <PromptMast
                prompt={activePrompt?.text}
                // the at-rest orb in the mast's FACE slot (2026-07-24): the
                // "you typed this" counterpart to the crew face on replies.
                // 36 canvas for a ~22 visible orb — it draws itself inset,
                // so the canvas runs larger than the mark you see.
                blob={
                  !isTyping && (thread?.messages.some((m) => m.from === 'agent') ?? false) ? (
                    <ThinkingBlob size={36} />
                  ) : null
                }
                // The run console lives INSIDE the mast either way
                // (2026-07-24): folded, a small square on the ask's line;
                // expanded, the full log directly below on the text column.
                dock={
                  consoleDocked && consoleSource ? (
                    <ThinkingConsole
                      threadId={consoleSource.threadId}
                      lines={consoleSource.lines}
                      done={consoleSource.done}
                      failed={consoleSource.failed}
                      folded
                      compactDock
                      onToggleFold={() => setConsoleFolded(false)}
                    />
                  ) : null
                }
                below={
                  !consoleDocked && consoleSource ? (
                    <ThinkingConsole
                      threadId={consoleSource.threadId}
                      lines={consoleSource.lines}
                      done={consoleSource.done}
                      failed={consoleSource.failed}
                      folded={false}
                      onToggleFold={() => setConsoleFolded(true)}
                    />
                  ) : null
                }
                onLayout={(e) => setMastH(Math.ceil(e.nativeEvent.layout.height))}
              />
            </View>
          ) : null}
          {/* Both console states moved INSIDE the prompt mast (2026-07-24):
              the free-floating overlay that used to sit under the mast, and
              the folded >_ that hid in the composer's corner, are now the
              mast's `below` and `dock` slots. One white box holds the ask and
              the run that answers it. */}

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

          {/* the pinned week strip retired 2026-07-24: it sat in the FLOW
              at the top of this area while the mast and console floated
              absolutely over the same band, so all three overlapped. The
              strip now rides inside its own answer, down in the thread. */}

          {/* the calendar rail: drops below whatever already owns the top
              band (2026-07-24) — at spacing.sm it landed straight on the
              prompt mast */}
          {calRail && stripTarget != null && !calOpen ? (
            <View
              style={{
                position: 'absolute',
                top: consoleTop,
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
              // ONE thing to clear now (2026-07-24): the console lives inside
              // the mast, so the mast's own measured height already covers
              // both and there's no second surface to reserve for.
              // mastBand already carries spacing.sm of air below the box, so
              // adding spacing.md again stacked ~20px of dead space between
              // the mast and the first line ("여기사이가 여전히 거리가 멀어").
              paddingTop: mastBand ? mastTop + mastBand : spacing.lg,
              // room to scroll past the floating command pill: the
              // conversation flows BEHIND it, no wall. Raised 118 → 150
              // (2026-07-24 "지금 너무 챗 콘솔이랑 가까"): the reply's
              // at-rest blob is the last thing in the scroll, and at 118 it
              // came to rest almost touching the composer band.
              paddingBottom: 150,
            }}
            showsVerticalScrollIndicator={false}
            // drives the mast index (2026-07-24): 16/s is plenty for a label
            // swap and keeps the JS bridge quiet
            scrollEventThrottle={64}
            onScroll={(e) =>
              onScrollIndex(
                e.nativeEvent.contentOffset.y,
                e.nativeEvent.layoutMeasurement.height,
                e.nativeEvent.contentSize.height
              )
            }
            onContentSizeChange={scrollToEnd}>
            {/* unbound new chat: an EMPTY stage (2026-07-17 — starter
                chips, the routing gauge, and the crew dots all
                retired). The composer alone is the invitation; the
                console narrates the run once it starts. */}
            {thread?.messages.map((m, mi) => {
              // The turn hairline is RETIRED (2026-07-24 "여기 줄나오는거는...
              // 지우기"): it drew a rule above every new ask, which is almost
              // every turn — so it read as constant furniture rather than a
              // boundary. The gray index lines already mark where each ask
              // landed, and a genuinely NEW task still gets its NEW TASK line.
              return (
              <View
                key={m.id}
                // measured HERE, not on the Text: this wrapper is a direct
                // child of the scroll content, so its y IS the scroll offset
                // the mast index compares against
                onLayout={
                  m.from === 'user' && m.text && !m.taskDivider
                    ? (e) => {
                        promptTops.current[m.id] = e.nativeEvent.layout.y;
                      }
                    : undefined
                }>
                {/* CHOP boundary as a LINE OF TEXT (2026-07-24 "이 디자인
                    제거하고... 프롬프트의 대답글 시작에 맞춰서 줄로 텍스트로"):
                    the centered blue-milk chip flanked by two rules was
                    doing far too much for a boundary marker.
                    Now it's one quiet line, starting on the SAME left edge
                    as the replies below it (the 22px face chip + its 8px
                    gap), so the thread keeps a single text column. */}
                {m.taskDivider ? (
                  <View style={{ marginTop: spacing.xl, marginBottom: spacing.md }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        marginLeft: TEXT_COL,
                        fontFamily: fontFamily.mono,
                        fontSize: 11,
                        letterSpacing: 0.8,
                        color: darkChat.textTertiary,
                      }}>
                      {`NEW TASK  ${m.taskDivider}`}
                    </Text>
                  </View>
                ) : null}
                {/* terminalLog no longer renders here — those boot
                    lines live inside the top run console (bootLog) */}
                {/* MY ask keeps its place in the record but loses the
                    bubble (2026-07-24 "말풍선은 없애는 데 기록은 남겨야
                    해서 그냥 심플하게 텍스트로만"): a quiet plain-text line
                    marking where the ask landed.
                    It is ALSO the mast's anchor (same day, "그게 인덱스라서"):
                    onLayout records where each ask sits so the pinned mast
                    can name whichever answer you've scrolled to. The mast
                    used to hide these lines to avoid a duplicate; showing
                    one ask at a time up top is what makes both readable. */}
                {!m.taskDivider && m.from === 'user' ? (
                  m.text ? (
                    <Text
                      style={{
                        // on the shared text column, level with the mast's
                        // own words and the replies below (2026-07-24)
                        marginLeft: TEXT_COL,
                        // tight to the answer it labels (2026-07-24 "간격을
                        // 더 가깝게"): the index line and its reply are one
                        // unit, so the air belongs ABOVE the pair, not
                        // between them
                        marginTop: spacing.md,
                        marginBottom: 2,
                        fontSize: 13,
                        lineHeight: 19,
                        fontFamily: fontFamily.regular,
                        color: 'rgba(255,255,255,0.5)',
                      }}>
                      {m.text}
                    </Text>
                  ) : null
                ) : null}
                {m.taskDivider || m.from === 'user' ? null : (
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
                  >
                {m.approval ? (
                  <ApprovalCard
                    compact
                    onDark
                    approval={m.approval}
                    onApprove={(a) => resolveChatApproval(thread.id, m.id, a, true)}
                    onDeny={(a) => resolveChatApproval(thread.id, m.id, a, false)}
                  />
                ) : null}
                {/* the WEEK STRIP rides with the answer that produced it
                    (2026-07-24 "다 오버랩되고있어 콘솔이랑 달력"): it used
                    to be pinned up top, where it collided with the mast and
                    the console. In the flow it scrolls with the reply and
                    the week reads as that reply's own evidence. Tap still
                    trades up to the month view. */}
                {m.schedule && !m.schedule.booked && !calOpen ? (
                  <Pressable
                    onPress={() => setCalOpen(true)}
                    style={({ pressed }) => ({
                      marginBottom: spacing.sm,
                      opacity: pressed ? 0.85 : 1,
                    })}>
                    <WeekStrip targetDate={m.schedule.date} scanning={false} />
                  </Pressable>
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
                {/* Scribe's draft (2026-07-24): Edit hands the words to the
                    composer, so rewriting happens where typing happens */}
                {m.draft ? (
                  <DraftCard
                    draft={m.draft}
                    onSend={() => sendDraft(thread.id, m.id)}
                    onEdit={() => setDraft(m.draft!.body)}
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
                // the month panel takes the top slot outright: opening it
                // hides the mast (and the console now inside it), so there's
                // nothing left up there to stack under (2026-07-24)
                top: spacing.sm,
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
              {/* the docked run console MOVED into the prompt mast
                  (2026-07-24 "여기 흰색창 안에 오른쪽으로 숨기기") — it used
                  to hide in this composer corner, a long way from the run it
                  narrates. See the PromptMast's dock/below slots. */}
              </View>
          </View>
          </View>
          </View>
        </View>

      </KeyboardAvoidingView>
      </Animated.View>
      {/* the BACK of the card (the crew handoff graph) retired with the
          flip, 2026-07-24 */}
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
