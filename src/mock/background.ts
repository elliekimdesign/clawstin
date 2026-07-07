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
};

export const initialBackground: BackgroundTask[] = [
  {
    id: 'b1',
    agentId: 'scout',
    label: 'Comparing flight prices to Seoul',
    state: 'running',
    threadId: 't1',
  },
  {
    id: 'b2',
    agentId: 'pilot',
    label: 'Pick a time for Friday dinner',
    state: 'waiting',
    threadId: 't5',
    deadline: 'Fri',
  },
];
