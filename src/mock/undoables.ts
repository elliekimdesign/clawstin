// Recent [WRITE] actions, newest first. Each knows its executor thread;
// the keywords route free-form undo asks. No visible time windows: the
// user-facing rule is "actions can be undone; if one can't, the crew
// says so right there" (the past-undo ask will arrive as a popup later).
// Shared by Home (LAST ACTION card) and the new-chat router: undo always
// goes back to the original executor in the original thread.
export const UNDOABLES = [
  {
    label: 'Archived 12 newsletter emails',
    threadId: 't1',
    ask: 'Undo this: archived 12 newsletter emails',
    re: /archiv|email|newsletter/i,
  },
  {
    label: 'Held 2 dinner slots for Friday',
    threadId: 't5',
    ask: 'Undo this: held 2 dinner slots',
    re: /dinner|slot|hold/i,
  },
  {
    label: 'Labeled 6 GitHub notifications',
    threadId: 't4',
    ask: 'Undo this: labeled 6 GitHub notifications',
    re: /github|label|notification/i,
  },
];
