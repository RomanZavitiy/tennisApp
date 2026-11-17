import { beforeEach, describe, expect, it, vi } from "vitest";

import { getPlayTodayFeed } from "@/lib/offers/play-today-feed";

// The database is replaced: what's under test is which games "Play today"
// asks for — one sport (PD1), public only (PD3.2), and never a men's or
// women's game the viewer couldn't join (PD3.1).
const { findMany, getPlayIntentFeed } = vi.hoisted(() => ({
  findMany: vi.fn(),
  getPlayIntentFeed: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ db: { sparringOffer: { findMany } } }));
vi.mock("@/lib/moderation/personal-block", () => ({
  blockedCounterpartIds: vi.fn().mockResolvedValue(["blocked-1"]),
}));
vi.mock("@/lib/offers/play-intent-feed", () => ({ getPlayIntentFeed }));

const NOW = new Date("2026-11-17T10:00:00Z");

describe("getPlayTodayFeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findMany.mockResolvedValue([]);
    getPlayIntentFeed.mockResolvedValue([]);
  });

  it("asks for public games of the sport that the viewer may join", async () => {
    await getPlayTodayFeed("me", 4, NOW, "PADEL", "FEMALE");

    const [args] = findMany.mock.calls[0] as [
      { where: Record<string, unknown> },
    ];
    expect(args.where).toMatchObject({
      status: "OPEN",
      visibility: "PUBLIC",
      sport: "PADEL",
      matchGender: { in: ["ANY", "WOMEN", "MIXED"] },
      authorId: { notIn: ["me", "blocked-1"] },
    });
  });

  it("leaves single-gender games out when the viewer's gender isn't given", async () => {
    await getPlayTodayFeed("me", 4, NOW);

    const [args] = findMany.mock.calls[0] as [
      { where: { sport: string; matchGender: { in: string[] } } },
    ];
    expect(args.where.sport).toBe("TENNIS");
    expect(args.where.matchGender.in).toEqual(["ANY", "MIXED"]);
  });

  it("asks for today's intents in the same sport, at the viewer's level", async () => {
    await getPlayTodayFeed("me", 4, NOW, "PADEL");

    expect(getPlayIntentFeed).toHaveBeenCalledWith(
      "me",
      { sport: "PADEL", date: "2026-11-17", ntrp: 4 },
      NOW,
    );
  });
});
