import { beforeEach, describe, expect, it, vi } from "vitest";

import { notifyFavoriters } from "@/lib/notifications/favorite-offer";

// The database is replaced: what's under test is who hears that a
// favourite player posted a game (slice PD3, task PD3.4).
const { favoriteFindMany, userUpdate, notify, blockedCounterpartIds } =
  vi.hoisted(() => ({
    favoriteFindMany: vi.fn(),
    userUpdate: vi.fn(),
    notify: vi.fn(),
    blockedCounterpartIds: vi.fn(),
  }));
vi.mock("@/lib/db", () => ({
  db: {
    playerFavorite: { findMany: favoriteFindMany },
    user: { update: userUpdate },
  },
}));
vi.mock("@/lib/notifications/notify", () => ({ notify }));
vi.mock("@/lib/moderation/personal-block", () => ({ blockedCounterpartIds }));

const NOW = new Date("2026-11-10T11:00:00Z"); // noon Europe/Warsaw
const OFFER = {
  offerId: "offer-1",
  authorId: "author",
  matchGender: "ANY" as const,
};

function fan(id: string, over: Record<string, unknown> = {}) {
  return {
    user: {
      id,
      notifyNewOffers: true,
      offerPushSentOn: null,
      offerPushSentCount: 0,
      ...over,
    },
  };
}

describe("notifyFavoriters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    blockedCounterpartIds.mockResolvedValue([]);
    userUpdate.mockResolvedValue(undefined);
  });

  it("notifies the players who keep the author as a favourite and counts it", async () => {
    favoriteFindMany.mockResolvedValue([fan("fan-1")]);

    expect(await notifyFavoriters(OFFER, [], NOW)).toEqual(["fan-1"]);

    expect(notify).toHaveBeenCalledWith(
      "fan-1",
      { kind: "FAVORITE_POSTED_OFFER", offerId: "offer-1" },
      NOW,
    );
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: "fan-1" },
      data: {
        offerPushSentOn: new Date("2026-11-10T00:00:00Z"),
        offerPushSentCount: 1,
      },
    });
  });

  it("skips a player the level push already reached, and a blocked one", async () => {
    favoriteFindMany.mockResolvedValue([
      fan("already"),
      fan("blocked"),
      fan("fan-1"),
    ]);
    blockedCounterpartIds.mockResolvedValue(["blocked"]);

    expect(await notifyFavoriters(OFFER, ["already"], NOW)).toEqual(["fan-1"]);
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it("respects the daily cap and quiet hours", async () => {
    favoriteFindMany.mockResolvedValue([
      fan("capped", {
        offerPushSentOn: new Date("2026-11-10T00:00:00Z"),
        offerPushSentCount: 3,
      }),
    ]);
    expect(await notifyFavoriters(OFFER, [], NOW)).toEqual([]);

    favoriteFindMany.mockResolvedValue([fan("fan-1")]);
    const night = new Date("2026-11-10T22:30:00Z"); // 23:30 Europe/Warsaw
    expect(await notifyFavoriters(OFFER, [], night)).toEqual([]);
    expect(notify).not.toHaveBeenCalled();
  });

  it("asks only for opted-in players the game is for", async () => {
    favoriteFindMany.mockResolvedValue([]);

    await notifyFavoriters({ ...OFFER, matchGender: "WOMEN" }, [], NOW);

    const [args] = favoriteFindMany.mock.calls[0] as [{ where: object }];
    expect(args.where).toEqual({
      favoriteId: "author",
      user: {
        notifyNewOffers: true,
        onboardingCompletedAt: { not: null },
        gender: "FEMALE",
      },
    });
  });
});
