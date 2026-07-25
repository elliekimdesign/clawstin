/**
 * THE DINNER GRAPH (2026-07-22, flip-view case study): "dinner with
 * Jenna" expanded into the 4-crew backstage script. One task proves
 * both sides: the front's 30-second happy path, and the flip showing
 * every crew moving, the catchable mistake, and the reroute.
 *
 * Write-stages announce INTENT before executing (`intent`), which is
 * what makes Hold possible: the dashed "about to: ..." line is the
 * window where the human can catch what the agents cannot know.
 */

export type GraphStageStatus =
  | 'queued'
  | 'running'
  /** intent announced, not yet executed: the dashed holdable window */
  | 'about'
  | 'done'
  /** the user pulled the brake here */
  | 'held';

export type GraphStage = {
  id: string;
  /** crew pixel id (see mock/crew.ts): muppet, scout, pilot, quill */
  crew: 'muppet' | 'scout' | 'pilot' | 'quill';
  /** machine-voice stage label, lowercase (display sentence-cases) */
  label: string;
  /** wall time shown after the label, e.g. '0.8s' */
  ms: string;
  /** write-stages: the pre-commit line, shown dashed on the edge */
  intent?: string;
  /** the demo's catchable mistake lives on this stage */
  wrongBeat?: boolean;
};

/** Phase 1: the routed plan, three handoffs down the spine.
 * research (read) then action (write) then writing (draft). */
export const DINNER_STAGES: GraphStage[] = [
  {
    id: 'g-parse',
    crew: 'muppet',
    label: 'parse & plan  split into find, schedule, invite',
    ms: '0.3s',
  },
  {
    id: 'g-days',
    crew: 'scout',
    label: 'research  Jenna free Thu or Fri',
    ms: '0.8s',
  },
  {
    id: 'g-places',
    crew: 'scout',
    label: 'research  4 places near the office',
    ms: '1.1s',
  },
  {
    id: 'g-book',
    crew: 'pilot',
    label: 'execute  reserve the table',
    ms: '0.6s',
    intent: 'about to: book Prime Cut, Fri 7 PM',
    wrongBeat: true,
  },
  {
    id: 'g-invite',
    crew: 'quill',
    label: 'draft  invite in your voice',
    ms: '0.9s',
  },
];

/** Phase 2: appended after Hold + "Jenna is vegetarian" — the graph
 * grows a back-edge (pilot routing back to scout), then re-runs. */
export const DINNER_REROUTE_STAGES: GraphStage[] = [
  {
    id: 'g-rescout',
    crew: 'scout',
    label: 're-research  vegetarian near the office',
    ms: '1.2s',
  },
  {
    id: 'g-rebook',
    crew: 'pilot',
    label: 'execute  reserve the table',
    ms: '0.5s',
    intent: 'about to: book Verdura, Fri 7 PM',
  },
  {
    id: 'g-reinvite',
    crew: 'quill',
    label: 'draft  invite in your voice',
    ms: '0.9s',
  },
];

/** Chat copy for the script's front side (rule check: sentence case,
 * no em dashes, approvals resolve in the asking bubble). */
export const DINNER_COPY = {
  /** after Hold, the user types this (demo prompt suggestion) */
  userFix: 'Jenna is vegetarian',
  /** the acknowledgement that redraws the graph */
  reroute: 'Good catch. Sending Specs back out for vegetarian spots.',
  /** the closing reply above the send-invite approval */
  closing:
    'Booked Verdura for Friday 7 PM. Here is the invite for Jenna.',
  approvalTitle: 'Send the invite to Jenna?',
} as const;
