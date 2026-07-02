import type { Approval } from '@/components/ui/approval-card';

export type ChatMessage = {
  id: string;
  from: 'user' | 'agent';
  text?: string;
  approval?: Approval;
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
type Reply = { text: string; approval?: Approval };

const rules: { keywords: string[]; reply: Reply }[] = [
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
