import type { District } from "@/lib/generated/prisma/enums";

// "Who's interested in this offer" (task 5.16): the push that tells a player
// a new offer near their level and district was just posted. Matching rules
// only, kept pure so every rule (level, district, self-exclusion, the daily
// cap, quiet hours) has a test without touching the database — the database
// query and the actual send live in lib/notifications/notify.ts, the same
// split lib/rating/reliability.ts uses for its own counters.

/** How far (in NTRP) a candidate's level may sit from the offer's wanted
 * range (decision in this session's prompt: "±0.5 NTRP"). */
export const NTRP_MATCH_TOLERANCE = 0.5;

/** At most this many "new offer for you" pushes per player per day. */
export const DAILY_OFFER_PUSH_LIMIT = 3;

const QUIET_HOURS_START = 22; // 22:00 Europe/Warsaw
const QUIET_HOURS_END = 7; // 07:00 Europe/Warsaw

const warsawHourFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Europe/Warsaw",
  hour: "2-digit",
  hourCycle: "h23",
});

const warsawDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Warsaw",
});

/** Whether `now` falls in the 22:00–07:00 Europe/Warsaw quiet window. */
export function isQuietHours(now: Date): boolean {
  const hour = Number(warsawHourFormatter.format(now));
  return hour >= QUIET_HOURS_START || hour < QUIET_HOURS_END;
}

/** The Europe/Warsaw calendar date of `now`, as "YYYY-MM-DD" — the daily
 * cap's "day", the same format `todayInKrakow` (lib/validation/profile.ts)
 * already uses for the minimum-age check. */
export function warsawDateString(now: Date): string {
  return warsawDateFormatter.format(now);
}

export type NewOfferInfo = {
  authorId: string;
  district: District | null;
  /** Null bound means "any level" on that side (same as feedWhere's ntrp filter). */
  ntrpMin: number | null;
  ntrpMax: number | null;
};

export type OfferPushCandidate = {
  userId: string;
  district: District | null;
  selfRatedNtrp: number | null;
  notifyNewOffers: boolean;
  /** Warsaw calendar date of the last "new offer" push counted below, or
   * null if none yet. */
  offerPushSentOn: string | null;
  /** How many "new offer" pushes this candidate got on offerPushSentOn. */
  offerPushSentCount: number;
};

function levelMatches(
  candidateNtrp: number | null,
  ntrpMin: number | null,
  ntrpMax: number | null,
): boolean {
  if (candidateNtrp === null) {
    return false;
  }
  const minOk =
    ntrpMin === null || ntrpMin - NTRP_MATCH_TOLERANCE <= candidateNtrp;
  const maxOk =
    ntrpMax === null || ntrpMax + NTRP_MATCH_TOLERANCE >= candidateNtrp;
  return minOk && maxOk;
}

function hasDailyCapacity(
  candidate: OfferPushCandidate,
  today: string,
): boolean {
  return (
    candidate.offerPushSentOn !== today ||
    candidate.offerPushSentCount < DAILY_OFFER_PUSH_LIMIT
  );
}

/**
 * Whether `candidate` should get a "new offer for you" push for `offer` at
 * `now`: not the author, opted in, same district, level within half an NTRP
 * step, under today's cap, and not during quiet hours. An offer with no
 * district (a club outside the city, 2.1) matches nobody — there's no
 * district left to compare.
 */
export function isInterestedIn(
  candidate: OfferPushCandidate,
  offer: NewOfferInfo,
  now: Date,
): boolean {
  if (candidate.userId === offer.authorId) {
    return false;
  }
  if (!candidate.notifyNewOffers) {
    return false;
  }
  if (offer.district === null || candidate.district !== offer.district) {
    return false;
  }
  if (!levelMatches(candidate.selfRatedNtrp, offer.ntrpMin, offer.ntrpMax)) {
    return false;
  }
  if (isQuietHours(now)) {
    return false;
  }
  if (!hasDailyCapacity(candidate, warsawDateString(now))) {
    return false;
  }
  return true;
}

/** Every candidate `isInterestedIn` this offer, in the order given. */
export function interestedCandidates<T extends OfferPushCandidate>(
  candidates: readonly T[],
  offer: NewOfferInfo,
  now: Date,
): T[] {
  return candidates.filter((candidate) =>
    isInterestedIn(candidate, offer, now),
  );
}
