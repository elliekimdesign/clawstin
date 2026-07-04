/**
 * Keyword routing for the chat crew chips: which of the 4 core Muppet crews
 * picks up a message. Based on the top daily agent workflows — scheduling,
 * research, writing, and communication triage.
 */

export type CrewKey = 'researcher' | 'writer' | 'triage' | 'orchestrator';

export type CrewRoute = { key: CrewKey; name: string };

export const ISLAND_CREWS: Record<CrewKey, CrewRoute> = {
  researcher: { key: 'researcher', name: 'Research' },
  writer: { key: 'writer', name: 'Scribe' },
  triage: { key: 'triage', name: 'Operator' },
  orchestrator: { key: 'orchestrator', name: 'Orchestrator' },
};

/** Render order for the chip row. */
export const CREW_LIST: CrewRoute[] = [
  ISLAND_CREWS.researcher,
  ISLAND_CREWS.writer,
  ISLAND_CREWS.triage,
  ISLAND_CREWS.orchestrator,
];

const TRIAGE_WORDS = ['email', 'mail', 'inbox', 'reply', 'message', 'archive', 'slack'];
const WRITER_WORDS = ['write', 'draft', 'post', 'blog', 'linkedin', 'tweet', 'compose'];
// No dedicated Scheduler crew anymore — schedule-flavored asks route to
// Orchestrator (see also app-store.tsx's schedule-parsing Transition Hold).
const SCHEDULER_WORDS = [
  'schedule', 'meeting', 'meet', 'book', 'calendar', 'tomorrow', 'appointment', 'block',
];
const RESEARCHER_WORDS = [
  'research', 'find', 'search', 'compare', 'summarize', 'benchmark', 'options', 'repo', 'docs',
  'look up',
];
// Compound/coordination requests, PLUS anything schedule-flavored — Orchestrator
// now owns scheduling since there's no standalone Scheduler crew.
const ORCHESTRATOR_WORDS = ['plan my', 'coordinate', 'handle everything', 'orchestrate'];

/**
 * Route a message to a crew (or null → Clawstin Core handles it directly).
 * Orchestrator wins first (multi-crew asks, or anything schedule-flavored —
 * a time like "3pm" also counts), then Operator (email context) over Scribe
 * ("reply to Jamie's email"), then Research.
 */
export function routeCrew(text: string): CrewRoute | null {
  const lower = text.toLowerCase();
  const has = (words: string[]) => words.some((w) => lower.includes(w));
  if (
    has(ORCHESTRATOR_WORDS) ||
    has(SCHEDULER_WORDS) ||
    /\d{1,2}(:\d{2})?\s*(am|pm)/.test(lower)
  ) {
    return ISLAND_CREWS.orchestrator;
  }
  if (has(TRIAGE_WORDS)) return ISLAND_CREWS.triage;
  if (has(WRITER_WORDS)) return ISLAND_CREWS.writer;
  if (has(RESEARCHER_WORDS)) return ISLAND_CREWS.researcher;
  return null;
}
