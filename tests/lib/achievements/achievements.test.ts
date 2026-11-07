import { describe, expect, it } from "vitest";

import {
  computeAchievements,
  hasRegularMonth,
  REGULAR_MONTH_MATCHES,
} from "@/lib/achievements/achievements";

function counts(
  overrides: Partial<Parameters<typeof computeAchievements>[0]> = {},
) {
  return {
    matchesPlayed: 0,
    reliability: { kind: "new" as const },
    distinctOpponents: 0,
    hasRegularMonth: false,
    ...overrides,
  };
}

describe("computeAchievements", () => {
  it("unlocks nothing for a player with no matches", () => {
    expect(computeAchievements(counts())).toEqual([]);
  });

  it("unlocks FIRST_MATCH at exactly 1 match", () => {
    expect(computeAchievements(counts({ matchesPlayed: 1 }))).toEqual([
      "FIRST_MATCH",
    ]);
  });

  it.each([
    [9, ["FIRST_MATCH"]],
    [10, ["FIRST_MATCH", "MATCHES_10"]],
    [25, ["FIRST_MATCH", "MATCHES_10", "MATCHES_25"]],
    [50, ["FIRST_MATCH", "MATCHES_10", "MATCHES_25", "MATCHES_50"]],
  ] as const)("matchesPlayed=%i unlocks %j", (matchesPlayed, expected) => {
    expect(computeAchievements(counts({ matchesPlayed }))).toEqual(expected);
  });

  it("does not unlock RELIABLE below 95%", () => {
    expect(
      computeAchievements(
        counts({ reliability: { kind: "rated", percent: 94 } }),
      ),
    ).not.toContain("RELIABLE");
  });

  it("unlocks RELIABLE at exactly 95%", () => {
    expect(
      computeAchievements(
        counts({ reliability: { kind: "rated", percent: 95 } }),
      ),
    ).toContain("RELIABLE");
  });

  it("does not unlock RELIABLE for a 'new' player even at a lucky percent", () => {
    expect(
      computeAchievements(counts({ reliability: { kind: "new" } })),
    ).not.toContain("RELIABLE");
  });

  it("does not unlock FIVE_OPPONENTS below 5 distinct opponents", () => {
    expect(computeAchievements(counts({ distinctOpponents: 4 }))).not.toContain(
      "FIVE_OPPONENTS",
    );
  });

  it("unlocks FIVE_OPPONENTS at exactly 5 distinct opponents", () => {
    expect(computeAchievements(counts({ distinctOpponents: 5 }))).toContain(
      "FIVE_OPPONENTS",
    );
  });

  it("unlocks REGULAR_MONTH only when the flag is true", () => {
    expect(computeAchievements(counts({ hasRegularMonth: true }))).toContain(
      "REGULAR_MONTH",
    );
    expect(
      computeAchievements(counts({ hasRegularMonth: false })),
    ).not.toContain("REGULAR_MONTH");
  });
});

describe("hasRegularMonth", () => {
  it("is false with no matches", () => {
    expect(hasRegularMonth([])).toBe(false);
  });

  it(`is false with ${String(REGULAR_MONTH_MATCHES - 1)} matches in one month`, () => {
    const dates = Array.from(
      { length: REGULAR_MONTH_MATCHES - 1 },
      (_, i) => new Date(`2026-10-0${String(i + 1)}T12:00:00Z`),
    );
    expect(hasRegularMonth(dates)).toBe(false);
  });

  it(`is true with exactly ${String(REGULAR_MONTH_MATCHES)} matches in one month`, () => {
    const dates = Array.from(
      { length: REGULAR_MONTH_MATCHES },
      (_, i) => new Date(`2026-10-0${String(i + 1)}T12:00:00Z`),
    );
    expect(hasRegularMonth(dates)).toBe(true);
  });

  it("does not combine matches from different months", () => {
    const dates = [
      new Date("2026-09-30T12:00:00Z"),
      new Date("2026-09-29T12:00:00Z"),
      new Date("2026-10-01T12:00:00Z"),
      new Date("2026-10-02T12:00:00Z"),
    ];
    expect(hasRegularMonth(dates)).toBe(false);
  });

  it("uses the Europe/Warsaw calendar day, not UTC, near midnight", () => {
    // 2026-10-31 23:30 UTC is 2026-11-01 00:30 in Warsaw (CET, UTC+1) --
    // this and the next three November matches fall in the same Warsaw
    // month even though the first instant is still October in UTC.
    const dates = [
      new Date("2026-10-31T23:30:00Z"),
      new Date("2026-11-05T12:00:00Z"),
      new Date("2026-11-10T12:00:00Z"),
      new Date("2026-11-15T12:00:00Z"),
    ];
    expect(hasRegularMonth(dates)).toBe(true);
  });
});
