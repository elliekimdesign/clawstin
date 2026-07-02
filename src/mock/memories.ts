export type Memory = {
  id: string;
  group: 'You' | 'People' | 'Projects' | 'Preferences';
  emoji: string;
  text: string;
};

export const initialMemories: Memory[] = [
  { id: 'm1', group: 'You', emoji: '👤', text: 'Junior product designer based in Seoul.' },
  { id: 'm2', group: 'You', emoji: '🌏', text: 'Korean is first language; prefers simple English explanations.' },
  { id: 'm3', group: 'Preferences', emoji: '☀️', text: 'Prefers morning meetings before 11 AM.' },
  { id: 'm4', group: 'Preferences', emoji: '✉️', text: 'Likes short, friendly email replies.' },
  { id: 'm5', group: 'Projects', emoji: '💼', text: 'Building OpenClaw — a self-hosted AI agent server.' },
  { id: 'm6', group: 'People', emoji: '🧑‍💻', text: 'Jamie is a teammate on the OpenClaw project.' },
];
