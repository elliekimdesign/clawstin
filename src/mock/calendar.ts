/** Mock calendar feed — what Muppet sees when it "checks your calendar". */

export type CalendarEvent = {
  id: string;
  title: string;
  start?: string; // "4:20 PM" — omit both for all-day
  end?: string;
  allDay?: boolean;
  location?: string;
  color: 'brand' | 'yellow' | 'mint';
};

export type CalendarDay = {
  id: string;
  weekday: string; // 'Wednesday'
  date: number; // 1
  events: CalendarEvent[]; // [] = empty day (rendered dimmed)
};

export const CAL_MONTH = 'July 2026';

export const initialCalendarDays: CalendarDay[] = [
  {
    id: 'd-0701',
    weekday: 'Wednesday',
    date: 1,
    events: [
      {
        id: 'e1',
        title: 'Design review',
        start: '2:00 PM',
        end: '3:00 PM',
        location: 'Figma huddle',
        color: 'brand',
      },
    ],
  },
  {
    id: 'd-0702',
    weekday: 'Thursday',
    date: 2,
    events: [
      { id: 'e2', title: 'Team standup', start: '9:30 AM', end: '9:45 AM', color: 'brand' },
      {
        id: 'e3',
        title: 'Dentist',
        start: '4:30 PM',
        end: '5:15 PM',
        location: 'Gangnam Smile Clinic',
        color: 'mint',
      },
    ],
  },
  {
    id: 'd-0703',
    weekday: 'Friday',
    date: 3,
    events: [{ id: 'e4', title: 'Rent', allDay: true, color: 'yellow' }],
  },
  { id: 'd-0704', weekday: 'Saturday', date: 4, events: [] },
  { id: 'd-0705', weekday: 'Sunday', date: 5, events: [] },
  {
    id: 'd-0706',
    weekday: 'Monday',
    date: 6,
    events: [
      { id: 'e5', title: 'Portfolio review', start: '10:00 AM', end: '10:30 AM', color: 'brand' },
    ],
  },
  { id: 'd-0707', weekday: 'Tuesday', date: 7, events: [] },
  {
    id: 'd-0708',
    weekday: 'Wednesday',
    date: 8,
    events: [
      {
        id: 'e6',
        title: 'Flight to Jeju',
        start: '7:40 AM',
        end: '8:50 AM',
        location: 'GMP → CJU',
        color: 'mint',
      },
    ],
  },
  { id: 'd-0709', weekday: 'Thursday', date: 9, events: [] },
  { id: 'd-0710', weekday: 'Friday', date: 10, events: [] },
  {
    id: 'd-0711',
    weekday: 'Saturday',
    date: 11,
    events: [{ id: 'e7', title: "Hana's birthday", allDay: true, color: 'yellow' }],
  },
  { id: 'd-0712', weekday: 'Sunday', date: 12, events: [] },
  { id: 'd-0713', weekday: 'Monday', date: 13, events: [] },
  {
    id: 'd-0714',
    weekday: 'Tuesday',
    date: 14,
    events: [
      { id: 'e8', title: 'Sprint planning', start: '11:00 AM', end: '12:00 PM', color: 'brand' },
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
): { date: number; title: string; start?: string } | null {
  const lower = text.toLowerCase();
  const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/);
  const tomorrow = lower.includes('tomorrow');
  const triggered =
    timeMatch != null ||
    tomorrow ||
    lower.includes('schedule') ||
    lower.includes('remind') ||
    lower.includes('calendar');
  if (!triggered) return null;

  let start: string | undefined;
  if (timeMatch) {
    start = `${timeMatch[1]}:${timeMatch[2] ?? '00'} ${timeMatch[3].toUpperCase()}`;
  }

  let title = text;
  if (timeMatch) title = title.replace(new RegExp(timeMatch[0], 'i'), ' ');
  title = title
    .replace(/\b(remind me to|schedule|remind|add|put|please|tomorrow|today|calendar|my|to|at|on)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  title = title ? title.charAt(0).toUpperCase() + title.slice(1) : 'New event';

  return { date: tomorrow ? todayDate + 1 : todayDate, title, start };
}
