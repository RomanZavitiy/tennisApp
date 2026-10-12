import { describe, expect, it } from "vitest";

import {
  feedHref,
  feedWhere,
  parseFeedFilters,
} from "@/lib/offers/feed-filters";

const NOW = new Date("2026-10-11T10:00:00Z");
const BASE = [{ status: "OPEN" }, { startsAt: { gt: NOW } }];

describe("parseFeedFilters", () => {
  it("reads every filter from the URL", () => {
    expect(
      parseFeedFilters({
        date: "2026-10-20",
        district: "KROWODRZA",
        ntrp: "3.5",
        format: "DOUBLES",
      }),
    ).toEqual({
      date: "2026-10-20",
      district: "KROWODRZA",
      ntrp: 3.5,
      format: "DOUBLES",
    });
  });

  it("treats a missing or empty value as no filter", () => {
    expect(parseFeedFilters({})).toEqual({});
    expect(
      parseFeedFilters({ date: "", district: "", ntrp: "", format: "" }),
    ).toEqual({});
  });

  it("ignores values that don't parse, keeping the rest", () => {
    expect(
      parseFeedFilters({
        date: "2026-02-30",
        district: "WARSZAWA",
        ntrp: "3.7",
        format: "DOUBLES",
      }),
    ).toEqual({ format: "DOUBLES" });
    expect(parseFeedFilters({ ntrp: "abc" })).toEqual({});
    expect(parseFeedFilters({ ntrp: "8" })).toEqual({});
  });

  it("takes the first of repeated values and ignores unknown keys", () => {
    expect(
      parseFeedFilters({ format: ["SINGLES", "DOUBLES"], page: "2", x: "y" }),
    ).toEqual({ format: "SINGLES" });
  });
});

describe("feedWhere", () => {
  it("without filters asks for open offers that haven't started", () => {
    expect(feedWhere({}, NOW)).toEqual({ AND: BASE });
  });

  it("limits a date to that Kraków day", () => {
    expect(feedWhere({ date: "2026-10-20" }, NOW)).toEqual({
      AND: [
        ...BASE,
        {
          startsAt: {
            // Kraków is UTC+2 on 20 October.
            gte: new Date("2026-10-19T22:00:00Z"),
            lt: new Date("2026-10-20T22:00:00Z"),
          },
        },
      ],
    });
  });

  it("handles the day clocks go back: a 25-hour day", () => {
    expect(feedWhere({ date: "2026-10-25" }, NOW)).toEqual({
      AND: [
        ...BASE,
        {
          startsAt: {
            gte: new Date("2026-10-24T22:00:00Z"),
            lt: new Date("2026-10-25T23:00:00Z"),
          },
        },
      ],
    });
  });

  it("matches a level inside the offer's range, an open bound counting as any", () => {
    expect(feedWhere({ ntrp: 3.5 }, NOW)).toEqual({
      AND: [
        ...BASE,
        { OR: [{ ntrpMin: null }, { ntrpMin: { lte: 3.5 } }] },
        { OR: [{ ntrpMax: null }, { ntrpMax: { gte: 3.5 } }] },
      ],
    });
  });

  it("combines every filter", () => {
    expect(
      feedWhere(
        {
          date: "2026-12-01",
          district: "DEBNIKI",
          ntrp: 4,
          format: "SINGLES",
        },
        NOW,
      ),
    ).toEqual({
      AND: [
        ...BASE,
        {
          startsAt: {
            // Winter: UTC+1.
            gte: new Date("2026-11-30T23:00:00Z"),
            lt: new Date("2026-12-01T23:00:00Z"),
          },
        },
        { district: "DEBNIKI" },
        { OR: [{ ntrpMin: null }, { ntrpMin: { lte: 4 } }] },
        { OR: [{ ntrpMax: null }, { ntrpMax: { gte: 4 } }] },
        { format: "SINGLES" },
      ],
    });
  });

  it("crosses month and year ends", () => {
    const where = feedWhere({ date: "2026-12-31" }, NOW);
    expect(where.AND).toContainEqual({
      startsAt: {
        gte: new Date("2026-12-30T23:00:00Z"),
        lt: new Date("2026-12-31T23:00:00Z"),
      },
    });
  });

  it("leaves out a signed-in viewer's own offers when asked", () => {
    expect(feedWhere({}, NOW, "author-1")).toEqual({
      AND: [...BASE, { authorId: { not: "author-1" } }],
    });
  });

  it("does not exclude anyone for a guest", () => {
    expect(feedWhere({}, NOW, null)).toEqual({ AND: BASE });
    expect(feedWhere({}, NOW)).toEqual({ AND: BASE });
  });
});

describe("feedHref", () => {
  it("leaves out empty filters and the first page", () => {
    expect(feedHref({})).toBe("/offers");
    expect(feedHref({}, 1)).toBe("/offers");
    expect(feedHref({}, 2)).toBe("/offers?page=2");
  });

  it("keeps the filters on every page", () => {
    expect(
      feedHref({ date: "2026-10-20", ntrp: 4, format: "DOUBLES" }, 3),
    ).toBe("/offers?date=2026-10-20&ntrp=4.0&format=DOUBLES&page=3");
  });

  it("round-trips through parseFeedFilters", () => {
    const filters = {
      date: "2026-10-20",
      district: "PODGORZE",
      ntrp: 2.5,
      format: "SINGLES",
    } as const;
    const query = new URL(feedHref(filters), "http://x").searchParams;
    expect(parseFeedFilters(Object.fromEntries(query))).toEqual(filters);
  });
});
