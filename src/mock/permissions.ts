import { Ionicons } from '@expo/vector-icons';

/**
 * source models where the connection actually lives: 'connected' items were
 * set up on OpenClaw Web and are live; 'available' items still need setup
 * there (the mobile app is a controller, not where OAuth happens).
 */
export type PermissionSource = 'connected' | 'available';

export type Permission = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  name: string;
  detail: string;
  enabled: boolean;
  source: PermissionSource;
  /** setup URL on OpenClaw Web — present when source === 'available' */
  setupUrl?: string;
};

export type RequestLogItem = {
  id: string;
  text: string;
  time: string;
  result: 'Approved' | 'Denied';
};

export const initialPermissions: Permission[] = [
  {
    key: 'calendar',
    icon: 'calendar',
    name: 'Calendar',
    detail: 'View & create events',
    enabled: true,
    source: 'connected',
  },
  {
    key: 'contacts',
    icon: 'people',
    name: 'Contacts',
    detail: 'Look up people',
    enabled: true,
    source: 'connected',
  },
  // Available order matters — the first 3 are what the compact list shows
  // on the Access screen (Email, Smart Home, Devtools); the rest only surface
  // via "More".
  {
    key: 'gmail',
    icon: 'mail',
    name: 'Email',
    detail: 'Read & draft emails',
    enabled: false,
    source: 'available',
    setupUrl: 'https://web.openclaw.ai/setup/gmail',
  },
  {
    key: 'google-home',
    icon: 'home',
    name: 'Smart Home',
    detail: 'Control smart home devices',
    enabled: false,
    source: 'available',
    setupUrl: 'https://web.openclaw.ai/setup/google-home',
  },
  {
    key: 'github',
    icon: 'logo-github',
    name: 'Devtools',
    detail: 'Watch repos & PRs',
    enabled: false,
    source: 'available',
    setupUrl: 'https://web.openclaw.ai/setup/github',
  },
  {
    key: 'files',
    icon: 'folder',
    name: 'Files',
    detail: 'Read documents',
    enabled: false,
    source: 'available',
    setupUrl: 'https://web.openclaw.ai/setup/files',
  },
  {
    key: 'health',
    icon: 'fitness',
    name: 'Health',
    detail: 'Track health & wellness data',
    enabled: false,
    source: 'available',
    setupUrl: 'https://web.openclaw.ai/setup/health',
  },
];

export const initialRequestLog: RequestLogItem[] = [
  { id: 'r1', text: 'Calendar access by Muppet', time: '2h ago', result: 'Approved' },
  { id: 'r2', text: 'Files access by Muppet', time: 'Yesterday', result: 'Denied' },
];
