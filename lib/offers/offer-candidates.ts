import { db } from "@/lib/db";
import { blockedCounterpartIds } from "@/lib/moderation/personal-block";
import { rankCandidates, type Candidate } from "@/lib/matching/candidates";

// "Kого запросити" (task S2.2): loads the pool for one open offer, already
// narrowed to people the author could plausibly invite, then hands it to
// the pure ranking in lib/matching/candidates.ts. Caller's job to check the
// viewer is the author and the offer is still OPEN (task S2.2) — this
// assumes both.

/**
 * Up to 10 players worth inviting to `offerId` (task S2.1), or `[]` when
 * the offer has no district to match against (same rule
 * lib/notifications/new-offer.ts follows for "new offer for my level").
 */
export async function getOfferCandidates(
  offerId: string,
): Promise<Candidate[]> {
  const offer = await db.sparringOffer.findUnique({
    where: { id: offerId },
    select: {
      authorId: true,
      district: true,
      ntrpMin: true,
      ntrpMax: true,
      author: { select: { elo: true } },
    },
  });
  if (!offer || offer.district === null) {
    return [];
  }

  const [blockedIds, dismissedRows, joinedRows, invitedRows] =
    await Promise.all([
      blockedCounterpartIds(offer.authorId),
      db.offerDismissal.findMany({
        where: { offerId },
        select: { userId: true },
      }),
      db.offerJoin.findMany({ where: { offerId }, select: { userId: true } }),
      db.offerInvite.findMany({
        where: { offerId },
        select: { inviteeId: true },
      }),
    ]);
  const excludedIds = new Set([
    offer.authorId,
    ...blockedIds,
    ...dismissedRows.map((row) => row.userId),
    ...joinedRows.map((row) => row.userId),
    ...invitedRows.map((row) => row.inviteeId),
  ]);

  const pool = await db.user.findMany({
    where: {
      id: { notIn: [...excludedIds] },
      district: offer.district,
      discoverable: true,
      blockedAt: null,
      onboardingCompletedAt: { not: null },
    },
    select: {
      id: true,
      name: true,
      avatarPath: true,
      district: true,
      selfRatedNtrp: true,
      elo: true,
      scheduledMatches: true,
      noShows: true,
      lateCancellations: true,
      discoverable: true,
    },
  });

  return rankCandidates(
    pool,
    {
      authorId: offer.authorId,
      district: offer.district,
      ntrpMin: offer.ntrpMin,
      ntrpMax: offer.ntrpMax,
    },
    offer.author.elo,
  );
}
