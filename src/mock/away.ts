/** One promoted row in the WHILE YOU WERE AWAY digest: something new
 * or user-relevant enough to earn a line. Routine repeats never appear
 * here — they fold into the digest's routineCount. */
export type AwayHighlight = {
  key: string;
  label: string;
  /** mono right edge, e.g. '7:30' */
  ago: string;
  /** the conversation this highlight opens */
  threadId: string;
  /** not yet opened — wears the ready-green dot */
  unread?: boolean;
  /** crew-initiated rows carry the responsible member's face as their
   * mark (2026-07-21); user-asked rows keep the blue mosaic dot */
  agentId?: string;
  /** links this row to an Undoable (by its label) — the row grows an
   * inline Undo/Revert button, absorbing the LAST ACTION rail
   * (2026-07-21 merge: WYWA and LAST ACTION are two states of the
   * same card, so away-time rows carry their own undo) */
  undoKey?: string;
};

/** One folded rule repeat, revealed only by expanding the "+N routine
 * runs" line in place. */
export type AwayRoutineRun = {
  key: string;
  label: string;
  ago: string;
  threadId: string;
  /** the member whose rule ran — face mark, same as highlights */
  agentId?: string;
};

/** The away delta as a DIGEST, not a ledger, split by WHO initiated
 * (2026-07-21 two-tab folder): HANDLED = routine agents acting on
 * their own; ASKED = one-off completions of things the user typed in
 * chat. Headline counts are computed per tab so they can't drift.
 * Details live in Activity; this card only briefs. */
export type AwayDigest = {
  /** autonomous tab: standing routines and rules did this alone */
  auto: AwayHighlight[];
  /** rule repeats folded into one "+N MORE" expansion under auto */
  routines: AwayRoutineRun[];
  /** one-off tab: chat-input work, done and delivered */
  asked: AwayHighlight[];
};

export const AWAY_DIGEST: AwayDigest = {
  auto: [
    {
      key: 'briefing',
      label: 'Morning briefing is ready',
      ago: '7:30',
      threadId: 't3',
      unread: true,
      agentId: 'quill',
    },
    {
      key: 'pr-block',
      label: 'PR review block confirmed',
      ago: '2m',
      threadId: 't2',
      undoKey: 'Blocked 10:00–10:30 for PR review',
      agentId: 'muppet',
    },
  ],
  // the three overnight github-pr-review quiet checks (activity a8-a10)
  routines: [
    { key: 'r1', label: 'PR watch, quiet check', ago: '10h', threadId: 't2', agentId: 'muppet' },
    { key: 'r2', label: 'PR watch, quiet check', ago: '13h', threadId: 't2', agentId: 'muppet' },
    { key: 'r3', label: 'PR watch, quiet check', ago: '15h', threadId: 't2', agentId: 'muppet' },
  ],
  asked: [
    {
      key: 'dinner',
      label: 'Booked dinner with Jenna',
      ago: '55m',
      threadId: 't1',
      undoKey: 'Booked dinner with Jenna',
    },
  ],
};
