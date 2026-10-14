import { db } from "@/lib/db";
import type {
  CourtStatus,
  District,
  OfferFormat,
  Surface,
} from "@/lib/generated/prisma/enums";
import { rankByEloCloseness } from "@/lib/matching/elo-rank";
import { feedWhere, type FeedFilters } from "@/lib/offers/feed-filters";
import { playersNeeded } from "@/lib/offers/players-needed";

// The offer feed on /offers (task 3.6): open offers that haven't started yet,
// narrowed by the URL filters (3.7), then ranked — closest ELO first for a
// signed-in viewer, soonest first for a guest (task 3.9, lib/matching). Public, so — as for player profiles —
// the select names every field that leaves the database (RLS decision, 1.2).
//
// Ranking a page correctly needs the whole filtered list, not just one page
// of it, so this reads every matching offer rather than paging in the
// database — the feed's dataset (a single city's open offers) stays small
// enough for that, same assumption as the unpaginated club list (2.5).

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
  courtStatus: CourtStatus;
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
  filters: FeedFilters = {},
  viewerId: string | null = null,
  now = new Date(),
): Promise<FeedPage> {
  const viewer = viewerId
    ? await db.user.findUnique({
        where: { id: viewerId },
        select: { elo: true },
      })
    : null;

  const rows = await db.sparringOffer.findMany({
    // Served by the (status, starts_at) index from task 3.2.
    where: feedWhere(filters, now, viewerId),
    // The base order, kept for offers that end up an equal ELO distance
    // apart (or for a guest, who has no ELO to rank by at all); id breaks
    // ties at the same start time.
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      format: true,
      hasPartner: true,
      startsAt: true,
      district: true,
      ntrpMin: true,
      ntrpMax: true,
      surface: true,
      courtStatus: true,
      club: { select: { id: true, name: true } },
      author: { select: { id: true, name: true, elo: true } },
      _count: { select: { joins: { where: { status: "ACCEPTED" } } } },
    },
  });

  const offers = rows.map(({ _count, author, ...offer }) => ({
    ...offer,
    author: { id: author.id, name: author.name },
    spotsLeft: Math.max(0, playersNeeded(offer) - _count.joins),
  }));
  // Pairs each offer with its author's ELO, purely for ranking below — kept
  // out of FeedOffer itself, which only has the author's id and name.
  const ranked = rankByEloCloseness(
    offers.map((offer, i) => ({
      offer,
      elo: rows[i].author.elo,
      startsAt: offer.startsAt,
    })),
    viewer?.elo ?? null,
  ).map((entry) => entry.offer);

  const start = (page - 1) * FEED_PAGE_SIZE;
  return {
    offers: ranked.slice(start, start + FEED_PAGE_SIZE),
    page,
    hasNextPage: ranked.length > start + FEED_PAGE_SIZE,
  };
}
