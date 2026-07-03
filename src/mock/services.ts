export type ServiceState = 'operational' | 'ready' | 'connected' | 'degraded' | 'down';

export type ServiceGroup = 'core' | 'llm';

export type ServiceStatus = {
  id: string;
  name: string;
  group: ServiceGroup;
  state: ServiceState;
  /** display label on the right ("Operational", "Ready", "Connected"...) */
  detail?: string;
  /** optional latency, rendered in mono ("42ms") */
  pingMs?: number;
};

export const initialServices: ServiceStatus[] = [
  { id: 'core', name: 'Clawstin Core', group: 'core', state: 'operational', detail: 'Operational' },
  { id: 'muppet', name: 'Muppet Agent', group: 'core', state: 'ready', detail: 'Ready' },
  {
    id: 'oc35',
    name: 'Claude 3.5 Sonnet',
    group: 'llm',
    state: 'degraded',
    detail: 'Degraded',
    pingMs: 42,
  },
  {
    id: 'hermes',
    name: 'Nous Hermes 70B (Ollama)',
    group: 'llm',
    state: 'connected',
    detail: 'Connected',
  },
];
