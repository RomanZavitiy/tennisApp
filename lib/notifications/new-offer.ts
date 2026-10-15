import { db } from "@/lib/db";
import type { District } from "@/lib/generated/prisma/enums";
import {
  interestedCandidates,
  warsawDateString,
  type NewOfferInfo,
  type OfferPushCandidate,
} from "@/lib/matching/offer-interest";
import { notify } from "@/lib/notifications/notify";

// "New offer for my level" (task 5.16): called once, right after createOffer
// (3.5) saves the row. Narrows by district in the query — the rest of the
// matching rule (level, the daily cap, quiet hours, never the author) is
// lib/matching/offer-interest.ts, pure and already tested there.

function toCandidate(row: {
  id: string;
  district: District | null;
  selfRatedNtrp: number | null;
  notifyNewOffers: boolean;
  offerPushSentOn: Date | null;
  offerPushSentCount: number;
}): OfferPushCandidate {
  return {
    userId: row.id,
    district: row.district,
    selfRatedNtrp: row.selfRatedNtrp,
    notifyNewOffers: row.notifyNewOffers,
    offerPushSentOn: row.offerPushSentOn
      ? row.offerPushSentOn.toISOString().slice(0, 10)
      : null,
    offerPushSentCount: row.offerPushSentCount,
  };
}

export async function notifyInterestedPlayers(
  offer: NewOfferInfo & { offerId: string },
  now: Date = new Date(),
): Promise<void> {
  // No district, no match (lib/matching's own rule) — skip the query too.
  if (!offer.district) {
    return;
  }

  const rows = await db.user.findMany({
    where: {
      id: { not: offer.authorId },
      district: offer.district,
      notifyNewOffers: true,
      onboardingCompletedAt: { not: null },
    },
    select: {
      id: true,
      district: true,
      selfRatedNtrp: true,
      notifyNewOffers: true,
      offerPushSentOn: true,
      offerPushSentCount: true,
    },
  });

  const today = warsawDateString(now);
  const matches = interestedCandidates(rows.map(toCandidate), offer, now);

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
}
