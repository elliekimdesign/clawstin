import type { Approval } from '@/components/ui/approval-card';

// Two use cases, two approval moments — both from Use Case B's PR-review
// negotiation. Every approval lives IN a chat thread (threadId): the
// agent asks in a bubble and the answer happens right there, never on a
// separate review screen. `items` = what exactly gets touched.
// THE NEW MOCK WORLD (2026-07-29). Two asks waiting on Ellie, both from
// work the crew already did: an interview to schedule, and a PR review to
// protect time for. Each opens its own thread, where the choice is made.
export const initialApprovals: Approval[] = [
  {
    id: 'iv1',
    icon: 'calendar-clear-outline',
    title: 'Found 3 slots that work for the candidate interview',
    detail: 'Thursday 10 AM, Thursday 2 PM, or Friday 11 AM. Which one?',
    permissionKey: 'calendar',
    risk: 'write',
    threadId: 'tv1',
    age: 'now',
    // the three slots ARE the choice: each button books one (no em dashes
    // anywhere in product copy, per the standing rule)
    items: [
      { label: 'Thursday 10 AM', detail: 'clear all morning' },
      { label: 'Thursday 2 PM', detail: 'after the design sync' },
      { label: 'Friday 11 AM', detail: 'clear all morning' },
    ],
    actionLabel: 'Book Thursday 10 AM',
    denyLabel: 'None of these',
    receipt: 'Interview booked',
  },
  {
    id: 'pr1',
    icon: 'logo-github',
    title: 'PRs #482 and #489 have been waiting on your review since Sunday',
    detail: 'Block 45 min today at 2 PM?',
    permissionKey: 'calendar',
    risk: 'write',
    threadId: 'tv2',
    age: '2d',
    items: [
      { label: '#482 auth-service', detail: 'waiting since Sunday' },
      { label: '#489 billing-api', detail: 'waiting since Sunday' },
    ],
    // ONE option, so the button names the time itself
    actionLabel: 'Block 2 PM today',
    denyLabel: 'Not today',
    receipt: 'Review time blocked',
  },
];
