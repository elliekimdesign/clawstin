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

// Use Case B's standing rule: "When a PR is ready for my review, block
// time on my calendar for it." Event-triggered (a PR arrives), not
// schedule-based — the one rule that exists in this build.
export const AUTOPILOT_RULES: AutopilotRule[] = [
  {
    key: 'github-pr-review',
    app: 'github',
    name: 'PR review time',
    runs: 1,
    undone: 0,
    threadId: 't2',
    recent: [{ label: 'Blocked 10:00–10:30 for auth-service #482', ago: '2m' }],
  },
];

/** ago strings like "12d" with 8+ days = no run in the last week. */
export function isInactiveAgo(ago?: string): boolean {
  const m = ago?.match(/^(\d+)d$/);
  return !!m && Number(m[1]) >= 8;
}
