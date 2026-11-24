import { describe, expect, it } from "vitest";

import { NTRP_LEVELS } from "@/lib/profile/options";
import {
  STARTING_ELO,
  startingElo,
  startingPadelElo,
} from "@/lib/rating/starting-elo";
import { PADEL_LEVELS } from "@/lib/sport/sport";

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

describe("startingPadelElo (slice PD4)", () => {
  it.each([
    [1, 1000],
    [1.5, 1100],
    [3.5, 1500],
    [7, 2200],
  ])("padel level %d starts at %i", (level, elo) => {
    expect(startingPadelElo(level)).toBe(elo);
  });

  it("gives every padel level its own, rising value", () => {
    const elos = PADEL_LEVELS.map(startingPadelElo);
    expect(new Set(elos).size).toBe(PADEL_LEVELS.length);
    expect([...elos].sort((a, b) => a - b)).toEqual(elos);
  });

  it.each([0.5, 1.2, 7.5, Number.NaN])(
    "refuses padel level %d, which is off the scale",
    (level) => {
      expect(() => startingPadelElo(level)).toThrow(RangeError);
    },
  );
});
