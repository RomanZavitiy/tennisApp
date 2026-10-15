import { describe, expect, it } from "vitest";

import { matchScoreSchema } from "@/lib/validation/match-result";

// Set notation here, "6-4", means { author: 6, player: 4 } — author's games
// first. The task's own examples (decisions.md, 2026-10-14 score format).
function score(sets: [number, number][], winner: "AUTHOR" | "PLAYER") {
  return {
    sets: sets.map(([author, player]) => ({ author, player })),
    winner,
  };
}

describe("matchScoreSchema", () => {
  it("accepts straight sets, 6-4 6-3", () => {
    expect(
      matchScoreSchema.safeParse(
        score(
          [
            [6, 4],
            [6, 3],
          ],
          "AUTHOR",
        ),
      ).success,
    ).toBe(true);
  });

  it("accepts a split match decided by a super-tiebreak, 6-4 3-6 10-8", () => {
    expect(
      matchScoreSchema.safeParse(
        score(
          [
            [6, 4],
            [3, 6],
            [10, 8],
          ],
          "AUTHOR",
        ),
      ).success,
    ).toBe(true);
  });

  it("accepts two tiebreak sets, 7-6 7-6", () => {
    expect(
      matchScoreSchema.safeParse(
        score(
          [
            [7, 6],
            [7, 6],
          ],
          "AUTHOR",
        ),
      ).success,
    ).toBe(true);
  });

  it("rejects a set that was never decided, 6-6", () => {
    expect(
      matchScoreSchema.safeParse(
        score(
          [
            [6, 6],
            [6, 3],
          ],
          "AUTHOR",
        ),
      ).success,
    ).toBe(false);
  });

  it("rejects a super-tiebreak decided by only one point, 6-4 3-6 10-9", () => {
    expect(
      matchScoreSchema.safeParse(
        score(
          [
            [6, 4],
            [3, 6],
            [10, 9],
          ],
          "AUTHOR",
        ),
      ).success,
    ).toBe(false);
  });

  it("rejects a third set when the first two weren't split, 6-4 6-4 6-4", () => {
    expect(
      matchScoreSchema.safeParse(
        score(
          [
            [6, 4],
            [6, 4],
            [6, 4],
          ],
          "AUTHOR",
        ),
      ).success,
    ).toBe(false);
  });

  it("rejects a winner that doesn't match the score", () => {
    expect(
      matchScoreSchema.safeParse(
        score(
          [
            [6, 4],
            [6, 3],
          ],
          "PLAYER",
        ),
      ).success,
    ).toBe(false);
  });

  it("rejects fewer than two sets", () => {
    expect(matchScoreSchema.safeParse(score([[6, 4]], "AUTHOR")).success).toBe(
      false,
    );
  });

  it("rejects more than three sets", () => {
    expect(
      matchScoreSchema.safeParse(
        score(
          [
            [6, 4],
            [3, 6],
            [10, 8],
            [6, 0],
          ],
          "AUTHOR",
        ),
      ).success,
    ).toBe(false);
  });

  it("accepts the player winning in two sets", () => {
    expect(
      matchScoreSchema.safeParse(
        score(
          [
            [4, 6],
            [2, 6],
          ],
          "PLAYER",
        ),
      ).success,
    ).toBe(true);
  });
});
