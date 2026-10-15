import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  FEED_PAGE_SIZE,
  getClubOffers,
  getOfferFeed,
  parsePage,
} from "@/lib/offers/feed";

// The database is replaced: what's under test is which offers the query asks
// for, how pages are cut, and how free spots and the ranking are computed.
const { findMany, findUnique } = vi.hoisted(() => ({
  findMany: vi.fn(),
  findUnique: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: {
    sparringOffer: { findMany },
    user: { findUnique },
  },
}));

const NOW = new Date("2026-10-11T10:00:00Z");

function row(
  id: number,
  offer: {
    format?: string;
    hasPartner?: boolean;
    accepted?: number;
    elo?: number | null;
    startsAt?: Date;
    authorId?: string;
    courtStatus?: string;
  } = {},
) {
  return {
    id: String(id),
    format: offer.format ?? "SINGLES",
    hasPartner: offer.hasPartner ?? false,
    startsAt: offer.startsAt ?? new Date("2026-10-20T16:00:00Z"),
    district: "KROWODRZA",
    ntrpMin: null,
    ntrpMax: null,
    surface: null,
    courtStatus: offer.courtStatus ?? "WILL_BOOK",
    club: null,
    author: {
      id: offer.authorId ?? "a",
      name: "Ola",
      elo: offer.elo === undefined ? 1500 : offer.elo,
      scheduledMatches: 0,
      noShows: 0,
      lateCancellations: 0,
    },
    _count: { joins: offer.accepted ?? 0 },
  };
}

describe("parsePage", () => {
  it.each([
    [undefined, 1],
    ["2", 2],
    [["3", "4"], 3],
    ["0", 1],
    ["-1", 1],
    ["1.5", 1],
    ["abc", 1],
    ["", 1],
  ])("reads %j as page %i", (value, page) => {
    expect(parsePage(value)).toBe(page);
  });
});

describe("getOfferFeed", () => {
  beforeEach(() => {
    findMany.mockReset();
    findMany.mockResolvedValue([]);
    findUnique.mockReset();
    findUnique.mockResolvedValue(null);
  });

  it("asks only for open offers that haven't started, soonest first", async () => {
    await getOfferFeed(1, {}, null, NOW);

    const query = findMany.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(query.where).toEqual({
      AND: [{ status: "OPEN" }, { startsAt: { gt: NOW } }],
    });
    expect(query.orderBy).toEqual([{ startsAt: "asc" }, { id: "asc" }]);
  });

  it("counts only accepted joins against the free spots", async () => {
    await getOfferFeed(1, {}, null, NOW);

    const query = findMany.mock.calls[0]?.[0] as {
      select: { _count: unknown };
    };
    expect(query.select._count).toEqual({
      select: { joins: { where: { status: "ACCEPTED" } } },
    });
  });

  it("returns a full page and says there is a next one", async () => {
    findMany.mockResolvedValue(
      Array.from({ length: FEED_PAGE_SIZE + 1 }, (_, i) => row(i)),
    );

    const feed = await getOfferFeed(1, {}, null, NOW);

    expect(feed.offers).toHaveLength(FEED_PAGE_SIZE);
    expect(feed.hasNextPage).toBe(true);
  });

  it("says there is no next page on the last one", async () => {
    findMany.mockResolvedValue(
      Array.from({ length: FEED_PAGE_SIZE + 2 }, (_, i) => row(i)),
    );

    const feed = await getOfferFeed(2, {}, null, NOW);

    expect(feed).toMatchObject({ page: 2, hasNextPage: false });
    expect(feed.offers).toHaveLength(2);
  });

  it("carries the court status through to the feed offer", async () => {
    findMany.mockResolvedValue([row(1, { courtStatus: "BOOKED" })]);

    const feed = await getOfferFeed(1, {}, null, NOW);

    expect(feed.offers[0]?.courtStatus).toBe("BOOKED");
  });

  it("computes the author's reliability for the card (4.12)", async () => {
    const withHistory = row(1);
    withHistory.author = {
      ...withHistory.author,
      scheduledMatches: 4,
      noShows: 1,
      lateCancellations: 0,
    };
    findMany.mockResolvedValue([withHistory]);

    const feed = await getOfferFeed(1, {}, null, NOW);

    expect(feed.offers[0]?.author.reliability).toEqual({
      kind: "rated",
      percent: 75,
    });
  });

  it("works out the spots left for each format", async () => {
    findMany.mockResolvedValue([
      row(1),
      row(2, { format: "DOUBLES" }),
      row(3, { format: "DOUBLES", accepted: 1 }),
      row(4, { format: "DOUBLES", hasPartner: true }),
    ]);

    const feed = await getOfferFeed(1, {}, null, NOW);

    expect(feed.offers.map((offer) => offer.spotsLeft)).toEqual([1, 3, 2, 2]);
    expect(feed.offers[0]).not.toHaveProperty("_count");
    expect(feed.offers[0]).not.toHaveProperty("elo");
  });

  it("narrows the query by the filters", async () => {
    await getOfferFeed(1, { format: "DOUBLES" }, null, NOW);

    const query = findMany.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(query.where).toEqual({
      AND: [
        { status: "OPEN" },
        { startsAt: { gt: NOW } },
        { format: "DOUBLES" },
      ],
    });
  });

  it("excludes the viewer's own offers", async () => {
    findUnique.mockResolvedValue({ elo: 1500 });

    await getOfferFeed(1, {}, "viewer-1", NOW);

    const query = findMany.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(query.where).toEqual({
      AND: [
        { status: "OPEN" },
        { startsAt: { gt: NOW } },
        { authorId: { not: "viewer-1" } },
      ],
    });
  });

  it("does not look up an ELO for a guest", async () => {
    await getOfferFeed(1, {}, null, NOW);

    expect(findUnique).not.toHaveBeenCalled();
  });

  it("ranks offers by ELO closeness to a signed-in viewer", async () => {
    findUnique.mockResolvedValue({ elo: 1500 });
    const near = row(1, { elo: 1510 });
    const far = row(2, { elo: 1900 });
    findMany.mockResolvedValue([far, near]);

    const feed = await getOfferFeed(1, {}, "viewer-1", NOW);

    expect(feed.offers.map((offer) => offer.id)).toEqual(["1", "2"]);
  });

  it("falls back to date order for a guest", async () => {
    const soon = row(1, {
      elo: 1900,
      startsAt: new Date("2026-10-20T10:00:00Z"),
    });
    const later = row(2, {
      elo: 1500,
      startsAt: new Date("2026-10-21T10:00:00Z"),
    });
    // The database already returns them soonest first.
    findMany.mockResolvedValue([soon, later]);

    const feed = await getOfferFeed(1, {}, null, NOW);

    expect(feed.offers.map((offer) => offer.id)).toEqual(["1", "2"]);
  });
});

describe("getClubOffers", () => {
  beforeEach(() => {
    findMany.mockReset();
    findMany.mockResolvedValue([]);
  });

  it("asks for open, upcoming offers at just this club, soonest first", async () => {
    await getClubOffers("club-1", NOW);

    const query = findMany.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(query.where).toEqual({
      AND: [
        { AND: [{ status: "OPEN" }, { startsAt: { gt: NOW } }] },
        { clubId: "club-1" },
      ],
    });
    expect(query.orderBy).toEqual([{ startsAt: "asc" }, { id: "asc" }]);
  });

  it("returns every match, unranked and unpaged", async () => {
    findMany.mockResolvedValue(
      Array.from({ length: FEED_PAGE_SIZE + 1 }, (_, i) => row(i)),
    );

    const offers = await getClubOffers("club-1", NOW);

    expect(offers).toHaveLength(FEED_PAGE_SIZE + 1);
  });

  it("works out spots left the same way the feed does", async () => {
    findMany.mockResolvedValue([row(1, { format: "DOUBLES", accepted: 1 })]);

    const offers = await getClubOffers("club-1", NOW);

    expect(offers[0]?.spotsLeft).toBe(2);
  });
});
