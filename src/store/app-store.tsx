import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import type { Approval } from '@/components/ui/approval-card';
import { ActivityItem, initialActivity } from '@/mock/activity';
import { initialApprovals } from '@/mock/approvals';
import { ChatMessage, getScriptedReply } from '@/mock/chat';
import { initialMemories, Memory } from '@/mock/memories';
import {
  initialPermissions,
  initialRequestLog,
  Permission,
  RequestLogItem,
} from '@/mock/permissions';
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

export type RunningTask = { id: string; label: string };

type Store = {
  // Connection (MVP: local toggle — onboarding vs state board)
  connected: boolean;
  setConnected: (v: boolean) => void;

  // Activity (autonomous action log) + pending approvals (shown on Home board)
  approvals: Approval[];
  activity: ActivityItem[];
  running: RunningTask[];
  services: ServiceStatus[];
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

  // Access (infrastructure endpoints)
  infra: InfraEndpoint[];
  setInfraValue: (id: string, value: string) => void;
};

const AppContext = createContext<Store | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [approvals, setApprovals] = useState<Approval[]>(initialApprovals);
  const [activity, setActivity] = useState<ActivityItem[]>(initialActivity);
  const [running] = useState<RunningTask[]>([{ id: 'run1', label: 'Checking your calendar' }]);
  const [services] = useState<ServiceStatus[]>(initialServices);
  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const [typingThreadId, setTypingThreadId] = useState<string | null>(null);
  const [memories, setMemories] = useState<Memory[]>(initialMemories);
  const [permissions, setPermissions] = useState<Permission[]>(initialPermissions);
  const [requestLog, setRequestLog] = useState<RequestLogItem[]>(initialRequestLog);
  const [infra, setInfra] = useState<InfraEndpoint[]>(initialInfra);

  const setPermissionEnabled = useCallback((key: string, enabled: boolean) => {
    setPermissions((prev) => prev.map((p) => (p.key === key ? { ...p, enabled } : p)));
  }, []);

  const logRequest = useCallback((text: string, result: 'Approved' | 'Denied') => {
    setRequestLog((prev) => [{ id: nextId('r'), text, time: 'just now', result }, ...prev]);
  }, []);

  const addActivity = useCallback((item: Omit<ActivityItem, 'id' | 'time'>) => {
    setActivity((prev) => [{ id: nextId('a'), time: 'just now', ...item }, ...prev]);
  }, []);

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

  const setInfraValue = useCallback((id: string, value: string) => {
    setInfra((prev) => prev.map((e) => (e.id === id ? { ...e, value } : e)));
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
      setTypingThreadId(threadId);
      // fake "thinking" delay, then reveal the scripted reply
      setTimeout(() => {
        const reply = getScriptedReply(userText);
        setTypingThreadId(null);
        appendToThread(threadId, {
          id: nextId('c'),
          from: 'agent',
          text: reply.text,
          approval: reply.approval,
        });
      }, 1300);
    },
    [appendToThread]
  );

  const createThread = useCallback(
    (seedText?: string) => {
      const id = nextId('t');
      const seeded = seedText?.trim();
      const newThread: Thread = {
        id,
        title: seeded ? seeded.slice(0, 32) : 'New chat',
        lastPreview: seeded ?? 'Start a conversation…',
        updatedAt: 'now',
        emoji: '💬',
        messages: seeded ? [{ id: nextId('c'), from: 'user', text: seeded }] : [],
      };
      setThreads((prev) => [newThread, ...prev]);
      if (seeded) respond(id, seeded);
      return id;
    },
    [respond]
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
          : `No problem — I won't do that.`,
      });
    },
    [appendToThread, resolveApproval]
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
      infra,
      setInfraValue,
    }),
    [
      connected,
      running,
      services,
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
      infra,
      setInfraValue,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used within AppProvider');
  return ctx;
}
