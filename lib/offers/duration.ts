// How long an offer wants the court for (slice K5). The same list backs the
// form's options, the offer schema, the feed filter and the database CHECK
// (migration 20261017120000_add_offer_duration).
export const OFFER_DURATIONS = [60, 90, 120, 180] as const;
export type OfferDuration = (typeof OFFER_DURATIONS)[number];
export const DEFAULT_OFFER_DURATION: OfferDuration = 90;

export function isOfferDuration(value: number): value is OfferDuration {
  return (OFFER_DURATIONS as readonly number[]).includes(value);
}

/** When the game ends. */
export function offerEndsAt(startsAt: Date, durationMinutes: number): Date {
  return new Date(startsAt.getTime() + durationMinutes * 60_000);
}
