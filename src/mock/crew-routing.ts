/**
 * Keyword routing for the chat crew chips: which of the 4 core Muppet crews
 * picks up a message. Based on the top daily agent workflows — scheduling,
 * research, writing, and communication triage.
 */

export type CrewKey = 'scheduler' | 'researcher' | 'writer' | 'triage' | 'orchestrator';

export type CrewRoute = { key: CrewKey; name: string; emoji: string };

export const ISLAND_CREWS: Record<CrewKey, CrewRoute> = {
  researcher: { key: 'researcher', name: 'Researcher', emoji: '🔍' },
  scheduler: { key: 'scheduler', name: 'Scheduler', emoji: '📅' },
  writer: { key: 'writer', name: 'Scribe', emoji: '✍️' },
  triage: { key: 'triage', name: 'Operator', emoji: '✉️' },
  orchestrator: { key: 'orchestrator', name: 'Orchestrator', emoji: '🧭' },
};

/** Render order for the chip row. */
export const CREW_LIST: CrewRoute[] = [
  ISLAND_CREWS.scheduler,
  ISLAND_CREWS.researcher,
  ISLAND_CREWS.writer,
  ISLAND_CREWS.triage,
  ISLAND_CREWS.orchestrator,
];

const TRIAGE_WORDS = ['email', 'mail', 'inbox', 'reply', 'message', 'archive', 'slack'];
const WRITER_WORDS = ['write', 'draft', 'post', 'blog', 'linkedin', 'tweet', 'compose'];
const SCHEDULER_WORDS = [
  'schedule', 'meeting', 'meet', 'book', 'calendar', 'tomorrow', 'appointment', 'block',
];
const RESEARCHER_WORDS = [
  'research', 'find', 'search', 'compare', 'summarize', 'benchmark', 'options', 'repo', 'docs',
  'look up',
];
// Compound requests that need more than one crew working together
// ("research X and schedule Y", "plan my week") — Orchestrator coordinates.
const ORCHESTRATOR_WORDS = ['plan my', 'coordinate', 'handle everything', 'orchestrate'];

/**
 * Route a message to a crew (or null → Clawstin Core handles it directly).
 * Orchestrator (multi-crew asks) wins first, then Operator (email context)
 * over Scribe ("reply to Jamie's email"), Scribe over Scheduler; a time like
 * "3pm" also counts as Scheduler.
 */
export function routeCrew(text: string): CrewRoute | null {
  const lower = text.toLowerCase();
  const has = (words: string[]) => words.some((w) => lower.includes(w));
  if (has(ORCHESTRATOR_WORDS) || (has(SCHEDULER_WORDS) && has(RESEARCHER_WORDS))) {
    return ISLAND_CREWS.orchestrator;
  }
  if (has(TRIAGE_WORDS)) return ISLAND_CREWS.triage;
  if (has(WRITER_WORDS)) return ISLAND_CREWS.writer;
  if (has(SCHEDULER_WORDS) || /\d{1,2}(:\d{2})?\s*(am|pm)/.test(lower)) {
    return ISLAND_CREWS.scheduler;
  }
  if (has(RESEARCHER_WORDS)) return ISLAND_CREWS.researcher;
  return null;
}
