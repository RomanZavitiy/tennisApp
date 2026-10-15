import { beforeEach, describe, expect, it, vi } from "vitest";

import { notifyInterestedPlayers } from "@/lib/notifications/new-offer";

const { userFindMany, userUpdate, notify } = vi.hoisted(() => ({
  userFindMany: vi.fn(),
  userUpdate: vi.fn(),
  notify: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: { user: { findMany: userFindMany, update: userUpdate } },
}));
vi.mock("@/lib/notifications/notify", () => ({ notify }));

const AUTHOR = "author-1";
const OFFER = {
  offerId: "offer-1",
  authorId: AUTHOR,
  district: "STARE_MIASTO" as const,
  ntrpMin: 3.5,
  ntrpMax: 4.0,
};
const NOW = new Date("2026-11-10T12:00:00Z"); // noon Europe/Warsaw

function candidateRow(over: Partial<Record<string, unknown>> = {}) {
  return {
    id: "candidate-1",
    district: "STARE_MIASTO" as const,
    selfRatedNtrp: 3.5,
    notifyNewOffers: true,
    offerPushSentOn: null,
    offerPushSentCount: 0,
    ...over,
  };
}

describe("notifyInterestedPlayers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userUpdate.mockResolvedValue(undefined);
  });

  it("does nothing, not even a query, for an offer with no district", async () => {
    await notifyInterestedPlayers({ ...OFFER, district: null }, NOW);

    expect(userFindMany).not.toHaveBeenCalled();
  });

  it("notifies a matching candidate and starts their daily count at 1", async () => {
    userFindMany.mockResolvedValue([candidateRow()]);

    await notifyInterestedPlayers(OFFER, NOW);

    expect(notify).toHaveBeenCalledWith(
      "candidate-1",
      { kind: "NEW_OFFER_FOR_LEVEL", offerId: "offer-1" },
      NOW,
    );
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: "candidate-1" },
      data: {
        offerPushSentOn: new Date("2026-11-10T00:00:00Z"),
        offerPushSentCount: 1,
      },
    });
  });

  it("increments today's count instead of resetting it", async () => {
    userFindMany.mockResolvedValue([
      candidateRow({
        offerPushSentOn: new Date("2026-11-10T00:00:00Z"),
        offerPushSentCount: 1,
      }),
    ]);

    await notifyInterestedPlayers(OFFER, NOW);

    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: "candidate-1" },
      data: { offerPushSentCount: { increment: 1 } },
    });
  });

  it("skips a candidate the matching rules reject, and never notifies them", async () => {
    userFindMany.mockResolvedValue([
      candidateRow({ selfRatedNtrp: 1.5 }), // far outside the level range
    ]);

    await notifyInterestedPlayers(OFFER, NOW);

    expect(notify).not.toHaveBeenCalled();
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("queries only onboarded players in the offer's own district, excluding the author", async () => {
    userFindMany.mockResolvedValue([]);

    await notifyInterestedPlayers(OFFER, NOW);

    const [args] = userFindMany.mock.calls[0] as [{ where: object }];
    expect(args.where).toEqual({
      id: { not: AUTHOR },
      district: "STARE_MIASTO",
      notifyNewOffers: true,
      onboardingCompletedAt: { not: null },
    });
  });
});
