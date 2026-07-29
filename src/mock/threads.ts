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

export const askCategories: AskCategory[] = [];

// ── Two use cases, nothing else ────────────────────────────────────────
// A = pull direction (human → agent): a one-shot ask, slot-filled and
// booked in one round trip. B = push direction (agent → human): a
// standing rule set once, then a proactive notification + a real
// negotiation (reject → re-propose → approve) days later.
// THE NEW MOCK WORLD (2026-07-29). Four threads: two waiting on Ellie
// (the Suggestions rows open these) and two already delivered (the
// Completed rows). Recent chats fills itself from whatever she types.
export const initialThreads: Thread[] = [
  {
    id: 'tv1',
    title: 'Candidate interview',
    lastPreview: 'Found 3 slots that work for the candidate interview',
    updatedAt: 'now',
    icon: 'calendar-clear-outline',
    agentId: 'muppet',
    crew: 'orchestrator',
    tool: 'calendar',
    messages: [
      {
        id: 'tv1-m1',
        from: 'agent',
        text: 'Found 3 slots that work for the candidate interview. Thursday 10 AM, Thursday 2 PM, or Friday 11 AM. Which one?',
        // the choice resolves in this bubble (approvals-in-chat rule)
        approval: {
          id: 'iv1',
          icon: 'calendar-clear-outline',
          title: 'Found 3 slots that work for the candidate interview',
          detail: 'Thursday 10 AM, Thursday 2 PM, or Friday 11 AM. Which one?',
          permissionKey: 'calendar',
          risk: 'write',
          threadId: 'tv1',
          age: 'now',
          items: [
            { label: 'Thursday 10 AM', detail: 'clear all morning' },
            { label: 'Thursday 2 PM', detail: 'after the design sync' },
            { label: 'Friday 11 AM', detail: 'clear all morning' },
          ],
          actionLabel: 'Book Thursday 10 AM',
          denyLabel: 'None of these',
          receipt: 'Interview booked',
        },
      },
    ],
  },
  {
    id: 'tv2',
    title: 'PR review time',
    lastPreview: 'PRs #482 and #489 have been waiting since Sunday',
    updatedAt: '2d',
    icon: 'logo-github',
    agentId: 'pilot',
    crew: 'triage',
    tool: 'github',
    messages: [
      {
        id: 'tv2-m1',
        from: 'agent',
        proactive: true,
        text: 'PRs #482 and #489 have been waiting on your review since Sunday. Block 45 min today at 2 PM?',
        approval: {
          id: 'pr1',
          icon: 'logo-github',
          title: 'PRs #482 and #489 have been waiting on your review since Sunday',
          detail: 'Block 45 min today at 2 PM?',
          permissionKey: 'calendar',
          risk: 'write',
          threadId: 'tv2',
          age: '2d',
          items: [
            { label: '#482 auth-service', detail: 'waiting since Sunday' },
            { label: '#489 billing-api', detail: 'waiting since Sunday' },
          ],
          actionLabel: 'Block 2 PM today',
          denyLabel: 'Not today',
          receipt: 'Review time blocked',
        },
      },
    ],
  },
  {
    id: 'tv5',
    title: 'Monthly investor update',
    lastPreview: 'Drafting the monthly investor update',
    updatedAt: 'now',
    icon: 'document-text-outline',
    agentId: 'quill',
    crew: 'writer',
    messages: [
      {
        id: 'tv5-m1',
        from: 'user',
        text: 'Draft the monthly investor update.',
      },
      {
        id: 'tv5-m2',
        from: 'agent',
        text: 'Started at 9:02 AM. Pulling last month numbers and the shipped work, then I will bring you a draft to read.',
      },
    ],
  },
  {
    id: 'tv3',
    title: 'AWS billing question',
    lastPreview: 'Replied to the AWS billing question',
    updatedAt: '7:48 AM',
    icon: 'mail-outline',
    agentId: 'quill',
    crew: 'writer',
    outcome: 'delivered',
    messages: [
      {
        id: 'tv3-m1',
        from: 'agent',
        text: 'Replied to the AWS billing question. The spike was the NAT gateway in us-east-1, and I quoted last month for comparison.',
      },
    ],
  },
  {
    id: 'tv4',
    title: 'Weekly digest',
    lastPreview: 'Weekly digest: what changed in main last week',
    updatedAt: '6:00 AM',
    icon: 'logo-github',
    agentId: 'scout',
    crew: 'researcher',
    outcome: 'delivered',
    messages: [
      {
        id: 'tv4-m1',
        from: 'agent',
        text: 'Weekly digest: what changed in main last week. 23 merges, mostly the auth refactor, and two dependency bumps worth a look.',
      },
    ],
  },
];
