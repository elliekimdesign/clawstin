import type { StatusKind } from '@/components/ui/status-pill';

export type Agent = {
  id: string;
  name: string;
  task: string;
  status: StatusKind;
};

export const agents: Agent[] = [
  { id: 'inbox', name: 'Inbox Sorter', task: 'Sorting inbox', status: 'running' },
  { id: 'cal', name: 'Scheduler', task: 'Watching calendar', status: 'idle' },
  { id: 'research', name: 'Researcher', task: 'Last run 2h ago', status: 'offline' },
];
