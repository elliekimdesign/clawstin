import { Ionicons } from '@expo/vector-icons';

export type Memory = {
  id: string;
  group: 'You' | 'People' | 'Projects' | 'Preferences';
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
};

export const initialMemories: Memory[] = [
  { id: 'm1', group: 'You', icon: 'person-outline', text: 'Junior product designer based in Seoul.' },
  { id: 'm2', group: 'You', icon: 'globe-outline', text: 'Korean is first language; prefers simple English explanations.' },
  { id: 'm3', group: 'Preferences', icon: 'sunny-outline', text: 'Prefers morning meetings before 11 AM.' },
  { id: 'm4', group: 'Preferences', icon: 'mail-outline', text: 'Likes short, friendly email replies.' },
  { id: 'm5', group: 'Projects', icon: 'briefcase-outline', text: 'Building OpenClaw, a self-hosted AI agent server.' },
  { id: 'm6', group: 'People', icon: 'code-slash-outline', text: 'Jamie is a teammate on the OpenClaw project.' },
];
