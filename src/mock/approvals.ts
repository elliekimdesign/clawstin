import type { Approval } from '@/components/ui/approval-card';

// Approvals only come from tools that are actually connected in Access
// (Calendar, Contacts, Devtools) — no payments, nothing outside the
// toolset. Every approval lives IN a chat thread (threadId): the agent
// asks in a bubble and the answer happens right there, never on a
// separate review screen. `items` = what exactly gets touched.
export const initialApprovals: Approval[] = [
  {
    id: 'ap1',
    icon: 'calendar',
    title: 'Move standup to 10:30 AM',
    detail: 'Reschedule tomorrow standup and notify the attendees.',
    permissionKey: 'calendar',
    risk: 'write',
    policy: 'Needs your approval',
    allowlisted: true,
    age: '2h',
    threadId: 'ta1',
    actionLabel: 'Move it',
    // The stamp records the APPROVAL; execution reports separately —
    // this one hits a conflict (see the edge-case flow in app-store).
    receipt: 'Approved',
    items: [
      { label: 'Daily standup', detail: '10:00 AM · 5 attendees' },
      { label: 'Proposed', detail: '10:30 AM · same link' },
    ],
  },
  {
    id: 'ap2',
    icon: 'people',
    // No deadline, long ignored: never deleted, never nagged — it just
    // soft-ages (sinks to the bottom of the list, dimmed).
    title: 'Merge 3 duplicate contacts',
    detail: 'Combine duplicates found in your address book.',
    permissionKey: 'contacts',
    risk: 'write',
    policy: 'Needs your approval',
    allowlisted: false,
    age: '3d',
    threadId: 'ta2',
    actionLabel: 'Merge 3',
    receipt: 'Merged successfully',
    items: [
      { label: 'Josh P.', detail: '+1 415-555-0182' },
      { label: 'Josh Preissle', detail: 'josh@preissle.dev' },
      { label: 'J. Preissle', detail: '(no info)' },
    ],
  },
  {
    id: 'ap3',
    icon: 'calendar',
    title: 'Decline the Friday 4pm invite',
    detail: 'It conflicts with your focus block.',
    permissionKey: 'calendar',
    risk: 'write',
    policy: 'Needs your approval',
    allowlisted: true,
    age: '4h',
    threadId: 'ta3',
    actionLabel: 'Decline it',
    receipt: 'Invite declined',
    items: [
      { label: 'Quarterly sync', detail: 'Fri 4:00 PM · from Dana' },
      { label: 'Conflicts with', detail: 'Focus block 3:00-5:00 PM' },
    ],
  },
];

/** The staged nudge approval: lands a few seconds after the board comes
 * up, announced by the floating pill. A Devtools case — the crew watched
 * CI go green and asks for the merge. */
export const landedApproval: Approval = {
  id: 'ap4',
  icon: 'git-merge',
  title: 'Merge the passing PR',
  detail: 'chore/log-json passed every check.',
  permissionKey: 'github',
  risk: 'write',
  policy: 'Needs your approval',
  allowlisted: false,
  age: 'now',
  threadId: 'ta4',
  actionLabel: 'Merge PR',
  // Approval is preserved even when execution fails (GitHub 502 flow).
  receipt: 'Approved',
  items: [
    { label: 'Migrate logs to structured JSON', detail: 'chore/log-json · #7b2fa19' },
    { label: 'Checks', detail: '12 passed · 0 failed' },
  ],
};
