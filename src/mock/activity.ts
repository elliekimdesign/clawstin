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
};

export const initialActivity: ActivityItem[] = [
  {
    id: 'a1', time: '16:40', day: 'today', ago: '2h',
    prompt: 'Plan my week and delegate the research tasks',
    agentId: 'muppet', threadId: 't2', total: '6.8s',
    steps: [
      { label: 'calendar.freebusy', ms: '180ms' },
      { label: 'crew.dispatch scout x2', ms: '95ms' },
      { label: 'draft weekly plan', ms: '5.1s' },
    ],
  },
  {
    id: 'a2', time: '15:12', day: 'today', ago: '3h',
    prompt: 'Summarize open source AI trends',
    agentId: 'scout', threadId: 't3', total: '11.4s',
    steps: [
      { label: 'search google x4', ms: '2.1s' },
      { label: 'fetch 6 pages', ms: '3.4s' },
      { label: 'summarize 6 sources', ms: '5.2s' },
    ],
  },
  {
    id: 'a3', time: '14:22', day: 'today', ago: '4h',
    prompt: 'Find API docs for Stripe',
    agentId: 'scout', threadId: 't3', total: '3.9s',
    steps: [
      { label: 'search google x2', ms: '1.2s' },
      { label: 'fetch docs.stripe.com', ms: '640ms' },
    ],
  },
  {
    id: 'a4', time: '11:05', day: 'today', ago: '7h',
    prompt: 'Rewrite my standup notes into a summary',
    agentId: 'quill', threadId: 't1', total: '4.6s',
    steps: [
      { label: 'notes.read standup', ms: '120ms' },
      { label: 'rewrite 3 sections', ms: '4.1s' },
    ],
  },
  {
    id: 'a5', time: '09:30', day: 'today', ago: '9h',
    prompt: 'Book a table for Friday at 7pm',
    agentId: 'pilot', threadId: 't2', status: 'needs_approval',
    steps: [
      { label: 'opentable.search', ms: '420ms' },
      { label: 'hold slot 19:00 x2', ms: '310ms' },
      { label: 'awaiting your approval', state: 'wait' },
    ],
  },
  {
    id: 'a6', time: '08:15', day: 'today', ago: '10h',
    prompt: 'Prep a morning briefing from my inbox',
    agentId: 'muppet', threadId: 't1', total: '8.2s',
    steps: [
      { label: 'gmail.messages.list', ms: '350ms' },
      { label: 'read 14 emails', ms: '2.6s' },
      { label: 'compose briefing', ms: '4.9s' },
    ],
  },
  {
    id: 'a7', time: '18:02', day: 'yesterday', ago: '1d',
    prompt: 'Reschedule my dentist to next week',
    agentId: 'pilot', threadId: 't2', total: '5.4s',
    steps: [
      { label: 'calendar.events.find dentist', ms: '210ms' },
      { label: 'calendar.events.move', ms: '480ms' },
      { label: 'notify via email', ms: '1.9s' },
    ],
  },
  {
    id: 'a8', time: '16:44', day: 'yesterday', ago: '1d',
    prompt: 'Draft a launch post for the beta',
    agentId: 'quill', threadId: 't3', total: '9.1s',
    steps: [
      { label: 'read product notes', ms: '380ms' },
      { label: 'draft 2 versions', ms: '7.8s' },
    ],
  },
  {
    id: 'a9', time: '13:20', day: 'yesterday', ago: '1d',
    prompt: 'Compare flight prices to Seoul in October',
    agentId: 'scout', threadId: 't1', status: 'failed',
    steps: [
      { label: 'skyscanner.search ICN', ms: '1.4s' },
      { label: 'retry x2 rate limited', state: 'err' },
      { label: 'timeout after 8s', state: 'err' },
    ],
  },
  {
    id: 'a10', time: '10:08', day: 'yesterday', ago: '1d',
    prompt: 'Clean up my spam and sort the new contacts',
    agentId: 'muppet', threadId: 't1', total: '7.7s',
    steps: [
      { label: 'gmail.spam.purge 12', ms: '900ms' },
      { label: 'contacts.dedupe 20', ms: '3.1s' },
      { label: 'apply labels x5', ms: '1.8s' },
    ],
  },
];
