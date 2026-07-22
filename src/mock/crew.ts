import { Ionicons } from '@expo/vector-icons';

export type CrewSkill = { label: string; on: boolean };

/** one standing permission on the member's HR file — same scope grammar
 * as the approval cards ("Calendar WRITE"), but agent-level, not per-task */
export type AccessGrant = {
  tool: string;
  scope: 'READ' | 'WRITE';
  icon: keyof typeof Ionicons.glyphMap;
};

export type CrewMember = {
  id: string;
  name: string;
  /** avatar icon — placeholder for the crew profile pic (user swaps later) */
  icon: keyof typeof Ionicons.glyphMap;
  /** one-line tagline shown under the name */
  role: string;
  /** identity sentence on the Info card: what this member does, in plain words */
  desc: string;
  /** relative time of the member's most recent run (mock) */
  lastRun: string;
  /** standing permissions — the agent-level half of the transparency
   * story (the approval card's scope line is the task-level half) */
  access: AccessGrant[];
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
    name: 'Beanie',
    icon: 'rocket-outline',
    role: 'Orchestrator · routes work across the crew',
    desc: 'Requests routed to the right teammate.',
    lastRun: '2m ago',
    // the orchestrator SEES everything and touches nothing — all READ
    access: [
      { tool: 'Gmail', scope: 'READ', icon: 'mail-outline' },
      { tool: 'Calendar', scope: 'READ', icon: 'calendar-clear-outline' },
      { tool: 'Slack', scope: 'READ', icon: 'logo-slack' },
    ],
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
    name: 'Specs',
    icon: 'search-outline',
    role: 'Research · reads and digests anything',
    desc: 'Finds and summarizes information across web, docs, and code.',
    lastRun: '18m ago',
    access: [
      { tool: 'Gmail', scope: 'READ', icon: 'mail-outline' },
      { tool: 'GitHub', scope: 'READ', icon: 'logo-github' },
      { tool: 'Web', scope: 'READ', icon: 'globe-outline' },
    ],
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
    name: 'Wink',
    icon: 'create-outline',
    role: 'Scribe · turns noise into notes',
    desc: 'Writes and rewrites summaries, drafts, and notes in your voice.',
    lastRun: '1h ago',
    access: [
      { tool: 'Gmail', scope: 'READ', icon: 'mail-outline' },
      { tool: 'Docs', scope: 'WRITE', icon: 'document-text-outline' },
      { tool: 'Slack', scope: 'READ', icon: 'logo-slack' },
    ],
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
    name: 'Crop',
    icon: 'calendar-clear-outline',
    role: 'Operator · guards your calendar',
    desc: 'Takes action in the real world: book, send, click, update.',
    lastRun: '26m ago',
    // the WRITE-heavy file: seeing this next to the others self-explains
    // why the Operator's work wears approvals so often
    access: [
      { tool: 'Calendar', scope: 'WRITE', icon: 'calendar-clear-outline' },
      { tool: 'Slack', scope: 'WRITE', icon: 'logo-slack' },
      { tool: 'Maps', scope: 'READ', icon: 'map-outline' },
    ],
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
