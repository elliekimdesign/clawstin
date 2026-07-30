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
  /** TWO FIELDS, NOT ONE SENTENCE (2026-07-30): this used to be a single
   * string, "Orchestrator · routes work across the crew", and six screens
   * recovered the role word with .split(' · ')[0]. That made a punctuation
   * mark load-bearing — editing the copy could silently break every role
   * tag in the app. Split apart, each consumer reads the field it means. */

  /** the one-word role, e.g. 'Lead'. Rendered as the small caps tag. */
  roleWord: string;
  /** what the member does, in plain words and lowercase, e.g. 'routes work
   * across the crew'. Reads as a continuation of roleWord, never alone. */
  roleLine: string;
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
    // LEAD, was Orchestrator (2026-07-30): plain word over job title
    roleWord: 'Lead',
    roleLine: 'routes work across the crew',
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
    roleWord: 'Research',
    roleLine: 'reads and digests anything',
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
    roleWord: 'Scribe',
    roleLine: 'turns noise into notes',
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
    // ACTIONS, was Operator (2026-07-30)
    roleWord: 'Actions',
    roleLine: 'guards your calendar',
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
