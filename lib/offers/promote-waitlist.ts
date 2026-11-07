import type { Prisma } from "@/lib/generated/prisma/client";

// Popping the waitlist (slice T, task T.3): called the moment an accepted
// place frees up (app/offers/[id]/actions.ts's changeJoin, on WITHDRAW),
// and again by the hourly cron (lib/notifications/reminders.ts) once the
// current priority request times out (task T.4). Takes whatever Prisma
// client the caller is already inside — the offer-side transaction for the
// first case, the plain `db` for the cron — same idiom as
// lib/rating/reliability.ts's recordScheduledMatch.

export type WaitlistPromotion = { userId: string; joinId: string };

/**
 * Moves the earliest-waiting player off `offerId`'s waitlist into a
 * REQUESTED join, flagged `fromWaitlist` so the author sees it labelled
 * and at the top of their requests (task T.3). Reuses an existing
 * withdrawn/declined join row for the same pair, same reuse idiom
 * requestToJoin uses for its own unique (offer, player) index — a
 * passed-over "no" doesn't block the system's own priority offer. Returns
 * null once the waitlist is empty.
 */
export async function promoteNextWaitlistEntry(
  tx: Prisma.TransactionClient,
  offerId: string,
  now: Date = new Date(),
): Promise<WaitlistPromotion | null> {
  const next = await tx.offerWaitlist.findFirst({
    where: { offerId },
    orderBy: { createdAt: "asc" },
    select: { id: true, userId: true },
  });
  if (!next) {
    return null;
  }

  await tx.offerWaitlist.delete({ where: { id: next.id } });
  const join = await tx.offerJoin.upsert({
    where: { offerId_userId: { offerId, userId: next.userId } },
    create: {
      offerId,
      userId: next.userId,
      status: "REQUESTED",
      fromWaitlist: true,
      waitlistOfferedAt: now,
    },
    update: {
      status: "REQUESTED",
      fromWaitlist: true,
      waitlistOfferedAt: now,
    },
    select: { id: true },
  });

  return { userId: next.userId, joinId: join.id };
}
