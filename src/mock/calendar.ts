/** Mock calendar feed — what Muppet sees when it "checks your calendar". */

export type CalendarEvent = {
  id: string;
  title: string;
  start?: string; // "4:20 PM" — omit both for all-day
  end?: string;
  allDay?: boolean;
  location?: string;
  color: 'brand' | 'yellow' | 'mint';
  /** where this event syncs from; the backend mirrors Apple/Google Calendar */
  source?: 'google' | 'apple';
};

export type CalendarDay = {
  id: string;
  weekday: string; // 'Wednesday'
  date: number; // 1
  events: CalendarEvent[]; // [] = empty day (rendered dimmed)
};

export const CAL_MONTH = 'July 2026';

/**
 * A month in the life of the user: senior software engineer in San Francisco.
 * Work events sync from Google Calendar, personal ones from Apple Calendar.
 * The backend mirrors both; clawstin never owns these events.
 */
export const initialCalendarDays: CalendarDay[] = [
  {
    id: 'd-0701',
    weekday: 'Wednesday',
    date: 1,
    events: [],
  },
  {
    id: 'd-0702',
    weekday: 'Thursday',
    date: 2,
    events: [],
  },
  {
    id: 'd-0703',
    weekday: 'Friday',
    date: 3,
    events: [],
  },
  { id: 'd-0704', weekday: 'Saturday', date: 4, events: [] },
  { id: 'd-0705', weekday: 'Sunday', date: 5, events: [] },
  {
    id: 'd-0706',
    weekday: 'Monday',
    date: 6,
    events: [],
  },
  {
    id: 'd-0707',
    weekday: 'Tuesday',
    date: 7,
    events: [],
  },
  {
    id: 'd-0708',
    weekday: 'Wednesday',
    date: 8,
    events: [],
  },
  {
    id: 'd-0709',
    weekday: 'Thursday',
    date: 9,
    events: [],
  },
  { id: 'd-0710', weekday: 'Friday', date: 10, events: [] },
  {
    id: 'd-0711',
    weekday: 'Saturday',
    date: 11,
    events: [],
  },
  {
    id: 'd-0712',
    weekday: 'Sunday',
    date: 12,
    events: [],
  },
  { id: 'd-0713', weekday: 'Monday', date: 13, events: [] },
  {
    id: 'd-0714',
    weekday: 'Tuesday',
    date: 14,
    events: [],
  },
  { id: 'd-0715', weekday: 'Wednesday', date: 15, events: [] },
  {
    id: 'd-0716',
    weekday: 'Thursday',
    date: 16,
    events: [],
  },
  {
    id: 'd-0717',
    weekday: 'Friday',
    date: 17,
    events: [],
  },
  {
    id: 'd-0718',
    weekday: 'Saturday',
    date: 18,
    events: [],
  },
  { id: 'd-0719', weekday: 'Sunday', date: 19, events: [] },
  {
    id: 'd-0720',
    weekday: 'Monday',
    date: 20,
    events: [],
  },
  { id: 'd-0721', weekday: 'Tuesday', date: 21, events: [] },
  {
    id: 'd-0722',
    weekday: 'Wednesday',
    date: 22,
    events: [],
  },
  { id: 'd-0723', weekday: 'Thursday', date: 23, events: [] },
  {
    id: 'd-0724',
    weekday: 'Friday',
    date: 24,
    events: [],
  },
  { id: 'd-0725', weekday: 'Saturday', date: 25, events: [] },
  { id: 'd-0726', weekday: 'Sunday', date: 26, events: [] },
  {
    id: 'd-0727',
    weekday: 'Monday',
    date: 27,
    events: [],
  },
  { id: 'd-0728', weekday: 'Tuesday', date: 28, events: [] },
  {
    id: 'd-0729',
    weekday: 'Wednesday',
    date: 29,
    events: [],
  },
  { id: 'd-0730', weekday: 'Thursday', date: 30, events: [] },
  {
    id: 'd-0731',
    weekday: 'Friday',
    date: 31,
    events: [],
  },
];

/** Payload for the inline schedule card Muppet drops into a chat thread. */
export type ScheduleSuggestion = {
  date: number;
  title: string;
  slots: string[];
  booked?: string; // set once the user taps a slot
};

/**
 * Suggest up to 3 free slots for a day: skip times already taken by an
 * event; the user's requested time (if any) goes first.
 */
export function suggestSlots(events: CalendarEvent[], requested?: string): string[] {
  const candidates = ['10:00 AM', '1:00 PM', '3:00 PM', '5:00 PM', '7:00 PM'];
  const taken = new Set(events.map((e) => e.start).filter(Boolean));
  const free = candidates.filter((c) => !taken.has(c) && c !== requested);
  const slots = requested && !taken.has(requested) ? [requested, ...free] : free;
  return slots.slice(0, 3);
}

/**
 * Rough demo parser: does this chat message look like "put something on my
 * calendar"? Returns the event to add, or null to fall through to the normal
 * scripted replies. Intentionally simple — keyword + time-regex level.
 */
/** weekday of a July 2026 date (July 1 = Wednesday); Mon = 0 */
const dow = (date: number) => (date + 1) % 7;
const WEEKDAYS = [
  ['monday', 'mon'],
  ['tuesday', 'tue', 'tues'],
  ['wednesday', 'wed'],
  ['thursday', 'thu', 'thur', 'thurs'],
  ['friday', 'fri'],
  ['saturday', 'sat'],
  ['sunday', 'sun'],
];

export function parseScheduleRequest(
  text: string,
  todayDate: number
): { date: number; title: string; start?: string; intent: 'check' | 'book' } | null {
  const lower = text.toLowerCase();
  const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/);
  const tomorrow = lower.includes('tomorrow') || /\btmrw?\b/.test(lower);
  // FREEFORM (2026-07-24 "완전히 플루이드하게"): a named weekday books
  // its next occurrence, and any booking-flavored verb or meal/meeting
  // noun triggers — not just the scripted example phrases
  const weekdayIdx = WEEKDAYS.findIndex((names) =>
    names.some((n) => new RegExp(`\\b${n}\\b`).test(lower))
  );
  const nextWeek = /\bnext week\b/.test(lower);
  const triggered =
    timeMatch != null ||
    tomorrow ||
    weekdayIdx >= 0 ||
    nextWeek ||
    /\b(schedule|remind|calendar|book|block|hold|plan|meet|meeting|dinner|lunch|brunch|coffee|call|appointment)\b/.test(
      lower
    );
  if (!triggered) return null;

  // the target date, in preference order: named weekday (its next
  // occurrence) > next week > tomorrow > today
  let date = todayDate;
  if (weekdayIdx >= 0) {
    date = todayDate + 1;
    while (date <= 31 && dow(date) !== weekdayIdx) date++;
    if (date > 31) date = todayDate; // fell off the month: stay put
  } else if (nextWeek) {
    date = Math.min(31, todayDate + 7);
  } else if (tomorrow) {
    date = todayDate + 1;
  }

  // "Check my calendar" is a QUESTION, not a booking: nothing to extract,
  // no slots to offer. Only booking-flavored asks take the book path below.
  const checkAsk =
    timeMatch == null && /\b(check|show|what'?s|look at|review)\b/.test(lower);
  if (checkAsk) {
    return { date, title: '', intent: 'check' };
  }

  let start: string | undefined;
  if (timeMatch) {
    start = `${timeMatch[1]}:${timeMatch[2] ?? '00'} ${timeMatch[3].toUpperCase()}`;
  }

  let title = text;
  if (timeMatch) title = title.replace(new RegExp(timeMatch[0], 'i'), ' ');
  title = title
    .replace(
      /\b(remind me to|set up|schedule|remind|book|block|hold|plan|add|put|please|tomorrow|tmrw|tmr|today|next week|calendar|my|the|a|to|at|on|for)\b/gi,
      ' '
    )
    .replace(
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)\b/gi,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();
  title = title ? title.charAt(0).toUpperCase() + title.slice(1) : 'New event';
  // "dinner with jenna" → "Dinner with Jenna": whatever follows "with" is
  // a name, and a lowercase name reads like a broken extraction.
  title = title.replace(/\bwith (\w)/i, (_m, c: string) => `with ${c.toUpperCase()}`);

  return { date, title, start, intent: 'book' };
}
