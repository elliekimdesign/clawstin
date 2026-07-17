import { Ionicons } from '@expo/vector-icons';
import type { ChatMessage } from '@/mock/chat';

export type Thread = {
  id: string;
  title: string;
  /** short preview of the last message, shown in the list */
  lastPreview: string;
  /** human-friendly relative time, shown in the list */
  updatedAt: string;
  /** avatar icon for the thread row */
  icon: keyof typeof Ionicons.glyphMap;
  /** crew member who produced the result (face chip in History) */
  agentId?: string;
  /** finished but not yet opened by the user (blue unread dot) */
  unread?: boolean;
  /** Done label: delivered = the work landed; expired = its real-world
   * deadline passed before the user answered. Threads are never locked
   * either way — a follow-up message revives them. */
  outcome?: 'delivered' | 'expired';
  /** who OWNS this thread — the chat pill shows this crew on open */
  crew?: 'triage' | 'orchestrator' | 'researcher' | 'writer';
  /** the tool this thread runs on — drives the header tool button
   * (calendar opens the month view; others are just the badge) */
  tool?: 'calendar' | 'contacts' | 'github';
  /** the background run that produced this thread's ask — shown as a
   * COLLAPSED thinking console ("✓ done  N steps") at the top */
  consoleLog?: string[];
  messages: ChatMessage[];
};

/** Quick-start shortcuts shown at the top of the Agent screen. */
export type AskCategory = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  /** the message text that seeds a new thread when tapped */
  seed: string;
};

export const askCategories: AskCategory[] = [
  { id: 'dinner', icon: 'restaurant-outline', label: 'Book dinner with Jenna', seed: 'Book dinner with Jenna' },
  {
    id: 'pr-watch',
    icon: 'git-pull-request-outline',
    label: 'Watch my PR queue',
    seed: 'Keep an eye on PRs waiting on me. If I\'m sitting on one, grab me 30 min.',
  },
];

// ── Two use cases, nothing else ────────────────────────────────────────
// A = pull direction (human → agent): a one-shot ask, slot-filled and
// booked in one round trip. B = push direction (agent → human): a
// standing rule set once, then a proactive notification + a real
// negotiation (reject → re-propose → approve) days later.
export const initialThreads: Thread[] = [
  {
    // Use Case A — "Book dinner with Jenna." The whole pull-direction
    // pattern in one thread: ask → routing → slot-fill chip → approval
    // → booked result. Fast, low-risk, one round trip.
    id: 't1',
    title: 'Dinner with Jenna',
    agentId: 'pilot',
    lastPreview: 'Jenna is free at 5:00, 6:30, or 7:00. Which works?',
    updatedAt: '2m',
    icon: 'restaurant-outline',
    crew: 'orchestrator',
    tool: 'calendar',
    messages: [
      {
        id: 't1-m1',
        from: 'user',
        terminalLog: [
          'Gateway connected | E2E Encrypted.',
          '2 tools active (Calendar, Contacts).',
        ],
        text: 'Book dinner with Jenna.',
      },
      {
        id: 't1-m2',
        from: 'agent',
        text: 'Jenna is free at 5:00, 6:30, or 7:00 this week. Which works?',
      },
    ],
  },
  {
    // Use Case B — the featured, standing-rule negotiation. 7 beats total;
    // beats 1-2 sit here from launch, beats 3-4 (the proactive PR notice)
    // arrive LIVE a few seconds after connect (see the staged nudge in
    // app-store.tsx) — a genuine unprompted arrival, not static copy.
    // Beats 5-7 (reject → re-propose → approve → final report) play out
    // through the approval card's own Deny/Approve buttons, live in chat
    // (see resolveChatApproval in app-store.tsx).
    id: 't2',
    title: 'PR review time',
    agentId: 'muppet',
    lastPreview: "Done — I'll watch your GitHub queue.",
    updatedAt: 'now',
    icon: 'git-pull-request-outline',
    crew: 'orchestrator',
    tool: 'github',
    messages: [
      {
        // beat 1 — delegate the standing rule
        id: 't2-m1',
        from: 'user',
        terminalLog: [
          'Gateway connected | E2E Encrypted.',
          '3 tools active (Calendar, Contacts, GitHub).',
        ],
        text: "Keep an eye on PRs waiting on me. If I'm sitting on one, grab me 30 min.",
      },
      {
        // beat 2 — confirm the rule, no autonomy overreach
        id: 't2-m2',
        from: 'agent',
        text: "Done — I'll watch your GitHub queue and find you time when something's waiting. Nothing gets booked without your OK.",
      },
    ],
  },
];
