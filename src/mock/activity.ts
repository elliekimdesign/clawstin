import { Ionicons } from '@expo/vector-icons';

export type ActivityItem = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  time: string;
};

export const initialActivity: ActivityItem[] = [
  { id: 'a1', icon: 'checkmark-circle', title: 'Summarized 4 new emails', time: '8m ago' },
  { id: 'a2', icon: 'calendar', title: 'Booked dentist · Tue 10:00 AM', time: '1h ago' },
  { id: 'a3', icon: 'document-text', title: 'Drafted reply to Jamie', time: '2h ago' },
  { id: 'a4', icon: 'sparkles', title: 'Cleaned up 12 spam messages', time: 'Yesterday' },
];
