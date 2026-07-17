// Recent [WRITE] actions, newest first. Each knows its executor thread;
// the keywords route free-form undo asks. No visible time windows: the
// user-facing rule is "actions can be undone; if one can't, the crew
// says so right there" (the past-undo ask will arrive as a popup later).
// Shared by Home (LAST ACTION card) and the new-chat router: undo always
// goes back to the original executor in the original thread.
export type Undoable = {
  label: string;
  threadId: string;
  ask: string;
  re: RegExp;
  /** set when PART of the action can't come back (a notification
   * already delivered, an email already read): the row's button says
   * "Revert…" and arms a confirm step, and this line states exactly
   * what stays done. Reversibility honesty is part of provenance. */
  irreversible?: string;
};

export const UNDOABLES: Undoable[] = [
  {
    label: 'Booked dinner with Jenna',
    threadId: 't1',
    ask: 'Undo this: dinner with Jenna',
    re: /dinner|jenna|reservation/i,
  },
  {
    label: 'Blocked 10:00–10:30 for PR review',
    threadId: 't2',
    ask: 'Undo this: PR review block',
    re: /pr|review|auth-service/i,
    // beat 7 told Priya the review is coming; that message is out in
    // the world and no calendar delete brings it back
    irreversible: "Frees the block. Priya's heads-up stays sent.",
  },
];
