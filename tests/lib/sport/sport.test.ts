import { describe, expect, it } from "vitest";

import { NTRP_LEVELS } from "@/lib/profile/options";
import {
  DEFAULT_SPORT,
  isSport,
  levelsFor,
  PADEL_LEVELS,
  playerLevel,
  sportFromCookie,
} from "@/lib/sport/sport";

describe("sportFromCookie", () => {
  it("reads a known sport", () => {
    expect(sportFromCookie("PADEL")).toBe("PADEL");
    expect(sportFromCookie("TENNIS")).toBe("TENNIS");
  });

  it("falls back to tennis for a missing or unknown value", () => {
    expect(DEFAULT_SPORT).toBe("TENNIS");
    expect(sportFromCookie(undefined)).toBe("TENNIS");
    expect(sportFromCookie(null)).toBe("TENNIS");
    expect(sportFromCookie("padel")).toBe("TENNIS");
    expect(sportFromCookie("SQUASH")).toBe("TENNIS");
  });
});

describe("isSport", () => {
  it("accepts only the two sports, as strings", () => {
    expect(isSport("PADEL")).toBe(true);
    expect(isSport("SQUASH")).toBe(false);
    expect(isSport(1)).toBe(false);
    expect(isSport(undefined)).toBe(false);
  });
});

describe("levelsFor", () => {
  it("is 1.0-7.0 in halves for padel", () => {
    expect(PADEL_LEVELS[0]).toBe(1);
    expect(PADEL_LEVELS.at(-1)).toBe(7);
    expect(PADEL_LEVELS).toHaveLength(13);
    expect(levelsFor("PADEL")).toBe(PADEL_LEVELS);
  });

  it("is NTRP for tennis", () => {
    expect(levelsFor("TENNIS")).toBe(NTRP_LEVELS);
  });

  it("has every NTRP level on the padel scale too", () => {
    expect(NTRP_LEVELS.every((level) => PADEL_LEVELS.includes(level))).toBe(
      true,
    );
  });
});

describe("playerLevel", () => {
  const player = { selfRatedNtrp: 3.5, padelLevel: 2 };

  it("picks the level of the sport asked for", () => {
    expect(playerLevel(player, "TENNIS")).toBe(3.5);
    expect(playerLevel(player, "PADEL")).toBe(2);
  });

  it("is null for a player who never declared a padel level", () => {
    expect(playerLevel({ ...player, padelLevel: null }, "PADEL")).toBeNull();
  });
});
