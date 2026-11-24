import { describe, expect, it } from "vitest";

import {
  computeDoublesEloChanges,
  type DoublesSeat,
} from "@/lib/rating/doubles-elo";

// Decision 2026-11-24: pair average against pair average, each player moved
// by their own K, floor 100.

const seat = (userId: string, elo: number, matchesPlayed = 0): DoublesSeat => ({
  userId,
  elo,
  matchesPlayed,
});

const afterOf = (
  changes: ReturnType<typeof computeDoublesEloChanges>,
  userId: string,
) => changes.find((change) => change.userId === userId)?.after;

describe("computeDoublesEloChanges", () => {
  it("moves even pairs by half of K, partners by the same amount", () => {
    const changes = computeDoublesEloChanges({
      authorPair: [seat("a", 1500), seat("b", 1500)],
      otherPair: [seat("c", 1500), seat("d", 1500)],
      winner: "AUTHOR",
    });

    expect(changes).toEqual([
      { userId: "a", before: 1500, after: 1520 },
      { userId: "b", before: 1500, after: 1520 },
      { userId: "c", before: 1500, after: 1480 },
      { userId: "d", before: 1500, after: 1480 },
    ]);
  });

  it("compares pair averages, not individual ratings", () => {
    // 1400 + 1600 averages 1500: an even match against two 1500s.
    const changes = computeDoublesEloChanges({
      authorPair: [seat("a", 1400), seat("b", 1600)],
      otherPair: [seat("c", 1500), seat("d", 1500)],
      winner: "PLAYER",
    });

    expect(afterOf(changes, "a")).toBe(1380);
    expect(afterOf(changes, "b")).toBe(1580);
    expect(afterOf(changes, "c")).toBe(1520);
  });

  it("rewards an underdog pair's win more than a favourite's", () => {
    const changes = computeDoublesEloChanges({
      authorPair: [seat("a", 1300), seat("b", 1300)],
      otherPair: [seat("c", 1700), seat("d", 1700)],
      winner: "AUTHOR",
    });

    // Expected score 1/11 for a 400-point gap: 40 * (1 - 0.0909) = 36.
    expect(afterOf(changes, "a")).toBe(1336);
    expect(afterOf(changes, "c")).toBe(1664);
  });

  it("uses each player's own K: past 10 results a player moves half as far", () => {
    const changes = computeDoublesEloChanges({
      authorPair: [seat("a", 1500, 0), seat("b", 1500, 10)],
      otherPair: [seat("c", 1500, 3), seat("d", 1500, 25)],
      winner: "AUTHOR",
    });

    expect(afterOf(changes, "a")).toBe(1520);
    expect(afterOf(changes, "b")).toBe(1510);
    expect(afterOf(changes, "c")).toBe(1480);
    expect(afterOf(changes, "d")).toBe(1490);
  });

  it("never drops a rating below 100", () => {
    const changes = computeDoublesEloChanges({
      authorPair: [seat("a", 110), seat("b", 1500)],
      otherPair: [seat("c", 800), seat("d", 800)],
      winner: "PLAYER",
    });

    expect(afterOf(changes, "a")).toBe(100);
  });

  it("rates the author alone when their partner isn't on the app", () => {
    const changes = computeDoublesEloChanges({
      authorPair: [seat("a", 1500)],
      otherPair: [seat("c", 1500), seat("d", 1500)],
      winner: "AUTHOR",
    });

    expect(changes.map((change) => change.userId)).toEqual(["a", "c", "d"]);
    expect(afterOf(changes, "a")).toBe(1520);
  });

  it("refuses a side with nobody rated on it", () => {
    expect(() =>
      computeDoublesEloChanges({
        authorPair: [],
        otherPair: [seat("c", 1500), seat("d", 1500)],
        winner: "AUTHOR",
      }),
    ).toThrow();
  });
});
