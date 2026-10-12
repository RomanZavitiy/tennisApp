import { describe, expect, it } from "vitest";

import {
  rankByEloCloseness,
  type RankableOffer,
} from "@/lib/matching/elo-rank";

function offer(
  elo: number | null,
  startsAt: string,
): RankableOffer & { id: string } {
  return {
    id: `${String(elo)}@${startsAt}`,
    elo,
    startsAt: new Date(startsAt),
  };
}

describe("rankByEloCloseness", () => {
  it("ranks the closer ELO higher", () => {
    const near = offer(1510, "2026-11-01T10:00:00Z");
    const far = offer(1800, "2026-11-01T10:00:00Z");

    const ranked = rankByEloCloseness([far, near], 1500);

    expect(ranked).toEqual([near, far]);
  });

  it("breaks an equal ELO distance by the earlier start time", () => {
    const later = offer(1600, "2026-11-02T10:00:00Z");
    const earlier = offer(1400, "2026-11-01T10:00:00Z");

    const ranked = rankByEloCloseness([later, earlier], 1500);

    expect(ranked).toEqual([earlier, later]);
  });

  it("does not break the sort when an offer's author has no ELO", () => {
    const withElo = offer(1700, "2026-11-03T10:00:00Z");
    const withoutElo = offer(null, "2026-11-01T10:00:00Z");

    const ranked = rankByEloCloseness([withoutElo, withElo], 1500);

    expect(ranked).toEqual([withElo, withoutElo]);
  });

  it("falls back to start time among several offers with no ELO", () => {
    const later = offer(null, "2026-11-02T10:00:00Z");
    const earlier = offer(null, "2026-11-01T10:00:00Z");

    const ranked = rankByEloCloseness([later, earlier], 1500);

    expect(ranked).toEqual([earlier, later]);
  });

  it("sorts by start time alone when the viewer has no ELO", () => {
    const later = offer(1900, "2026-11-02T10:00:00Z");
    const earlier = offer(1200, "2026-11-01T10:00:00Z");

    const ranked = rankByEloCloseness([later, earlier], null);

    expect(ranked).toEqual([earlier, later]);
  });

  it("does not mutate the input array", () => {
    const offers = [
      offer(1800, "2026-11-01T10:00:00Z"),
      offer(1500, "2026-11-01T10:00:00Z"),
    ];
    const original = [...offers];

    rankByEloCloseness(offers, 1500);

    expect(offers).toEqual(original);
  });
});
