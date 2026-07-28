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

// DEMO DATA WIPED 2026-07-28: the old seeded world lives in git;
// fresh mock data lands here next.
export const UNDOABLES: Undoable[] = [];
