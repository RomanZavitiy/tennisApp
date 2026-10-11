import { beforeEach, describe, expect, it, vi } from "vitest";

import { FEED_PAGE_SIZE, getOfferFeed, parsePage } from "@/lib/offers/feed";

// The database is replaced: what's under test is which offers the query asks
// for, how pages are cut, and how free spots are counted.
const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { sparringOffer: { findMany } } }));

const NOW = new Date("2026-10-11T10:00:00Z");

function row(
  id: number,
  offer: { format?: string; hasPartner?: boolean; accepted?: number } = {},
) {
  return {
    id: String(id),
    format: offer.format ?? "SINGLES",
    hasPartner: offer.hasPartner ?? false,
    startsAt: new Date("2026-10-20T16:00:00Z"),
    district: "KROWODRZA",
    ntrpMin: null,
    ntrpMax: null,
    surface: null,
    club: null,
    author: { id: "a", name: "Ola" },
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
  });

  it("asks only for open offers that haven't started, soonest first", async () => {
    await getOfferFeed(1, NOW);

    const query = findMany.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(query.where).toEqual({ status: "OPEN", startsAt: { gt: NOW } });
    expect(query.orderBy).toEqual([{ startsAt: "asc" }, { id: "asc" }]);
  });

  it("counts only accepted joins against the free spots", async () => {
    await getOfferFeed(1, NOW);

    const query = findMany.mock.calls[0]?.[0] as {
      select: { _count: unknown };
    };
    expect(query.select._count).toEqual({
      select: { joins: { where: { status: "ACCEPTED" } } },
    });
  });

  it("reads one page at a time, plus one row to see if there's more", async () => {
    await getOfferFeed(3, NOW);

    expect(findMany.mock.calls[0]?.[0]).toMatchObject({
      skip: 2 * FEED_PAGE_SIZE,
      take: FEED_PAGE_SIZE + 1,
    });
  });

  it("returns a full page and says there is a next one", async () => {
    findMany.mockResolvedValue(
      Array.from({ length: FEED_PAGE_SIZE + 1 }, (_, i) => row(i)),
    );

    const feed = await getOfferFeed(1, NOW);

    expect(feed.offers).toHaveLength(FEED_PAGE_SIZE);
    expect(feed.hasNextPage).toBe(true);
  });

  it("says there is no next page on the last one", async () => {
    findMany.mockResolvedValue([row(1), row(2)]);

    const feed = await getOfferFeed(2, NOW);

    expect(feed).toMatchObject({ page: 2, hasNextPage: false });
    expect(feed.offers).toHaveLength(2);
  });

  it("works out the spots left for each format", async () => {
    findMany.mockResolvedValue([
      row(1),
      row(2, { format: "DOUBLES" }),
      row(3, { format: "DOUBLES", accepted: 1 }),
      row(4, { format: "DOUBLES", hasPartner: true }),
    ]);

    const feed = await getOfferFeed(1, NOW);

    expect(feed.offers.map((offer) => offer.spotsLeft)).toEqual([1, 3, 2, 2]);
    expect(feed.offers[0]).not.toHaveProperty("_count");
  });
});
