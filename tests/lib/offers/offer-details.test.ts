import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOfferDetails } from "@/lib/offers/offer-details";

// The database is replaced: what's under test is who gets which part of the
// offer — the request list is the author's alone.
const { offerFindUnique, joinFindMany, joinFindUnique } = vi.hoisted(() => ({
  offerFindUnique: vi.fn(),
  joinFindMany: vi.fn(),
  joinFindUnique: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: {
    sparringOffer: { findUnique: offerFindUnique },
    offerJoin: { findMany: joinFindMany, findUnique: joinFindUnique },
  },
}));

const OFFER = "44444444-4444-4444-8444-444444444444";
const AUTHOR = "22222222-2222-4222-8222-222222222222";
const PLAYER = "33333333-3333-4333-8333-333333333333";

describe("getOfferDetails", () => {
  const player = {
    id: AUTHOR,
    name: "Ola",
    selfRatedNtrp: 3.5,
    scheduledMatches: 0,
    noShows: 0,
    lateCancellations: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    offerFindUnique.mockResolvedValue({
      id: OFFER,
      format: "DOUBLES",
      hasPartner: false,
      author: player,
      _count: { joins: 1 },
    });
    joinFindMany.mockResolvedValue([
      { id: "j1", status: "REQUESTED", user: player },
    ]);
    joinFindUnique.mockResolvedValue({ id: "j2", status: "REQUESTED" });
  });

  it("returns null for an id that isn't a uuid, without a query", async () => {
    await expect(getOfferDetails("new", null)).resolves.toBeNull();
    expect(offerFindUnique).not.toHaveBeenCalled();
  });

  it("returns null for a missing offer", async () => {
    offerFindUnique.mockResolvedValue(null);
    await expect(getOfferDetails(OFFER, null)).resolves.toBeNull();
  });

  it("counts the places left and shows a guest no requests", async () => {
    const details = await getOfferDetails(OFFER, null);

    expect(details).toMatchObject({
      spotsLeft: 2,
      isAuthor: false,
      viewerJoin: null,
      joins: [],
    });
    expect(details?.offer).not.toHaveProperty("_count");
    expect(joinFindMany).not.toHaveBeenCalled();
    expect(joinFindUnique).not.toHaveBeenCalled();
  });

  it("gives a player their own request only", async () => {
    const details = await getOfferDetails(OFFER, PLAYER);

    expect(details).toMatchObject({
      isAuthor: false,
      viewerJoin: { id: "j2", status: "REQUESTED" },
      joins: [],
    });
    const resultSelect = {
      id: true,
      status: true,
      winner: true,
      reportedBy: true,
      noShowParty: true,
      score: true,
      authorEloBefore: true,
      authorEloAfter: true,
      playerEloBefore: true,
      playerEloAfter: true,
    };
    expect(joinFindUnique).toHaveBeenCalledWith({
      where: { offerId_userId: { offerId: OFFER, userId: PLAYER } },
      select: { id: true, status: true, result: { select: resultSelect } },
    });
    expect(joinFindMany).not.toHaveBeenCalled();
  });

  it("gives the author the open and accepted requests", async () => {
    const details = await getOfferDetails(OFFER, AUTHOR);

    expect(details).toMatchObject({
      isAuthor: true,
      viewerJoin: null,
      joins: [{ id: "j1" }],
    });
    expect(joinFindMany.mock.calls[0]?.[0]).toMatchObject({
      where: { offerId: OFFER, status: { in: ["REQUESTED", "ACCEPTED"] } },
    });
  });

  it("selects only public player fields", async () => {
    await getOfferDetails(OFFER, AUTHOR);

    const playerOnly = {
      select: {
        id: true,
        name: true,
        selfRatedNtrp: true,
        scheduledMatches: true,
        noShows: true,
        lateCancellations: true,
      },
    };
    // toEqual, not toMatchObject: an extra field must fail the test.
    const offerQuery = offerFindUnique.mock.calls[0]?.[0] as {
      select: { author: unknown };
    };
    const joinsQuery = joinFindMany.mock.calls[0]?.[0] as {
      select: { user: unknown };
    };
    expect(offerQuery.select.author).toEqual(playerOnly);
    expect(joinsQuery.select.user).toEqual(playerOnly);
  });
});
