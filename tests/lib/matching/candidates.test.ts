import { describe, expect, it } from "vitest";

import {
  MAX_CANDIDATES,
  rankCandidates,
  type CandidateOffer,
  type CandidatePlayer,
} from "@/lib/matching/candidates";

const AUTHOR = "author-id";
const OFFER: CandidateOffer = {
  authorId: AUTHOR,
  district: "STARE_MIASTO",
  ntrpMin: 3.5,
  ntrpMax: 4.0,
};

function player(over: Partial<CandidatePlayer> = {}): CandidatePlayer {
  return {
    id: "player-id",
    name: "A Player",
    avatarPath: null,
    district: "STARE_MIASTO",
    selfRatedNtrp: 3.5,
    elo: 1200,
    scheduledMatches: 5,
    noShows: 0,
    lateCancellations: 0,
    discoverable: true,
    ...over,
  };
}

describe("rankCandidates", () => {
  it("includes a player matching level, district and reliability", () => {
    const result = rankCandidates([player()], OFFER, 1200);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("player-id");
  });

  it("excludes the author even if they'd otherwise match", () => {
    const result = rankCandidates([player({ id: AUTHOR })], OFFER, 1200);
    expect(result).toHaveLength(0);
  });

  it("excludes a player who opted out of discoverability (task S2.3)", () => {
    const result = rankCandidates(
      [player({ discoverable: false })],
      OFFER,
      1200,
    );
    expect(result).toHaveLength(0);
  });

  it("excludes a player with no district, or a different one", () => {
    expect(
      rankCandidates([player({ district: null })], OFFER, 1200),
    ).toHaveLength(0);
    expect(
      rankCandidates([player({ district: "PODGORZE" })], OFFER, 1200),
    ).toHaveLength(0);
  });

  it("excludes a player outside the offer's NTRP range (±0.5)", () => {
    expect(
      rankCandidates([player({ selfRatedNtrp: 2.5 })], OFFER, 1200),
    ).toHaveLength(0);
    // 3.0 is within half a step below the offer's own 3.5 minimum.
    expect(
      rankCandidates([player({ selfRatedNtrp: 3.0 })], OFFER, 1200),
    ).toHaveLength(1);
  });

  it("excludes an established player with low reliability", () => {
    const unreliable = player({
      scheduledMatches: 10,
      noShows: 5,
      lateCancellations: 0,
    });
    expect(rankCandidates([unreliable], OFFER, 1200)).toHaveLength(0);
  });

  it("does not exclude a newcomer for low reliability (task S2.1)", () => {
    const newcomer = player({ scheduledMatches: 1, noShows: 1 });
    expect(rankCandidates([newcomer], OFFER, 1200)).toHaveLength(1);
  });

  it("ranks closer ELO to the author first", () => {
    const close = player({ id: "close", elo: 1210 });
    const far = player({ id: "far", elo: 1500 });
    const result = rankCandidates([far, close], OFFER, 1200);
    expect(result.map((c) => c.id)).toEqual(["close", "far"]);
  });

  it("sorts a missing ELO last", () => {
    const missing = player({ id: "missing", elo: null });
    const known = player({ id: "known", elo: 1600 });
    const result = rankCandidates([missing, known], OFFER, 1200);
    expect(result.map((c) => c.id)).toEqual(["known", "missing"]);
  });

  it("caps the list at MAX_CANDIDATES", () => {
    const pool = Array.from({ length: MAX_CANDIDATES + 5 }, (_, i) =>
      player({ id: `p${String(i)}`, elo: 1200 + i }),
    );
    expect(rankCandidates(pool, OFFER, 1200)).toHaveLength(MAX_CANDIDATES);
  });
});
