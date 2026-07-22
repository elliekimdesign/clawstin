/** Schedules: time-based autonomy. Rules answer "when X happens, act";
 * schedules answer "at time T, act". Both live in AUTOPILOT because both
 * are the agent working without you. Every schedule owns exactly ONE
 * thread (threadId) and every run accumulates there: the same
 * one-home-per-event principle as undo routing. */

export type ScheduleScope = 'READ' | 'WRITE';

export type Schedule = {
  id: string;
  name: string;
  /** human cadence, e.g. "2:00 PM daily", "Mon 9 AM" */
  cadence: string;
  /** the one thread this schedule's runs accumulate in */
  threadId: string;
  /** which tool it touches, in ApprovalCard's SCOPE_NAME language */
  permissionKey?: string;
  scope: ScheduleScope;
  runs: number;
  lastRun?: { ago: string; ok: boolean };
};

/** Inline chat card payload: the structured proposal the agent makes
 * from a natural-language ask. Receipt model: the card never
 * disappears; scheduling stamps it. */
export type ScheduleProposal = {
  id: string;
  name: string;
  cadence: string;
  /** one plain line of what each run does */
  what: string;
  permissionKey?: string;
  scope: ScheduleScope;
  resolved?: 'scheduled';
  /** "Run once now" already fired: the test run sits below in-thread */
  testRan?: boolean;
};

// One seed (2026-07-21 NEXT UP): the board's future axis needs at
// least one time-anchored routine to glance at. Its home thread t4
// exists in mock/threads.ts (the old rule stands: no dangling
// threadIds). More arrive normally via addRoutine() when the user
// accepts a routine suggestion in-app.
export const initialSchedules: Schedule[] = [
  {
    id: 'sch-weekly',
    name: 'Weekly review',
    cadence: 'Mon 9 AM',
    threadId: 't4',
    permissionKey: 'calendar',
    scope: 'READ',
    runs: 3,
  },
];
