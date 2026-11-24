import { db } from "@/lib/db";
import type { District, Sport } from "@/lib/generated/prisma/enums";
import {
  interestedCandidates,
  warsawDateString,
  type NewOfferInfo,
  type OfferPushCandidate,
} from "@/lib/matching/offer-interest";
import { notify } from "@/lib/notifications/notify";
import type { TimeOfDay } from "@/lib/offers/feed-filters";
import { requiredGender } from "@/lib/offers/match-gender";
import { playerLevel } from "@/lib/sport/sport";

// "New offer for my level" (task 5.16): called once, right after createOffer
// (3.5) saves the row. Narrows by district in the query — the rest of the
// matching rule (level, the daily cap, quiet hours, never the author) is
// lib/matching/offer-interest.ts, pure and already tested there.

function toCandidate(
  sport: Sport,
  row: {
    id: string;
    district: District | null;
    selfRatedNtrp: number | null;
    padelLevel: number | null;
    notifyNewOffers: boolean;
    offerPushSentOn: Date | null;
    offerPushSentCount: number;
    preferredDistricts: District[];
    preferredTimes: string[];
  },
): OfferPushCandidate {
  return {
    userId: row.id,
    district: row.district,
    // The level in the offer's own sport (slice PD1): a padel offer never
    // reaches a player who hasn't declared a padel level.
    selfRatedNtrp: playerLevel(row, sport),
    notifyNewOffers: row.notifyNewOffers,
    offerPushSentOn: row.offerPushSentOn
      ? row.offerPushSentOn.toISOString().slice(0, 10)
      : null,
    offerPushSentCount: row.offerPushSentCount,
    preferredDistricts: row.preferredDistricts,
    // Stored as a plain text[] column (lib/profile/options.ts's WEEKDAYS
    // has the same shape) — cast once here rather than widen
    // OfferPushCandidate's own type to the raw column type everywhere else
    // that builds one (e.g. the tests).
    preferredTimes: row.preferredTimes as TimeOfDay[],
  };
}

export async function notifyInterestedPlayers(
  offer: NewOfferInfo & { offerId: string },
  now: Date = new Date(),
  // The players it reached — the favourites push (PD3.4) skips them, so
  // nobody hears about one offer twice.
): Promise<string[]> {
  // No district, no match (lib/matching's own rule) — skip the query too.
  if (!offer.district) {
    return [];
  }

  // Slice PD3: a men's or women's game only reaches players it is for.
  const gender = requiredGender(offer.matchGender ?? "ANY");
  const rows = await db.user.findMany({
    where: {
      id: { not: offer.authorId },
      ...(gender ? { gender } : {}),
      // U1.3: the candidate's own district still matches as before U1;
      // OR widens the pool to players who named this one as preferred too.
      OR: [
        { district: offer.district },
        { preferredDistricts: { has: offer.district } },
      ],
      notifyNewOffers: true,
      onboardingCompletedAt: { not: null },
    },
    select: {
      id: true,
      district: true,
      selfRatedNtrp: true,
      padelLevel: true,
      notifyNewOffers: true,
      offerPushSentOn: true,
      offerPushSentCount: true,
      preferredDistricts: true,
      preferredTimes: true,
    },
  });

  const today = warsawDateString(now);
  const matches = interestedCandidates(
    rows.map((row) => toCandidate(offer.sport ?? "TENNIS", row)),
    offer,
    now,
  );

  for (const match of matches) {
    await notify(
      match.userId,
      { kind: "NEW_OFFER_FOR_LEVEL", offerId: offer.offerId },
      now,
    );
    await db.user.update({
      where: { id: match.userId },
      data:
        match.offerPushSentOn === today
          ? { offerPushSentCount: { increment: 1 } }
          : {
              offerPushSentOn: new Date(`${today}T00:00:00Z`),
              offerPushSentCount: 1,
            },
    });
  }
  return matches.map((match) => match.userId);
}
