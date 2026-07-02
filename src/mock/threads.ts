import { Ionicons } from '@expo/vector-icons';
import type { ChatMessage } from '@/mock/chat';

export type Thread = {
  id: string;
  title: string;
  /** short preview of the last message, shown in the list */
  lastPreview: string;
  /** human-friendly relative time, shown in the list */
  updatedAt: string;
  /** avatar accent for the thread row */
  emoji: string;
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
    id: 't1',
    title: 'Inbox cleanup',
    lastPreview: 'Summarized 4 new emails and archived 12.',
    updatedAt: '2m',
    emoji: '📥',
    messages: [
      { id: 't1-m1', from: 'user', text: 'Can you clean up my inbox?' },
      {
        id: 't1-m2',
        from: 'agent',
        text: 'Done — I summarized 4 new emails and archived 12 promotions. Want the summary?',
      },
    ],
  },
  {
    id: 't2',
    title: 'Trip to Seoul',
    lastPreview: 'I found 3 flight options under your budget.',
    updatedAt: '1h',
    emoji: '✈️',
    messages: [
      { id: 't2-m1', from: 'user', text: 'Help me plan a trip to Seoul next month.' },
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
    lastPreview: 'Here are your top 3 priorities for the week.',
    updatedAt: 'Mon',
    emoji: '🗓️',
    messages: [
      { id: 't3-m1', from: 'user', text: "What should I focus on this week?" },
      {
        id: 't3-m2',
        from: 'agent',
        text: 'Here are your top 3 priorities for the week, based on your calendar and goals.',
      },
    ],
  },
];
