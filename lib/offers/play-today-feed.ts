import { db } from "@/lib/db";
import { levelMatches } from "@/lib/matching/offer-interest";
import { blockedCounterpartIds } from "@/lib/moderation/personal-block";
import type { FeedFilters } from "@/lib/offers/feed-filters";
import {
  feedOfferSelect,
  toFeedOffer,
  type FeedOffer,
} from "@/lib/offers/feed";
import { PLAY_TODAY_WINDOW_HOURS } from "@/lib/offers/play-today";
import {
  getPlayIntentFeed,
  type PlayIntentCard,
} from "@/lib/offers/play-intent-feed";
import { todayInKrakow } from "@/lib/validation/profile";

export type PlayTodayFeed = {
  offers: FeedOffer[];
  intents: PlayIntentCard[];
};

/**
 * "Грати сьогодні" (task U3.1): open offers starting within the next
 * PLAY_TODAY_WINDOW_HOURS that match the viewer's own level, plus today's
 * intents (slice U2) — no pagination or ELO ranking, same "stays small
 * enough" assumption as getClubOffers. The viewer's own offers are left
 * out: there's nothing to join on your own game here.
 */
export async function getPlayTodayFeed(
  viewerId: string,
  viewerNtrp: number | null,
  now: Date = new Date(),
): Promise<PlayTodayFeed> {
  const blockedIds = await blockedCounterpartIds(viewerId);

  const rows = await db.sparringOffer.findMany({
    where: {
      status: "OPEN",
      authorId: { notIn: [viewerId, ...blockedIds] },
      startsAt: {
        gt: now,
        lte: new Date(now.getTime() + PLAY_TODAY_WINDOW_HOURS * 3_600_000),
      },
    },
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    select: feedOfferSelect,
  });

  const offers = rows
    .map(toFeedOffer)
    .filter((offer) => levelMatches(viewerNtrp, offer.ntrpMin, offer.ntrpMax));

  const todayFilters: FeedFilters = {
    date: todayInKrakow(now),
    ...(viewerNtrp !== null ? { ntrp: viewerNtrp } : {}),
  };
  const intents = await getPlayIntentFeed(viewerId, todayFilters, now);

  return { offers, intents };
}
