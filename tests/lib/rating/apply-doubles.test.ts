import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Prisma } from "@/lib/generated/prisma/client";
import {
  settleDoublesResult,
  type LockedDoublesResult,
} from "@/lib/rating/apply-doubles";

// The transaction is a stub: what's under test is which rows get written
// with what, for each kind of doubles result (decision 2026-11-24).

const userUpdate = vi.fn();
const userUpdateMany = vi.fn();
const userFindMany = vi.fn();
const resultUpdate = vi.fn();
const tx = {
  user: {
    update: userUpdate,
    updateMany: userUpdateMany,
    findMany: userFindMany,
  },
  doublesResult: { update: resultUpdate },
} as unknown as Prisma.TransactionClient;

const result = (
  overrides: Partial<LockedDoublesResult> = {},
): LockedDoublesResult => ({
  id: "result-1",
  status: "PENDING",
  winner: "AUTHOR",
  noShowUserId: null,
  authorPartnerId: "p1",
  opponent1Id: "p2",
  opponent2Id: "p3",
  reportedById: "author",
  offer: {
    id: "offer-1",
    sport: "PADEL",
    authorId: "author",
    joins: [{ userId: "p1" }, { userId: "p2" }, { userId: "p3" }],
  },
  ...overrides,
});

const rated = (ids: string[], elo = 1500) =>
  ids.map((id) => ({ id, padelElo: elo, padelMatchesPlayed: 0 }));

describe("settleDoublesResult", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("confirms a padel score and moves every player's padel ELO once", async () => {
    userFindMany.mockResolvedValue(rated(["author", "p1", "p2", "p3"]));

    await settleDoublesResult(tx, result());

    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: "author" },
      data: { padelElo: 1520, padelMatchesPlayed: { increment: 1 } },
    });
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: "p3" },
      data: { padelElo: 1480, padelMatchesPlayed: { increment: 1 } },
    });
    expect(userUpdate).toHaveBeenCalledTimes(4);
    expect(resultUpdate).toHaveBeenCalledWith({
      where: { id: "result-1" },
      data: {
        status: "CONFIRMED",
        eloChanges: expect.arrayContaining([
          { userId: "p1", before: 1500, after: 1520 },
        ]) as unknown,
      },
    });
  });

  it("counts the game as scheduled for every player", async () => {
    userFindMany.mockResolvedValue(rated(["author", "p1", "p2", "p3"]));

    await settleDoublesResult(tx, result());

    expect(userUpdateMany).toHaveBeenCalledWith({
      where: { id: { in: ["author", "p1", "p2", "p3"] } },
      data: { scheduledMatches: { increment: 1 } },
    });
  });

  it("confirms a tennis doubles score without touching any rating", async () => {
    await settleDoublesResult(
      tx,
      result({ offer: { ...result().offer, sport: "TENNIS" } }),
    );

    expect(userFindMany).not.toHaveBeenCalled();
    expect(userUpdate).not.toHaveBeenCalled();
    expect(resultUpdate).toHaveBeenCalledWith({
      where: { id: "result-1" },
      data: { status: "CONFIRMED" },
    });
  });

  it("leaves padel ratings alone when someone has no padel level", async () => {
    userFindMany.mockResolvedValue([
      ...rated(["author", "p1", "p2"]),
      { id: "p3", padelElo: null, padelMatchesPlayed: 0 },
    ]);

    await settleDoublesResult(tx, result());

    expect(userUpdate).not.toHaveBeenCalled();
    expect(resultUpdate).toHaveBeenCalledWith({
      where: { id: "result-1" },
      data: { status: "CONFIRMED" },
    });
  });

  it("rates the author alone when their partner isn't on the app", async () => {
    userFindMany.mockResolvedValue(rated(["author", "p2", "p3"]));

    await settleDoublesResult(
      tx,
      result({
        authorPartnerId: null,
        offer: {
          ...result().offer,
          joins: [{ userId: "p2" }, { userId: "p3" }],
        },
      }),
    );

    expect(userUpdate).toHaveBeenCalledTimes(3);
  });

  it("settles a no-show report as NO_SHOW against the named player only", async () => {
    await settleDoublesResult(
      tx,
      result({
        winner: null,
        authorPartnerId: null,
        opponent1Id: null,
        opponent2Id: null,
        noShowUserId: "p2",
      }),
    );

    expect(userUpdate).toHaveBeenCalledTimes(1);
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: "p2" },
      data: { noShows: { increment: 1 } },
    });
    expect(resultUpdate).toHaveBeenCalledWith({
      where: { id: "result-1" },
      data: { status: "NO_SHOW" },
    });
  });
});
