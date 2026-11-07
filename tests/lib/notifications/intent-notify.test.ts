import { beforeEach, describe, expect, it, vi } from "vitest";

import { notifyMatchingOfferAuthors } from "@/lib/notifications/intent-notify";

const { offerFindMany, userUpdate, notify } = vi.hoisted(() => ({
  offerFindMany: vi.fn(),
  userUpdate: vi.fn(),
  notify: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: {
    sparringOffer: { findMany: offerFindMany },
    user: { update: userUpdate },
  },
}));
vi.mock("@/lib/notifications/notify", () => ({ notify }));

const INTENT_OWNER = "intent-owner";
const INTENT = {
  userId: INTENT_OWNER,
  date: "2026-11-10",
  times: ["evening"] as const,
  districts: ["STARE_MIASTO"] as const,
  format: "SINGLES" as const,
  selfRatedNtrp: 3.5,
};
const NOW = new Date("2026-11-10T11:00:00Z"); // noon Europe/Warsaw

function offerRow(over: Partial<Record<string, unknown>> = {}) {
  return {
    id: "offer-1",
    authorId: "author-1",
    district: "STARE_MIASTO" as const,
    ntrpMin: 3.5,
    ntrpMax: 4.0,
    format: "SINGLES" as const,
    startsAt: new Date("2026-11-10T17:00:00Z"),
    author: {
      notifyNewOffers: true,
      offerPushSentOn: null,
      offerPushSentCount: 0,
    },
    ...over,
  };
}

describe("notifyMatchingOfferAuthors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userUpdate.mockResolvedValue(undefined);
  });

  it("does nothing, not even a query, for an intent with no districts", async () => {
    await notifyMatchingOfferAuthors({ ...INTENT, districts: [] }, NOW);

    expect(offerFindMany).not.toHaveBeenCalled();
  });

  it("notifies a matching offer's author and starts their daily count at 1", async () => {
    offerFindMany.mockResolvedValue([offerRow()]);

    await notifyMatchingOfferAuthors(INTENT, NOW);

    expect(notify).toHaveBeenCalledWith(
      "author-1",
      { kind: "INTENT_FOR_YOUR_OFFER", offerId: "offer-1" },
      NOW,
    );
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: "author-1" },
      data: {
        offerPushSentOn: new Date("2026-11-10T00:00:00Z"),
        offerPushSentCount: 1,
      },
    });
  });

  it("skips an offer the matching rules reject, and never notifies its author", async () => {
    offerFindMany.mockResolvedValue([offerRow({ ntrpMin: 5.5, ntrpMax: 6.0 })]);

    await notifyMatchingOfferAuthors(INTENT, NOW);

    expect(notify).not.toHaveBeenCalled();
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("queries only open, upcoming offers in a wanted district and format", async () => {
    offerFindMany.mockResolvedValue([]);

    await notifyMatchingOfferAuthors(INTENT, NOW);

    const [args] = offerFindMany.mock.calls[0] as [{ where: object }];
    expect(args.where).toEqual({
      authorId: { not: INTENT_OWNER },
      status: "OPEN",
      startsAt: { gt: NOW },
      district: { in: ["STARE_MIASTO"] },
      format: "SINGLES",
      author: { notifyNewOffers: true },
    });
  });
});
