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
export const initialActivity: ActivityItem[] = [
  {
    id: 'a1', time: '16:52', day: 'today', ago: '2m', kind: 'task',
    prompt: 'Book dinner with Jenna',
    agentId: 'pilot', threadId: 't1', total: '1.4s',
    steps: [
      { label: 'contacts.lookup Jenna', ms: '180ms' },
      { label: 'calendar.freebusy Jenna', ms: '600ms' },
      { label: 'propose 3 slots', ms: '620ms' },
    ],
  },
  {
    id: 'a2', time: '16:40', day: 'today', ago: '15m', kind: 'task',
    prompt: "Keep an eye on PRs waiting on me. If I'm sitting on one, grab me 30 min.",
    agentId: 'muppet', threadId: 't2', total: '0.4s',
    steps: [{ label: 'watch  github.pulls, standing rule armed', ms: '400ms' }],
  },
  {
    id: 'a3', time: '16:46', day: 'today', ago: '6m', kind: 'task',
    prompt: 'PR review time, standing watch',
    agentId: 'muppet', threadId: 't2', status: 'needs_approval',
    source: 'autopilot', ruleKey: 'github-pr-review',
    steps: [
      { label: 'github.pulls.list · 2 waiting', ms: '340ms' },
      { label: 'calendar.freebusy today', ms: '210ms' },
      { label: 'awaiting your approval', state: 'wait' },
    ],
  },
  {
    id: 'a4', time: '15:12', day: 'today', ago: '1h', kind: 'chat',
    prompt: 'Can\'t — I\'m on call this afternoon.',
    agentId: 'muppet', threadId: 't2', total: '0.7s',
    steps: [
      { label: 'replan  checking tomorrow morning', ms: '400ms' },
      { label: 'synthesize  10:00 before standup is open', ms: '300ms' },
    ],
  },
  {
    id: 'a7', time: '07:30', day: 'today', ago: '9h', kind: 'task',
    prompt: 'Morning briefing, delivered',
    agentId: 'quill', threadId: 't3', total: '6.1s',
    steps: [
      { label: 'calendar.events today', ms: '420ms' },
      { label: 'github.pulls.list · 1 waiting', ms: '380ms' },
      { label: 'write briefing in your voice', ms: '2.8s' },
    ],
  },
  // the three overnight quiet checks WYWA folds into "+3 routine runs"
  {
    id: 'a8', time: '06:50', day: 'today', ago: '10h', kind: 'task',
    prompt: 'PR watch, quiet check',
    agentId: 'muppet', threadId: 't2', total: '0.3s',
    source: 'autopilot', ruleKey: 'github-pr-review',
    steps: [{ label: 'github.pulls.list · 0 new', ms: '300ms' }],
  },
  {
    id: 'a9', time: '04:10', day: 'today', ago: '13h', kind: 'task',
    prompt: 'PR watch, quiet check',
    agentId: 'muppet', threadId: 't2', total: '0.3s',
    source: 'autopilot', ruleKey: 'github-pr-review',
    steps: [{ label: 'github.pulls.list · 0 new', ms: '280ms' }],
  },
  {
    id: 'a10', time: '01:30', day: 'today', ago: '15h', kind: 'task',
    prompt: 'PR watch, quiet check',
    agentId: 'muppet', threadId: 't2', total: '0.3s',
    source: 'autopilot', ruleKey: 'github-pr-review',
    steps: [{ label: 'github.pulls.list · 0 new', ms: '310ms' }],
  },
  {
    id: 'a5', time: '18:24', day: 'yesterday', ago: '1d', kind: 'task',
    prompt: 'Shortlist three quiet places near the office for dinner',
    agentId: 'scout', threadId: 't1', total: '3.1s',
    steps: [
      { label: 'search maps x3', ms: '1.2s' },
      { label: 'read reviews x12', ms: '1.4s' },
      { label: 'rank by noise and distance', ms: '500ms' },
    ],
  },
  {
    id: 'a6', time: '17:05', day: 'yesterday', ago: '1d', kind: 'chat',
    prompt: 'TL;DR the two PRs waiting on me',
    agentId: 'quill', threadId: 't2', total: '2.2s',
    steps: [
      { label: 'github.pulls.diff x2', ms: '900ms' },
      { label: 'summarize in your voice', ms: '1.3s' },
    ],
  },
];
