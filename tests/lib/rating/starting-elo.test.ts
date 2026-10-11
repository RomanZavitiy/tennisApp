import { describe, expect, it } from "vitest";

import { NTRP_LEVELS } from "@/lib/profile/options";
import { STARTING_ELO, startingElo } from "@/lib/rating/starting-elo";

describe("startingElo", () => {
  it.each([
    [1.5, 1000],
    [2, 1100],
    [2.5, 1200],
    [3, 1300],
    [3.5, 1400],
    [4, 1500],
    [4.5, 1600],
    [5, 1700],
    [5.5, 1800],
    [6, 1900],
    [6.5, 2000],
    [7, 2100],
  ])("NTRP %d starts at %i", (ntrp, elo) => {
    expect(startingElo(ntrp)).toBe(elo);
  });

  it("covers every level the profile offers, and nothing else", () => {
    expect(Object.keys(STARTING_ELO)).toEqual(
      NTRP_LEVELS.map((level) => level.toFixed(1)),
    );
  });

  it.each([1, 1.4, 3.7, 7.5, 0, -2, Number.NaN, Infinity])(
    "refuses NTRP %d, which is off the scale",
    (ntrp) => {
      expect(() => startingElo(ntrp)).toThrow(RangeError);
    },
  );
});
