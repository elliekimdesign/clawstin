/** Pending pull requests the crew pulls from the connected Devtools
 * (GitHub) gateway tool — mock data for the multi-tool demo. */
export type PendingPR = {
  id: string;
  title: string;
  branch: string;
  hash: string;
  status: 'review' | 'passed';
};

export const PENDING_PRS: PendingPR[] = [
  {
    id: 'pr1',
    title: 'Fix auth token refresh',
    branch: 'fix/token-refresh',
    hash: '#a1b2c3d',
    status: 'review',
  },
  {
    id: 'pr2',
    title: 'Add rate limiter to gateway',
    branch: 'feat/rate-limit',
    hash: '#e4f5a6b',
    status: 'review',
  },
  {
    id: 'pr3',
    title: 'Migrate logs to structured JSON',
    branch: 'chore/log-json',
    hash: '#c7d8e9f',
    status: 'passed',
  },
];
