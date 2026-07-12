import { Ionicons } from '@expo/vector-icons';
import { initialApprovals } from '@/mock/approvals';
import type { ChatMessage } from '@/mock/chat';

/** the approval each ask-thread hosts (defined once in mock/approvals). */
const approvalById = (id: string) => initialApprovals.find((a) => a.id === id)!;

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
  { id: 'inbox', icon: 'mail-outline', label: 'Summarize my inbox', seed: 'Summarize my inbox' },
  { id: 'day', icon: 'sunny-outline', label: 'Plan my day', seed: 'Help me plan my day' },
  { id: 'reply', icon: 'create-outline', label: 'Draft a reply', seed: 'Draft a reply for me' },
  { id: 'research', icon: 'search-outline', label: 'Research a topic', seed: 'Research a topic for me' },
];

export const initialThreads: Thread[] = [
  {
    id: 't4',
    title: 'Morning briefing',
    lastPreview: 'Your morning briefing is ready.',
    updatedAt: '10m',
    icon: 'sunny-outline',
    agentId: 'muppet',
    unread: true,
    outcome: 'delivered',
    messages: [
      {
        id: 't4-m1',
        from: 'user',
        text: 'Prep a morning briefing from my inbox',
      },
      {
        id: 't4-m2',
        from: 'agent',
        text: 'Your morning briefing is ready: 3 emails need replies, standup moved to 10:30, and the beta launch checklist is on track.',
      },
    ],
  },
  {
    id: 't1',
    title: 'Inbox cleanup',
    agentId: 'muppet',
    lastPreview: 'Summarized 4 new emails and archived 12.',
    updatedAt: '2m',
    icon: 'mail-outline',
    outcome: 'delivered',
    messages: [
      {
        id: 't1-m1',
        from: 'user',
        terminalLog: [
          'Gateway connected | E2E Encrypted.',
          '2 tools active (Gmail, Calendar).',
        ],
        text: 'Can you clean up my inbox?',
      },
      {
        id: 't1-m2',
        from: 'agent',
        // two crews worked on this one (triage + writer) — shows the "+1" mark
        crewCount: 2,
        text: 'Done. I summarized 4 new emails and archived 12 promotions. Want the summary?',
      },
    ],
  },
  {
    id: 't2',
    title: 'Trip to Seoul',
    agentId: 'scout',
    lastPreview: 'I found 3 flight options under your budget.',
    updatedAt: '1h',
    icon: 'airplane-outline',
    messages: [
      {
        id: 't2-m1',
        from: 'user',
        terminalLog: [
          'Gateway connected | E2E Encrypted.',
          '2 tools active (Calendar, Contacts).',
        ],
        text: 'Help me plan a trip to Seoul next month.',
      },
      {
        id: 't2-m2',
        from: 'agent',
        text: 'I found 3 flight options under your budget and a few neighborhoods to stay in. Shall I draft an itinerary?',
      },
    ],
  },
  {
    id: 't3',
    title: 'Weekly review',
    agentId: 'quill',
    lastPreview: 'Here are your top 3 priorities for the week.',
    updatedAt: 'Mon',
    icon: 'calendar-clear-outline',
    outcome: 'delivered',
    messages: [
      {
        id: 't3-m1',
        from: 'user',
        terminalLog: [
          'Gateway connected | E2E Encrypted.',
          '2 tools active (Calendar, Contacts).',
        ],
        text: "What should I focus on this week?",
      },
      {
        id: 't3-m2',
        from: 'agent',
        text: 'Here are your top 3 priorities for the week, based on your calendar and goals.',
      },
    ],
  },
  {
    // Case 1 demo (time-boxed Needs You): ignored for a day, so the agent
    // escalated with a reminder instead of deleting the task. It expires
    // only when Friday actually passes.
    id: 't5',
    title: 'Friday dinner',
    agentId: 'pilot',
    lastPreview: 'Still want Friday dinner? Tables are filling up.',
    updatedAt: '1d',
    icon: 'restaurant-outline',
    crew: 'orchestrator',
    tool: 'calendar',
    messages: [
      {
        id: 't5-m1',
        from: 'user',
        terminalLog: [
          'Gateway connected | E2E Encrypted.',
          '2 tools active (Calendar, Contacts).',
        ],
        text: 'Find a spot for team dinner on Friday.',
      },
      {
        id: 't5-m2',
        from: 'agent',
        text: 'Three places near the office have Friday 7:00 PM tables. Want me to hold one?',
      },
      {
        id: 't5-m3',
        from: 'agent',
        text: 'Still want Friday dinner? Tables are filling up.',
        proactive: true,
      },
    ],
  },
  {
    // Case 1 endgame: the deadline itself passed, so the task moved to
    // Done with the expired label. Not locked; a follow-up revives it.
    id: 't6',
    title: 'Saturday pottery class',
    agentId: 'pilot',
    lastPreview: 'Saturday passed, so I closed this one.',
    updatedAt: 'Sat',
    icon: 'color-palette-outline',
    outcome: 'expired',
    crew: 'orchestrator',
    tool: 'calendar',
    messages: [
      {
        id: 't6-m1',
        from: 'user',
        terminalLog: [
          'Gateway connected | E2E Encrypted.',
          '2 tools active (Calendar, Contacts).',
        ],
        text: 'Sign me up for the Saturday pottery class.',
      },
      {
        id: 't6-m2',
        from: 'agent',
        text: 'Two seats are open for Saturday 2:00 PM. Want me to grab one?',
      },
      {
        id: 't6-m3',
        from: 'agent',
        text: 'Saturday passed, so I closed this one. Say the word and I will set it up again.',
      },
    ],
  },
  // ── Approval ask-threads ─────────────────────────────────────────────
  // Every Needs You approval lives here as an interactive bubble: the
  // agent asks proactively, the payload + scope + buttons sit in ONE
  // bubble, and the answer happens in place — no review screen.
  {
    id: 'ta1',
    title: 'Move standup',
    agentId: 'pilot',
    lastPreview: 'Standup clashes with your focus block. Move it?',
    updatedAt: '2h',
    icon: 'calendar-outline',
    crew: 'orchestrator',
    tool: 'calendar',
    consoleLog: [
      'watch  calendar sync, 14 events  0.8s',
      'execute  standup vs focus block clash  0.3s',
      'synthesize  proposing 10:30 AM  0.2s',
    ],
    messages: [
      {
        id: 'ta1-m0',
        from: 'user',
        terminalLog: [
          'Gateway connected | E2E Encrypted.',
          '2 tools active (Calendar, Contacts).',
        ],
        text: 'Keep my mornings clear of meeting clashes.',
      },
      {
        id: 'ta1-m1',
        from: 'agent',
        proactive: true,
        text: 'Standup tomorrow clashes with your 10:00 focus block. Move it to 10:30 AM?',
        approval: approvalById('ap1'),
      },
    ],
  },
  {
    id: 'ta2',
    title: 'Duplicate contacts',
    agentId: 'muppet',
    lastPreview: 'Found 3 duplicates of "Josh P." Merge them?',
    updatedAt: '3d',
    icon: 'people-outline',
    crew: 'triage',
    tool: 'contacts',
    consoleLog: [
      'watch  contacts sync, 214 cards  2.1s',
      'execute  3 cards match "Josh P."  0.4s',
      'synthesize  proposing a merge  0.2s',
    ],
    messages: [
      {
        id: 'ta2-m0',
        from: 'user',
        terminalLog: [
          'Gateway connected | E2E Encrypted.',
          '2 tools active (Calendar, Contacts).',
        ],
        text: 'Keep my address book tidy.',
      },
      {
        id: 'ta2-m1',
        from: 'agent',
        proactive: true,
        text: 'Found 3 duplicates of "Josh P." in your contacts. Merge them?',
        approval: approvalById('ap2'),
      },
    ],
  },
  {
    id: 'ta3',
    title: 'Friday 4pm invite',
    agentId: 'pilot',
    lastPreview: 'The Friday 4:00 PM invite hits your focus block.',
    updatedAt: '4h',
    icon: 'calendar-outline',
    crew: 'orchestrator',
    tool: 'calendar',
    consoleLog: [
      'watch  new invite from Dana  0.6s',
      'execute  clash with focus block 3-5 PM  0.3s',
      'synthesize  proposing a decline  0.2s',
    ],
    messages: [
      {
        id: 'ta3-m0',
        from: 'user',
        terminalLog: [
          'Gateway connected | E2E Encrypted.',
          '2 tools active (Calendar, Contacts).',
        ],
        text: 'Guard my focus blocks.',
      },
      {
        id: 'ta3-m1',
        from: 'agent',
        proactive: true,
        text: 'Dana sent a Friday 4:00 PM invite that lands inside your focus block. Decline it?',
        approval: approvalById('ap3'),
      },
    ],
  },
  {
    // Seeded with just the standing instruction: the staged nudge (see
    // app-store) drops the ask in here at runtime, right when the
    // floating pill announces it.
    id: 'ta4',
    title: 'Merge the passing PR',
    agentId: 'quill',
    lastPreview: 'Watching CI on 3 open PRs.',
    updatedAt: 'now',
    icon: 'git-merge-outline',
    crew: 'orchestrator',
    tool: 'github',
    consoleLog: [
      'watch  CI on 3 open PRs  4.2s',
      'execute  chore/log-json checks green  0.5s',
      'synthesize  proposing the merge  0.2s',
    ],
    messages: [
      {
        id: 'ta4-m0',
        from: 'user',
        terminalLog: [
          'Gateway connected | E2E Encrypted.',
          '3 tools active (Calendar, Contacts, Devtools).',
        ],
        text: 'Watch CI and flag PRs that are ready to merge.',
      },
    ],
  },
];
