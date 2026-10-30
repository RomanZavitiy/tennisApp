import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getLeaderboard,
  LEADERBOARD_SIZE,
} from "@/lib/leaderboard/get-leaderboard";

// The database is replaced: what's under test is which users the query asks
// for, how they're ordered, and how reliability is computed per row.
const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: { user: { findMany } },
}));

function row(
  id: string,
  overrides: {
    elo?: number;
    matchesPlayed?: number;
    district?: string | null;
    scheduledMatches?: number;
    noShows?: number;
    lateCancellations?: number;
  } = {},
) {
  return {
    id,
    name: "Ola",
    avatarPath: null,
    district: overrides.district === undefined ? null : overrides.district,
    elo: overrides.elo ?? 1500,
    matchesPlayed: overrides.matchesPlayed ?? 0,
    scheduledMatches: overrides.scheduledMatches ?? 0,
    noShows: overrides.noShows ?? 0,
    lateCancellations: overrides.lateCancellations ?? 0,
  };
}

describe("getLeaderboard", () => {
  beforeEach(() => {
    findMany.mockReset();
    findMany.mockResolvedValue([]);
  });

  it("asks only for onboarded, unblocked users with an ELO, ranked desc", async () => {
    await getLeaderboard();

    const query = findMany.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(query.where).toEqual({
      AND: [
        { onboardingCompletedAt: { not: null } },
        { blockedAt: null },
        { elo: { not: null } },
      ],
    });
    expect(query.orderBy).toEqual([{ elo: "desc" }, { id: "asc" }]);
  });

  it("caps the query at the top 100", async () => {
    await getLeaderboard();

    const query = findMany.mock.calls[0]?.[0] as { take: number };
    expect(query.take).toBe(LEADERBOARD_SIZE);
    expect(LEADERBOARD_SIZE).toBe(100);
  });

  it("narrows the query by district", async () => {
    await getLeaderboard({ district: "KROWODRZA" as never });

    const query = findMany.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(query.where).toEqual({
      AND: [
        { onboardingCompletedAt: { not: null } },
        { blockedAt: null },
        { elo: { not: null } },
        { district: "KROWODRZA" },
      ],
    });
  });

  it("narrows the query by NTRP band", async () => {
    await getLeaderboard({ level: "intermediate" });

    const query = findMany.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(query.where).toEqual({
      AND: [
        { onboardingCompletedAt: { not: null } },
        { blockedAt: null },
        { elo: { not: null } },
        { selfRatedNtrp: { gte: 3, lte: 4 } },
      ],
    });
  });

  it("returns rows in the order the database gives them", async () => {
    findMany.mockResolvedValue([
      row("1", { elo: 1900 }),
      row("2", { elo: 1500 }),
    ]);

    const players = await getLeaderboard();

    expect(players.map((player) => player.id)).toEqual(["1", "2"]);
    expect(players.map((player) => player.elo)).toEqual([1900, 1500]);
  });

  it("computes each player's reliability (4.12)", async () => {
    findMany.mockResolvedValue([
      row("1", { scheduledMatches: 4, noShows: 1, lateCancellations: 0 }),
    ]);

    const players = await getLeaderboard();

    expect(players[0]?.reliability).toEqual({ kind: "rated", percent: 75 });
  });

  it("carries district and matches played through to the row", async () => {
    findMany.mockResolvedValue([
      row("1", { district: "PODGORZE", matchesPlayed: 12 }),
    ]);

    const players = await getLeaderboard();

    expect(players[0]).toMatchObject({
      district: "PODGORZE",
      matchesPlayed: 12,
    });
  });
});
