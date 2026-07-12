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

export const initialActivity: ActivityItem[] = [
  // Autopilot runs: no prompt asked for these; a rule or schedule fired.
  {
    id: 'ap-run1', time: '16:52', day: 'today', ago: '2m',
    prompt: 'Email cleanup, rule run',
    agentId: 'muppet', threadId: 't1', total: '2.4s',
    source: 'autopilot', ruleKey: 'email-cleanup',
    steps: [
      { label: 'gmail.messages.list', ms: '350ms' },
      { label: 'summarize 4 new emails', ms: '1.6s' },
    ],
  },
  {
    id: 'ap-run2', time: '16:52', day: 'today', ago: '2m',
    prompt: 'Newsletter archiving, rule run',
    agentId: 'muppet', threadId: 't1', total: '1.9s',
    source: 'autopilot', ruleKey: 'newsletter-archiving',
    steps: [
      { label: 'match list.promotions x12', ms: '240ms' },
      { label: 'archive 12 emails', ms: '1.3s' },
    ],
  },
  {
    id: 'ap-run3', time: '16:50', day: 'today', ago: '4m',
    prompt: 'GitHub labeling, rule run',
    agentId: 'pilot', threadId: 't4', total: '1.2s',
    source: 'autopilot', ruleKey: 'github-labeling',
    steps: [{ label: 'label 6 notifications', ms: '900ms' }],
  },
  {
    id: 'ap-run4', time: '09:14', day: 'yesterday', ago: '1d',
    prompt: 'Newsletter archiving, rule run',
    agentId: 'muppet', threadId: 't1', total: '1.6s',
    source: 'autopilot', ruleKey: 'newsletter-archiving',
    steps: [{ label: 'archive 8 emails, undone later', ms: '1.1s' }],
  },
  {
    id: 'ap-run5', time: '09:00', day: 'yesterday', ago: '1d',
    prompt: 'Weekly review, scheduled run',
    agentId: 'quill', threadId: 't3', total: '8.2s',
    source: 'autopilot', ruleKey: 'weekly-review',
    steps: [
      { label: 'calendar.week.read', ms: '600ms' },
      { label: 'draft top 3 priorities', ms: '6.4s' },
    ],
  },
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

  // Coverage rows (2026-07-12): Activity is the COMPLETE history —
  // every thread appears here, newest first, even pure conversations.
  {
    id: 'a11', time: '12:40', day: 'today', ago: '3h',
    prompt: 'Dinner with Jenna 6 pm tmrw',
    agentId: 'muppet', threadId: 't5', total: '2.1s',
    steps: [{ label: 'calendar.freebusy fri', ms: '600ms' }],
  },
  {
    id: 'a12', time: '11:15', day: 'today', ago: '4h',
    prompt: 'Book the Saturday pottery class',
    agentId: 'muppet', threadId: 't6', total: '3.4s',
    steps: [{ label: 'browser.checkout attempt', ms: '2.2s' }],
  },
  {
    id: 'a13', time: '09:05', day: 'today', ago: '6h',
    prompt: 'Move standup to 10:30 AM',
    agentId: 'muppet', threadId: 'ta1', total: '1.8s',
    steps: [{ label: 'calendar.event.move', ms: '700ms' }],
  },
  {
    id: 'a14', time: '17:40', day: 'yesterday', ago: '1d',
    prompt: 'Merge 3 duplicate contacts',
    agentId: 'pilot', threadId: 'ta2', total: '2.6s',
    steps: [{ label: 'contacts.merge x3', ms: '1.9s' }],
  },
  {
    id: 'a15', time: '15:12', day: 'yesterday', ago: '1d',
    prompt: 'Decline the Friday 4pm invite',
    agentId: 'muppet', threadId: 'ta3', total: '1.2s',
    steps: [{ label: 'calendar.rsvp decline', ms: '500ms' }],
  },
  {
    id: 'a16', time: '14:02', day: 'yesterday', ago: '1d',
    prompt: 'Merge the passing PR',
    agentId: 'muppet', threadId: 'ta4', total: '4.0s',
    steps: [{ label: 'github.pr.merge 128', ms: '2.4s' }],
  },
];
