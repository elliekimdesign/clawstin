import { Ionicons } from '@expo/vector-icons';

export type CrewSkill = { label: string; on: boolean };

export type CrewMember = {
  id: string;
  name: string;
  /** avatar icon — placeholder for the crew profile pic (user swaps later) */
  icon: keyof typeof Ionicons.glyphMap;
  /** one-line tagline shown under the name */
  role: string;
  skills: CrewSkill[];
  active: boolean;
  /** completed task count (mock) — drives the usage bar on the crew card */
  tasksDone: number;
  /** perf mock: % of runs completed with zero user intervention */
  autonomy: number;
  /** perf mock: hours of human work saved this week */
  timeSavedH: number;
  /** perf mock: tokens spent this week, in millions */
  tokensM: number;
};

export const initialCrew: CrewMember[] = [
  {
    id: 'muppet',
    name: 'Frog',
    icon: 'rocket-outline',
    role: 'Orchestrator · coordinates the crew',
    skills: [
      { label: 'Delegate tasks', on: true },
      { label: 'Prioritize', on: true },
      { label: 'Summarize the day', on: true },
    ],
    active: true,
    tasksDone: 128,
    autonomy: 92,
    timeSavedH: 6.5,
    tokensM: 2.1,
  },
  {
    id: 'scout',
    name: 'Beaker',
    icon: 'search-outline',
    role: 'Research · digs up the facts',
    skills: [
      { label: 'Web research', on: true },
      { label: 'Fact-check', on: true },
      { label: 'Compare options', on: false },
    ],
    active: true,
    tasksDone: 96,
    autonomy: 88,
    timeSavedH: 4.5,
    tokensM: 3.4,
  },
  {
    id: 'quill',
    name: 'Miss Piggy',
    icon: 'create-outline',
    role: 'Scribe · turns noise into notes',
    skills: [
      { label: 'Summarize emails', on: true },
      { label: 'TL;DR threads', on: true },
      { label: 'Extract action items', on: true },
    ],
    active: true,
    tasksDone: 34,
    autonomy: 95,
    timeSavedH: 1.8,
    tokensM: 0.6,
  },
  {
    id: 'pilot',
    name: 'Gonzo',
    icon: 'calendar-clear-outline',
    role: 'Operator · guards your calendar',
    skills: [
      { label: 'Book meetings', on: true },
      { label: 'Find free slots', on: true },
      { label: 'Send reminders', on: false },
    ],
    active: true,
    tasksDone: 57,
    autonomy: 90,
    timeSavedH: 3.2,
    tokensM: 1.3,
  },
];
