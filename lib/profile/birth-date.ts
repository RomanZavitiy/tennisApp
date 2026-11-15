import { daysInMonth, isoDate } from "@/lib/offers/date-time-picker";
import { MIN_AGE } from "@/lib/validation/profile";

// The profile's date of birth as three selects (day, month, year) instead of
// <input type="date">: a calendar is the wrong tool for a date decades back,
// and the native input's format followed the browser, not the site. The
// form still sends one "YYYY-MM-DD" string, so profileSchema is unchanged.

/** How far back the year list goes. */
const OLDEST_AGE = 100;

/**
 * The years to offer, newest first: from the last year anyone old enough
 * could be born in, back 100 years. The age rule itself stays in
 * profileSchema; a December birthday in the newest year can still be too
 * young, and the form says so.
 */
export function birthYears(today: string): number[] {
  const newest = Number(today.slice(0, 4)) - MIN_AGE;
  return Array.from({ length: OLDEST_AGE - MIN_AGE + 1 }, (_, i) => newest - i);
}

/** The days to offer: 31 until month and year say otherwise. */
export function birthDays(month: number | null, year: number | null): number {
  // A leap year until the year is known, so 29 February stays possible.
  return month ? daysInMonth(year ?? 2000, month) : 31;
}

/**
 * "YYYY-MM-DD" once all three parts are chosen and make a real date, "" until
 * then (the schema's "Enter your date of birth").
 */
export function composeBirthDate(
  day: number | null,
  month: number | null,
  year: number | null,
): string {
  if (!day || !month || !year || day > daysInMonth(year, month)) {
    return "";
  }
  return isoDate(year, month, day);
}

/** A saved "YYYY-MM-DD" back into its three parts. */
export function splitBirthDate(value: string | undefined): {
  day: number | null;
  month: number | null;
  year: number | null;
} {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!match) {
    return { day: null, month: null, year: null };
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}
