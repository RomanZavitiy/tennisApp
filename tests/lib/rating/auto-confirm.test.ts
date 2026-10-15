import { beforeEach, describe, expect, it, vi } from "vitest";

import { autoConfirmExpiredResults } from "@/lib/rating/auto-confirm";
import { RESULT_AUTO_CONFIRMED_MESSAGE } from "@/lib/messages/post-system-message";

const { matchResultFindMany, postSystemMessage, tx } = vi.hoisted(() => ({
  matchResultFindMany: vi.fn(),
  postSystemMessage: vi.fn(),
  tx: {
    $queryRaw: vi.fn(),
    matchResult: { findUnique: vi.fn(), update: vi.fn() },
    user: { update: vi.fn() },
  },
}));

vi.mock("@/lib/db", () => ({
  db: {
    matchResult: { findMany: matchResultFindMany },
    $transaction: (run: (client: typeof tx) => Promise<unknown>) => run(tx),
  },
}));
vi.mock("@/lib/messages/post-system-message", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/lib/messages/post-system-message")
  >()),
  postSystemMessage,
}));

const pendingResult = {
  status: "PENDING",
  winner: "AUTHOR",
  noShowParty: null,
  offerJoin: {
    id: "join-1",
    userId: "player-id",
    offer: {
      authorId: "author-id",
      author: { elo: 1500, matchesPlayed: 20 },
    },
    user: { elo: 1500, matchesPlayed: 20 },
  },
};

const pendingNoShowReport = {
  status: "PENDING",
  winner: null,
  noShowParty: "AUTHOR",
  offerJoin: pendingResult.offerJoin,
};

describe("autoConfirmExpiredResults", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does nothing when no result is due", async () => {
    matchResultFindMany.mockResolvedValue([]);

    await expect(autoConfirmExpiredResults()).resolves.toBe(0);
    expect(tx.user.update).not.toHaveBeenCalled();
    expect(postSystemMessage).not.toHaveBeenCalled();
  });

  it("confirms every due result and posts a system message each", async () => {
    matchResultFindMany.mockResolvedValue([
      { id: "result-1" },
      { id: "result-2" },
    ]);
    tx.matchResult.findUnique.mockResolvedValue(pendingResult);

    await expect(autoConfirmExpiredResults()).resolves.toBe(2);

    expect(tx.user.update).toHaveBeenCalledTimes(4);
    expect(postSystemMessage).toHaveBeenCalledTimes(2);
    expect(postSystemMessage).toHaveBeenCalledWith(
      { offerJoinId: "join-1" },
      RESULT_AUTO_CONFIRMED_MESSAGE,
    );
  });

  it("settles a due no-show report as NO_SHOW, crediting the reported party but not ELO", async () => {
    matchResultFindMany.mockResolvedValue([{ id: "result-1" }]);
    tx.matchResult.findUnique.mockResolvedValue(pendingNoShowReport);

    await expect(autoConfirmExpiredResults()).resolves.toBe(1);

    expect(tx.user.update).toHaveBeenCalledTimes(1);
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: "author-id" },
      data: { noShows: { increment: 1 } },
    });
    expect(tx.matchResult.update).toHaveBeenCalledWith({
      where: { id: "result-1" },
      data: { status: "NO_SHOW" },
    });
    // Decision 2026-10-14's own scope: a notice at filing and at
    // disputing, not at this silent deadline.
    expect(postSystemMessage).not.toHaveBeenCalled();
  });

  it("skips a result a human already settled in the meantime, without reapplying ELO", async () => {
    matchResultFindMany.mockResolvedValue([{ id: "result-1" }]);
    tx.matchResult.findUnique.mockResolvedValue({
      ...pendingResult,
      status: "CONFIRMED",
    });

    await expect(autoConfirmExpiredResults()).resolves.toBe(0);
    expect(tx.user.update).not.toHaveBeenCalled();
    expect(postSystemMessage).not.toHaveBeenCalled();
  });

  it("queries only PENDING results past their auto-confirm deadline", async () => {
    matchResultFindMany.mockResolvedValue([]);
    const now = new Date("2026-10-20T00:00:00Z");

    await autoConfirmExpiredResults(now);

    expect(matchResultFindMany).toHaveBeenCalledWith({
      where: { status: "PENDING", autoConfirmAt: { lte: now } },
      select: { id: true },
    });
  });
});
