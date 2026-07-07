import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as Notifications from 'expo-notifications';

import type { Approval } from '@/components/ui/approval-card';
import { ActivityItem, initialActivity } from '@/mock/activity';
import { initialApprovals, landedApproval } from '@/mock/approvals';
import {
  CalendarDay,
  CalendarEvent,
  initialCalendarDays,
  parseScheduleRequest,
  suggestSlots,
} from '@/mock/calendar';
import { ChatMessage, getScriptedReply } from '@/mock/chat';
import { QuickTask } from '@/mock/quick-tasks';
import { initialMemories, Memory } from '@/mock/memories';
import {
  initialPermissions,
  initialRequestLog,
  Permission,
  RequestLogItem,
} from '@/mock/permissions';
import { CrewMember, initialCrew } from '@/mock/crew';
import { CrewKey, ISLAND_CREWS, routeCrew } from '@/mock/crew-routing';
import { PENDING_PRS } from '@/mock/github';
import { initialInfra, InfraEndpoint } from '@/mock/infra';
import { BackgroundTask, initialBackground } from '@/mock/background';
import { initialServices, ServiceStatus } from '@/mock/services';
import { initialThreads, Thread } from '@/mock/threads';

/**
 * One light store shared across all tabs so the demo feels connected:
 * approve in a chat thread -> permission flips in Access -> entry shows in Activity.
 * Chat is now multi-thread: a list of conversations, each with its own messages.
 */

let counter = 100;
const nextId = (prefix: string) => `${prefix}-${counter++}`;

// Intentional "Transition Hold" — an artificial delay so the crew indicator
// reads as calm and deliberate rather than flickering, regardless of how
// fast the (fake) backend actually resolves. Middle of the 1.2-1.5s range
// the pattern calls for.
const CREW_HOLD_MS = 1300;

/**
 * Visit each crew in `stages` in order, holding CREW_HOLD_MS on each before
 * advancing, then call `onDone`. `onStage` fires the moment a stage BEGINS
 * (not after its hold) so callers can start stage-specific visuals — e.g.
 * kicking off the calendar scan right as Scheduler's hold begins, so that
 * hold time gets used for something rather than sitting idle.
 */
function runCrewSequence(
  stages: CrewKey[],
  setCrewSelected: (k: CrewKey) => void,
  onDone: () => void,
  onStage?: (k: CrewKey, index: number) => void
) {
  stages.forEach((key, i) => {
    setTimeout(() => {
      setCrewSelected(key);
      onStage?.(key, i);
    }, i * CREW_HOLD_MS);
  });
  setTimeout(onDone, stages.length * CREW_HOLD_MS);
}

/** Live backend narration for the chat's pinned Thinking Console. */
export type ThinkingState = {
  threadId: string;
  lines: string[];
  done: boolean;
  /** the run stopped on errors instead of finishing — amber footer */
  failed?: boolean;
};

// Console lines carry NO wall-clock timestamps: steps land within the same
// second, so a [HH:MM:SS] prefix adds zero information while eating 11
// chars of a narrow mobile line. Task-run lines end with a per-step
// DURATION instead ("· 1.4s") — the delta between steps is the real
// debugging information. Status notices (boot lines) get neither.
const STEP_DURATIONS = ['0.2s', '1.3s', '0.8s', '0.4s'];

/** A plausible action chip for whichever tool is actually connected. */
const TOOL_ACTION_PHRASE: Record<string, string> = {
  calendar: 'Check my calendar for today',
  contacts: 'Look up a contact',
  gmail: 'Check if there are any urgent emails from today',
  'google-home': 'Check the status of my smart home devices',
  github: 'Any pending PRs on GitHub?',
  files: 'Find a recent file',
  health: 'Check my sleep score from last night',
};

// ── Failure edge cases ──────────────────────────────────────────────────
// Two DIFFERENT kinds of failure, designed differently:
// - technical (GitHub 502): retry with backoff, STOP, preserve the
//   approval, offer keep-retrying vs drop. No alternative service exists,
//   so only two choices.
// - logical (calendar conflict): the world changed under the plan; no
//   retry can fix it, the agent REPLANS and proposes the new answer.
const GITHUB_FAIL = {
  lines: [
    'execute · github.merge chore/log-json',
    'retry 1/3 · after 10s · 502',
    'retry 2/3 · after 22s · 502',
    'retry 3/3 · after 44s · 502',
  ],
  msg: {
    caption: 'TASK PAUSED',
    text: "GitHub is returning errors, so the merge didn't go through. Your approval is saved; I'll retry and merge as soon as it's back. Checks were green, so no re-review is needed unless the branch changes.",
    suggestions: ['Keep retrying', 'Drop it'],
  },
};
const CALENDAR_CONFLICT = {
  lines: [
    'execute · calendar.move standup 10:30',
    'check · 10:30 taken 5m ago by Priya',
    'replan · 11:00 open for all 5 · 0.4s',
  ],
  msg: {
    caption: 'TASK PAUSED',
    text: "10:30 just got taken. Priya booked a pairing session there 5 minutes ago, so standup stays at 10:00 for now. Want 11:00 instead? It's open for everyone.",
    suggestions: ['Move to 11:00', 'Keep 10:00'],
  },
};
/** Follow-up chips from the paused cards resolve as quick scripted runs. */
const EDGE_FOLLOWUPS: {
  re: RegExp;
  tool: 'calendar' | 'github';
  lines: string[];
  text: string;
}[] = [
  {
    re: /keep retrying/i,
    tool: 'github',
    lines: ['execute · retry queue armed · 0.2s', 'synthesize · merge on recovery · 0.3s'],
    text: "On it. I'll keep retrying in the background and merge the moment GitHub answers.",
  },
  {
    re: /drop it/i,
    tool: 'github',
    lines: ['execute · retry queue cleared · 0.2s'],
    text: "Dropped. chore/log-json stays unmerged; say the word and I'll queue it again.",
  },
  {
    re: /move to 11/i,
    tool: 'calendar',
    lines: [
      'execute · calendar.move standup 11:00 · 0.8s',
      'synthesize · notifying 5 attendees · 0.3s',
    ],
    text: 'Done. Standup is at 11:00; all 5 attendees got the update.',
  },
  {
    re: /keep 10/i,
    tool: 'calendar',
    lines: ['execute · move request closed · 0.2s'],
    text: 'Kept. Standup stays at 10:00 and I closed the move request.',
  },
];

export type RunningTask = { id: string; label: string };
export type GatewayStatus = 'online' | 'unstable' | 'offline';

type Store = {
  // Connection (MVP: local toggle — onboarding vs state board)
  connected: boolean;
  setConnected: (v: boolean) => void;

  // Activity (autonomous action log) + pending approvals (shown on Home board)
  approvals: Approval[];
  activity: ActivityItem[];
  running: RunningTask[];
  services: ServiceStatus[];
  /** what the crew is doing in the background right now */
  background: BackgroundTask[];
  /** id of the model currently used as the default route */
  defaultModelId: string;
  /** reroute to the local model; clears the degraded cloud-model state */
  failoverToLocal: () => void;
  calendarDays: CalendarDay[];
  addCalendarEvent: (date: number, ev: Omit<CalendarEvent, 'id'>) => void;
  /** non-null while Muppet is "scanning" the calendar (drives the chat week strip) */
  calendarScan: { targetDate: number } | null;
  bookScheduleSlot: (threadId: string, messageId: string, slot: string) => void;

  // Quick-task presets (guided suggestions, no in-app "connect" step)
  startQuickTask: (threadId: string, task: QuickTask) => void;
  /** crew chip state: which crew is handling messages (auto-routed or manual) */
  crewSelected: CrewKey | null;
  crewManual: boolean;
  crewBusy: boolean;
  /** manual override; tapping the already-selected crew returns to auto */
  selectCrew: (key: CrewKey) => void;
  /** show a thread's owning crew in the pill (auto, no manual pin) */
  focusCrew: (key: CrewKey) => void;
  resolveApproval: (a: Approval, approved: boolean) => void;

  // Chat threads
  threads: Thread[];
  typingThreadId: string | null;
  /** live backend narration shown in the chat's Thinking Console */
  thinking: ThinkingState | null;
  /** set right after a booking so the chat pops the month view open on
   * that date with the fresh event highlighted */
  calendarReveal: { date: number; title: string; seq: number } | null;
  /** which tool(s) the current task is using — drives the header tool icon */
  activeTool: 'calendar' | 'github' | 'both';
  /** non-null while the PR console (GitHub data island) should be pinned */
  prReveal: { threadId: string } | null;
  getThread: (id: string) => Thread | undefined;
  /** opening a thread picks up its delivery — clears the unread dot */
  markThreadRead: (id: string) => void;
  /** create a new thread (optionally seeded with a first user message), returns its id */
  createThread: (seedText?: string) => string;
  sendMessage: (threadId: string, text: string) => void;
  resolveChatApproval: (
    threadId: string,
    messageId: string,
    a: Approval,
    approved: boolean
  ) => void;

  // Memory
  memories: Memory[];
  updateMemory: (id: string, text: string) => void;
  deleteMemory: (id: string) => void;

  // Access (permissions)
  permissions: Permission[];
  requestLog: RequestLogItem[];
  togglePermission: (key: string) => void;
  connectPermissionFromWeb: () => void;
  copiedToast: string | null;
  syncingPermission: string | null;

  // Access (gateway health — demo-toggleable, no real backend)
  gatewayStatus: GatewayStatus;
  setGatewayStatus: (s: GatewayStatus) => void;
  reconnectGateway: () => void;
  rebootGateway: () => void;

  // Access (infrastructure endpoints)
  infra: InfraEndpoint[];
  setInfraValue: (id: string, value: string) => void;

  // Crew (the Muppets — hired assistant characters)
  crew: CrewMember[];
  getCrew: (id: string) => CrewMember | undefined;
  toggleCrewActive: (id: string) => void;
  toggleCrewSkill: (crewId: string, skill: string) => void;
};

const AppContext = createContext<Store | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [approvals, setApprovals] = useState<Approval[]>(initialApprovals);
  const [activity, setActivity] = useState<ActivityItem[]>(initialActivity);
  const [running] = useState<RunningTask[]>([{ id: 'run1', label: 'Checking your calendar' }]);
  const [services, setServices] = useState<ServiceStatus[]>(initialServices);
  const [background] = useState<BackgroundTask[]>(initialBackground);
  // Which model currently serves as the default route ('oc35' = Claude).
  const [defaultModelId, setDefaultModelId] = useState('oc35');

  // Demo resolution for a degraded cloud model: reroute traffic to the
  // local model. The degraded row clears and [Default] moves to hermes.
  const failoverToLocal = useCallback(() => {
    setDefaultModelId('hermes');
    setServices((prev) =>
      prev.map((s) =>
        s.id === 'oc35' ? { ...s, state: 'operational' as const, reason: undefined } : s
      )
    );
  }, []);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>(initialCalendarDays);
  const [calendarScan, setCalendarScan] = useState<{ targetDate: number } | null>(null);
  const [crewSelected, setCrewSelected] = useState<CrewKey | null>(null);
  const [crewManual, setCrewManual] = useState(false);
  const [crewBusy, setCrewBusy] = useState(false);

  const selectCrew = useCallback(
    (key: CrewKey) => {
      if (crewManual && crewSelected === key) {
        // tap the active manual chip again → back to auto routing
        setCrewSelected(null);
        setCrewManual(false);
      } else {
        setCrewSelected(key);
        setCrewManual(true);
      }
    },
    [crewManual, crewSelected]
  );

  /** Opening a thread reflects who OWNS it: the pill shows that crew
   * (auto, not a manual pin). Used by the seeded approval ask-threads. */
  const focusCrew = useCallback((key: CrewKey) => {
    setCrewSelected(key);
    setCrewManual(false);
  }, []);
  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const [typingThreadId, setTypingThreadId] = useState<string | null>(null);
  const [thinking, setThinking] = useState<ThinkingState | null>(null);
  const [calendarReveal, setCalendarReveal] = useState<{
    date: number;
    title: string;
    seq: number;
  } | null>(null);
  const [activeTool, setActiveTool] = useState<'calendar' | 'github' | 'both'>('calendar');
  const [prReveal, setPrReveal] = useState<{ threadId: string } | null>(null);
  const thinkingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const thinkingPlan = useRef<{ threadId: string; lines: string[] } | null>(null);

  /** Stream `lines` into the Thinking Console one by one. */
  const runThinking = useCallback((threadId: string, lines: string[], stepMs = 800) => {
    thinkingTimers.current.forEach(clearTimeout);
    thinkingTimers.current = [];
    thinkingPlan.current = { threadId, lines };
    setThinking({ threadId, lines: [], done: false });
    lines.forEach((line, i) => {
      thinkingTimers.current.push(
        setTimeout(() => {
          setThinking((prev) =>
            prev && prev.threadId === threadId && !prev.done
              ? { ...prev, lines: [...prev.lines, line] }
              : prev
          );
        }, stepMs * (i + 1))
      );
    });
  }, []);

  /** The reply landed: flush any lines still queued and fold the console.
   * `failed` marks runs that STOPPED on errors (amber footer). */
  const finishThinking = useCallback((threadId: string, failed = false) => {
    thinkingTimers.current.forEach(clearTimeout);
    thinkingTimers.current = [];
    const plan = thinkingPlan.current;
    setThinking((prev) =>
      prev && prev.threadId === threadId
        ? {
            threadId,
            lines: plan?.threadId === threadId ? plan.lines : prev.lines,
            done: true,
            failed,
          }
        : prev
    );
  }, []);
  const [memories, setMemories] = useState<Memory[]>(initialMemories);
  const [permissions, setPermissions] = useState<Permission[]>(initialPermissions);
  const [requestLog, setRequestLog] = useState<RequestLogItem[]>(initialRequestLog);
  const [infra, setInfra] = useState<InfraEndpoint[]>(initialInfra);
  const [crew, setCrew] = useState<CrewMember[]>(initialCrew);

  const setPermissionEnabled = useCallback((key: string, enabled: boolean) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.key === key ? { ...p, enabled, source: enabled ? 'connected' : p.source } : p
      )
    );
  }, []);

  const logRequest = useCallback((text: string, result: 'Approved' | 'Denied') => {
    setRequestLog((prev) => [{ id: nextId('r'), text, time: 'just now', result }, ...prev]);
  }, []);

  const addActivity = useCallback(
    (
      item: Omit<ActivityItem, 'id' | 'time' | 'day' | 'ago' | 'agentId' | 'threadId'> &
        Partial<Pick<ActivityItem, 'day' | 'ago' | 'agentId' | 'threadId'>>
    ) => {
      setActivity((prev) => [
        {
          id: nextId('a'),
          time: 'just now',
          day: 'today',
          ago: '1m',
          agentId: 'muppet',
          threadId: 't1',
          ...item,
        },
        ...prev,
      ]);
    },
    []
  );

  const resolveApproval = useCallback(
    (a: Approval, approved: boolean) => {
      setApprovals((prev) => prev.filter((x) => x.id !== a.id));
      logRequest(a.title, approved ? 'Approved' : 'Denied');
      if (approved) {
        if (a.permissionKey) setPermissionEnabled(a.permissionKey, true);
        addActivity({ prompt: `Approved: ${a.title}` });
      }
    },
    [addActivity, logRequest, setPermissionEnabled]
  );

  // Staged nudge: a while after the board comes up, a background run
  // finishes and lands a NEW approval in its chat thread. In-app the
  // board itself announces it (Needs You count + desk row); outside the
  // app the OS push carries it. One-shot per session, like all theater.
  // (The staged timer itself lives below, after appendToThread exists.)
  const nudgeFired = useRef(false);

  const togglePermission = useCallback(
    (key: string) => {
      setPermissions((prev) =>
        prev.map((p) => {
          if (p.key !== key) return p;
          const enabled = !p.enabled;
          logRequest(`${p.name} access by Muppet`, enabled ? 'Approved' : 'Denied');
          return { ...p, enabled };
        })
      );
    },
    [logRequest]
  );

  // Mobile is a controller, not where OAuth happens — the ONE global CTA
  // ("Manage & Add Skills on OpenClaw Web") copies a link (toast, no real
  // clipboard dep) and simulates the live sync: the next available item
  // flips to connected once the (mock) web setup completes.
  const [copiedToast, setCopiedToast] = useState<string | null>(null);
  const [syncingPermission, setSyncingPermission] = useState<string | null>(null);

  const connectPermissionFromWeb = useCallback(() => {
    const p = permissions.find((x) => x.source === 'available');
    if (!p) return;
    setCopiedToast(p.setupUrl ?? 'https://web.openclaw.ai');
    setTimeout(() => setCopiedToast(null), 1800);
    setSyncingPermission(p.key);
    setTimeout(() => {
      setSyncingPermission(null);
      setPermissions((prev) =>
        prev.map((x) => (x.key === p.key ? { ...x, source: 'connected', enabled: true } : x))
      );
      logRequest(`${p.name} connected via Web`, 'Approved');
    }, 2500);
  }, [permissions, logRequest]);

  const setInfraValue = useCallback((id: string, value: string) => {
    setInfra((prev) => prev.map((e) => (e.id === id ? { ...e, value } : e)));
  }, []);

  // Gateway health — demo-toggleable, no real backend to fail against.
  // Reconnect/Reboot both just fake a short delay then flip back to 'online',
  // mirroring connectPermissionFromWeb's fake-latency pattern above.
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus>('online');
  const reconnectGateway = useCallback(() => {
    setTimeout(() => setGatewayStatus('online'), 1600);
  }, []);
  const rebootGateway = useCallback(() => {
    setTimeout(() => setGatewayStatus('online'), 2800);
  }, []);

  const addCalendarEvent = useCallback((date: number, ev: Omit<CalendarEvent, 'id'>) => {
    setCalendarDays((prev) =>
      prev.map((d) =>
        d.date === date ? { ...d, events: [...d.events, { id: nextId('e'), ...ev }] } : d
      )
    );
  }, []);

  const getCrew = useCallback((id: string) => crew.find((c) => c.id === id), [crew]);

  const toggleCrewActive = useCallback((id: string) => {
    setCrew((prev) => prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c)));
  }, []);

  const toggleCrewSkill = useCallback((crewId: string, skill: string) => {
    setCrew((prev) =>
      prev.map((c) =>
        c.id === crewId
          ? { ...c, skills: c.skills.map((s) => (s.label === skill ? { ...s, on: !s.on } : s)) }
          : c
      )
    );
  }, []);

  // --- Threads -------------------------------------------------------------

  const getThread = useCallback((id: string) => threads.find((t) => t.id === id), [threads]);

  const markThreadRead = useCallback((id: string) => {
    setThreads((prev) => prev.map((t) => (t.id === id && t.unread ? { ...t, unread: false } : t)));
  }, []);

  /** Append a message to a thread and refresh its list preview. Also the
   * live 3-state transition: an agent answer with nothing left pending
   * closes the thread (Done, delivered); any user follow-up revives it. */
  const appendToThread = useCallback((threadId: string, msg: ChatMessage) => {
    const settled =
      msg.from === 'agent' &&
      !msg.approval &&
      !(msg.schedule && !msg.schedule.booked) &&
      // an open question (chips) keeps the thread open too
      !msg.suggestions;
    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? {
              ...t,
              outcome: settled ? ('delivered' as const) : undefined,
              messages: [...t.messages, msg],
              lastPreview: msg.text ?? t.lastPreview,
              updatedAt: 'now',
            }
          : t
      )
    );
  }, []);

  // Staged nudge: a while after the board comes up, the crew's CI watch
  // finishes and the ask lands IN ITS CHAT THREAD (ta4) — the floating
  // pill only announces it and links there.
  useEffect(() => {
    if (!connected || nudgeFired.current) return;
    nudgeFired.current = true;
    const t = setTimeout(() => {
      setApprovals((prev) =>
        prev.some((a) => a.id === landedApproval.id) ? prev : [...prev, landedApproval]
      );
      appendToThread(landedApproval.threadId!, {
        id: nextId('c'),
        from: 'agent',
        proactive: true,
        text: 'chore/log-json passed every check. Merge it into main?',
        approval: landedApproval,
      });
    }, 6000);
    // Nudge #3, OUTSIDE the app: the Friday-dinner deadline escalation
    // lands as a real OS notification (lock screen / banner) ~20s in —
    // the agent's voice, not system language.
    Notifications.scheduleNotificationAsync({
      content: {
        title: 'Pilot from your crew',
        body: 'Ellie, Friday tables are filling up. Want me to lock one in?',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 20,
      },
    });
    return () => clearTimeout(t);
  }, [connected, appendToThread]);

  const respond = useCallback(
    (threadId: string, userText: string) => {
      // Every new ask resets the tool context; each branch below sets its own.
      setPrReveal(null);
      setActiveTool('calendar');

      // Follow-ups from a paused task's chips resolve as quick runs —
      // matched FIRST so "Move to 11:00" never falls into the generic
      // calendar-booking parser.
      const edge = EDGE_FOLLOWUPS.find((e) => e.re.test(userText));
      if (edge) {
        setTypingThreadId(threadId);
        setCrewBusy(true);
        setActiveTool(edge.tool);
        runThinking(threadId, edge.lines);
        runCrewSequence(['triage'], setCrewSelected, () => {
          setTypingThreadId(null);
          setCrewBusy(false);
          finishThinking(threadId);
          appendToThread(threadId, { id: nextId('c'), from: 'agent', text: edge.text });
        });
        return;
      }

      // GitHub asks FIRST (the phrases often contain "tomorrow"/"time",
      // which would otherwise fall into the plain calendar branch).
      const githubAsk = /\bprs?\b|pull request|github|devtools/i.test(userText);

      // Simple INFO ask (the default chip): GitHub is connected, here are
      // the pending PRs — data console only, nothing gets written.
      if (githubAsk && !/\bblock\b|review time|deep work/i.test(userText)) {
        setTypingThreadId(threadId);
        setCrewBusy(true);
        setActiveTool('github');
        const needsReview = PENDING_PRS.filter((p) => p.status === 'review').length;
        runThinking(threadId, [
          'parse & plan · GitHub status check · 0.2s',
          `execute · GitHub, ${PENDING_PRS.length} pending PRs · 1.1s`,
          'synthesize · building the list · 0.3s',
        ]);
        runCrewSequence(['triage'], setCrewSelected, () => {
          setTypingThreadId(null);
          setCrewBusy(false);
          finishThinking(threadId);
          setPrReveal({ threadId });
          appendToThread(threadId, {
            id: nextId('c'),
            from: 'agent',
            text: `GitHub is connected. ${PENDING_PRS.length} PRs are open; ${needsReview} are waiting on your review.`,
          });
        });
        return;
      }

      // Multi-tool flow: pull PRs from GitHub (data → PR console) AND
      // block review time (action → chat approval).
      if (githubAsk) {
        setTypingThreadId(threadId);
        setCrewBusy(true);
        setActiveTool('both');
        // Each line stays under ~46 mono chars so the trailing duration
        // never wraps to an orphan line on a phone-width console.
        runThinking(threadId, [
          'parse & plan · Devtools + Calendar · 0.2s',
          `execute · GitHub, ${PENDING_PRS.length} pending PRs · 1.4s`,
          'execute · Calendar, 9-11 open tomorrow · 0.8s',
          'synthesize · proposing a 2h block · 0.3s',
        ]);
        const prDate = new Date().getDate() + 1;
        const needsReview = PENDING_PRS.filter((p) => p.status === 'review').length;
        runCrewSequence(['triage', 'orchestrator'], setCrewSelected, () => {
          setTypingThreadId(null);
          setCrewBusy(false);
          finishThinking(threadId);
          setPrReveal({ threadId });
          // Calendar WRITES go through approval like everything else — the
          // agent proposes the block, the Book chip commits it.
          appendToThread(threadId, {
            id: nextId('c'),
            from: 'agent',
            text: `Found ${PENDING_PRS.length} pending PRs, ${needsReview} need your review. Tomorrow 9:00 to 11:00 AM is open. Block it for deep work?`,
            schedule: {
              date: prDate,
              title: 'Deep work: PR review',
              slots: ['9:00 AM'],
            },
          });
        });
        return;
      }

      // Schedule-sounding messages get the agentic calendar flow: the week
      // strip "scans" for a while, then a schedule card drops into the thread.
      const parsed = parseScheduleRequest(userText, new Date().getDate());
      if (parsed) {
        setTypingThreadId(threadId);
        setCrewBusy(true);
        // Narrate the backend: the full 4-stage grammar for the calendar
        // flow (the reply itself is the "resolve & prompt" stage).
        runThinking(
          threadId,
          parsed.intent === 'check'
            ? [
                'parse & plan · schedule request · 0.2s',
                'execute · Calendar, pulling events · 1.1s',
                'synthesize · building the day view · 0.4s',
              ]
            : [
                `parse & plan · "${parsed.title}" · 0.2s`,
                'execute · Calendar, checking conflicts · 1.2s',
                'synthesize · lining up open slots · 0.4s',
              ]
        );
        // Transition Hold: Operator holds first, then Orchestrator visibly
        // takes over (auto wins for the calendar flow — there's no standalone
        // Scheduler crew) — the week strip starts the moment Orchestrator's
        // hold BEGINS, so that hold time is spent "parsing the calendar"
        // rather than sitting idle.
        runCrewSequence(
          ['triage', 'orchestrator'],
          setCrewSelected,
          () => {
            setTypingThreadId(null);
            setCalendarScan(null);
            setCrewBusy(false);
            finishThinking(threadId);
            const dayEvents = calendarDays.find((d) => d.date === parsed.date)?.events ?? [];
            const dayWord = parsed.date === new Date().getDate() ? 'today' : 'tomorrow';
            if (parsed.intent === 'check') {
              // A question gets an answer, not a booking offer.
              const n = dayEvents.length;
              appendToThread(threadId, {
                id: nextId('c'),
                from: 'agent',
                text:
                  n === 0
                    ? `I checked ${dayWord}. Nothing on the calendar, the day is clear.`
                    : `I checked ${dayWord}. ${n} event${n === 1 ? '' : 's'} on the books; the evening is open.`,
                schedule: { date: parsed.date, title: '', slots: [] },
              });
            } else {
              appendToThread(threadId, {
                id: nextId('c'),
                from: 'agent',
                text: `I checked ${dayWord}. Here's how it looks. Want me to book "${parsed.title}"?`,
                schedule: {
                  date: parsed.date,
                  title: parsed.title,
                  slots: suggestSlots(dayEvents, parsed.start),
                },
              });
            }
          },
          (key) => {
            if (key === 'orchestrator') {
              setCrewManual(false);
              setCalendarScan({ targetDate: parsed.date });
            }
          }
        );
        return;
      }
      setTypingThreadId(threadId);
      setCrewBusy(true);
      // The scripted reply is deterministic — read it up front so its
      // pipeline steps can narrate through the Thinking Console. The
      // pipeline never renders as an in-chat card anymore: the console IS
      // the pipeline view, and the reply keeps only the essentials.
      const reply = getScriptedReply(userText);
      const pipelineLines = reply.pipeline
        ? reply.pipeline.steps.map(
            (s, i) =>
              `${s.label.charAt(0).toLowerCase() + s.label.slice(1)} · ${STEP_DURATIONS[i % STEP_DURATIONS.length]}`
          )
        : null;
      // Manual override sticks; otherwise Operator holds first, then the
      // routed crew visibly takes over (Transition Hold) before the reply
      // reveals — Clawstin Core (no crew) just holds on Operator.
      if (!crewManual) {
        const crew = routeCrew(userText);
        runThinking(
          threadId,
          pipelineLines ??
            (crew
              ? [
                  `parse & plan · routing to ${crew.name} · 0.2s`,
                  `execute · ${crew.name} picked it up · 0.9s`,
                ]
              : ['parse & plan · handled by core · 0.2s'])
        );
        const stages: CrewKey[] = crew ? ['triage', crew.key] : ['triage'];
        runCrewSequence(stages, setCrewSelected, () => {
          setTypingThreadId(null);
          setCrewBusy(false);
          finishThinking(threadId);
          appendToThread(threadId, {
            id: nextId('c'),
            from: 'agent',
            text: reply.text,
            approval: reply.approval,
            result: reply.result,
            crewCount: reply.crewCount,
          });
        });
      } else {
        // Manual pick already reflects the active crew — just hold once.
        runThinking(
          threadId,
          pipelineLines ?? [
            `execute · sent to ${crewSelected ? ISLAND_CREWS[crewSelected].name : 'core'} · 0.3s`,
          ]
        );
        setTimeout(() => {
          setTypingThreadId(null);
          setCrewBusy(false);
          finishThinking(threadId);
          appendToThread(threadId, {
            id: nextId('c'),
            from: 'agent',
            text: reply.text,
            approval: reply.approval,
            result: reply.result,
            crewCount: reply.crewCount,
          });
        }, CREW_HOLD_MS);
      }
    },
    [appendToThread, calendarDays, crewManual, crewSelected, runThinking, finishThinking]
  );

  const createThread = useCallback(
    (seedText?: string) => {
      const id = nextId('t');
      const seeded = seedText?.trim();

      // Agent speaks first on a genuinely blank thread — never a silent
      // empty screen waiting on the user, and never generic chatbot small
      // talk. Two branches on whether any tool is actually connected.
      let greeting: ChatMessage | null = null;
      if (!seeded) {
        const connectedTools = permissions.filter((p) => p.source === 'connected');
        const gatewayLine =
          gatewayStatus === 'online'
            ? 'Gateway connected | E2E Encrypted.'
            : `Gateway ${gatewayStatus === 'offline' ? 'offline' : 'reconnecting'}, retrying…`;
        const toolsLine = connectedTools.length
          ? `${connectedTools.length} tool${connectedTools.length === 1 ? '' : 's'} active (${connectedTools.map((p) => p.name).join(', ')}).`
          : '0 tools active.';

        // The boot lines live in the Thinking Console (unfolds on entry,
        // folds once read) — the greeting bubble no longer repeats them.
        runThinking(id, [gatewayLine, toolsLine]);
        thinkingTimers.current.push(setTimeout(() => finishThinking(id), 2 * 800 + 900));

        if (connectedTools.length === 0) {
          greeting = {
            id: nextId('c'),
            from: 'agent',
            text:
              "Hi Ellie. I couldn't find any connected tools yet. Don't worry, I can still monitor your server infrastructure or help you set up your core workflows via desktop.",
            suggestions: [
              'Run a system health check on my Mac mini',
              'Show me how to connect tools on the desktop web',
            ],
          };
        } else {
          const chipSource = connectedTools.slice(0, 3);
          greeting = {
            id: nextId('c'),
            from: 'agent',
            text: 'What can I run for you today?',
            suggestions: chipSource.map(
              (p) => TOOL_ACTION_PHRASE[p.key] ?? `Do something with ${p.name}`
            ),
          };
        }
      }

      const newThread: Thread = {
        id,
        title: seeded ? seeded.slice(0, 32) : 'New chat',
        lastPreview: seeded ?? greeting?.text ?? 'Start a conversation…',
        updatedAt: 'now',
        icon: 'chatbubble-outline',
        messages: seeded
          ? [{ id: nextId('c'), from: 'user', text: seeded }]
          : greeting
            ? [greeting]
            : [],
      };
      setThreads((prev) => [newThread, ...prev]);
      if (seeded) respond(id, seeded);
      // A fresh thread opens unassigned: the pill reads "New Chat" until
      // the first message routes it to a crew (see sendMessage).
      if (greeting) {
        setCrewSelected(null);
        setCrewManual(false);
      }
      return id;
    },
    [respond, permissions, gatewayStatus, runThinking, finishThinking]
  );

  const sendMessage = useCallback(
    (threadId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      appendToThread(threadId, { id: nextId('c'), from: 'user', text: trimmed });
      respond(threadId, trimmed);
    },
    [appendToThread, respond]
  );

  // When approving inside chat, also flip permission + remove the inline card,
  // then add a short agent follow-up to the same thread.
  // Receipt model: answering an ask never deletes the card and never
  // appends a follow-up bubble. The card stays as the permanent record
  // (dimmed) and the button row becomes a stamp — question and outcome
  // remain ONE chunk on the timeline. The task itself closes to Done.
  const resolveChatApproval = useCallback(
    (threadId: string, messageId: string, a: Approval, approved: boolean) => {
      const stamped: Approval = { ...a, resolved: approved ? 'approved' : 'denied' };
      // Two staged edge cases run AFTER approval: execution fails, the
      // approval stamp stays (never re-ask the user for the same yes),
      // and the task PAUSES instead of closing.
      const edge = approved && (a.id === 'ap1' || a.id === 'ap4');
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? {
                ...t,
                outcome: edge ? undefined : ('delivered' as const),
                updatedAt: 'now',
                lastPreview: approved ? `✓ ${a.receipt ?? 'Approved'}` : '✗ Denied',
                messages: t.messages.map((m) =>
                  m.id === messageId ? { ...m, approval: stamped } : m
                ),
              }
            : t
        )
      );
      resolveApproval(a, approved);
      if (!edge) return;
      const isGithub = a.id === 'ap4';
      const play = isGithub ? GITHUB_FAIL : CALENDAR_CONFLICT;
      const stepMs = isGithub ? 1100 : 900;
      setTypingThreadId(threadId);
      setCrewBusy(true);
      runThinking(threadId, play.lines, stepMs);
      setTimeout(
        () => {
          setTypingThreadId(null);
          setCrewBusy(false);
          // technical failure STOPS (amber); the logical one replans fine
          finishThinking(threadId, isGithub);
          appendToThread(threadId, { id: nextId('c'), from: 'agent', ...play.msg });
        },
        play.lines.length * stepMs + 700
      );
    },
    [resolveApproval, appendToThread, runThinking, finishThinking]
  );

  // When a slot pill is tapped: really add the event and stamp the card
  // booked in place. Receipt model (mirrors resolveChatApproval): the
  // card's "✓ Booked" state IS the confirmation — no follow-up bubble.
  const bookScheduleSlot = useCallback(
    (threadId: string, messageId: string, slot: string) => {
      const thread = threads.find((t) => t.id === threadId);
      const schedule = thread?.messages.find((m) => m.id === messageId)?.schedule;
      if (!schedule || schedule.booked) return;
      addCalendarEvent(schedule.date, { title: schedule.title, start: slot, color: 'brand' });
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? {
                ...t,
                outcome: 'delivered' as const,
                updatedAt: 'now',
                lastPreview: `✓ Booked at ${slot}`,
                messages: t.messages.map((m) =>
                  m.id === messageId ? { ...m, schedule: { ...schedule, booked: slot } } : m
                ),
              }
            : t
        )
      );
      // Show the receipt: pop the month view open on that day with the
      // fresh event blinking in. (Session-only, like all mock state.)
      setCalendarReveal((prev) => ({
        date: schedule.date,
        title: schedule.title,
        seq: (prev?.seq ?? 0) + 1,
      }));
    },
    [threads, addCalendarEvent]
  );

  // --- Quick-task presets ----------------------------------------------------
  // Mobile is a controller over an already-provisioned gateway — these never
  // ask the user to "connect" anything in-app, just offer to run things.

  const startQuickTask = useCallback(
    (threadId: string, task: QuickTask) => {
      appendToThread(threadId, {
        id: nextId('c'),
        from: 'agent',
        text: task.intro,
        suggestions: task.examples,
      });
    },
    [appendToThread]
  );

  // --- Memory --------------------------------------------------------------

  const updateMemory = useCallback((id: string, text: string) => {
    setMemories((prev) => prev.map((m) => (m.id === id ? { ...m, text } : m)));
  }, []);

  const deleteMemory = useCallback((id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const value = useMemo<Store>(
    () => ({
      connected,
      setConnected,
      approvals,
      activity,
      running,
      services,
      background,
      defaultModelId,
      failoverToLocal,
      calendarDays,
      addCalendarEvent,
      calendarScan,
      bookScheduleSlot,
      startQuickTask,
      crewSelected,
      crewManual,
      crewBusy,
      selectCrew,
      focusCrew,
      resolveApproval,
      threads,
      typingThreadId,
      thinking,
      calendarReveal,
      activeTool,
      prReveal,
      getThread,
      markThreadRead,
      createThread,
      sendMessage,
      resolveChatApproval,
      memories,
      updateMemory,
      deleteMemory,
      permissions,
      requestLog,
      togglePermission,
      connectPermissionFromWeb,
      copiedToast,
      syncingPermission,
      gatewayStatus,
      setGatewayStatus,
      reconnectGateway,
      rebootGateway,
      infra,
      setInfraValue,
      crew,
      getCrew,
      toggleCrewActive,
      toggleCrewSkill,
    }),
    [
      connected,
      running,
      services,
      background,
      defaultModelId,
      failoverToLocal,
      calendarDays,
      addCalendarEvent,
      calendarScan,
      bookScheduleSlot,
      startQuickTask,
      crewSelected,
      crewManual,
      crewBusy,
      selectCrew,
      focusCrew,
      approvals,
      activity,
      resolveApproval,
      threads,
      typingThreadId,
      thinking,
      calendarReveal,
      activeTool,
      prReveal,
      getThread,
      markThreadRead,
      createThread,
      sendMessage,
      resolveChatApproval,
      memories,
      updateMemory,
      deleteMemory,
      permissions,
      requestLog,
      togglePermission,
      connectPermissionFromWeb,
      copiedToast,
      syncingPermission,
      gatewayStatus,
      setGatewayStatus,
      reconnectGateway,
      rebootGateway,
      infra,
      setInfraValue,
      crew,
      getCrew,
      toggleCrewActive,
      toggleCrewSkill,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used within AppProvider');
  return ctx;
}
