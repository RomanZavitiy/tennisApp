import type { District, OfferFormat } from "@/lib/generated/prisma/enums";
import { levelMatches } from "@/lib/matching/offer-interest";
import {
  nextDay,
  type FeedFilters,
  type TimeOfDay,
} from "@/lib/offers/feed-filters";
import { krakowLocalToDate } from "@/lib/offers/krakow-time";

// "Хочу зіграти" (slice U2): the pure rules around a PlayIntent, kept out
// of the server actions and the feed query the same way join-rules.ts is
// kept out of actions.ts.

/**
 * Midnight Europe/Warsaw after `date` (task U2.1's "намір спливає опівночі
 * за Europe/Warsaw") — null only for a malformed date string, which the
 * Zod schema (lib/validation/play-intent.ts) already rejects before this
 * is ever called.
 */
export function playIntentExpiresAt(date: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
    return null;
  }
  return krakowLocalToDate(`${nextDay(date)}T00:00`);
}

export type IntentSummary = {
  date: string;
  times: readonly TimeOfDay[];
  districts: readonly District[];
  format: OfferFormat;
  selfRatedNtrp: number | null;
};

/**
 * Whether `intent` matches the offer feed's own filters (task U2.2: "ті
 * самі" filters). `ntrp` compares against the one level an intent has —
 * the poster's own — the same tolerance levelMatches already gives an
 * offer's declared range (lib/matching/offer-interest.ts).
 */
export function intentMatchesFilters(
  intent: IntentSummary,
  filters: FeedFilters,
): boolean {
  if (filters.date && filters.date !== intent.date) {
    return false;
  }
  if (filters.district && !intent.districts.includes(filters.district)) {
    return false;
  }
  if (filters.format && filters.format !== intent.format) {
    return false;
  }
  if (filters.time && !intent.times.some((time) => time === filters.time)) {
    return false;
  }
  if (
    filters.ntrp !== undefined &&
    !levelMatches(intent.selfRatedNtrp, filters.ntrp, filters.ntrp)
  ) {
    return false;
  }
  return true;
}

/** A representative Kraków start hour for each part of day (task U2.3's
 * prefilled "create a game" form — an exact time still needs picking,
 * this just gives the form something reasonable to start from). */
const REPRESENTATIVE_HOUR: Record<TimeOfDay, string> = {
  morning: "09:00",
  afternoon: "13:00",
  evening: "18:00",
};

/**
 * Query params for "Створити гру і запросити" (task U2.3): the intent's
 * date and earliest preferred time of day, its format and first district,
 * plus `invite` — the same prefill idiom playAgainParams (slice Q) uses,
 * read by /offers/new (app/(member)/offers/new/page.tsx).
 */
export function intentInviteParams(intent: {
  userId: string;
  date: string;
  times: readonly TimeOfDay[];
  districts: readonly District[];
  format: OfferFormat;
}): URLSearchParams {
  const params = new URLSearchParams();
  params.set("format", intent.format);
  params.set("invite", intent.userId);
  const hour = REPRESENTATIVE_HOUR[intent.times.at(0) ?? "morning"];
  params.set("startsAt", `${intent.date}T${hour}`);
  const district = intent.districts.at(0);
  if (district) {
    params.set("district", district);
  }
  return params;
}
