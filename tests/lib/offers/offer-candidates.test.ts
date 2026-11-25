import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOfferCandidates } from "@/lib/offers/offer-candidates";

// The database is replaced: what's under test is how the pool for "Who to
// invite" (task S2.2) is read in the offer's own sport — the padel level
// (slice PD1) and the padel ELO (slice PD4) for a padel game. The ranking
// rules themselves are lib/matching/candidates.test.ts.
const { offerFindUnique, userFindMany, emptyFindMany } = vi.hoisted(() => ({
  offerFindUnique: vi.fn(),
  userFindMany: vi.fn(),
  emptyFindMany: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: {
    sparringOffer: { findUnique: offerFindUnique },
    user: { findMany: userFindMany },
    offerDismissal: { findMany: emptyFindMany },
    offerJoin: { findMany: emptyFindMany },
    offerInvite: { findMany: emptyFindMany },
  },
}));
vi.mock("@/lib/moderation/personal-block", () => ({
  blockedCounterpartIds: vi.fn().mockResolvedValue([]),
}));

function offer(sport: "TENNIS" | "PADEL") {
  return {
    authorId: "author",
    sport,
    matchGender: "ANY",
    district: "KROWODRZA",
    ntrpMin: 3,
    ntrpMax: 4,
    author: { elo: 1900, padelElo: 1200 },
  };
}

function player(
  id: string,
  levels: {
    selfRatedNtrp: number | null;
    padelLevel: number | null;
    elo: number;
    padelElo: number | null;
  },
) {
  return {
    id,
    name: id,
    avatarPath: null,
    district: "KROWODRZA",
    scheduledMatches: 0,
    noShows: 0,
    lateCancellations: 0,
    discoverable: true,
    ...levels,
  };
}

// Tennis and padel say the opposite about who is closest to the author.
const pool = [
  player("tennis-close", {
    selfRatedNtrp: 3.5,
    padelLevel: 3.5,
    elo: 1900,
    padelElo: 1800,
  }),
  player("padel-close", {
    selfRatedNtrp: 3.5,
    padelLevel: 3.5,
    elo: 1000,
    padelElo: 1250,
  }),
  player("no-padel-level", {
    selfRatedNtrp: 3.5,
    padelLevel: null,
    elo: 1900,
    padelElo: null,
  }),
];

beforeEach(() => {
  vi.clearAllMocks();
  emptyFindMany.mockResolvedValue([]);
  userFindMany.mockResolvedValue(pool);
});

describe("getOfferCandidates", () => {
  it("ranks a tennis game's candidates by the tennis ELO", async () => {
    offerFindUnique.mockResolvedValue(offer("TENNIS"));

    const candidates = await getOfferCandidates("offer-1");

    expect(candidates.map((c) => c.id)).toEqual([
      "tennis-close",
      "no-padel-level",
      "padel-close",
    ]);
  });

  it("ranks a padel game's candidates by the padel ELO, without players who have no padel level", async () => {
    offerFindUnique.mockResolvedValue(offer("PADEL"));

    const candidates = await getOfferCandidates("offer-1");

    expect(candidates.map((c) => c.id)).toEqual([
      "padel-close",
      "tennis-close",
    ]);
  });

  it("suggests nobody for a game with no district", async () => {
    offerFindUnique.mockResolvedValue({ ...offer("PADEL"), district: null });

    expect(await getOfferCandidates("offer-1")).toEqual([]);
    expect(userFindMany).not.toHaveBeenCalled();
  });
});
