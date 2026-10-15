import { describe, expect, it, vi } from "vitest";

import type { Prisma } from "@/lib/generated/prisma/client";
import { applyMatchElo, applyMatchEloFromJoin } from "@/lib/rating/apply-elo";

// Only the two calls applyMatchElo actually makes; cast past the rest of
// Prisma.TransactionClient's surface, which this function never touches.
// Mocks are kept as plain vi.fn()s, not the cast object, so assertions on
// them aren't typed through Prisma's own (unbound) method signatures.
function fakeTx() {
  const userUpdate = vi.fn().mockResolvedValue(undefined);
  const matchResultUpdate = vi.fn().mockResolvedValue(undefined);
  const tx = {
    user: { update: userUpdate },
    matchResult: { update: matchResultUpdate },
  } as unknown as Prisma.TransactionClient;
  return { tx, userUpdate, matchResultUpdate };
}

describe("applyMatchElo", () => {
  it("raises the winner and lowers the loser, by the same formula as computeEloChange", async () => {
    const { tx, userUpdate, matchResultUpdate } = fakeTx();

    await applyMatchElo(tx, {
      matchResultId: "result-1",
      winner: "AUTHOR",
      authorId: "author-id",
      authorElo: 1500,
      authorMatchesPlayed: 20,
      playerId: "player-id",
      playerElo: 1500,
      playerMatchesPlayed: 20,
    });

    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: "author-id" },
      data: { elo: 1510, matchesPlayed: { increment: 1 } },
    });
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: "player-id" },
      data: { elo: 1490, matchesPlayed: { increment: 1 } },
    });
    expect(matchResultUpdate).toHaveBeenCalledWith({
      where: { id: "result-1" },
      data: {
        status: "CONFIRMED",
        authorEloBefore: 1500,
        authorEloAfter: 1510,
        playerEloBefore: 1500,
        playerEloAfter: 1490,
      },
    });
  });

  it("gives the player, not the author, the win when the player won", async () => {
    const { tx, userUpdate } = fakeTx();

    await applyMatchElo(tx, {
      matchResultId: "result-2",
      winner: "PLAYER",
      authorId: "author-id",
      authorElo: 1500,
      authorMatchesPlayed: 5,
      playerId: "player-id",
      playerElo: 1500,
      playerMatchesPlayed: 5,
    });

    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: "author-id" },
      data: { elo: 1480, matchesPlayed: { increment: 1 } },
    });
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: "player-id" },
      data: { elo: 1520, matchesPlayed: { increment: 1 } },
    });
  });
});

describe("applyMatchEloFromJoin", () => {
  const pendingJoin = {
    winner: "AUTHOR" as const,
    offerJoin: {
      userId: "player-id",
      offer: {
        authorId: "author-id",
        author: { elo: 1500, matchesPlayed: 20 },
      },
      user: { elo: 1500, matchesPlayed: 20 },
    },
  };

  it("applies ELO from the join's nested shape", async () => {
    const { tx, userUpdate } = fakeTx();

    await applyMatchEloFromJoin(tx, "result-3", pendingJoin);

    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: "author-id" },
      data: { elo: 1510, matchesPlayed: { increment: 1 } },
    });
  });

  it("refuses to guess a missing rating instead of applying a wrong one", async () => {
    const { tx } = fakeTx();

    await expect(
      applyMatchEloFromJoin(tx, "result-4", {
        ...pendingJoin,
        offerJoin: {
          ...pendingJoin.offerJoin,
          offer: {
            ...pendingJoin.offerJoin.offer,
            author: { elo: null, matchesPlayed: 0 },
          },
        },
      }),
    ).rejects.toThrow("Can't apply ELO");
  });
});
