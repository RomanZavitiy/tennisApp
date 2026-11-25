import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMyOpenOffers } from "@/lib/offers/my-open-offers";

// The database is replaced: what's under test is which of the viewer's own
// games "Invite to game" offers (task S1.4) — open, upcoming, and since
// slice PD2 optionally of one sport only.
const { offerFindMany } = vi.hoisted(() => ({ offerFindMany: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: { sparringOffer: { findMany: offerFindMany } },
}));

const NOW = new Date("2026-11-25T10:00:00Z");

beforeEach(() => {
  vi.clearAllMocks();
  offerFindMany.mockResolvedValue([]);
});

describe("getMyOpenOffers", () => {
  it("reads the author's open, upcoming games of both sports by default", async () => {
    await getMyOpenOffers("user-1", NOW);

    expect(offerFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { authorId: "user-1", status: "OPEN", startsAt: { gt: NOW } },
        orderBy: { startsAt: "asc" },
      }),
    );
  });

  it("keeps only one sport's games when a sport is given", async () => {
    await getMyOpenOffers("user-1", NOW, "PADEL");

    expect(offerFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          authorId: "user-1",
          status: "OPEN",
          startsAt: { gt: NOW },
          sport: "PADEL",
        },
      }),
    );
  });
});
