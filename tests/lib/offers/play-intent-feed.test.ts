import { beforeEach, describe, expect, it, vi } from "vitest";

import { getPlayIntentFeed } from "@/lib/offers/play-intent-feed";

// The database is replaced: what's under test is which intents the query
// asks for and which level each card carries (slice PD2).
const { findMany, blockedCounterpartIds } = vi.hoisted(() => ({
  findMany: vi.fn(),
  blockedCounterpartIds: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ db: { playIntent: { findMany } } }));
vi.mock("@/lib/moderation/personal-block", () => ({ blockedCounterpartIds }));

const NOW = new Date("2026-11-10T11:00:00Z");

function row(sport: "TENNIS" | "PADEL", over: Record<string, unknown> = {}) {
  return {
    id: `intent-${sport}`,
    date: new Date("2026-11-10T00:00:00Z"),
    times: ["evening"],
    districts: ["STARE_MIASTO"],
    format: sport === "PADEL" ? "DOUBLES" : "SINGLES",
    sport,
    note: null,
    user: {
      id: "player-1",
      name: "Ola",
      avatarPath: null,
      selfRatedNtrp: 3.5,
      padelLevel: 5,
    },
    ...over,
  };
}

describe("getPlayIntentFeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    blockedCounterpartIds.mockResolvedValue(["blocked-1"]);
  });

  it("asks only for live intents of the given sport, minus blocked players", async () => {
    findMany.mockResolvedValue([]);

    await getPlayIntentFeed("viewer", { sport: "PADEL" }, NOW);

    const [args] = findMany.mock.calls[0] as [{ where: object }];
    expect(args.where).toEqual({
      expiresAt: { gt: NOW },
      userId: { notIn: ["blocked-1"] },
      sport: "PADEL",
    });
  });

  it("asks for both sports when no sport is given", async () => {
    findMany.mockResolvedValue([]);

    await getPlayIntentFeed("viewer", {}, NOW);

    const [args] = findMany.mock.calls[0] as [{ where: object }];
    expect(args.where).not.toHaveProperty("sport");
  });

  it("gives each card the poster's level in the intent's own sport", async () => {
    findMany.mockResolvedValue([row("TENNIS"), row("PADEL")]);

    const cards = await getPlayIntentFeed("viewer", {}, NOW);

    expect(cards.map((card) => [card.sport, card.user.level])).toEqual([
      ["TENNIS", 3.5],
      ["PADEL", 5],
    ]);
    expect(cards[0]?.date).toBe("2026-11-10");
    expect(cards[0]?.user).not.toHaveProperty("padelLevel");
  });

  it("compares the level filter with the padel level on a padel intent", async () => {
    findMany.mockResolvedValue([row("PADEL")]);

    expect(
      await getPlayIntentFeed("viewer", { sport: "PADEL", ntrp: 5 }, NOW),
    ).toHaveLength(1);
    // 3.5 is this player's NTRP, not their padel level.
    expect(
      await getPlayIntentFeed("viewer", { sport: "PADEL", ntrp: 3.5 }, NOW),
    ).toHaveLength(0);
  });
});
