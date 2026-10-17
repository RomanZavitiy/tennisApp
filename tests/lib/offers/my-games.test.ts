import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMyUpcomingGames } from "@/lib/offers/my-games";

const { offerFindMany, joinFindMany } = vi.hoisted(() => ({
  offerFindMany: vi.fn(),
  joinFindMany: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: {
    sparringOffer: { findMany: offerFindMany },
    offerJoin: { findMany: joinFindMany },
  },
}));

const ME = "user-1";
const NOW = new Date("2026-10-17T10:00:00Z");

function offer(id: string, startsAt: string) {
  return {
    id,
    startsAt: new Date(startsAt),
    durationMinutes: 90,
    district: "PODGORZE",
    club: null,
  };
}

describe("getMyUpcomingGames", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    offerFindMany.mockResolvedValue([]);
    joinFindMany.mockResolvedValue([]);
  });

  it("asks only for the player's upcoming, not-cancelled games", async () => {
    await getMyUpcomingGames(ME, NOW);

    const upcoming = {
      status: { in: ["OPEN", "FULL"] },
      startsAt: { gt: NOW },
    };
    expect(offerFindMany.mock.calls[0]?.[0]).toMatchObject({
      where: { authorId: ME, ...upcoming },
    });
    expect(joinFindMany.mock.calls[0]?.[0]).toMatchObject({
      where: {
        userId: ME,
        status: { in: ["REQUESTED", "ACCEPTED"] },
        offer: upcoming,
      },
    });
  });

  it("merges posted and joined games, soonest first, with each role", async () => {
    offerFindMany.mockResolvedValue([
      { ...offer("mine", "2026-10-20T16:00:00Z"), _count: { joins: 2 } },
    ]);
    joinFindMany.mockResolvedValue([
      { status: "ACCEPTED", offer: offer("in", "2026-10-18T16:00:00Z") },
      { status: "REQUESTED", offer: offer("asked", "2026-10-22T16:00:00Z") },
    ]);

    const games = await getMyUpcomingGames(ME, NOW);

    expect(games.map((g) => [g.offerId, g.role, g.pendingRequests])).toEqual([
      ["in", "ACCEPTED", 0],
      ["mine", "AUTHOR", 2],
      ["asked", "REQUESTED", 0],
    ]);
  });
});
