import type { ClubListItem } from "@/components/club-list";
import type { ClubMapMarker } from "@/components/club-map";
import { type ClubFilters, clubWhere } from "@/lib/clubs/club-filters";
import { db } from "@/lib/db";
import { feedWhere } from "@/lib/offers/feed-filters";

export type ClubSearchResult = ClubListItem & ClubMapMarker;

// The home page's court search (slice K4): the clubs matching the filters,
// each with how many open offers it has — the same "open and not started"
// rule as the offer feed (feedWhere), so the count matches what the club's
// page then lists. Read whole, not paged, like the club list always was
// (2.5): one city's clubs stay a short list.
export async function searchClubs(
  filters: ClubFilters,
  now = new Date(),
): Promise<ClubSearchResult[]> {
  const clubs = await db.club.findMany({
    where: clubWhere(filters),
    select: {
      id: true,
      name: true,
      address: true,
      district: true,
      latitude: true,
      longitude: true,
      bookingUrl: true,
      phone: true,
    },
    orderBy: { name: "asc" },
  });
  if (clubs.length === 0) {
    return [];
  }

  const counts = await db.sparringOffer.groupBy({
    by: ["clubId"],
    where: {
      AND: [feedWhere({}, now), { clubId: { in: clubs.map((c) => c.id) } }],
    },
    _count: { _all: true },
  });
  const openOffers = new Map(
    counts.map((row) => [row.clubId, row._count._all]),
  );

  return clubs.map((club) => ({
    ...club,
    openOffers: openOffers.get(club.id) ?? 0,
  }));
}
