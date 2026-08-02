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
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApprovalCard } from '@/components/ui/approval-card';
import { AskPaneCorners } from '@/components/ui/ask-pane-corners';
import { type SeedPhase } from '@/components/ui/new-chat-seed';
import { ConsoleFace } from '@/components/ui/console-face';
import { CrewSwitch } from '@/components/ui/crew-switch';
import { AquaBg } from '@/components/ui/aqua-bg';
import { ButterBg } from '@/components/ui/butter-bg';
import { CloudBg } from '@/components/ui/cloud-bg';
import { FrostedGlassFill } from '@/components/ui/frosted-glass-fill';
import { ColorPanelsBg } from '@/components/ui/color-panels-bg';
import { MeshBg } from '@/components/ui/mesh-bg';
import { MintBg } from '@/components/ui/mint-bg';
import { MonthOverlay } from '@/components/ui/month-overlay';
import { DraftCard } from '@/components/ui/draft-card';
import { MessageBubble } from '@/components/ui/message-bubble';
import { ThinkingBlob } from '@/components/ui/thinking-blob';
import { TurnLanes } from '@/components/ui/turn-lanes';
import { PRConsole } from '@/components/ui/pr-console';
import { CrewDetail } from '@/components/ui/crew-detail';
import { GlassIconButton } from '@/components/ui/glass-icon-button';
import { ResultCard } from '@/components/ui/result-card';
import { TaskReviewCard } from '@/components/ui/task-review-card';
import { ScheduleProposalCard } from '@/components/ui/schedule-proposal-card';
import { ScheduleCard } from '@/components/ui/schedule-card';
import { ThinkingConsole } from '@/components/ui/thinking-console';
import { WeekStrip } from '@/components/ui/week-strip';
import { routeCrew, type CrewKey } from '@/mock/crew-routing';
import { UNDOABLES } from '@/mock/undoables';
import { useAppStore } from '@/store/app-store';
import { brandBlue, darkChat, fontFamily, fontSize, radius, shadow, spacing , sysColor } from '@/theme/theme';

const GLASS_AVAILABLE = Platform.OS === 'ios' && isGlassEffectAPIAvailable();

/** THE TEXT COLUMN (2026-07-24 "전광판에 나오는 거랑 똑같은 데서 시작"):
 * every sentence on this screen — the mast's own words, the gray index lines,
 * the replies, the NEW TASK marker — starts this far in from the scroll's
 * edge padding. Set by the agent reply's own geometry (face chip 26 + gap 8),
 * because that face can't be shoved to the screen edge; the mast's padding
 * matches it. Grew 30 -> 34 when the face did (2026-07-24 "페이스부분들 더
 * 약간 크게하고 필요하면 글씨들 더 오른쪽으로"). Mirrors message-bubble.tsx. */
// The thread's left inset, ON TOP of the ScrollView's own spacing.lg (14)
// edge padding. 34 (mast orb slot) -> 16 -> 4 (2026-07-25 "너무 띄어서 글씨가
// 시작해 왼쪽에서"): the two were stacking into ~30px of dead margin before
// the first letter. Must stay equal to TEXT_COL in message-bubble.tsx.
// prompt-mast.tsx is unused as of 2026-07-25 but kept in the tree for its
// design history, the way acid-swoosh-bg.tsx was.
const TEXT_COL = 4;

// HEADER_BLEED retired 2026-07-27: the run panel stopped painting the header
// band when it became a floating card on the unchanged field.

/** ONE vertical rhythm for the thread (2026-07-25 "간격이 일정하지 않음"): the
 * gap above an ask and the gap below it must be equal, or turns read as
 * lopsided. Above = the reply block's own marginBottom (spacing.lg 14) PLUS the
 * ask's marginTop, so the ask contributes TURN_GAP - 14. Below = the meta row's
 * marginBottom, which is TURN_GAP outright. Change this, not the pieces. */
const TURN_GAP = 30;

/** the run panel wears the >_ key's own dark face, so opening the panel reads
 * as the same object expanding rather than a separate surface appearing. */
const RUN_PANEL_BG = '#0E1626';

/** How far the background fan's axis sits ABOVE the screen's centre. The
 * composer eats the bottom band, so the fan is lifted to centre on the FREE
 * field instead. Anything meant to read as "on the axis" (the empty-stage
 * line) has to use the same number, or it floats off the motor's centre
 * (2026-07-29 "모터 중심으로 가운데 와야해"). */
const FAN_AXIS_LIFT = 80;

/** The conversation view for one thread. Rendered two ways: pushed over
 * the tabs (iOS edge-swipe walks back) and inside the Chat tab's slider,
 * where the history drawer is the way out. The `showBack` prop retired
 * with the chevron itself (2026-07-29). */
export function ChatThreadView({
  id,
  onShowHistory,
  composeNew = false,
  initialDraft,
}: {
  id: string;
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
    approveReview,
    rejectReview,
    resolveChatApproval,
    calendarDays,
    bookScheduleSlot,
    sendDraft,
    editDraftBody,
    runScheduleOnce,
    confirmSchedule,
    runArchive,
    crewSelected,
    crewManual,
    crewBusy,
    selectCrew,
    focusCrew,
  } = useAppStore();
  const [draft, setDraft] = useState(initialDraft ?? '');
  // compose-new binds to a real thread on the first send
  const [boundId, setBoundId] = useState<string | null>(null);
  // the + popover is BACK to attachments (2026-07-27 "첨부할수있는거로
  // 떴었는데 그거 살려야하고"): it drifted into a Settings door on
  // 2026-07-24, but + beside the input is iMessage grammar for "bring
  // something into this message" — the tool list lives behind the chip
  // row's own door instead.
  const [attachOpen, setAttachOpen] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  // which review card has an approve/reject request in flight
  const [reviewBusyId, setReviewBusyId] = useState<string | null>(null);

  /** Total wall time of a run, summed from its own step durations
   * (2026-07-28): the trace is the single record of what happened, so it has
   * to answer "how long did this take" on its own. Lines with no trailing
   * duration (an open hold) contribute nothing — they are not finished. */
  const runTotal = (lines: string[]) => {
    const secs = lines.reduce((sum, line) => {
      const m = line.trim().match(/([\d.]+)\s*(ms|s)$/i);
      if (!m) return sum;
      const n = Number(m[1]);
      return sum + (m[2].toLowerCase() === 'ms' ? n / 1000 : n);
    }, 0);
    return secs > 0 ? `${secs.toFixed(1)}s` : null;
  };
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
  const { height: winH } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  /** the run panel's own scroller — parked at the bottom (newest run) */
  const runScrollRef = useRef<ScrollView>(null);

  const effId = boundId ?? id;
  // a screen that changes identity (new chat, bound thread) always
  // opens CLEAN — no inherited calendar panel (2026-07-24 "항상 새로
  // 열었을 때는 뉴 창으로")
  useEffect(() => {
    setCalOpen(false);
  }, [effId]);
  const thread = composeNew && !boundId ? undefined : getThread(effId);

  // SENDING clears the stage, not typing (2026-07-27 v2 "글쓸때까지는 다
  // 똑같고 글을 치고나면 뒷배경이 없어지는거야"): the fan and the title hold
  // steady through the whole draft — the stage empties only once the first
  // message actually lands and the screen becomes a conversation. Threads
  // opened with history start already-flat (no fade-out flash).
  const hasMessages = !!thread?.messages.length;
  const fanFade = useSharedValue(hasMessages ? 0 : 1);
  useEffect(() => {
    fanFade.value = withTiming(hasMessages ? 0 : 1, { duration: 380 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMessages]);
  const fanFadeStyle = useAnimatedStyle(() => ({ opacity: fanFade.value }));

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
  /** the reply's face — the thread's own agent, else whoever the pill
   * currently names (one source for bubbles, split panes, live runs) */
  const replyFace =
    thread?.agentId ??
    (crewSelected
      ? ({ researcher: 'scout', writer: 'quill', triage: 'pilot', orchestrator: 'muppet' } as const)[
          crewSelected
        ]
      : undefined);
  // the floating console's measured height, so the scroll's content
  // starts below it at rest but slides BEHIND it when scrolling
  // console fold: expanded = full log floating up top (chat slides
  // behind); folded = a small circle docked at the right, above the
  // composer. Seeded threads arrive folded; folding/unfolding reflows
  // the chat naturally (LayoutAnimation in the console's toggle).
  const [consoleFolded, setConsoleFolded] = useState(true);
  // the pinned RUN PANEL under the header (2026-07-25): opened by the
  // composer's >_ key, it shows the ask in small type plus the live parse /
  // execute / synthesize steps. Closed by default — the thread is the main
  // event; this is the machine's side of it, on demand.
  const [runPanelOpen, setRunPanelOpen] = useState(false);

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
  // THE SCROLL INDEX IS GONE (2026-07-25): activePromptId, promptTops and
  // onScrollIndex existed ONLY to decide which ask the pinned mast should
  // name. With the mast removed the whole mechanism is dead weight — and it
  // was the source of the contradiction Ellie flagged, since the pinned copy
  // renamed itself mid-scroll while the thread below said something else.
  // still needed: the run console attaches to the NEWEST ask only, so older
  // finished turns don't replay their steps
  const newestPromptId = currentTaskPrompts[currentTaskPrompts.length - 1]?.id;
  // the ask the run panel labels itself with — always the newest, since that
  // is the one the console is narrating
  const activeAsk = currentTaskPrompts[currentTaskPrompts.length - 1]?.text;

  // THE MAST IS GONE (2026-07-25) — nothing is pinned over the thread any
  // more, so there is no band to reserve and no measured height to track.
  // consoleTop is now just the top inset the calendar rail hangs from.
  const consoleTop = spacing.sm;
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
    /* the safe-area fill follows the RUN PANEL (2026-07-25 "버튼 누를떄는 여기도
       변화시키기"): the panel bleeds up over the header, but the notch/status
       band above it is painted by this SafeAreaView — so it stayed pale and cut
       a light stripe across the dark plate. It now switches with the panel. */
    <SafeAreaView
      style={{
        flex: 1,
        // no more full-screen repaint when the console opens (2026-07-27
        // "갑자기 색깔이 바뀌니까 이상해서"): the field keeps its own color
        // in every state — the run panel is a dark CARD on it, not a mode.
        backgroundColor: darkChat.base,
      }}
      edges={['top', 'bottom']}>
      {/* the whole chat. Was the flippable FRONT of a card until the
          backstage flip retired (2026-07-24); now a plain wrapper. */}
      <Animated.View style={{ flex: 1 }}>
      {/* blue desk: light status icons */}
      {/* v5 (2026-07-17, mosaic desk): white icons on the blue field,
          dark on the light colorways */}
      {/* dark glyphs always — the field stays pale in every state now */}
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
      ) : darkChat.background === 'desk' ? (
        // HOME'S OWN FIELD (2026-07-27 "홈탭이랑 뭔가 일관성이 좀 떨어져"):
        // chat ran hard-edged mosaic tiles (the 2026-07-17 "모자이크 큰 타일로"
        // era) while Home ran this shader, which is most of why the two screens
        // felt like different apps. Same component, same `fan` preset Home uses
        // — just the pale variant, since the thread speaks ink where Home
        // speaks white.
        // the axis LIFT (2026-07-27 "모터가 위치가 좀 애매하게 밑으로"): the
        // canvas centers the fan on itself, but the composer eats the bottom
        // band, so on-screen it read low. -80 puts the axis on the free
        // field's own center (header bottom to composer top, ~419pt on this
        // device), tuned by screenshot: gaps above and below the fan match.
        // The fade wrapper dissolves the fan into the identical flat
        // #CADAEA while a draft exists (base === the shader's colorBack,
        // so nothing shifts hue).
        <Animated.View
          style={[StyleSheet.absoluteFill, fanFadeStyle]}
          pointerEvents="none">
          <ColorPanelsBg variant="deskWashPale" preset="fan" centerYOffset={-FAN_AXIS_LIFT} />
        </Animated.View>
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
            {/* BACK on EVERY chat screen, New task included (2026-07-29
                "전부 이거여야해"): one pale glass circle, same position,
                no state where it disappears. The history-drawer variant
                below only replaces it inside the Chat tab's slider. */}
            {!onShowHistory ? (
            <GlassIconButton
              icon="chevron-back"
              clear
              size={40}
              iconSize={19}
              iconColor="#16181C"
              hitSlop={10}
              // deep-linked chats have no history: fall back to Home
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            />
            ) : (
            <GlassIconButton
              icon="list"
              clear
              size={40}
              iconSize={18}
              iconColor="#16181C"
              hitSlop={10}
              onPress={onShowHistory}
            />
            )}
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
              <GlassIconButton
                icon={contextToolIcon}
                clear
                size={40}
                iconSize={18}
                iconColor="#16181C"
                hitSlop={10}
                onPress={() => setCalOpen(true)}
              />
            ) : null}
            {/* the New chat + (2026-07-24 "항상 뉴 챗 버튼으로") — except on a
                chat that IS already new and empty (2026-07-27): there the
                button re-opens the screen you are looking at, so it reads as
                a mystery action. It returns the moment the thread exists. */}
            {/* the COMPOSE glyph, not a bare + (2026-07-27): + now means
                "attach" down in the composer, so the header's new-task
                door speaks Apple's own new-message grammar instead */}
            {!(composeNew && !thread) ? (
            <GlassIconButton
              icon="create-outline"
              clear
              size={40}
              iconSize={19}
              iconColor="#16181C"
              hitSlop={10}
              onPress={() =>
                router.replace({ pathname: '/chat/[id]', params: { id: 'new' } })
              }
            />
            ) : null}
          </Animated.View>
        ) : null}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <View style={{ flex: 1 }}>
          {/* The occluder plate went with the mast (2026-07-25): it existed
              only to swallow thread text sliding through the gaps around a
              floating pinned box. With nothing pinned, nothing to hide. */}
          {/* THE PROMPT MAST IS GONE (2026-07-25 "굉장히 헷갈리거는거같아
              체계도 없고"). It was a sticky index naming whichever answer you
              had scrolled to — a reasonable idea that produced a screen where
              the SAME ask appeared twice (once pinned, once in the thread),
              and where the pinned copy actively contradicted what was
              on-screen because it renamed itself mid-scroll. Two labels
              claiming "your prompt" with no stated relationship is the whole
              source of the confusion.
              The thread now carries its own structure instead: one TURN =
              your ask, the run steps that answered it, then the reply. A turn
              is self-explaining, so nothing needs pinning above it. */}
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
          {/* THE RUN PANEL (2026-07-25 "누르면 챗 프롬프트 친거 위로 항상
              가장위에... 화면을 켜서 보여지게하기"): a pinned readout in the
              band between the header and the first message, opened by the
              composer's >_ key. Two things, in the order she asked for them:
              the ask in small type, then what the machine is doing with it.
              It OVERLAYS the scroll (absolute, zIndex 25) so the thread slides
              beneath and the panel always shows the current run no matter how
              far down you have read. A desk-blue plate behind it stops thread
              text ghosting through the gaps. */}
          {runPanelOpen && consoleSource ? (
            <Animated.View
              entering={FadeIn.duration(180)}
              exiting={FadeOut.duration(140)}
              style={{
                position: 'absolute',
                // A CARD, NOT A MODE (2026-07-27 "갑자기 색깔이 바뀌니까
                // 이상해서"): the header-bleed era painted the whole top band
                // — and the SafeAreaView repainted the rest — so opening the
                // console flipped the entire screen dark. The panel now
                // floats as a rounded dark card just under the header, on
                // the untouched pale field, the same grammar as the month
                // overlay. It still wears the >_ key's own face.
                top: spacing.xs,
                left: spacing.md,
                right: spacing.md,
                zIndex: 25,
                borderRadius: 18,
                backgroundColor: RUN_PANEL_BG,
                paddingTop: 14,
                paddingBottom: 12,
                paddingHorizontal: spacing.lg,
                shadowColor: '#16181C',
                shadowOpacity: 0.22,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 8 },
                elevation: 12,
              }}>
              {/* A RECEIPT ROLL (2026-07-25 "해당하는 탭 열였을때 모든 프롬프트랑
                  그 과정을 다 영수증 히스토리처럼 보여줘야해서 위로 올리면 그
                  기록들이 다 똑같이 나오게해줘"): every finished run on this
                  thread, oldest at the top, then the live one last. It used to
                  show only the current run, because the store's `thinking` holds
                  one run and is overwritten on the next send — finished runs are
                  now archived per thread (see runArchive in app-store).
                  maxHeight caps it at half the screen so the panel can never
                  swallow the whole thread; inside that it scrolls. */}
              <ScrollView
                style={{ maxHeight: winH * 0.5 }}
                showsVerticalScrollIndicator={false}
                // opens parked at the BOTTOM: the newest run is what you just
                // asked about, and older ones are what you scroll up to find
                ref={runScrollRef}
                onContentSizeChange={() =>
                  runScrollRef.current?.scrollToEnd({ animated: false })
                }>
                {(runArchive[effId] ?? []).map((rec, ri) => (
                  <View key={`arch-${ri}`} style={{ marginBottom: 18 }}>
                    {rec.ask ? (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'baseline',
                          gap: 8,
                          marginBottom: 8,
                        }}>
                        <Text
                          numberOfLines={1}
                          style={{
                            flex: 1,
                            fontSize: 12,
                            lineHeight: 17,
                            fontFamily: fontFamily.regular,
                            color: 'rgba(255,255,255,0.6)',
                          }}>
                          {rec.ask}
                        </Text>
                        {/* the run's own total — the trace answers this now
                            that the step list is gone */}
                        {runTotal(rec.lines) ? (
                          <Text
                            style={{
                              fontFamily: fontFamily.mono,
                              fontSize: 11,
                              color: 'rgba(255,255,255,0.4)',
                            }}>
                            {`${rec.lines.length} steps · ${runTotal(rec.lines)}`}
                          </Text>
                        ) : null}
                      </View>
                    ) : null}
                    <ThinkingConsole
                      threadId={`${effId}-arch-${ri}`}
                      lines={rec.lines}
                      done
                      failed={rec.failed}
                      folded={false}
                      stepsOnly
                      onDark
                    />
                  </View>
                ))}
                {/* the LIVE run last — ONLY while it is still writing itself
                    (2026-07-28): finishThinking archives the run, but
                    `thinking` keeps holding it, so a completed run rendered
                    twice — once from the archive, once here. */}
                {!consoleSource.done || !thinkingHere ? (
                <View>
                  {activeAsk ? (
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 12,
                        lineHeight: 17,
                        fontFamily: fontFamily.regular,
                        // LIGHT on the dark panel: the panel took the console
                        // key's near-black face, so its own text inverts
                        color: 'rgba(255,255,255,0.6)',
                        marginBottom: 8,
                      }}>
                      {activeAsk}
                    </Text>
                  ) : null}
                  <ThinkingConsole
                    threadId={consoleSource.threadId}
                    lines={consoleSource.lines}
                    done={consoleSource.done}
                    failed={consoleSource.failed}
                    folded={false}
                    onToggleFold={() => setRunPanelOpen(false)}
                    stepsOnly
                    onDark
                  />
                </View>
                ) : null}
              </ScrollView>
            </Animated.View>
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
              // no pinned band any more (2026-07-25), so the thread just
              // starts on the normal edge inset
              // adding spacing.md again stacked ~20px of dead space between
              // the mast and the first line ("여기사이가 여전히 거리가 멀어").
              paddingTop: spacing.lg,
              // room to scroll past the floating command pill: the
              // conversation flows BEHIND it, no wall. Raised 118 → 150
              // (2026-07-24 "지금 너무 챗 콘솔이랑 가까"): the reply's
              // at-rest blob is the last thing in the scroll, and at 118 it
              // came to rest almost touching the composer band.
              paddingBottom: 150,
            }}
            showsVerticalScrollIndicator={false}
            // no onScroll handler any more (2026-07-25): it only fed the
            // pinned mast's index, which is gone
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
              // no onLayout measuring any more (2026-07-25): these offsets
              // fed the pinned mast's scroll index, which is gone
              <View key={m.id}>
                {/* CHOP boundary as a LINE OF TEXT (2026-07-24 "이 디자인
                    제거하고... 프롬프트의 대답글 시작에 맞춰서 줄로 텍스트로"):
                    the centered blue-milk chip flanked by two rules was
                    doing far too much for a boundary marker.
                    Now it's one quiet line, starting on the SAME left edge
                    as the replies below it (the 22px face chip + its 8px
                    gap), so the thread keeps a single text column. */}
                {m.taskDivider ? (
                  /* A BAND ACROSS THE SCREEN (2026-07-25 "뉴 테스크는 아예 화면을
                     가로지르는 섹션이 나와서 중간에 말하기. 근데 가로지르는
                     배경색은 배경색이랑 비슷한거 눈에 덜튀는거"): it was a
                     left-aligned mono line, which read as one more row in the
                     thread rather than a boundary between tasks. Full-bleed
                     (negative margins cancel the scroll's padding) with the text
                     CENTRED, so it visibly cuts the thread in two.
                     The fill is a hair off the field — near enough to stay quiet,
                     different enough to register as a surface. */
                  <View
                    style={{
                      marginLeft: -spacing.lg,
                      marginRight: -spacing.lg,
                      marginTop: spacing.xl,
                      marginBottom: spacing.lg,
                      paddingVertical: 11,
                      alignItems: 'center',
                      backgroundColor: 'rgba(255,255,255,0.34)',
                    }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: fontFamily.mono,
                        fontSize: 11,
                        letterSpacing: 0.8,
                        color: 'rgba(22,24,28,0.5)',
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
                {/* THE ASK OPENS A TURN (2026-07-25 rework): every ask
                    prints, no exceptions — the "hide the newest because the
                    mast shows it" rule died with the mast. It leads its turn
                    on the RIGHT at full reading size, so turn-taking is
                    legible at a glance: right = you, left = crew. The old
                    13px/50%-white treatment made your own words the faintest
                    thing on screen, which is why the thread read as a wall of
                    agent monologue with stray gray labels in it. */}
                {!m.taskDivider && m.from === 'user' && m.text ? (
                  /* YOUR ASK WEARS THE FOLDER'S WHITE (2026-07-25 "여기를 폴더
                     흰색처럼 감싸기... 레디어스 없는 사각으로"): plain text on
                     the pale mosaic left your own words indistinguishable from
                     the crew's. A white pane makes the turn's opening legible
                     at a glance. SQUARE, radius 0 — explicitly asked for, and
                     it sets the ask apart from the folder cards below, which
                     are all rounded. Full-bleed to both screen edges (negative
                     margins cancel the scroll's own padding) so it reads as a
                     band across the thread, not a floating chip. */
                  <View
                    style={{
                      // RIGHT-ALIGNED, SHRINK TO FIT (2026-07-25 "얘를 이렇게
                      // 전체다 쓰지말고 오른쪽 정렬로 쓰기", per the Claude
                      // reference): the pane ran the full width, so your ask and
                      // the crew's reply were the same shape and the thread had
                      // no sense of turn-taking. alignSelf flex-end + maxWidth
                      // makes it take only the width its text needs and sit on
                      // the right — the oldest chat convention there is — while
                      // replies stay full-width on the left.
                      alignSelf: 'flex-end',
                      maxWidth: '84%',
                      marginRight: TEXT_COL,
                      // 30 -> 16 (2026-07-25 "두번째 프롬프트가 너무 멀리나와서
                      // 간격이 일정하지 않음"): the reply block above already
                      // pays marginBottom spacing.lg (14), so a 30 top margin
                      // here STACKED into a 44px gap above every ask while the
                      // gap below one was only 18. 16 + 14 = 30 above, and the
                      // meta row's 18 below — near enough to read as one rhythm.
                      // TURN_GAP - 14: the reply block above already pays
                      // spacing.lg (14), so this makes the total gap TURN_GAP.
                      // Before this it was a flat 30, stacking to 44 above an
                      // ask while below one was only 18.
                      marginTop: mi === 0 ? 8 : TURN_GAP - 14,
                      marginBottom: 16,
                      // 14, not 30 (2026-07-25 "글씨 시작이 더 앞에서 시작해야해
                      // 왜 떨어져서 나오지"): a previous pass padded to 30 to
                      // line the ask's text up with the REPLY's text, which
                      // sits past the crew face chip. But the ask has no face,
                      // so matching that column just pushed your own words
                      // needlessly inward. The pane's own left edge is the
                      // reference now — the reply's face is what hangs out
                      // further left, which is the point of a speaker mark.
                      paddingLeft: 14,
                      paddingRight: 14,
                      paddingVertical: 10,
                      // HOME'S FOLDER GEOMETRY (2026-07-27): radius 16, the
                      // board's own corner, and the frosted material below
                      // instead of a flat white fill. The square (radius 0)
                      // pane and its checker CORNER BLOCKS both went — they
                      // were a vocabulary chat had invented for itself, and
                      // they are most of what made this screen read as a
                      // different app. AskPaneCorners is left in the tree
                      // unused, like prompt-mast.tsx.
                      borderRadius: 16,
                      overflow: 'hidden',
                    }}>
                    <FrostedGlassFill flat radius={16} tint="rgba(255,255,255,0.78)" />
                    <Text
                      style={{
                        // matches the reply body (2026-07-25): your words and
                        // the crew's are the same register, one reading size
                        fontSize: 17.5,
                        lineHeight: 25,
                        fontFamily: fontFamily.regular,
                        color: darkChat.text,
                      }}>
                      {m.text}
                    </Text>
                  </View>
                ) : null}
                {/* META ROW, OUTSIDE the pane (2026-07-25 "이 안에 포함시키지
                    말고 밖에 작게 보여주기"): edit + copy for YOUR ask only — a
                    crew reply is not yours to edit. It sat inside the white pane
                    first, which made the pane taller and put chrome in a reading
                    surface. Out here it hangs under the pane as quiet meta, and
                    the pane goes back to holding nothing but the sentence. */}
                {!m.taskDivider && m.from === 'user' && m.text ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: 13,
                      // hugs the pane's own right edge, which is now flush with
                      // TEXT_COL since the pane right-aligned (2026-07-25)
                      marginRight: TEXT_COL + 2,
                      marginTop: -10,
                      // matches the gap ABOVE an ask, so a turn sits centred in
                      // its own air rather than crowded on one side
                      marginBottom: TURN_GAP,
                    }}>
                    {/* NO timestamp yet: ChatMessage has no time field (see
                        src/mock/chat.ts) and inventing one would print a fake.
                        When messages carry a real `at`, it goes in this slot. */}
                    <Pressable
                      hitSlop={10}
                      onPress={() => setDraft(m.text ?? '')}
                      style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
                      {/* EDIT reloads the ask into the composer rather than
                          mutating history — the thread is a record, and an
                          in-place rewrite would erase what the crew answered. */}
                      <Ionicons name="pencil-outline" size={13} color="rgba(22,24,28,0.4)" />
                    </Pressable>
                    <Pressable
                      hitSlop={10}
                      onPress={() => Alert.alert('Copied', m.text ?? '')}
                      style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
                      {/* COPY is a stub Alert: expo-clipboard is not installed,
                          and adding a native dep for one icon forces a rebuild.
                          Swap for Clipboard.setStringAsync when one lands. */}
                      <Ionicons name="copy-outline" size={13} color="rgba(22,24,28,0.4)" />
                    </Pressable>
                  </View>
                ) : null}
                {/* NO run readout in the thread any more (2026-07-25 "프롬프트
                    밑에서 3 steps 이런건 안나와도 될거같아"): the steps used to
                    hang under the newest ask, first as a live log and then as a
                    "N steps" summary row. Both are gone — the composer's >_ key
                    opens the pinned run panel instead, and that panel scrolls
                    back through EVERY prompt's run, which the per-row version
                    could never do (it only ever knew the newest). One place to
                    look for the machine's side of things. */}
                {m.taskDivider || m.from === 'user' ? null : (() => {
                const cards = (
                <>
                {m.approval ? (
                  <ApprovalCard
                    compact
                    onDark
                    approval={m.approval}
                    onApprove={(a) => resolveChatApproval(thread.id, m.id, a, true)}
                    onDeny={(a) => resolveChatApproval(thread.id, m.id, a, false)}
                  />
                ) : null}
                {/* a coding task's REVIEW resolves right here (2026-07-28):
                    real diff, changed files, typecheck, approve/reject —
                    the approvals-in-chat rule applies to code too */}
                {m.review ? (
                  <TaskReviewCard
                    review={m.review}
                    outcome={m.reviewOutcome}
                    busy={reviewBusyId === m.id}
                    onApprove={() => {
                      setReviewBusyId(m.id);
                      approveReview(thread.id, m.id, m.review!.taskId).finally(() =>
                        setReviewBusyId(null)
                      );
                    }}
                    onReject={() => {
                      setReviewBusyId(m.id);
                      rejectReview(thread.id, m.id, m.review!.taskId).finally(() =>
                        setReviewBusyId(null)
                      );
                    }}
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
                    onEditBody={(body) => editDraftBody(thread.id, m.id, body)}
                  />
                ) : null}
                {/* PIPELINE CARD RETIRED from the thread (2026-07-28 "셋이 다
                    다른 얘기를 하고 있어요"): the run panel's trace is the
                    single record of what happened. A static step list beside
                    it duplicated the same run and drifted out of sync with
                    it. The one thing the list carried that the trace does not
                    — the human approval gate — is now the approval card
                    itself, which is a real button rather than a status row. */}
                {m.result ? <ResultCard result={m.result} /> : null}
                {/* the rest of the crew, folded (2026-07-29): the owner's
                    answer is above; this opens to show who else worked and
                    what they did, attributed by face */}
                {m.crewNotes ? <CrewDetail notes={m.crewNotes} /> : null}
                {/* suggestion chips retired (2026-07-24 "앞에
                    프롬프트 나오는 것도 지워" — the composer alone
                    invites; behavior is freeform now) */}
                </>
                );
                // BRANCH LANES (2026-08-01, the Figma G-storyboard): a
                // reply that carries lanes IS the split loop — no prose
                // bubble, no cards; the lanes subsume the schedule UI
                // and fold to a receipt once booked.
                if (m.lanes) {
                  return (
                    <TurnLanes
                      lanes={m.lanes}
                      booked={m.schedule?.booked || undefined}
                      title={m.schedule?.title || thread.title || 'Task'}
                      onBook={(slot) => bookScheduleSlot(thread.id, m.id, slot)}
                      onDraft={(seed) => setDraft(seed)}
                      onChip={(text) => setDraft(text)}
                    />
                  );
                }
                // the RESEARCH│TASK SplitReply retired 2026-08-01 ("이
                // 구조는 이제 완전히 지워도 돼"): lanes carry the new
                // grammar, everything else keeps the classic bubble
                return (
                  <MessageBubble
                    from={m.from}
                    text={m.text}
                    proactive={m.proactive}
                    caption={m.caption}
                    agentId={replyFace}>
                    {cards}
                  </MessageBubble>
                );
                })()}
              </View>
              );
            })}
            {/* THINKING = the metaball blob (2026-08-01 "움직이는 버블
                그거 사용해줘"): while a run writes itself the only
                in-flow presence is the crew's own churning bead — the
                step trace stays behind the >_ key. */}
            {thinkingHere && !thinkingHere.done ? (
              <View style={{ alignSelf: 'flex-start', marginTop: 6, marginLeft: 2 }}>
                <ThinkingBlob size={34} lively />
              </View>
            ) : null}
          </ScrollView>

          {/* THE PLACEHOLDER MOVED TO THE STAGE (2026-07-27 "화면 중간에
              이전에 한 스타일로"): same one-instruction rule as before, the
              other way around — on an empty chat the INVITATION sits mid
              screen over the fan's upper wing, and the input runs bare. It
              fades with the fan the moment typing starts (shared fanFade),
              and threads with content get the in-field placeholder back. */}
          {!thread?.messages.length ? (
            <Animated.View
              pointerEvents="none"
              exiting={FadeOut.duration(380)}
              style={[
                StyleSheet.absoluteFill,
                // ON THE FAN'S AXIS (2026-07-29 "모터 중심으로 가운데"):
                // screen-centre put the line below the motor, because the
                // fan itself is lifted by FAN_AXIS_LIFT. Same lift here
                // keeps the two locked together.
                {
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingBottom: FAN_AXIS_LIFT * 2,
                },
              ]}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: fontFamily.regular,
                  color: 'rgba(22,24,28,0.45)',
                }}>
                Your crew is standing by.
              </Text>
            </Animated.View>
          ) : null}

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
              {/* FROSTED, not a blue slab (2026-07-27): on 2026-07-25 this band
                  took Home's solid #4E83B8 to separate itself from the pale
                  field. It did separate — but a saturated block at the bottom of
                  an otherwise soft screen was the loudest thing on it, and Home's
                  own ask bar is glass, not a colour field. Same frosted material
                  as the board's sections; the chips and the >_ key supply the
                  contrast instead. */}
              <FrostedGlassFill flat radius={16} tint="rgba(255,255,255,0.42)" />
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
                    // icon-only square (2026-07-27): the labeled "Add more"
                    // chip clipped mid-word at the screen edge. Now that the
                    // composer's + means ATTACH again, this square is the one
                    // door to the full tool list — ellipsis, not another +,
                    // so the two never read as the same action.
                    { icon: 'ellipsis-horizontal', label: '', action: 'settings' },
                  ] as const
                ).map((r) => (
                  <Pressable
                    key={r.action}
                    onPress={() => {
                      // TOGGLE (2026-07-25 "버튼 클릭가능하고 다시 누르면 풀리기
                      // 가능하게 해줘"): tapping a tool selects it, tapping the
                      // same one again clears the selection. Previously every
                      // chip just raised "Coming soon", so nothing could be
                      // picked. "Add more" is not a tool — it still navigates.
                      if (r.action === 'settings') router.push('/settings');
                      else setToolPinned((cur) => (cur === r.action ? null : r.action));
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
                      // SECONDARY WEIGHT, kept (2026-07-25 "같은 무게가
                      // 아니어야한다는거야. 보조느낌"): the chips must read as the
                      // assisting row, never matching the input's own white.
                      // The band under them went from solid blue to frosted glass
                      // on 2026-07-27, so a bare white veil no longer had
                      // anything to sit on — these carry a faint ink outline for
                      // their edge now, with a light fill for the body.
                      // SELECTED = the >_ key's own dark face (2026-07-25
                      // "클릭햇을때배경이 이거랑같게 해주기"), which also ties a
                      // picked tool to the console key a row below it.
                      borderWidth: 1,
                      borderColor: 'rgba(22,24,28,0.14)',
                      backgroundColor:
                        toolPinned === r.action ? RUN_PANEL_BG : 'rgba(255,255,255,0.5)',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      paddingHorizontal: r.label ? 10 : 0,
                      opacity: pressed ? 0.5 : 1,
                    })}>
                    <Ionicons
                      name={r.icon}
                      size={r.label ? 13 : 15}
                      color={toolPinned === r.action ? '#FFFFFF' : 'rgba(22,24,28,0.78)'}
                    />
                    {r.label ? (
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: fontFamily.medium,
                          color:
                            toolPinned === r.action ? '#FFFFFF' : 'rgba(22,24,28,0.78)',
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
              {/* the + opens the ATTACH popover again (2026-07-27):
                  Camera / Photos / Files, restored from the 07-17 era */}
              <Pressable
                hitSlop={10}
                onPress={() => setAttachOpen((v) => !v)}
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
                onFocus={() => setAttachOpen(false)}
                // on an empty chat the mid-screen line IS the placeholder,
                // so the field stays bare; threads keep it in-field
                placeholder={thread?.messages.length ? 'What needs doing?' : ''}
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
              {/* THE RUN KEY, OUTSIDE the input (2026-07-25 "바깥쪽오른쪽으로
                  챗콘솔을 줄이고 저 자리를 만드는거야"): a sibling of the white
                  surface, not a control inside it — the input is flex:1, so
                  this key SHORTENS it and takes the freed slot on the right.
                  It belongs to the machine, not to what you are typing, so it
                  keeps its own dark face out on the desk. Tapping opens the
                  pinned run panel under the header.
                  This is where it lived before 2026-07-24, when it was moved
                  into the mast and then into the thread. */}
              {consoleSource ? (
                <Pressable
                  hitSlop={8}
                  onPress={() => setRunPanelOpen((v) => !v)}
                  style={({ pressed }) => ({
                    width: 48,
                    // FIXED SQUARE (2026-08-01 "줄이 길어져도 사각으로"): the
                    // key must not stretch with a multiline input — it pins
                    // to the row's bottom, beside the send arrow
                    height: 48,
                    alignSelf: 'flex-end',
                    borderRadius: 13,
                    backgroundColor: runPanelOpen ? '#1B2942' : '#0E1626',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.8 : 1,
                  })}>
                  <ConsoleFace
                    size={13}
                    color={consoleSource.failed ? sysColor.degraded : '#7ED9A0'}
                  />
                </Pressable>
              ) : null}
              </View>
          </View>
          </View>
          </View>

          {/* Attachment popover (+ button): Camera / Photos / Files —
              restored 2026-07-27; the frosted card sits just above the
              composer, anchored to the + that opened it */}
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
                  // clears the taller two-row composer (chips + input)
                  bottom: 122,
                  zIndex: 21,
                  minWidth: 180,
                  shadowColor: '#16181C',
                  shadowOpacity: 0.16,
                  shadowRadius: 18,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 10,
                  paddingVertical: spacing.xs,
                }}>
                {/* the folder cards' glass skin, flat — a popover is a
                    card, not a folder */}
                <FrostedGlassFill flat radius={16} tint="rgba(255,255,255,0.85)" />
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
                    <Ionicons name={item.icon} size={18} color="rgba(22,24,28,0.65)" />
                    <Text
                      style={{
                        fontSize: fontSize.body,
                        fontFamily: fontFamily.regular,
                        color: '#16181C',
                      }}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </Animated.View>
            </>
          ) : null}
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
