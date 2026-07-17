import type { Approval } from '@/components/ui/approval-card';

// Two use cases, two approval moments — both from Use Case B's PR-review
// negotiation. Every approval lives IN a chat thread (threadId): the
// agent asks in a bubble and the answer happens right there, never on a
// separate review screen. `items` = what exactly gets touched.
export const initialApprovals: Approval[] = [
  {
    // beat 4: the first proposed slot, rejected by the user (denyLabel
    // matches the script's "Pick another time" rather than a bare "Deny")
    id: 'ap1',
    icon: 'git-pull-request',
    title: 'Block 2:00–2:30 for PR review',
    detail: 'auth-service #482 has been waiting since 9:40.',
    risk: 'write',
    policy: 'Needs your approval',
    allowlisted: true,
    age: 'now',
    threadId: 't2',
    actionLabel: 'Block 2:00–2:30',
    denyLabel: 'Pick another time',
    // GitHub READ (watching the queue) + Calendar WRITE (booking the
    // block) at once — SCOPE_NAME only ever names one tool, so this
    // combined line is spelled out explicitly.
    scopeOverride: 'GitHub READ · Calendar WRITE',
    items: [
      { label: 'auth-service #482', detail: 'waiting since 9:40' },
      { label: 'Blocks', detail: '2:00–2:30 PM today' },
    ],
  },
  {
    // beat 6: the re-proposed slot, approved
    id: 'ap2',
    icon: 'git-pull-request',
    title: 'Block 10:00–10:30 for PR review',
    detail: 'Tomorrow, before standup.',
    risk: 'write',
    policy: 'Needs your approval',
    allowlisted: true,
    age: 'now',
    threadId: 't2',
    actionLabel: 'Block 10:00–10:30',
    denyLabel: 'Pick another time',
    scopeOverride: 'GitHub READ · Calendar WRITE',
    receipt: 'Blocked 10:00–10:30',
    items: [
      { label: 'auth-service #482', detail: 'review time' },
      { label: 'Blocks', detail: 'Tomorrow 10:00–10:30 AM' },
    ],
  },
];
