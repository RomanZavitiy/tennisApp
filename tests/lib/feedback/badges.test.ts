import { describe, expect, it } from "vitest";

import { BADGE_THRESHOLD, computeBadges } from "@/lib/feedback/badges";

describe("computeBadges", () => {
  it("shows no badge below the threshold", () => {
    expect(computeBadges({ PUNCTUAL: BADGE_THRESHOLD - 1 })).toEqual([]);
  });

  it("shows a badge exactly at the threshold", () => {
    expect(computeBadges({ PUNCTUAL: BADGE_THRESHOLD })).toEqual(["PUNCTUAL"]);
  });

  it("shows every tag that clears the threshold, and only those", () => {
    expect(
      computeBadges({
        PUNCTUAL: BADGE_THRESHOLD,
        LEVEL_MATCHES_NTRP: BADGE_THRESHOLD - 1,
        GOOD_GAME: BADGE_THRESHOLD + 10,
      }),
    ).toEqual(["PUNCTUAL", "GOOD_GAME"]);
  });

  it("is empty for an empty count map", () => {
    expect(computeBadges({})).toEqual([]);
  });
});
