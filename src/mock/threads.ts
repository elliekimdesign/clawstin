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
// DEMO DATA WIPED 2026-07-28: the old seeded world lives in git;
// fresh mock data lands here next.
export const initialThreads: Thread[] = [];
