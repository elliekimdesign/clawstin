import { Ionicons } from '@expo/vector-icons';

export type ActivityDay = 'today' | 'yesterday';

export type ActivityItem = {
  id: string;
  /** kept optional for back-compat with addActivity call sites (unused in UI) */
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  time: string;
  /** crew member who did it (temp: single 'Muppet') */
  crew: string;
  /** circle face emoji — temporary placeholder for the crew profile pic */
  emoji: string;
  /** grouping bucket for day headers */
  day: ActivityDay;
};

export const initialActivity: ActivityItem[] = [
  { id: 'a1', title: 'Summarized 4 new emails', time: '8m ago', crew: 'Muppet', emoji: '🙂', day: 'today' },
  { id: 'a2', title: 'Booked dentist · Tue 10:00 AM', time: '1h ago', crew: 'Muppet', emoji: '🗓️', day: 'today' },
  { id: 'a3', title: 'Drafted reply to Jamie', time: '2h ago', crew: 'Muppet', emoji: '✍️', day: 'today' },
  { id: 'a5', title: 'Snoozed 3 low-priority pings', time: '4h ago', crew: 'Muppet', emoji: '🤖', day: 'today' },
  { id: 'a4', title: 'Cleaned up 12 spam messages', time: 'Yesterday', crew: 'Muppet', emoji: '🧹', day: 'yesterday' },
  { id: 'a6', title: 'Sorted 20 contacts into groups', time: 'Yesterday', crew: 'Muppet', emoji: '🧐', day: 'yesterday' },
  { id: 'a7', title: 'Synced calendar with Notion', time: 'Yesterday', crew: 'Muppet', emoji: '🔄', day: 'yesterday' },
];
