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
    events: [
      { id: 'e1a', title: 'Team standup', start: '9:30 AM', end: '9:45 AM', color: 'brand', source: 'google' },
      {
        id: 'e1b',
        title: 'Design review',
        start: '2:00 PM',
        end: '3:00 PM',
        location: 'Figma huddle',
        color: 'brand',
        source: 'google',
      },
    ],
  },
  {
    id: 'd-0702',
    weekday: 'Thursday',
    date: 2,
    events: [
      { id: 'e2a', title: 'Team standup', start: '9:30 AM', end: '9:45 AM', color: 'brand', source: 'google' },
      { id: 'e2b', title: '1:1 with Sarah Chen', start: '2:00 PM', end: '2:30 PM', color: 'brand', source: 'google' },
      {
        id: 'e2c',
        title: 'Climbing at Mission Cliffs',
        start: '7:00 PM',
        end: '9:00 PM',
        location: 'Mission Cliffs',
        color: 'mint',
        source: 'apple',
      },
    ],
  },
  {
    id: 'd-0703',
    weekday: 'Friday',
    date: 3,
    events: [
      { id: 'e3a', title: 'Rent', allDay: true, color: 'yellow', source: 'apple' },
    ],
  },
  { id: 'd-0704', weekday: 'Saturday', date: 4, events: [] },
  { id: 'd-0705', weekday: 'Sunday', date: 5, events: [] },
  {
    id: 'd-0706',
    weekday: 'Monday',
    date: 6,
    events: [
      { id: 'e6a', title: 'Sprint planning', start: '10:00 AM', end: '11:00 AM', color: 'brand', source: 'google' },
      { id: 'e6b', title: 'PR review block', start: '3:00 PM', end: '4:00 PM', color: 'brand', source: 'google' },
    ],
  },
  {
    id: 'd-0707',
    weekday: 'Tuesday',
    date: 7,
    events: [
      {
        id: 'e7a',
        title: 'Pair with Priya on auth refactor',
        start: '11:00 AM',
        end: '12:30 PM',
        color: 'brand',
        source: 'google',
      },
      // (kept light on purpose: the demo books "Dinner with Jenna 6pm
      // tmrw" INTO this day — it must not already exist here)
    ],
  },
  {
    id: 'd-0708',
    weekday: 'Wednesday',
    date: 8,
    events: [
      {
        id: 'e8a',
        title: 'Q3 roadmap offsite',
        start: '9:00 AM',
        end: '4:00 PM',
        location: 'Mountain View campus',
        color: 'mint',
        source: 'google',
      },
    ],
  },
  {
    id: 'd-0709',
    weekday: 'Thursday',
    date: 9,
    events: [
      { id: 'e9a', title: '1:1 with Sarah Chen', start: '2:00 PM', end: '2:30 PM', color: 'brand', source: 'google' },
    ],
  },
  { id: 'd-0710', weekday: 'Friday', date: 10, events: [] },
  {
    id: 'd-0711',
    weekday: 'Saturday',
    date: 11,
    events: [
      {
        id: 'e11a',
        title: 'Fort Funston hike',
        start: '10:00 AM',
        end: '12:00 PM',
        color: 'mint',
        source: 'apple',
      },
      {
        id: 'e11b',
        title: "Maya's birthday dinner",
        start: '7:00 PM',
        location: 'Foreign Cinema',
        color: 'yellow',
        source: 'apple',
      },
    ],
  },
  {
    id: 'd-0712',
    weekday: 'Sunday',
    date: 12,
    events: [
      {
        id: 'e12a',
        title: 'Brunch with Dev and Maya',
        start: '11:00 AM',
        location: 'Zazie, Cole Valley',
        color: 'yellow',
        source: 'apple',
      },
    ],
  },
  { id: 'd-0713', weekday: 'Monday', date: 13, events: [] },
  {
    id: 'd-0714',
    weekday: 'Tuesday',
    date: 14,
    events: [
      { id: 'e14a', title: 'Sprint planning', start: '11:00 AM', end: '12:00 PM', color: 'brand', source: 'google' },
      {
        id: 'e14b',
        title: 'Dentist',
        start: '4:30 PM',
        end: '5:15 PM',
        location: 'SoMa Dental',
        color: 'mint',
        source: 'apple',
      },
    ],
  },
  { id: 'd-0715', weekday: 'Wednesday', date: 15, events: [] },
  {
    id: 'd-0716',
    weekday: 'Thursday',
    date: 16,
    events: [
      {
        id: 'e16a',
        title: 'Coffee chat with Stripe recruiter',
        start: '8:30 AM',
        end: '9:15 AM',
        location: 'Blue Bottle, SoMa',
        color: 'yellow',
        source: 'apple',
      },
      { id: 'e16b', title: '1:1 with Sarah Chen', start: '2:00 PM', end: '2:30 PM', color: 'brand', source: 'google' },
    ],
  },
  {
    id: 'd-0717',
    weekday: 'Friday',
    date: 17,
    events: [
      { id: 'e17a', title: 'Demo Friday', start: '4:00 PM', end: '5:00 PM', color: 'brand', source: 'google' },
      { id: 'e17b', title: 'On-call handoff', start: '5:00 PM', end: '5:15 PM', color: 'brand', source: 'google' },
    ],
  },
  {
    id: 'd-0718',
    weekday: 'Saturday',
    date: 18,
    events: [
      {
        id: 'e18a',
        title: 'Run in Golden Gate Park',
        start: '9:00 AM',
        end: '10:00 AM',
        color: 'mint',
        source: 'apple',
      },
    ],
  },
  { id: 'd-0719', weekday: 'Sunday', date: 19, events: [] },
  {
    id: 'd-0720',
    weekday: 'Monday',
    date: 20,
    events: [
      { id: 'e20a', title: 'Sprint planning', start: '10:00 AM', end: '11:00 AM', color: 'brand', source: 'google' },
      {
        id: 'e20b',
        title: 'Architecture review: billing service',
        start: '2:00 PM',
        end: '3:30 PM',
        color: 'brand',
        source: 'google',
      },
    ],
  },
  { id: 'd-0721', weekday: 'Tuesday', date: 21, events: [] },
  {
    id: 'd-0722',
    weekday: 'Wednesday',
    date: 22,
    events: [
      {
        id: 'e22a',
        title: 'Design review',
        start: '2:00 PM',
        end: '3:00 PM',
        location: 'Figma huddle',
        color: 'brand',
        source: 'google',
      },
    ],
  },
  { id: 'd-0723', weekday: 'Thursday', date: 23, events: [] },
  {
    id: 'd-0724',
    weekday: 'Friday',
    date: 24,
    events: [
      {
        id: 'e24a',
        title: 'Giants game with Dev',
        start: '6:45 PM',
        location: 'Oracle Park',
        color: 'yellow',
        source: 'apple',
      },
    ],
  },
  { id: 'd-0725', weekday: 'Saturday', date: 25, events: [] },
  { id: 'd-0726', weekday: 'Sunday', date: 26, events: [] },
  {
    id: 'd-0727',
    weekday: 'Monday',
    date: 27,
    events: [
      { id: 'e27a', title: 'Sprint planning', start: '10:00 AM', end: '11:00 AM', color: 'brand', source: 'google' },
    ],
  },
  { id: 'd-0728', weekday: 'Tuesday', date: 28, events: [] },
  {
    id: 'd-0729',
    weekday: 'Wednesday',
    date: 29,
    events: [
      { id: 'e29a', title: 'Perf review drafts due', allDay: true, color: 'yellow', source: 'google' },
    ],
  },
  { id: 'd-0730', weekday: 'Thursday', date: 30, events: [] },
  {
    id: 'd-0731',
    weekday: 'Friday',
    date: 31,
    events: [
      {
        id: 'e31a',
        title: 'Team offsite dinner',
        start: '6:00 PM',
        location: 'Mission Chinese Food',
        color: 'yellow',
        source: 'google',
      },
    ],
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
export function parseScheduleRequest(
  text: string,
  todayDate: number
): { date: number; title: string; start?: string; intent: 'check' | 'book' } | null {
  const lower = text.toLowerCase();
  const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/);
  const tomorrow = lower.includes('tomorrow') || /\btmrw?\b/.test(lower);
  const triggered =
    timeMatch != null ||
    tomorrow ||
    lower.includes('schedule') ||
    lower.includes('remind') ||
    lower.includes('calendar');
  if (!triggered) return null;

  // "Check my calendar" is a QUESTION, not a booking: nothing to extract,
  // no slots to offer. Only booking-flavored asks take the book path below.
  const checkAsk =
    timeMatch == null && /\b(check|show|what'?s|look at|review)\b/.test(lower);
  if (checkAsk) {
    return { date: tomorrow ? todayDate + 1 : todayDate, title: '', intent: 'check' };
  }

  let start: string | undefined;
  if (timeMatch) {
    start = `${timeMatch[1]}:${timeMatch[2] ?? '00'} ${timeMatch[3].toUpperCase()}`;
  }

  let title = text;
  if (timeMatch) title = title.replace(new RegExp(timeMatch[0], 'i'), ' ');
  title = title
    .replace(
      /\b(remind me to|schedule|remind|add|put|please|tomorrow|tmrw|tmr|today|calendar|my|to|at|on)\b/gi,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();
  title = title ? title.charAt(0).toUpperCase() + title.slice(1) : 'New event';
  // "dinner with jenna" → "Dinner with Jenna": whatever follows "with" is
  // a name, and a lowercase name reads like a broken extraction.
  title = title.replace(/\bwith (\w)/i, (_m, c: string) => `with ${c.toUpperCase()}`);

  return { date: tomorrow ? todayDate + 1 : todayDate, title, start, intent: 'book' };
}
