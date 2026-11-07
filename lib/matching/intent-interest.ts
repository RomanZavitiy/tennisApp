import type { District, OfferFormat } from "@/lib/generated/prisma/enums";
import {
  hasPushCapacityNow,
  levelMatches,
  warsawDateString,
  type PushThrottleState,
} from "@/lib/matching/offer-interest";
import { matchesTimeOfDay, type TimeOfDay } from "@/lib/offers/feed-filters";

// "Does this new intent match one of my open offers" (task U2.4) — the
// mirror of lib/matching/offer-interest.ts's own isInterestedIn, but swapped:
// there the offer is new and candidates are players; here the intent is
// new and candidates are offer authors. Reuses the same push throttle
// (hasPushCapacityNow) and NTRP tolerance (levelMatches) rather than a
// second copy of either.

export type PlayIntentInfo = {
  userId: string;
  date: string;
  times: readonly TimeOfDay[];
  districts: readonly District[];
  format: OfferFormat;
  selfRatedNtrp: number | null;
};

export type OpenOfferForIntent = PushThrottleState & {
  offerId: string;
  authorId: string;
  district: District | null;
  ntrpMin: number | null;
  ntrpMax: number | null;
  format: OfferFormat;
  startsAt: Date;
};

/**
 * Whether `offer` is worth a push to its author because `intent` just
 * matched it: not the intent's own author, one of the wanted districts,
 * same format, the intent owner's level within the offer's range, the
 * offer's Kraków calendar date and time-of-day inside what the intent
 * asked for, and the author's own push throttle has room (task U2.4,
 * "same limit as NEW_OFFER_FOR_LEVEL").
 */
export function offerMatchesIntent(
  offer: OpenOfferForIntent,
  intent: PlayIntentInfo,
  now: Date,
): boolean {
  if (offer.authorId === intent.userId) {
    return false;
  }
  if (offer.district === null || !intent.districts.includes(offer.district)) {
    return false;
  }
  if (offer.format !== intent.format) {
    return false;
  }
  if (!levelMatches(intent.selfRatedNtrp, offer.ntrpMin, offer.ntrpMax)) {
    return false;
  }
  if (warsawDateString(offer.startsAt) !== intent.date) {
    return false;
  }
  if (!intent.times.some((time) => matchesTimeOfDay(offer.startsAt, time))) {
    return false;
  }
  return hasPushCapacityNow(offer, now);
}

/** Every open offer `offerMatchesIntent` this intent, in the order given. */
export function offersMatchingIntent<T extends OpenOfferForIntent>(
  offers: readonly T[],
  intent: PlayIntentInfo,
  now: Date,
): T[] {
  return offers.filter((offer) => offerMatchesIntent(offer, intent, now));
}
