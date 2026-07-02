import type { Approval } from '@/components/ui/approval-card';

export const initialApprovals: Approval[] = [
  {
    id: 'ap1',
    icon: 'mail',
    title: 'Send email to Sophia',
    detail: 'Reply confirming the Thursday meeting.',
    permissionKey: 'gmail',
    risk: 'write',
    policy: 'Needs your approval',
    allowlisted: true,
  },
  {
    id: 'ap2',
    icon: 'card',
    title: 'Confirm payment · $24.00',
    detail: 'Renew your domain openclaw.dev for 1 year.',
    risk: 'write',
    policy: 'Needs your approval',
    allowlisted: false,
  },
  {
    id: 'ap3',
    icon: 'terminal',
    title: 'Run cleanup script',
    detail: 'Delete 12 temp files in ~/project.',
    risk: 'exec',
    command: 'rm -rf ./tmp/*',
    policy: 'Not in allowlist',
    allowlisted: false,
  },
];
