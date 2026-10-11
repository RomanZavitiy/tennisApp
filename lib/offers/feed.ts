import { db } from "@/lib/db";
import type {
  District,
  OfferFormat,
  Surface,
} from "@/lib/generated/prisma/enums";
import { playersNeeded } from "@/lib/offers/players-needed";

// The offer feed on /offers (task 3.6): open offers that haven't started yet,
// soonest first, one page at a time. Public, so — as for player profiles —
// the select names every field that leaves the database (RLS decision, 1.2).

export const FEED_PAGE_SIZE = 20;

export type FeedOffer = {
  id: string;
  format: OfferFormat;
  hasPartner: boolean;
  startsAt: Date;
  district: District | null;
  club: { id: string; name: string } | null;
  ntrpMin: number | null;
  ntrpMax: number | null;
  surface: Surface | null;
  author: { id: string; name: string | null };
  spotsLeft: number;
};

export type FeedPage = {
  offers: FeedOffer[];
  page: number;
  hasNextPage: boolean;
};

/**
 * The page number from `?page=`: a whole number from 1, anything else is the
 * first page. A page past the end is simply empty.
 */
export function parsePage(value: string | string[] | undefined): number {
  const page = Number(Array.isArray(value) ? value[0] : value);
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
}

export async function getOfferFeed(
  page: number,
  now = new Date(),
): Promise<FeedPage> {
  const rows = await db.sparringOffer.findMany({
    // Served by the (status, starts_at) index from task 3.2.
    where: { status: "OPEN", startsAt: { gt: now } },
    // id breaks ties, so offers at the same time keep their order between pages.
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    skip: (page - 1) * FEED_PAGE_SIZE,
    // One extra row says whether there is a next page.
    take: FEED_PAGE_SIZE + 1,
    select: {
      id: true,
      format: true,
      hasPartner: true,
      startsAt: true,
      district: true,
      ntrpMin: true,
      ntrpMax: true,
      surface: true,
      club: { select: { id: true, name: true } },
      author: { select: { id: true, name: true } },
      _count: { select: { joins: { where: { status: "ACCEPTED" } } } },
    },
  });

  const offers = rows.slice(0, FEED_PAGE_SIZE).map(({ _count, ...offer }) => ({
    ...offer,
    spotsLeft: Math.max(0, playersNeeded(offer) - _count.joins),
  }));
  return { offers, page, hasNextPage: rows.length > FEED_PAGE_SIZE };
}
