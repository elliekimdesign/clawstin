/** AUTOPILOT rules: conditional autonomy ("when a pattern matches, act").
 * Each rule keeps a pointer to the conversation it was born in — its
 * ledger row opens that thread, where the full history lives. */

export type AutopilotRule = {
  /** stable slug used as the Logs filter value */
  key: string;
  /** which app the rule works in — drives the row's app icon */
  app: 'gmail' | 'github' | 'drive' | 'calendar';
  name: string;
  runs: number;
  undone: number;
  /** the conversation this rule came from (tap target) */
  threadId: string;
  recent: { label: string; ago: string; undone?: boolean }[];
};

export const AUTOPILOT_RULES: AutopilotRule[] = [
  {
    key: 'email-cleanup',
    app: 'gmail',
    name: 'Email cleanup',
    runs: 47,
    undone: 0,
    threadId: 't1',
    recent: [
      { label: 'Flagged 2 for reply', ago: '2m' },
      { label: 'Archived 3 stale drafts', ago: '1d' },
    ],
  },
  {
    key: 'newsletter-archiving',
    app: 'gmail',
    name: 'Newsletter archiving',
    runs: 31,
    undone: 1,
    threadId: 't1',
    recent: [
      { label: 'Archived 12 emails', ago: '2m' },
      { label: 'Archived 8 emails', ago: '1d', undone: true },
    ],
  },
  {
    key: 'github-labeling',
    app: 'github',
    name: 'GitHub labeling',
    runs: 12,
    undone: 0,
    threadId: 't4',
    recent: [{ label: 'Sorted 6 GitHub alerts', ago: '4m' }],
  },
  {
    // stale on purpose: exercises the sheet's collapsed Inactive group
    key: 'receipt-filing',
    app: 'drive',
    name: 'Receipt filing',
    runs: 5,
    undone: 0,
    threadId: 't1',
    recent: [{ label: 'Filed 3 receipts to Drive', ago: '12d' }],
  },
];

/** ago strings like "12d" with 8+ days = no run in the last week. */
export function isInactiveAgo(ago?: string): boolean {
  const m = ago?.match(/^(\d+)d$/);
  return !!m && Number(m[1]) >= 8;
}
