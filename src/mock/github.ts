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
    hash: '#9f31c07',
    status: 'review',
  },
  {
    id: 'pr2',
    title: 'Add rate limiter to gateway',
    branch: 'feat/rate-limit',
    hash: '#c4e08d2',
    status: 'review',
  },
  {
    id: 'pr3',
    title: 'Migrate logs to structured JSON',
    branch: 'chore/log-json',
    hash: '#7b2fa19',
    status: 'passed',
  },
];
