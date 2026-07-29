import type { Approval } from '@/components/ui/approval-card';
import type { ScheduleSuggestion } from '@/mock/calendar';
import type { ScheduleProposal } from '@/mock/schedules';
import type { CrewNote } from '@/components/ui/crew-detail';
import type { TaskReview } from '@/mock/task-api';

/**
 * Universal result card: every informational answer (places, weather,
 * stocks…) renders as a minimal text list + ONE deep-link text button.
 * We never embed maps or other heavy UI — the native app does that better.
 */
export type ResultCard = {
  items: { label: string; detail?: string }[];
  /** Deep link to the service that OWNS the data; webUrl = fallback if the app isn't installed. */
  action?: { label: string; url: string; webUrl?: string };
};

export type PipelineStep = {
  label: string;
  status: 'done' | 'active' | 'pending';
  /** which crew member owns this step (2026-07-28): a multi-agent pipeline
   * that names three people must show WHO does what, or the handoff is a
   * claim the UI never backs up. Display name, e.g. 'Research'. */
  owner?: string;
  /** this step is the human gate — rendered as WAITING ON YOU, never as
   * machine progress, so "nothing writes until you approve" is visible */
  gate?: boolean;
};
export type Pipeline = { steps: PipelineStep[] };

/**
 * A message Scribe wrote for the user to send on. Reviewed in the chat
 * bubble that offered it (approvals-in-chat rule) — never a review screen.
 */
export type Draft = {
  /** who it goes to, when known ("Jenna") */
  to?: string;
  /** the drafted prose itself */
  body: string;
  /** stamped in place once sent — the card stays as the receipt */
  sent?: boolean;
};

/**
 * Scribe's draft for a scheduling ask: the note that goes out once a time is
 * settled. Mock copy, in the user's own plain voice (no em dashes, no emoji
 * per the product rules).
 */
/**
 * Who the note goes to, pulled from a parsed event title. parseScheduleRequest
 * already capitalizes whatever follows "with" ("dinner with jenna" →
 * "Dinner with Jenna"), so that's the name to address. Undefined when the
 * title names no one — the card then just says "Send it".
 */
export function recipientOf(title: string): string | undefined {
  const m = title.match(/\bwith\s+([A-Z][\w'-]*)/);
  return m ? m[1] : undefined;
}

export function draftForSchedule(title: string, slot?: string): string {
  // The note goes TO the person, so drop "with Jenna" from the subject —
  // otherwise the draft reads "does 7pm work for dinner with jenna?" at
  // Jenna herself, and lowercasing the whole title mangles her name too.
  // (anchorless \bwith\b would leave a bare "with jenna" title as the
  // subject, so strip any leading "with" too)
  const subject = title
    .replace(/\s*\bwith\s+[A-Z][\w'-]*/, '')
    .replace(/^\s*with\b/i, '')
    .trim()
    .toLowerCase();
  return slot
    ? subject
      ? `Hey! Does ${slot} work for ${subject}? Happy to move it if that's tight for you.`
      : `Hey! Does ${slot} work for you? Happy to move it if that's tight.`
    : subject
      ? `Hey! Are you free for ${subject} this week? Send me a time that works and I'll lock it in.`
      : `Hey! Are you free sometime this week? Send me a time that works and I'll lock it in.`;
}

export type ChatMessage = {
  id: string;
  from: 'user' | 'agent';
  text?: string;
  approval?: Approval;
  schedule?: ScheduleSuggestion;
  /** structured recurring-task proposal (name, cadence, scope) with a
   * test-run-first button row; stamped in place once scheduled */
  scheduleProposal?: ScheduleProposal;
  /** Scribe wrote something to send (2026-07-24): prose the user reads,
   * then sends or edits. Distinct from `text` — that's the agent talking TO
   * you; this is the agent's draft FOR you to send to someone else. */
  draft?: Draft;
  result?: ResultCard;
  /** the rest of the crew's contribution, folded under the main answer
   * (2026-07-29): one owner speaks plainly, everyone else is detail you can
   * open. Inside, the face carries the attribution. */
  crewNotes?: CrewNote[];
  /** a coding task came back with a real diff to review (2026-07-28): the
   * bridge's structured payload, rendered as the in-thread review card.
   * Approvals resolve where they were asked — never a separate screen. */
  review?: TaskReview;
  /** set once the user answers the review card, so it stamps in place
   * instead of offering buttons forever */
  reviewOutcome?: { state: 'approved'; branch: string; commit: string; url: string | null }
    | { state: 'rejected' }
    | { state: 'failed'; error: string };
  /** multi-agent status card — shown only for replies that represent real
   * tool/data work (not every reply; simple replies stay plain text). */
  pipeline?: Pipeline;
  /** tiny system-log lines shown above the message — reinforces the real
   * device connection (e.g. "[10:42:16] Gateway connected..."). */
  terminalLog?: string[];
  /** tap-to-send example prompts, shown under an agent message */
  suggestions?: string[];
  /** crew members who worked on this reply; >1 renders the mark with "+N" */
  crewCount?: number;
  /** the SYSTEM spoke first (escalation reminder, status nudge) — renders
   * a small mono caption so it reads apart from asked-for replies */
  proactive?: boolean;
  /** overrides the caption text (e.g. "TASK PAUSED" on failure updates) */
  caption?: string;
  /** CHOP (2026-07-12): the orchestrator cut a new task out of this
   * thread — renders as an inline boundary chip, never a new screen.
   * Value = the new task's title. */
  taskDivider?: string;
};

export const initialMessages: ChatMessage[] = [
  {
    id: 'c1',
    from: 'agent',
    text: "Hi! I'm your OpenClaw assistant. I can manage your inbox, calendar and more. What would you like to do?",
  },
];

/**
 * Scripted replies. We pick the first rule whose keyword matches the user's
 * message; otherwise we use the fallback. Some replies carry an approval card.
 */
type Reply = { text: string; approval?: Approval; result?: ResultCard; pipeline?: Pipeline; crewCount?: number };

const rules: { keywords: string[]; reply: Reply }[] = [
  {
    keywords: ['bike', 'nearest', 'near me', 'restaurant', 'coffee', 'place', 'where'],
    reply: {
      text: 'Found 3 Lyft bike stations near you. The closest is a 4-min walk.',
      result: {
        items: [
          { label: 'Market St & 10th', detail: '0.2 mi · 5 bikes' },
          { label: 'Valencia & 16th', detail: '0.4 mi · 2 bikes' },
          { label: 'Duboce Park', detail: '0.6 mi · 8 bikes' },
        ],
        action: { label: 'Open Lyft ↗', url: 'lyft://', webUrl: 'https://www.lyft.com/bikes' },
      },
    },
  },
  {
    keywords: ['contact', 'look up', 'phone number', 'reach'],
    reply: {
      text: 'Pulled up Jamie Chen from Contacts.',
      crewCount: 3,
      pipeline: {
        steps: [
          { label: 'Parsing user intent', status: 'done' },
          { label: 'Fetching Contacts database', status: 'done' },
          { label: 'Formatting summary response', status: 'done' },
        ],
      },
      result: {
        items: [
          { label: 'Jamie Chen', detail: '+1 (415) 555-0134' },
          { label: 'Email', detail: 'jamie@openclaw.dev' },
        ],
      },
    },
  },
  {
    keywords: ['email', 'mail', 'inbox'],
    reply: {
      text: 'I can check your inbox, but I need access to Gmail first.',
      approval: {
        id: 'chat-gmail',
        icon: 'mail',
        title: 'Access Gmail',
        detail: 'To read your latest emails and draft replies.',
        permissionKey: 'gmail',
        receipt: 'Access granted',
      },
    },
  },
  {
    keywords: ['meeting', 'calendar', 'schedule', 'book'],
    reply: {
      text: 'Sure, your calendar is free tomorrow morning. Want me to block 10:00–10:30 AM for a focus session?',
    },
  },
  {
    keywords: ['remember', 'memory', 'note'],
    reply: {
      text: "Got it. I'll remember that. You can review everything I know in the Memory tab.",
    },
  },
  {
    keywords: ['hi', 'hello', 'hey'],
    reply: { text: 'Hello! How can I help you today?' },
  },
];

const fallback: Reply = {
  text: "Here's what I'd do: break that into steps and handle it for you. (This is a demo reply. The real OpenClaw server isn't connected yet.)",
};

export function getScriptedReply(input: string): Reply {
  const lower = input.toLowerCase();
  for (const rule of rules) {
    if (rule.keywords.some((k) => lower.includes(k))) return rule.reply;
  }
  return fallback;
}
