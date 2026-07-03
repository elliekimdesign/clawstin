import type { Approval } from '@/components/ui/approval-card';
import type { ScheduleSuggestion } from '@/mock/calendar';

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

export type ChatMessage = {
  id: string;
  from: 'user' | 'agent';
  text?: string;
  approval?: Approval;
  schedule?: ScheduleSuggestion;
  result?: ResultCard;
  /** tiny system-log lines shown above the message — reinforces the real
   * device connection (e.g. "[10:42:16] Gateway connected..."). */
  terminalLog?: string[];
  /** tap-to-send example prompts, shown under an agent message */
  suggestions?: string[];
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
type Reply = { text: string; approval?: Approval; result?: ResultCard };

const rules: { keywords: string[]; reply: Reply }[] = [
  {
    keywords: ['bike', 'nearest', 'near me', 'restaurant', 'coffee', 'place', 'where'],
    reply: {
      text: 'Found 3 Lyft bike stations near you — the closest is a 4-min walk.',
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
    keywords: ['email', 'mail', 'inbox'],
    reply: {
      text: 'I can check your inbox, but I need access to Gmail first.',
      approval: {
        id: 'chat-gmail',
        icon: 'mail',
        title: 'Access Gmail',
        detail: 'To read your latest emails and draft replies.',
        permissionKey: 'gmail',
      },
    },
  },
  {
    keywords: ['meeting', 'calendar', 'schedule', 'book'],
    reply: {
      text: 'Sure — your calendar is free tomorrow morning. Want me to block 10:00–10:30 AM for a focus session?',
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
    reply: { text: 'Hello! 👋 How can I help you today?' },
  },
];

const fallback: Reply = {
  text: "Here's what I'd do: break that into steps and handle it for you. (This is a demo reply — the real OpenClaw server isn't connected yet.)",
};

export function getScriptedReply(input: string): Reply {
  const lower = input.toLowerCase();
  for (const rule of rules) {
    if (rule.keywords.some((k) => lower.includes(k))) return rule.reply;
  }
  return fallback;
}
