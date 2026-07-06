import type { Approval } from '@/components/ui/approval-card';

// Approvals only come from tools that are actually connected in Access
// (Calendar, Contacts today) — no payments, nothing outside the toolset.
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
  },
  {
    id: 'ap2',
    icon: 'people',
    title: 'Merge 3 duplicate contacts',
    detail: 'Combine duplicates found in your address book.',
    permissionKey: 'contacts',
    risk: 'write',
    policy: 'Needs your approval',
    allowlisted: false,
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
  },
];
