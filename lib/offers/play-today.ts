// "Грати сьогодні" (slice U3, task U3.1): the pure window rule, kept out
// of the query (lib/offers/play-today-feed.ts) the same way every other
// matching rule in lib/ is kept pure and tested without touching the
// database.

const HOUR_MS = 3_600_000;

/** The widest look-ahead the page shows (task U3.1: "1–8 годин"). */
export const PLAY_TODAY_WINDOW_HOURS = 8;

/** Whether `startsAt` is soon enough to show on the "Play today" page:
 * hasn't started yet, and starts within the next `PLAY_TODAY_WINDOW_HOURS`. */
export function isPlayingSoon(startsAt: Date, now: Date): boolean {
  const msAway = startsAt.getTime() - now.getTime();
  return msAway > 0 && msAway <= PLAY_TODAY_WINDOW_HOURS * HOUR_MS;
}
