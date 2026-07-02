import { Ionicons } from '@expo/vector-icons';

export type Permission = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  name: string;
  detail: string;
  enabled: boolean;
};

export type RequestLogItem = {
  id: string;
  text: string;
  time: string;
  result: 'Approved' | 'Denied';
};

export const initialPermissions: Permission[] = [
  { key: 'gmail', icon: 'mail', name: 'Gmail', detail: 'Read & draft emails', enabled: false },
  { key: 'calendar', icon: 'calendar', name: 'Calendar', detail: 'View & create events', enabled: true },
  { key: 'files', icon: 'folder', name: 'Files', detail: 'Read documents', enabled: false },
  { key: 'contacts', icon: 'people', name: 'Contacts', detail: 'Look up people', enabled: true },
  { key: 'payments', icon: 'card', name: 'Payments', detail: 'Confirm purchases', enabled: false },
];

export const initialRequestLog: RequestLogItem[] = [
  { id: 'r1', text: 'Calendar access by Muppet', time: '2h ago', result: 'Approved' },
  { id: 'r2', text: 'Files access by Muppet', time: 'Yesterday', result: 'Denied' },
];
