// Status vocabulary is exactly three words, mapped 1:1 to colors:
// Operational (green) / Degraded (amber) / Offline (red).
export type ServiceState = 'operational' | 'degraded' | 'down';

export type ServiceGroup = 'core' | 'llm';

export type ServiceStatus = {
  id: string;
  name: string;
  group: ServiceGroup;
  state: ServiceState;
  /** short cause shown under the name when not operational */
  reason?: string;
  /** optional latency, rendered in mono ("42ms") */
  pingMs?: number;
};

// Agent state intentionally lives in the Crew tab, not here — this list is
// the system/infra healthcheck only.
export const initialServices: ServiceStatus[] = [
  { id: 'core', name: 'Clawstin Core', group: 'core', state: 'operational' },
  {
    id: 'oc35',
    name: 'Claude 3.5 Sonnet',
    group: 'llm',
    state: 'degraded',
    reason: 'elevated error rate',
    pingMs: 42,
  },
  {
    id: 'hermes',
    name: 'Nous Hermes 70B',
    group: 'llm',
    state: 'operational',
    pingMs: 8,
  },
];
