// Late-cancellation rule (decision 2026-10-14, "Надійність гравця"): a
// cancellation less than 12h before the start counts against reliability.
// The counter itself lands in session 05 (Epic 4, tasks 4.10-4.12) — this
// module only gives today's callers (3.14's cancelOffer) a stable place to
// flag the moment it happens.
const LATE_CANCELLATION_WINDOW_MS = 12 * 60 * 60 * 1000;

export function isLateCancellation(startsAt: Date, now: Date): boolean {
  return startsAt.getTime() - now.getTime() < LATE_CANCELLATION_WINDOW_MS;
}

// TODO(session 05): persist this against the player's reliability counter
// instead of doing nothing.
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- stub signature for session 05
export function recordLateCancellation(userId: string): void {}
