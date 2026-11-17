import { db } from "@/lib/db";
import type { MatchGender } from "@/lib/generated/prisma/enums";
import {
  hasPushCapacityNow,
  warsawDateString,
} from "@/lib/matching/offer-interest";
import { blockedCounterpartIds } from "@/lib/moderation/personal-block";
import { notify } from "@/lib/notifications/notify";
import { requiredGender } from "@/lib/offers/match-gender";

// "A favourite player posted a game" (slice PD3, task PD3.4): called once,
// right after createOffer saves a public offer. Goes to the players who
// keep the author among their favourites, under the same throttle as "new
// offer for my level" (opted in, the daily cap, quiet hours) and counted
// against the same daily cap. Never to someone who shares a block with the
// author, never for a men's or women's game the player couldn't join, and
// never twice for one offer: `alreadyNotified` are the players the level
// push just reached.

export async function notifyFavoriters(
  offer: { offerId: string; authorId: string; matchGender: MatchGender },
  alreadyNotified: readonly string[] = [],
  now: Date = new Date(),
): Promise<string[]> {
  const gender = requiredGender(offer.matchGender);
  const [rows, blockedIds] = await Promise.all([
    db.playerFavorite.findMany({
      where: {
        favoriteId: offer.authorId,
        user: {
          notifyNewOffers: true,
          onboardingCompletedAt: { not: null },
          ...(gender ? { gender } : {}),
        },
      },
      select: {
        user: {
          select: {
            id: true,
            notifyNewOffers: true,
            offerPushSentOn: true,
            offerPushSentCount: true,
          },
        },
      },
    }),
    blockedCounterpartIds(offer.authorId),
  ]);

  const skip = new Set([...alreadyNotified, ...blockedIds, offer.authorId]);
  const today = warsawDateString(now);
  const notified: string[] = [];

  for (const { user } of rows) {
    const sentOn = user.offerPushSentOn
      ? user.offerPushSentOn.toISOString().slice(0, 10)
      : null;
    const open = hasPushCapacityNow(
      {
        notifyNewOffers: user.notifyNewOffers,
        offerPushSentOn: sentOn,
        offerPushSentCount: user.offerPushSentCount,
      },
      now,
    );
    if (skip.has(user.id) || !open) {
      continue;
    }
    await notify(
      user.id,
      { kind: "FAVORITE_POSTED_OFFER", offerId: offer.offerId },
      now,
    );
    await db.user.update({
      where: { id: user.id },
      data:
        sentOn === today
          ? { offerPushSentCount: { increment: 1 } }
          : {
              offerPushSentOn: new Date(`${today}T00:00:00Z`),
              offerPushSentCount: 1,
            },
    });
    notified.push(user.id);
  }
  return notified;
}
