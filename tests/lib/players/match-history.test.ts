import { describe, expect, it, vi } from "vitest";

import { getMatchHistory } from "@/lib/players/match-history";

const { matchResultFindMany } = vi.hoisted(() => ({
  matchResultFindMany: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: { matchResult: { findMany: matchResultFindMany } },
}));

const PLAYER = "11111111-1111-4111-8111-111111111111";
const AUTHOR = "22222222-2222-4222-8222-222222222222";

describe("getMatchHistory", () => {
  it("queries only this player's confirmed results", async () => {
    matchResultFindMany.mockResolvedValue([]);

    await getMatchHistory(PLAYER);

    expect(matchResultFindMany.mock.calls[0]?.[0]).toMatchObject({
      where: {
        status: "CONFIRMED",
        offerJoin: {
          OR: [{ userId: PLAYER }, { offer: { authorId: PLAYER } }],
        },
      },
    });
  });

  it("gives the author's own ELO change when they were the author", async () => {
    matchResultFindMany.mockResolvedValue([
      {
        id: "result-1",
        winner: "AUTHOR",
        score: [{ author: 6, player: 4 }],
        authorEloBefore: 1500,
        authorEloAfter: 1510,
        playerEloBefore: 1500,
        playerEloAfter: 1490,
        offerJoin: {
          userId: "opponent-id",
          user: { id: "opponent-id", name: "Bob" },
          offer: {
            startsAt: new Date(),
            authorId: PLAYER,
            author: { id: PLAYER, name: "Ola" },
          },
        },
      },
    ]);

    const history = await getMatchHistory(PLAYER);

    expect(history).toEqual([
      {
        id: "result-1",
        opponentId: "opponent-id",
        opponentName: "Bob",
        sets: [{ author: 6, player: 4 }],
        wasAuthor: true,
        won: true,
        eloBefore: 1500,
        eloAfter: 1510,
      },
    ]);
  });

  it("gives the joining player's own ELO change, not the author's", async () => {
    matchResultFindMany.mockResolvedValue([
      {
        id: "result-2",
        winner: "AUTHOR",
        score: [{ author: 6, player: 4 }],
        authorEloBefore: 1500,
        authorEloAfter: 1510,
        playerEloBefore: 1500,
        playerEloAfter: 1490,
        offerJoin: {
          userId: PLAYER,
          user: { id: PLAYER, name: "Ola" },
          offer: {
            startsAt: new Date(),
            authorId: AUTHOR,
            author: { id: AUTHOR, name: "Bob" },
          },
        },
      },
    ]);

    const history = await getMatchHistory(PLAYER);

    expect(history).toEqual([
      {
        id: "result-2",
        opponentId: AUTHOR,
        opponentName: "Bob",
        sets: [{ author: 6, player: 4 }],
        wasAuthor: false,
        won: false,
        eloBefore: 1500,
        eloAfter: 1490,
      },
    ]);
  });
});
