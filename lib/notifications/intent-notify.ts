import { db } from "@/lib/db";
import type { District, OfferFormat } from "@/lib/generated/prisma/enums";
import {
  offersMatchingIntent,
  type OpenOfferForIntent,
} from "@/lib/matching/intent-interest";
import { warsawDateString } from "@/lib/matching/offer-interest";
import { notify } from "@/lib/notifications/notify";
import type { TimeOfDay } from "@/lib/offers/feed-filters";

// "Push авторам відкритих оферт, які підходять під намір" (task U2.4):
// called once, right after postPlayIntent (app/offers/looking/actions.ts)
// saves the row. Narrows by district/format in the query — the rest of
// the matching rule (level, date, time of day, the daily cap, quiet
// hours) is lib/matching/intent-interest.ts, pure and already tested
// there. Same shape as lib/notifications/new-offer.ts, swapped: there a
// new offer looks for interested players, here a new intent looks for
// matching open offers.

function toOffer(row: {
  id: string;
  authorId: string;
  district: District | null;
  ntrpMin: number | null;
  ntrpMax: number | null;
  format: OfferFormat;
  startsAt: Date;
  author: {
    notifyNewOffers: boolean;
    offerPushSentOn: Date | null;
    offerPushSentCount: number;
  };
}): OpenOfferForIntent {
  return {
    offerId: row.id,
    authorId: row.authorId,
    district: row.district,
    ntrpMin: row.ntrpMin,
    ntrpMax: row.ntrpMax,
    format: row.format,
    startsAt: row.startsAt,
    notifyNewOffers: row.author.notifyNewOffers,
    offerPushSentOn: row.author.offerPushSentOn
      ? row.author.offerPushSentOn.toISOString().slice(0, 10)
      : null,
    offerPushSentCount: row.author.offerPushSentCount,
  };
}

export async function notifyMatchingOfferAuthors(
  intent: {
    userId: string;
    date: string;
    times: readonly TimeOfDay[];
    districts: readonly District[];
    format: OfferFormat;
    selfRatedNtrp: number | null;
  },
  now: Date = new Date(),
): Promise<void> {
  if (intent.districts.length === 0) {
    return;
  }

  const rows = await db.sparringOffer.findMany({
    where: {
      authorId: { not: intent.userId },
      status: "OPEN",
      startsAt: { gt: now },
      district: { in: [...intent.districts] },
      format: intent.format,
      author: { notifyNewOffers: true },
    },
    select: {
      id: true,
      authorId: true,
      district: true,
      ntrpMin: true,
      ntrpMax: true,
      format: true,
      startsAt: true,
      author: {
        select: {
          notifyNewOffers: true,
          offerPushSentOn: true,
          offerPushSentCount: true,
        },
      },
    },
  });

  const today = warsawDateString(now);
  const matches = offersMatchingIntent(rows.map(toOffer), intent, now);

  for (const match of matches) {
    await notify(
      match.authorId,
      { kind: "INTENT_FOR_YOUR_OFFER", offerId: match.offerId },
      now,
    );
    await db.user.update({
      where: { id: match.authorId },
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
