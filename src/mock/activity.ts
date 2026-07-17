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
};

// Two use cases only: A = dinner with Jenna (t1), B = the PR-review
// negotiation (t2). Every row here is a real beat from one of the two
// storyboards, newest first.
export const initialActivity: ActivityItem[] = [
  {
    id: 'a1', time: '16:52', day: 'today', ago: '2m',
    prompt: 'Book dinner with Jenna',
    agentId: 'pilot', threadId: 't1', total: '1.4s',
    steps: [
      { label: 'contacts.lookup Jenna', ms: '180ms' },
      { label: 'calendar.freebusy Jenna', ms: '600ms' },
      { label: 'propose 3 slots', ms: '620ms' },
    ],
  },
  {
    id: 'a2', time: '16:40', day: 'today', ago: '15m',
    prompt: "Keep an eye on PRs waiting on me. If I'm sitting on one, grab me 30 min.",
    agentId: 'muppet', threadId: 't2', total: '0.4s',
    steps: [{ label: 'watch  github.pulls, standing rule armed', ms: '400ms' }],
  },
  {
    id: 'a3', time: '16:46', day: 'today', ago: '6m',
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
    id: 'a4', time: '15:12', day: 'today', ago: '1h',
    prompt: 'Can\'t — I\'m on call this afternoon.',
    agentId: 'muppet', threadId: 't2', total: '0.7s',
    steps: [
      { label: 'replan  checking tomorrow morning', ms: '400ms' },
      { label: 'synthesize  10:00 before standup is open', ms: '300ms' },
    ],
  },
];
