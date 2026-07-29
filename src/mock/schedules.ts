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
// DEMO DATA WIPED 2026-07-28: the old seeded world lives in git;
// fresh mock data lands here next.
// THE NEW MOCK WORLD (2026-07-29). ORDER MATTERS: Home's "Next up" card
// shows [0], so the soonest thing leads. Both also list under Routines,
// which is the same ledger unfolded.
export const initialSchedules: Schedule[] = [
  {
    id: 'sv1',
    name: 'Standup notes for the 9:30 sync',
    cadence: '9:30 AM',
    threadId: 'tv4',
    permissionKey: 'calendar',
    scope: 'READ',
    runs: 12,
    lastRun: { ago: 'yesterday', ok: true },
  },
  {
    id: 'sv2',
    name: 'Weekly repo digest',
    cadence: 'Mondays 6 AM',
    threadId: 'tv4',
    permissionKey: 'github',
    scope: 'READ',
    runs: 8,
    // proof of life: a routine's whole job is running without you
    // watching, so the card says WHEN it last fired, not just that it did
    lastRun: { ago: 'Monday', ok: true },
  },
];
