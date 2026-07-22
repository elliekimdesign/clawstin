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
import { initialApprovals } from '@/mock/approvals';
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
import { initialSchedules, Schedule } from '@/mock/schedules';
import { initialServices, ServiceStatus } from '@/mock/services';
import { initialThreads, Thread } from '@/mock/threads';

/**
 * One light store shared across all tabs so the demo feels connected:
 * approve in a chat thread -> permission flips in Access -> entry shows in Activity.
 * Chat is now multi-thread: a list of conversations, each with its own messages.
 */

// seeded from the clock: a Fast Refresh re-runs this module and reset
// the old `= 100` counter while state kept its ids — new items then
// reused taken ids ("two children with the same key" in dev)
let counter = Date.now() % 1_000_000_000;
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
export const TOOL_ACTION_PHRASE: Record<string, string> = {
  calendar: 'Check my calendar for today',
  contacts: 'Look up a contact',
  gmail: 'Check if there are any urgent emails from today',
  'google-home': 'Check the status of my smart home devices',
  github: 'Any pending PRs on GitHub?',
  files: 'Find a recent file',
  health: 'Check my sleep score from last night',
};

/** Follow-up chips / free-form undo asks resolve as quick scripted runs.
 * Two use cases only now: A's dinner booking, B's PR-review block. */
const EDGE_FOLLOWUPS: {
  re: RegExp;
  tool: 'calendar' | 'github';
  lines: string[];
  text: string;
  /** optional follow-up chips (e.g. the ambiguous-undo disambiguation) */
  suggestions?: string[];
}[] = [
  // Conversational undo: the recipient is the original executor and the
  // reply lands in the original thread, so "executed -> undone" reads as
  // one story. The thinking lines double as the audit trail. Specific
  // matches first; the bare "undo" fallback asks back with chips.
  {
    re: /(undo|revert)[\s\S]*(dinner|jenna|reservation)|(dinner|jenna|reservation)[\s\S]*(undo|revert)/i,
    tool: 'calendar',
    lines: ['undo requested  dinner with Jenna', 'execute  calendar.event.delete  0.4s'],
    text: 'Undone. The dinner reservation is cancelled and Jenna was notified.',
  },
  {
    re: /(undo|revert)[\s\S]*(pr|review|auth-service)|(pr|review|auth-service)[\s\S]*(undo|revert)/i,
    tool: 'calendar',
    lines: ['undo requested  PR review block', 'execute  calendar.event.delete  0.4s'],
    // reversibility honesty: the block reverts, the sent heads-up
    // does not, and the crew says so in the receipt
    text: "Reverted. Tomorrow 10:00–10:30 is open again; the review is still waiting whenever you want it. Priya's heads-up already went out, so she may still expect it.",
  },
  {
    re: /undo|revert/i,
    tool: 'calendar',
    lines: ['undo requested  no target named', 'route  matching recent undoable actions'],
    text: 'Which one? These are still inside their undo window:',
    suggestions: ['Undo: dinner with Jenna', 'Undo: PR review block'],
  },
];

export type RunningTask = { id: string; label: string };
export type GatewayStatus = 'online' | 'unstable' | 'offline';

type Store = {
  // Connection (MVP: local toggle — onboarding vs state board)
  connected: boolean;
  setConnected: (v: boolean) => void;

  // Activity's >_ terminal takeover — global so the tab bar can go dark too
  consoleLens: boolean;
  setConsoleLens: (v: boolean) => void;

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
  focusCrew: (key: CrewKey | null) => void;
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

  /** cross-tab drill-down: the Logs screen pins this as a removable chip */
  logsFilter: { kind: 'source' | 'rule'; value: string } | null;
  setLogsFilter: (f: { kind: 'source' | 'rule'; value: string } | null) => void;

  // Schedules (time-based autonomy; lives in AUTOPILOT next to rules)
  schedules: Schedule[];
  /** the proposal card's test run: appends a mock result to the SAME thread */
  runScheduleOnce: (threadId: string, messageId: string) => void;
  /** stamps the card ✓ Scheduled and registers the schedule in AUTOPILOT */
  confirmSchedule: (threadId: string, messageId: string) => void;
  /** register a routine directly (e.g. accepting a pattern suggestion) */
  addRoutine: (sch: Omit<Schedule, 'id'>) => void;
  /** YOUR TURN quick answer: sends the choice into the dinner thread and
   * lets the confirmation arrive there (the button press IS the answer) */
  confirmDinner: (slot: string) => void;
  /** YOUR TURN decline: resolves the dinner ask in place — the thread
   * still records both sides, but the user is not dragged into chat */
  skipDinner: () => void;

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
  const [consoleLens, setConsoleLens] = useState(false);
  const [approvals, setApprovals] = useState<Approval[]>(initialApprovals);
  const [activity, setActivity] = useState<ActivityItem[]>(initialActivity);
  const [running] = useState<RunningTask[]>([{ id: 'run1', label: 'Checking your calendar' }]);
  const [services, setServices] = useState<ServiceStatus[]>(initialServices);
  const [background, setBackground] = useState<BackgroundTask[]>(initialBackground);
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
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);
  const [logsFilter, setLogsFilter] = useState<{ kind: 'source' | 'rule'; value: string } | null>(
    null
  );
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
  const focusCrew = useCallback((key: CrewKey | null) => {
    // null = back to the unassigned "New Chat" badge
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
      !(msg.scheduleProposal && !msg.scheduleProposal.resolved) &&
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

  // Staged nudge: Use Case B, beats 3-4. A while after the board comes
  // up, the crew's standing GitHub watch actually finds something — the
  // work-log line (beat 3) then the proactive, permission-scoped
  // approval (beat 4) land IN THE THREAD (t2) live, unprompted. The
  // floating pill only announces it and links there.
  useEffect(() => {
    if (!connected || nudgeFired.current) return;
    nudgeFired.current = true;
    const t = setTimeout(() => {
      const ap1 = initialApprovals.find((a) => a.id === 'ap1')!;
      appendToThread('t2', {
        id: nextId('c'),
        from: 'agent',
        proactive: true,
        terminalLog: ['github.pulls.list · 2 waiting'],
      });
      setApprovals((prev) => (prev.some((a) => a.id === ap1.id) ? prev : [...prev, ap1]));
      appendToThread('t2', {
        id: nextId('c'),
        from: 'agent',
        proactive: true,
        text: "auth-service #482 has been waiting on your review since 9:40 — Priya's release is behind it. You're free 2:00–2:30, block it?",
        approval: ap1,
      });
    }, 6000);
    // Nudge, OUTSIDE the app: the same PR-review ask lands as a real OS
    // notification (lock screen / banner) ~20s in — the agent's voice,
    // not system language.
    Notifications.scheduleNotificationAsync({
      content: {
        title: 'Muppet from your crew',
        body: 'auth-service #482 has been waiting since 9:40 — want me to block review time?',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 20,
      },
    });
    return () => clearTimeout(t);
  }, [connected, appendToThread]);

  const respond = useCallback(
    (threadId: string, userText: string, bornTitle?: string) => {
      // Every new ask resets the tool context; each branch below sets its own.
      setPrReveal(null);
      setActiveTool('calendar');
      // A message that BIRTHS a task announces its auto-generated name
      // as the run's first console line — the user sees the christening
      // the moment it happens, in the machine voice, where runs narrate.
      const nameLine = bornTitle ? [`task  "${bornTitle}"`] : [];

      // Follow-ups from a paused task's chips resolve as quick runs —
      // matched FIRST so "Move to 11:00" never falls into the generic
      // calendar-booking parser.
      const edge = EDGE_FOLLOWUPS.find((e) => e.re.test(userText));
      if (edge) {
        setTypingThreadId(threadId);
        setCrewBusy(true);
        setActiveTool(edge.tool);
        runThinking(threadId, [...nameLine, ...edge.lines]);
        runCrewSequence(['triage'], setCrewSelected, () => {
          setTypingThreadId(null);
          setCrewBusy(false);
          finishThinking(threadId);
          appendToThread(threadId, {
            id: nextId('c'),
            from: 'agent',
            text: edge.text,
            suggestions: edge.suggestions,
          });
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
        runThinking(threadId, [...nameLine, 
          'parse & plan  GitHub status check  0.2s',
          `execute  GitHub, ${PENDING_PRS.length} pending PRs  1.1s`,
          'synthesize  building the list  0.3s',
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
        runThinking(threadId, [...nameLine, 
          'parse & plan  Devtools + Calendar  0.2s',
          `execute  GitHub, ${PENDING_PRS.length} pending PRs  1.4s`,
          'execute  Calendar, 9-11 open tomorrow  0.8s',
          'synthesize  proposing a 2h block  0.3s',
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

      // Recurring asks become a SCHEDULE PROPOSAL, not a one-off booking —
      // matched before the calendar parser so "every day at 2pm" never
      // reads as a single event. The reply is a structured read-back
      // (name, cadence, scope) with a test run as the primary action.
      const recurring =
        /\b(every day|daily|every (morning|evening|week|weekday|weekdays|mon|tue|wed|thu|fri)|weekly|each (day|week|morning))\b/i.test(
          userText
        );
      if (recurring) {
        setTypingThreadId(threadId);
        setCrewBusy(true);
        const isInbox = /inbox|email|mail|digest/i.test(userText);
        const isReview = /review|priorit/i.test(userText);
        const name = isInbox ? 'Daily inbox digest' : isReview ? 'Weekly review' : 'Scheduled task';
        const what = isInbox
          ? 'Summarize new mail, flag urgent'
          : isReview
            ? 'Top priorities for the week'
            : 'Run it and deliver the result here';
        const time = userText.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
        const clock = time
          ? `${time[1]}:${time[2] ?? '00'} ${(time[3] ?? 'PM').toUpperCase()}`
          : '9:00 AM';
        const weekly =
          /\b(weekly|every week|each week|every mon)\b/i.test(userText);
        const cadence = weekly ? `Mon ${clock}` : `${clock} daily`;
        runThinking(threadId, [...nameLine, 
          'parse & plan  recurring intent  0.2s',
          `execute  drafting "${name}"  0.9s`,
          'synthesize  cadence + scope readback  0.3s',
        ]);
        runCrewSequence(['triage', 'orchestrator'], setCrewSelected, () => {
          setTypingThreadId(null);
          setCrewBusy(false);
          finishThinking(threadId);
          appendToThread(threadId, {
            id: nextId('c'),
            from: 'agent',
            text: 'Here is the schedule I would set up. Want to see one run before it goes live?',
            scheduleProposal: {
              id: nextId('sp'),
              name,
              cadence,
              what,
              permissionKey: isInbox ? 'gmail' : 'calendar',
              scope: 'READ',
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
                'parse & plan  schedule request  0.2s',
                'execute  Calendar, pulling events  1.1s',
                'synthesize  building the day view  0.4s',
              ]
            : [
                `parse & plan  "${parsed.title}"  0.2s`,
                'execute  Calendar, checking conflicts  1.2s',
                'synthesize  lining up open slots  0.4s',
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
              `${s.label.charAt(0).toLowerCase() + s.label.slice(1)}  ${STEP_DURATIONS[i % STEP_DURATIONS.length]}`
          )
        : null;
      // Manual override sticks; otherwise Operator holds first, then the
      // routed crew visibly takes over (Transition Hold) before the reply
      // reveals — Clawstin Core (no crew) just holds on Operator.
      if (!crewManual) {
        const crew = routeCrew(userText);
        runThinking(threadId, [
          ...nameLine,
          ...(pipelineLines ??
            (crew
              ? [
                  `parse & plan  routing to ${crew.name}  0.2s`,
                  `execute  ${crew.name} picked it up  0.9s`,
                ]
              : ['parse & plan  handled by core  0.2s'])),
        ]);
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
        runThinking(threadId, [
          ...nameLine,
          ...(pipelineLines ?? [
            `execute  sent to ${crewSelected ? ISLAND_CREWS[crewSelected].name : 'core'}  0.3s`,
          ]),
        ]);
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
      // Activity is the COMPLETE history: every ask lands in the ledger
      // the moment it exists, so the feed doubles as chat history.
      if (seeded) {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        setActivity((prev) => [
          {
            id: nextId('a'),
            time: `${hh}:${mm}`,
            day: 'today',
            ago: 'now',
            prompt: seeded,
            agentId: 'muppet',
            threadId: id,
          },
          ...prev,
        ]);
      }
      if (seeded) respond(id, seeded, seeded.slice(0, 32));
      // long-work asks go straight onto the RUNNING card, live
      if (seeded && LONG_TASK_RE.test(seeded)) {
        startRunningTask(
          seeded.length > 32 ? `${seeded.slice(0, 31)}…` : seeded,
          id
        );
      }
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

  // Continuation cues: corrections and amendments stay in the SAME
  // task ("아 7시 말고 7시반", "actually make it 6"). Everything else
  // after a finished task is a NEW task the orchestrator chops off.
  const CONTINUATION_RE =
    /말고|아니|대신|actually|instead|rather|wait|change|make it|not |cancel|undo/i;

  // Long-work cues: asks that stay RUNNING after the ack (downloads,
  // renders, standing monitors) land on the Home RUNNING card live.
  const LONG_TASK_RE =
    /download|다운로드|render|encode|scrape|crawl|backup|sync|monitor|keep an eye|계속|지켜/i;
  const startRunningTask = useCallback(
    (label: string, threadId: string) => {
      setBackground((prev) => [
        {
          id: nextId('b'),
          agentId: 'pilot',
          label,
          state: 'running' as const,
          threadId,
          age: 'now',
        },
        ...prev,
      ]);
    },
    []
  );

  const sendMessage = useCallback(
    (threadId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      // CHOP: threads never close; when the previous task in this
      // thread is done and the new message reads as a NEW topic, the
      // orchestrator drops an inline boundary + births a task object
      // (title now, ledger row now) — the scroll stays one river.
      const t = threads.find((th) => th.id === threadId);
      // a task is BORN here in two cases: the chop (new topic after a
      // done task) and the very first ask on a greeting-only thread —
      // either way the console announces the auto-generated name
      let bornTitle: string | undefined;
      if (t && !t.outcome && !t.messages.some((m) => m.from === 'user')) {
        bornTitle = trimmed.length > 32 ? `${trimmed.slice(0, 31)}…` : trimmed;
        setThreads((prev) =>
          prev.map((th) =>
            th.id === threadId ? { ...th, title: bornTitle ?? th.title } : th
          )
        );
      }
      if (t?.outcome && !CONTINUATION_RE.test(trimmed)) {
        const title = trimmed.length > 32 ? `${trimmed.slice(0, 31)}…` : trimmed;
        bornTitle = title;
        appendToThread(threadId, { id: nextId('c'), from: 'agent', taskDivider: title });
        const now = new Date();
        const AGENT_OF: Record<string, string> = {
          orchestrator: 'muppet',
          researcher: 'scout',
          writer: 'quill',
          triage: 'pilot',
        };
        setActivity((prev) => [
          {
            id: nextId('a'),
            time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
            day: 'today',
            ago: 'now',
            prompt: trimmed,
            agentId: t.crew ? AGENT_OF[t.crew] : 'muppet',
            threadId,
          },
          ...prev,
        ]);
        // the thread wakes from idle: the old task stays done, the new
        // one runs
        setThreads((prev) =>
          prev.map((th) => (th.id === threadId ? { ...th, outcome: undefined } : th))
        );
      }
      // long-work births land on the RUNNING card live (2026-07-22)
      if (bornTitle && LONG_TASK_RE.test(trimmed)) {
        startRunningTask(bornTitle, threadId);
      }
      appendToThread(threadId, { id: nextId('c'), from: 'user', text: trimmed });
      respond(threadId, trimmed, bornTitle);
    },
    [appendToThread, respond, threads]
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
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? {
                ...t,
                outcome: !approved && a.id === 'ap1' ? undefined : ('delivered' as const),
                updatedAt: 'now',
                lastPreview: approved ? `✓ ${a.receipt ?? 'Approved'}` : '✗ Rejected',
                messages: t.messages.map((m) =>
                  m.id === messageId ? { ...m, approval: stamped } : m
                ),
              }
            : t
        )
      );
      resolveApproval(a, approved);

      // Use Case B's negotiation: rejecting the first slot (ap1) makes
      // the agent RE-PROPOSE with a second approval card (ap2), rather
      // than a system failure — this is the one deliberate pushback beat.
      if (!approved && a.id === 'ap1') {
        setTypingThreadId(threadId);
        setCrewBusy(true);
        runThinking(threadId, [
          'replan  checking tomorrow morning  0.4s',
          'synthesize  10:00 before standup is open  0.3s',
        ]);
        setTimeout(() => {
          setTypingThreadId(null);
          setCrewBusy(false);
          finishThinking(threadId);
          appendToThread(threadId, {
            id: nextId('c'),
            from: 'agent',
            text: "Right, skipping today. Tomorrow 10:00 before standup — block that? I'll let Priya know it's coming.",
            approval: initialApprovals.find((ap) => ap.id === 'ap2'),
          });
        }, 1400);
        return;
      }

      // Approving the re-proposed slot (ap2) closes the loop with the
      // final wrap-up report.
      if (approved && a.id === 'ap2') {
        setTypingThreadId(threadId);
        setCrewBusy(true);
        runThinking(threadId, [
          'execute  calendar.block Thu 10:00-10:30  0.6s',
          'notify  Priya, review incoming  0.3s',
        ]);
        setTimeout(() => {
          setTypingThreadId(null);
          setCrewBusy(false);
          finishThinking(threadId);
          appendToThread(threadId, {
            id: nextId('c'),
            from: 'agent',
            text: 'Blocked 10:00–10:30 · "Review auth-service #482". Link\'s in the event.',
          });
        }, 1400);
      }
    },
    [resolveApproval, appendToThread, runThinking, finishThinking]
  );

  // The proposal card's test run: trust is calibrated BEFORE autonomy.
  // Stamps the card (↳ test run below) and appends a mock digest result
  // to the SAME thread — a preview of exactly what each delivery will be.
  const addRoutine = useCallback((sch: Omit<Schedule, 'id'>) => {
    setSchedules((prev) =>
      prev.some((x) => x.name === sch.name) ? prev : [...prev, { ...sch, id: nextId('s') }]
    );
  }, []);

  const confirmDinner = useCallback(
    (slot: string) => {
      // Use Case A: the whole pull-direction round trip, thread t1.
      const threadId = 't1';
      appendToThread(threadId, {
        id: nextId('c'),
        from: 'user',
        text: `${slot} works, book it`,
      });
      setTypingThreadId(threadId);
      setCrewBusy(true);
      runThinking(threadId, [
        `execute  Calendar, booking ${slot} with Jenna  0.8s`,
        'execute  OpenTable, confirming the table  1.1s',
      ]);
      runCrewSequence(['triage'], setCrewSelected, () => {
        setTypingThreadId(null);
        setCrewBusy(false);
        finishThinking(threadId);
        appendToThread(threadId, {
          id: nextId('c'),
          from: 'agent',
          text: `Done. Dinner with Jenna is booked for ${slot} and the invite went out.`,
        });
      });
    },
    [appendToThread, runThinking, finishThinking]
  );

  // Skip = a real answer, not a dismissal: no theater (the user chose
  // NOT to be taken anywhere), but the conversation keeps the record.
  const skipDinner = useCallback(() => {
    const threadId = 't1';
    appendToThread(threadId, {
      id: nextId('c'),
      from: 'user',
      text: 'Skip it, no dinner this time.',
    });
    appendToThread(threadId, {
      id: nextId('c'),
      from: 'agent',
      text: 'No problem, nothing booked. Say the word if plans change.',
    });
  }, [appendToThread]);

  const runScheduleOnce = useCallback(
    (threadId: string, messageId: string) => {
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? {
                ...t,
                messages: t.messages.map((m) =>
                  m.id === messageId && m.scheduleProposal
                    ? { ...m, scheduleProposal: { ...m.scheduleProposal, testRan: true } }
                    : m
                ),
              }
            : t
        )
      );
      setTypingThreadId(threadId);
      setCrewBusy(true);
      runThinking(threadId, [
        'test run  Gmail, 14 new since yesterday  1.1s',
        'summarize  3 need your attention  0.8s',
      ]);
      runCrewSequence(['triage'], setCrewSelected, () => {
        setTypingThreadId(null);
        setCrewBusy(false);
        finishThinking(threadId);
        appendToThread(threadId, {
          id: nextId('c'),
          from: 'agent',
          text: 'Test run done. Every delivery would look like this:',
          result: {
            items: [
              { label: 'Figma contract renewal', detail: 'reply by Fri' },
              { label: 'Standup moved to 10:30', detail: 'calendar' },
              { label: '12 promos ready to archive', detail: 'gmail' },
            ],
          },
        });
      });
    },
    [appendToThread, runThinking, finishThinking]
  );

  // Confirming stamps the card in place (receipt model) and registers the
  // schedule in AUTOPILOT. Its runs will accumulate in THIS thread — one
  // home per event, the same principle as undo routing. A staged "first
  // scheduled run" lands ~20s later to prove it live.
  const confirmSchedule = useCallback(
    (threadId: string, messageId: string) => {
      const thread = threads.find((t) => t.id === threadId);
      const proposal = thread?.messages.find((m) => m.id === messageId)?.scheduleProposal;
      if (!proposal || proposal.resolved) return;
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? {
                ...t,
                outcome: 'delivered' as const,
                updatedAt: 'now',
                lastPreview: `✓ Scheduled  ${proposal.cadence}`,
                title: proposal.name,
                messages: t.messages.map((m) =>
                  m.id === messageId && m.scheduleProposal
                    ? {
                        ...m,
                        scheduleProposal: { ...m.scheduleProposal, resolved: 'scheduled' as const },
                      }
                    : m
                ),
              }
            : t
        )
      );
      setSchedules((prev) => [
        ...prev,
        {
          id: nextId('s'),
          name: proposal.name,
          cadence: proposal.cadence,
          threadId,
          permissionKey: proposal.permissionKey,
          scope: proposal.scope,
          runs: proposal.testRan ? 1 : 0,
          lastRun: proposal.testRan ? { ago: 'now', ok: true } : undefined,
        },
      ]);
      setActivity((prev) => [
        {
          id: nextId('act'),
          time: 'now',
          day: 'today' as const,
          ago: 'now',
          prompt: `Scheduled: ${proposal.name}`,
          agentId: 'muppet',
          threadId,
          source: 'autopilot' as const,
          ruleKey: proposal.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          steps: [{ label: `cadence set  ${proposal.cadence}`, state: 'ok' as const }],
        },
        ...prev,
      ]);
      // Staged first run: the differentiator, live — the run lands in the
      // SAME thread (not a new session) and the Done card gets its dot.
      setTimeout(() => {
        appendToThread(threadId, {
          id: nextId('c'),
          from: 'agent',
          proactive: true,
          caption: 'SCHEDULED RUN',
          text: `${proposal.name}  first scheduled run`,
          result: {
            items: [
              { label: '2 threads need a reply', detail: 'gmail' },
              { label: 'All-hands prep due today', detail: 'calendar' },
              { label: '9 promos archived', detail: 'auto' },
            ],
          },
        });
        setThreads((prev) =>
          prev.map((t) => (t.id === threadId ? { ...t, unread: true } : t))
        );
        setSchedules((prev) =>
          prev.map((sch) =>
            sch.threadId === threadId
              ? { ...sch, runs: sch.runs + 1, lastRun: { ago: 'now', ok: true } }
              : sch
          )
        );
      }, 20000);
    },
    [threads, appendToThread]
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
      consoleLens,
      setConsoleLens,
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
      schedules,
      runScheduleOnce,
      addRoutine,
      confirmDinner,
      skipDinner,
      confirmSchedule,
      logsFilter,
      setLogsFilter,
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
      consoleLens,
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
      schedules,
      runScheduleOnce,
      confirmSchedule,
      logsFilter,
      setLogsFilter,
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
