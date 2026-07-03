import { Ionicons } from '@expo/vector-icons';

/** Reuse the status-popover's 3-color health convention. */
export type InfraState = 'connected' | 'degraded' | 'down';

export type InfraKind = 'gateway' | 'token';

export type InfraEndpoint = {
  id: string; // route param + setter key
  label: string; // "OpenClaw Gateway"
  icon: keyof typeof Ionicons.glyphMap;
  kind: InfraKind;
  value: string; // raw value (real address; real token)
  masked: boolean; // tokens render masked in the row
  state: InfraState; // drives the dot color
};

export const initialInfra: InfraEndpoint[] = [
  {
    id: 'gateway',
    label: 'OpenClaw Gateway',
    icon: 'globe-outline',
    kind: 'gateway',
    value: 'http://192.168.1.50:8000',
    masked: false,
    state: 'connected',
  },
  {
    id: 'oc35-token',
    label: 'Claude 3.5 Sonnet API Token',
    icon: 'key-outline',
    kind: 'token',
    value: 'sk-live-9f3c2a771b04e5d6a8f14a2f',
    masked: true,
    state: 'degraded', // mirrors services.ts oc35
  },
  {
    id: 'hermes-token',
    // hosting source made explicit — "Hermes-70B" alone doesn't say where it runs
    label: 'Nous Hermes 70B (Ollama) API Token',
    icon: 'key-outline',
    kind: 'token',
    value: 'hb-70b-4c1e8a92d7f0b3569e2c1d8f',
    masked: true,
    state: 'connected',
  },
];

/** Display form for a token: mask the middle, keep the last 4 chars. */
export function maskToken(value: string): string {
  const tail = value.slice(-4);
  return `sk-••••••••${tail}`;
}
