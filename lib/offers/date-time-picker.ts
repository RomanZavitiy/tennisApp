// The pure half of the offer form's date and time picker
// (components/date-time-picker.tsx). It works on the same Kraków wall-clock
// strings the form already sends ("YYYY-MM-DD", "HH:mm" and their
// "YYYY-MM-DDTHH:mm" join, see lib/offers/krakow-time.ts). Plain string and
// UTC-date math only, so neither the browser's nor the server's time zone
// can shift a day.

/** Times offered as chips: every half hour from 06:00 to 22:00. */
const FIRST_SLOT_MINUTES = 6 * 60;
const LAST_SLOT_MINUTES = 22 * 60;
const SLOT_STEP_MINUTES = 30;

const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;
const TIME_FORMAT = /^\d{2}:\d{2}$/;

/** "YYYY-MM-DDTHH:mm" split into its day and time; a part that's missing or malformed is null. */
export function splitLocal(value: string | undefined): {
  date: string | null;
  time: string | null;
} {
  const [date = "", time = ""] = (value ?? "").split("T");
  return {
    date: DATE_FORMAT.test(date) ? date : null,
    time: TIME_FORMAT.test(time) ? time : null,
  };
}

/** The form's value: the joined string once both parts are chosen, "" until then. */
export function joinLocal(date: string | null, time: string | null): string {
  return date && time ? `${date}T${time}` : "";
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** "YYYY-MM-DD" for a year, a month (1-12) and a day. */
export function isoDate(year: number, month: number, day: number): string {
  return `${String(year)}-${pad(month)}-${pad(day)}`;
}

/** The month `delta` months away from `month` (1-12) of `year`. */
export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/**
 * One month as calendar rows, Monday first (as in Poland): each cell is a
 * "YYYY-MM-DD" day, or null for the blanks before the 1st and after the
 * last day.
 */
export function monthGrid(year: number, month: number): (string | null)[][] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  // getUTCDay: Sunday is 0. Monday-first, Sunday becomes 6.
  const leading = (first.getUTCDay() + 6) % 7;
  const cells: (string | null)[] = [
    ...Array<null>(leading).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      isoDate(year, month, i + 1),
    ),
  ];
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  const rows: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}

/**
 * The time chips. A prefilled time that isn't on the half-hour grid (a
 * "play again" link, an old bookmark) is added in order, so the picker
 * still shows what's selected.
 */
export function timeSlots(extra?: string | null): string[] {
  const slots: string[] = [];
  for (
    let minutes = FIRST_SLOT_MINUTES;
    minutes <= LAST_SLOT_MINUTES;
    minutes += SLOT_STEP_MINUTES
  ) {
    slots.push(`${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`);
  }
  if (extra && TIME_FORMAT.test(extra) && !slots.includes(extra)) {
    slots.push(extra);
    slots.sort();
  }
  return slots;
}

/** Morning, afternoon or evening: how the time chips are grouped. */
export function partOfDay(time: string): "morning" | "afternoon" | "evening" {
  const hour = Number(time.slice(0, 2));
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

/** Whether a start at `date` + `time` is already over, given Kraków time now ("YYYY-MM-DDTHH:mm"). */
export function isPastSlot(
  date: string,
  time: string,
  earliest: string,
): boolean {
  return `${date}T${time}` <= earliest;
}

/** A day with no chip left to pick: before today, or today after the last slot. */
export function isPastDay(date: string, earliest: string): boolean {
  const slots = timeSlots();
  const last = slots[slots.length - 1] ?? "23:59";
  return isPastSlot(date, last, earliest);
}
