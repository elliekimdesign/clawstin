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

export const initialSchedules: Schedule[] = [
  // Weekly review reuses the existing t3 thread as its home: proof that
  // runs accumulate in one thread instead of scattering across sessions.
  {
    id: 's1',
    name: 'Weekly review',
    cadence: 'Mon 9 AM',
    threadId: 't3',
    permissionKey: 'calendar',
    scope: 'READ',
    runs: 6,
    lastRun: { ago: 'Mon', ok: true },
  },
];
