import { beforeEach, describe, expect, it, vi } from "vitest";

import { searchClubs } from "@/lib/clubs/club-search";

const { clubFindMany, offerGroupBy } = vi.hoisted(() => ({
  clubFindMany: vi.fn(),
  offerGroupBy: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: {
    club: { findMany: clubFindMany },
    sparringOffer: { groupBy: offerGroupBy },
  },
}));

const NOW = new Date("2026-11-10T12:00:00Z");

function club(id: string) {
  return {
    id,
    name: `Club ${id}`,
    address: "Testowa 1",
    district: "PODGORZE",
    latitude: 50,
    longitude: 19.9,
    bookingUrl: null,
    phone: null,
  };
}

describe("searchClubs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("filters clubs and counts each one's open, upcoming offers", async () => {
    clubFindMany.mockResolvedValue([club("a"), club("b")]);
    offerGroupBy.mockResolvedValue([{ clubId: "a", _count: { _all: 3 } }]);

    const result = await searchClubs({ surface: "CLAY" }, NOW);

    expect(clubFindMany.mock.calls[0]?.[0]).toMatchObject({
      where: { AND: [{ surfaces: { has: "CLAY" } }] },
      orderBy: { name: "asc" },
    });
    expect(offerGroupBy).toHaveBeenCalledWith({
      by: ["clubId"],
      where: {
        AND: [
          { AND: [{ status: "OPEN" }, { startsAt: { gt: NOW } }] },
          { clubId: { in: ["a", "b"] } },
        ],
      },
      _count: { _all: true },
    });
    expect(result.map((c) => [c.id, c.openOffers])).toEqual([
      ["a", 3],
      ["b", 0],
    ]);
  });

  it("skips the offer count when no club matches", async () => {
    clubFindMany.mockResolvedValue([]);

    await expect(searchClubs({}, NOW)).resolves.toEqual([]);
    expect(offerGroupBy).not.toHaveBeenCalled();
  });
});
