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
  /** WHERE it happened (2026-07-22 row grammar: front = who, back =
   * where + when): the product glyph trailing before the age */
  app?: 'gmail' | 'github' | 'drive' | 'calendar';
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
  /** WHERE it ran — trailing product glyph, same as highlights */
  app?: 'gmail' | 'github' | 'drive' | 'calendar';
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

// DEMO DATA WIPED 2026-07-28 ("기존에 있던 모든 프롬프트 데이터랑 홈탭
// 부분이 전부 지워져야 해"): the briefing / PR-block / dinner era lives in
// git. The shapes stay; the new mock world seeds fresh rows here.
export const AWAY_DIGEST: AwayDigest = {
  auto: [],
  routines: [],
  asked: [],
};
