export type ActivityDay = 'today' | 'yesterday';

/** One backstage step inside a run: what the agent actually did. */
export type LogStep = {
  /** mono machine line, e.g. 'calendar.freebusy' or 'search google x4' */
  label: string;
  /** duration shown after the label, e.g. '180ms', '2.1s' */
  ms?: string;
  /** ok (default) = green check, err = red cross, wait = amber pause */
  state?: 'ok' | 'err' | 'wait';
};

/** One system-log entry: which user prompt ran, when, which crew member
 * handled it, and the engine-room steps behind it. Chat surfaces show
 * the prompt side; the Logs tab shows the steps side. */
export type ActivityItem = {
  id: string;
  /** wall-clock time of the run, e.g. '14:22' ('just now' for live entries) */
  time: string;
  day: ActivityDay;
  /** compact relative age shown at the right edge, e.g. '1m', '2h', '1d' */
  ago: string;
  /** the user prompt (or system line) this entry records */
  prompt: string;
  /** crew member id who handled it (see mock/crew.ts) */
  agentId: string;
  /** the conversation this prompt lives in (see mock/threads.ts) */
  threadId: string;
  /** attention state: absent = went fine */
  status?: 'failed' | 'needs_approval';
  /** backstage steps, shown in the Logs console */
  steps?: LogStep[];
  /** total wall time of the run, e.g. '4.2s' */
  total?: string;
  /** ran without a prompt: an AUTOPILOT rule or schedule fired */
  source?: 'autopilot';
  /** which automation fired (see mock/autopilot.ts rule keys) */
  ruleKey?: string;
  /** ledger type filter (2026-07-22): 'task' = the run belongs to a
   * Home task (chopped work, standing rules, autopilot); 'chat' =
   * conversational back-and-forth with no task object. Absent = chat. */
  kind?: 'chat' | 'task';
};

// Two use cases only: A = dinner with Jenna (t1), B = the PR-review
// negotiation (t2). Every row here is a real beat from one of the two
// storyboards, newest first. (a5/a6 are yesterday's supporting beats so
// every crew member's HR-file sheet has at least one recent run.)
// DEMO DATA WIPED 2026-07-28: the old seeded world lives in git;
// fresh mock data lands here next.
export const initialActivity: ActivityItem[] = [];
