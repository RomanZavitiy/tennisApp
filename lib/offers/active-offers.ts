import type { Prisma } from "@/lib/generated/prisma/client";

// "Active offers" (task 6.17, decision 2026-10-14): a live count, not a
// time-windowed rate — how many offers an author currently has out there,
// at any moment — so it's a db.sparringOffer.count(), not checkRateLimit
// (lib/rate-limit/). "Active" matches the feed's own "not expired" rule
// (feedWhere, lib/offers/feed-filters.ts) plus FULL: a full offer still
// occupies one of the author's five slots even though the feed itself only
// lists OPEN ones.

export const MAX_ACTIVE_OFFERS = 5;

export function activeOffersWhere(
  authorId: string,
  now: Date,
): Prisma.SparringOfferWhereInput {
  return {
    authorId,
    status: { in: ["OPEN", "FULL"] },
    startsAt: { gt: now },
  };
}
