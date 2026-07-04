import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
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
import { CrewKey, routeCrew } from '@/mock/crew-routing';
import { initialInfra, InfraEndpoint } from '@/mock/infra';
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

/** [HH:MM:SS] using real device time — the terminal log's timestamp style. */
const logTime = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `[${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}]`;
};

/** A plausible action chip for whichever tool is actually connected. */
const TOOL_ACTION_PHRASE: Record<string, string> = {
  calendar: 'Check my calendar for today',
  contacts: 'Look up a contact',
  gmail: 'Check if there are any urgent emails from today',
  'google-home': 'Check the status of my smart home devices',
  github: 'Deploy the latest build on GitHub',
  files: 'Find a recent file',
  health: 'Check my sleep score from last night',
};

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
  resolveApproval: (a: Approval, approved: boolean) => void;
  getApproval: (id: string) => Approval | undefined;

  // Chat threads
  threads: Thread[];
  typingThreadId: string | null;
  getThread: (id: string) => Thread | undefined;
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
  const [services] = useState<ServiceStatus[]>(initialServices);
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
  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const [typingThreadId, setTypingThreadId] = useState<string | null>(null);
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
      item: Omit<ActivityItem, 'id' | 'time' | 'crew' | 'icon' | 'day'> &
        Partial<Pick<ActivityItem, 'crew' | 'icon' | 'day'>>
    ) => {
      setActivity((prev) => [
        { id: nextId('a'), time: 'just now', crew: 'Muppet', icon: 'checkmark-circle-outline', day: 'today', ...item },
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
        addActivity({ icon: 'checkmark-circle', title: `Approved: ${a.title}` });
      }
    },
    [addActivity, logRequest, setPermissionEnabled]
  );

  const getApproval = useCallback((id: string) => approvals.find((a) => a.id === id), [approvals]);

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

  /** Append a message to a thread and refresh its list preview. */
  const appendToThread = useCallback((threadId: string, msg: ChatMessage) => {
    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? {
              ...t,
              messages: [...t.messages, msg],
              lastPreview: msg.text ?? t.lastPreview,
              updatedAt: 'now',
            }
          : t
      )
    );
  }, []);

  const respond = useCallback(
    (threadId: string, userText: string) => {
      // Schedule-sounding messages get the agentic calendar flow: the week
      // strip "scans" for a while, then a schedule card drops into the thread.
      const parsed = parseScheduleRequest(userText, new Date().getDate());
      if (parsed) {
        setTypingThreadId(threadId);
        setCrewBusy(true);
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
            const dayEvents = calendarDays.find((d) => d.date === parsed.date)?.events ?? [];
            const dayWord = parsed.date === new Date().getDate() ? 'today' : 'tomorrow';
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
      // Manual override sticks; otherwise Operator holds first, then the
      // routed crew visibly takes over (Transition Hold) before the reply
      // reveals — Clawstin Core (no crew) just holds on Operator.
      if (!crewManual) {
        const crew = routeCrew(userText);
        const stages: CrewKey[] = crew ? ['triage', crew.key] : ['triage'];
        runCrewSequence(stages, setCrewSelected, () => {
          setTypingThreadId(null);
          setCrewBusy(false);
          const reply = getScriptedReply(userText);
          appendToThread(threadId, {
            id: nextId('c'),
            from: 'agent',
            text: reply.text,
            approval: reply.approval,
            result: reply.result,
            pipeline: reply.pipeline,
            crewCount: reply.crewCount,
          });
        });
      } else {
        // Manual pick already reflects the active crew — just hold once.
        setTimeout(() => {
          setTypingThreadId(null);
          setCrewBusy(false);
          const reply = getScriptedReply(userText);
          appendToThread(threadId, {
            id: nextId('c'),
            from: 'agent',
            text: reply.text,
            approval: reply.approval,
            result: reply.result,
            pipeline: reply.pipeline,
            crewCount: reply.crewCount,
          });
        }, CREW_HOLD_MS);
      }
    },
    [appendToThread, calendarDays, crewManual]
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
            ? `${logTime()} Gateway connected safely | End-to-End Encrypted.`
            : `${logTime()} Gateway ${gatewayStatus === 'offline' ? 'offline' : 'reconnecting'}, retrying…`;
        const toolsLine = connectedTools.length
          ? `${logTime()} ${connectedTools.length} tool${connectedTools.length === 1 ? '' : 's'} active (${connectedTools.map((p) => p.name).join(', ')}).`
          : `${logTime()} 0 tools active.`;

        if (connectedTools.length === 0) {
          greeting = {
            id: nextId('c'),
            from: 'agent',
            terminalLog: [gatewayLine, toolsLine],
            text:
              "Hi Ellie. I'm connected to your Mac mini gateway, but I couldn't find any connected tools yet. Don't worry, I can still monitor your server infrastructure or help you set up your core workflows via desktop.",
            suggestions: [
              'Run a system health check on my Mac mini',
              'Show me how to connect tools on the desktop web',
            ],
          };
        } else {
          const chipSource = connectedTools.slice(0, 2);
          greeting = {
            id: nextId('c'),
            from: 'agent',
            terminalLog: [gatewayLine, toolsLine],
            text: "Hi Ellie. Your OpenClaw gateway session is active and fully synced. What can I run for you today?",
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
      // Operator ("triage") lights up the instant a fresh thread opens, so
      // the crew bar always shows who's home rather than staying blank.
      if (greeting) {
        setCrewSelected('triage');
        setCrewManual(false);
      }
      return id;
    },
    [respond, permissions, gatewayStatus]
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
  const resolveChatApproval = useCallback(
    (threadId: string, messageId: string, a: Approval, approved: boolean) => {
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? {
                ...t,
                messages: t.messages.map((m) =>
                  m.id === messageId ? { ...m, approval: undefined } : m
                ),
              }
            : t
        )
      );
      resolveApproval(a, approved);
      appendToThread(threadId, {
        id: nextId('c'),
        from: 'agent',
        text: approved
          ? `Thanks! Access granted. I'll get right on it.`
          : `No problem, I won't do that.`,
      });
    },
    [appendToThread, resolveApproval]
  );

  // When a slot pill is tapped: really add the event, mark the card booked
  // in place, and follow up in the thread (mirrors resolveChatApproval).
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
                messages: t.messages.map((m) =>
                  m.id === messageId ? { ...m, schedule: { ...schedule, booked: slot } } : m
                ),
              }
            : t
        )
      );
      const dayWord = schedule.date === new Date().getDate() ? 'today' : 'tomorrow';
      appendToThread(threadId, {
        id: nextId('c'),
        from: 'agent',
        text: `Booked: "${schedule.title}" ${dayWord} at ${slot}.`,
      });
    },
    [threads, addCalendarEvent, appendToThread]
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
      calendarDays,
      addCalendarEvent,
      calendarScan,
      bookScheduleSlot,
      startQuickTask,
      crewSelected,
      crewManual,
      crewBusy,
      selectCrew,
      resolveApproval,
      getApproval,
      threads,
      typingThreadId,
      getThread,
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
      calendarDays,
      addCalendarEvent,
      calendarScan,
      bookScheduleSlot,
      startQuickTask,
      crewSelected,
      crewManual,
      crewBusy,
      selectCrew,
      approvals,
      activity,
      resolveApproval,
      getApproval,
      threads,
      typingThreadId,
      getThread,
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
