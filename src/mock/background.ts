/** What the crew is doing while you are not looking. `waiting` means the
 * agent asked the user something and is blocked on the answer — those
 * rows are the whole reason this surface exists. */
export type BackgroundTask = {
  id: string;
  /** crew member id (see mock/crew.ts) */
  agentId: string;
  /** short human line about the work, e.g. "Comparing flight prices" */
  label: string;
  /** ONLY open work lives here; finished results move to History */
  state: 'running' | 'waiting';
  /** the conversation this task lives in (see mock/threads.ts) */
  threadId: string;
  /** time-boxed tasks only: when real time passes this, the task expires
   * (Done, labeled expired). Until then non-response just escalates. */
  deadline?: string;
  /** display age; multi-day = soft-aged (sinks and dims, never deleted) */
  age?: string;
  /** running tasks only: short live progress line, e.g. "2 of 4 sites" */
  progress?: string;
};

// Use Case A is the one open, blocking ask (waiting on a slot pick).
// Use Case B's own "waiting on you" moment arrives live via the staged
// nudge (see app-store.tsx) once the PR notification lands, so it isn't
// seeded here — it appears the same way a real proactive ask would.
// DEMO DATA WIPED 2026-07-28: the old seeded world lives in git;
// fresh mock data lands here next.
export const initialBackground: BackgroundTask[] = [];
