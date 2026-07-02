export type CrewSkill = { label: string; on: boolean };

export type CrewMember = {
  id: string;
  name: string;
  /** circle face emoji — temporary placeholder for the crew profile pic (user swaps later) */
  emoji: string;
  /** one-line tagline shown under the name */
  role: string;
  skills: CrewSkill[];
  active: boolean;
};

export const initialCrew: CrewMember[] = [
  {
    id: 'muppet',
    name: 'Muppet',
    emoji: '🧑‍🚀',
    role: 'Orchestrator · coordinates the crew',
    skills: [
      { label: 'Delegate tasks', on: true },
      { label: 'Prioritize', on: true },
      { label: 'Summarize the day', on: true },
    ],
    active: true,
  },
  {
    id: 'scout',
    name: 'Scout',
    emoji: '🔎',
    role: 'Researcher · digs up the facts',
    skills: [
      { label: 'Web research', on: true },
      { label: 'Fact-check', on: true },
      { label: 'Compare options', on: false },
    ],
    active: true,
  },
  {
    id: 'quill',
    name: 'Quill',
    emoji: '📝',
    role: 'Summarizer · turns noise into notes',
    skills: [
      { label: 'Summarize emails', on: true },
      { label: 'TL;DR threads', on: true },
      { label: 'Extract action items', on: true },
    ],
    active: true,
  },
  {
    id: 'pilot',
    name: 'Pilot',
    emoji: '🗓️',
    role: 'Scheduler · guards your calendar',
    skills: [
      { label: 'Book meetings', on: true },
      { label: 'Find free slots', on: true },
      { label: 'Send reminders', on: false },
    ],
    active: false,
  },
];
