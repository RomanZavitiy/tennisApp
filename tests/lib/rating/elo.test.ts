import { describe, expect, it } from "vitest";

import { computeEloChange } from "@/lib/rating/elo";

describe("computeEloChange", () => {
  it("gives the stronger player a smaller gain for the same win", () => {
    const favoriteGain =
      computeEloChange({
        elo: 1700,
        opponentElo: 1500,
        outcome: "WIN",
        matchesPlayed: 20,
      }) - 1700;
    const underdogGain =
      computeEloChange({
        elo: 1500,
        opponentElo: 1700,
        outcome: "WIN",
        matchesPlayed: 20,
      }) - 1500;

    expect(favoriteGain).toBeLessThan(underdogGain);
    expect(favoriteGain).toBe(5);
    expect(underdogGain).toBe(15);
  });

  it("gives the stronger player a smaller loss for the same loss", () => {
    const favoriteLoss =
      1700 -
      computeEloChange({
        elo: 1700,
        opponentElo: 1500,
        outcome: "LOSS",
        matchesPlayed: 20,
      });
    const underdogLoss =
      1500 -
      computeEloChange({
        elo: 1500,
        opponentElo: 1700,
        outcome: "LOSS",
        matchesPlayed: 20,
      });

    expect(underdogLoss).toBeLessThan(favoriteLoss);
  });

  it("uses K=40 through the 10th confirmed match", () => {
    expect(
      computeEloChange({
        elo: 1500,
        opponentElo: 1500,
        outcome: "WIN",
        matchesPlayed: 9,
      }),
    ).toBe(1520);
  });

  it("uses K=20 from the 11th confirmed match on", () => {
    expect(
      computeEloChange({
        elo: 1500,
        opponentElo: 1500,
        outcome: "WIN",
        matchesPlayed: 10,
      }),
    ).toBe(1510);
  });

  it("floors the result at 100, however large the drop would be", () => {
    expect(
      computeEloChange({
        elo: 110,
        opponentElo: 10,
        outcome: "LOSS",
        matchesPlayed: 0,
      }),
    ).toBe(100);
  });

  it("is deterministic: the same inputs always give the same output", () => {
    const input = {
      elo: 1432,
      opponentElo: 1588,
      outcome: "WIN" as const,
      matchesPlayed: 3,
    };
    expect(computeEloChange(input)).toBe(computeEloChange({ ...input }));
  });
});
