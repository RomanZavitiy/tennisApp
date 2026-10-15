import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  confirmResult,
  disputeResult,
  submitResult,
} from "@/app/offers/[id]/result-actions";
import {
  RESULT_CONFIRMED_MESSAGE,
  RESULT_DISPUTED_MESSAGE,
  RESULT_SUBMITTED_MESSAGE,
} from "@/lib/messages/post-system-message";

const AUTHOR = "22222222-2222-4222-8222-222222222222";
const PLAYER = "33333333-3333-4333-8333-333333333333";
const STRANGER = "99999999-9999-4999-8999-999999999999";
const OFFER = "44444444-4444-4444-8444-444444444444";
const JOIN = "55555555-5555-4555-8555-555555555555";
const RESULT = "66666666-6666-4666-8666-666666666666";

const VALID_SCORE = {
  sets: [
    { author: 6, player: 4 },
    { author: 6, player: 3 },
  ],
  winner: "AUTHOR",
};

const {
  requireOnboardedUser,
  joinFindUnique,
  matchResultCreateManyAndReturn,
  postSystemMessage,
  tx,
} = vi.hoisted(() => ({
  requireOnboardedUser: vi.fn(),
  joinFindUnique: vi.fn(),
  matchResultCreateManyAndReturn: vi.fn(),
  postSystemMessage: vi.fn(),
  tx: {
    $queryRaw: vi.fn(),
    matchResult: { findUnique: vi.fn(), update: vi.fn() },
    user: { update: vi.fn() },
  },
}));

vi.mock("@/lib/auth/require-onboarded-user", () => ({ requireOnboardedUser }));
vi.mock("@/lib/db", () => ({
  db: {
    offerJoin: { findUnique: joinFindUnique },
    matchResult: { createManyAndReturn: matchResultCreateManyAndReturn },
    $transaction: (run: (client: typeof tx) => Promise<unknown>) => run(tx),
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/messages/post-system-message", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/lib/messages/post-system-message")
  >()),
  postSystemMessage,
}));

const acceptedSinglesJoin = {
  userId: PLAYER,
  status: "ACCEPTED",
  offerId: OFFER,
  offer: {
    authorId: AUTHOR,
    format: "SINGLES",
    startsAt: new Date(Date.now() - 86_400_000),
  },
  result: null,
};

describe("submitResult", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireOnboardedUser.mockResolvedValue({ id: AUTHOR });
    joinFindUnique.mockResolvedValue(acceptedSinglesJoin);
    matchResultCreateManyAndReturn.mockResolvedValue([{ id: RESULT }]);
  });

  it("files the result and posts a system message", async () => {
    await expect(submitResult(JOIN, VALID_SCORE)).resolves.toEqual({
      ok: true,
    });

    expect(matchResultCreateManyAndReturn).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            offerJoinId: JOIN,
            score: VALID_SCORE.sets,
            winner: "AUTHOR",
            reportedBy: "AUTHOR",
          }),
        ],
        skipDuplicates: true,
      }),
    );
    expect(postSystemMessage).toHaveBeenCalledWith(
      { offerJoinId: JOIN },
      RESULT_SUBMITTED_MESSAGE,
    );
  });

  it("rejects an invalid score without writing", async () => {
    const result = await submitResult(JOIN, {
      sets: [{ author: 6, player: 6 }],
      winner: "AUTHOR",
    });

    expect(result.ok).toBe(false);
    expect(matchResultCreateManyAndReturn).not.toHaveBeenCalled();
  });

  it("refuses someone who isn't a party to the join", async () => {
    requireOnboardedUser.mockResolvedValue({ id: STRANGER });

    await expect(submitResult(JOIN, VALID_SCORE)).resolves.toEqual({
      ok: false,
      message: "This isn't your match.",
    });
    expect(matchResultCreateManyAndReturn).not.toHaveBeenCalled();
  });

  it("refuses a doubles offer", async () => {
    joinFindUnique.mockResolvedValue({
      ...acceptedSinglesJoin,
      offer: { ...acceptedSinglesJoin.offer, format: "DOUBLES" },
    });

    await expect(submitResult(JOIN, VALID_SCORE)).resolves.toEqual({
      ok: false,
      message: "Only singles matches record a result.",
    });
  });

  it("refuses a second submission for the same match", async () => {
    matchResultCreateManyAndReturn.mockResolvedValue([]);

    await expect(submitResult(JOIN, VALID_SCORE)).resolves.toEqual({
      ok: false,
      message: "A result has already been filed for this match.",
    });
  });
});

const pendingResult = {
  status: "PENDING",
  winner: "AUTHOR",
  reportedBy: "PLAYER",
  offerJoin: {
    id: JOIN,
    offerId: OFFER,
    userId: PLAYER,
    offer: {
      authorId: AUTHOR,
      author: { elo: 1500, matchesPlayed: 20 },
    },
    user: { elo: 1500, matchesPlayed: 20 },
  },
};

describe("confirmResult", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireOnboardedUser.mockResolvedValue({ id: AUTHOR });
    tx.matchResult.findUnique.mockResolvedValue(pendingResult);
  });

  it("applies ELO to both players and marks the result confirmed", async () => {
    await expect(confirmResult(RESULT)).resolves.toEqual({ ok: true });

    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: AUTHOR },
      data: { elo: 1510, matchesPlayed: { increment: 1 } },
    });
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: PLAYER },
      data: { elo: 1490, matchesPlayed: { increment: 1 } },
    });
    expect(tx.matchResult.update).toHaveBeenCalledWith({
      where: { id: RESULT },
      data: {
        status: "CONFIRMED",
        authorEloBefore: 1500,
        authorEloAfter: 1510,
        playerEloBefore: 1500,
        playerEloAfter: 1490,
      },
    });
    expect(postSystemMessage).toHaveBeenCalledWith(
      { offerJoinId: JOIN },
      RESULT_CONFIRMED_MESSAGE,
    );
  });

  it("applies the change only once when confirmed twice", async () => {
    await confirmResult(RESULT);
    tx.matchResult.findUnique.mockResolvedValue({
      ...pendingResult,
      status: "CONFIRMED",
    });

    const second = await confirmResult(RESULT);

    expect(second).toEqual({
      ok: false,
      message: "This result has already been settled.",
    });
    expect(tx.user.update).toHaveBeenCalledTimes(2);
    expect(tx.matchResult.update).toHaveBeenCalledTimes(1);
  });

  it("refuses the party who filed the result", async () => {
    requireOnboardedUser.mockResolvedValue({ id: PLAYER });

    await expect(confirmResult(RESULT)).resolves.toEqual({
      ok: false,
      message: "Only the other player can confirm or dispute this result.",
    });
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it("treats a missing result as not found", async () => {
    tx.matchResult.findUnique.mockResolvedValue(null);

    await expect(confirmResult(RESULT)).resolves.toEqual({
      ok: false,
      message: "This result doesn't exist.",
    });
  });
});

describe("disputeResult", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireOnboardedUser.mockResolvedValue({ id: AUTHOR });
    tx.matchResult.findUnique.mockResolvedValue(pendingResult);
  });

  it("marks the result disputed without touching ELO", async () => {
    await expect(disputeResult(RESULT)).resolves.toEqual({ ok: true });

    expect(tx.matchResult.update).toHaveBeenCalledWith({
      where: { id: RESULT },
      data: { status: "DISPUTED" },
    });
    expect(tx.user.update).not.toHaveBeenCalled();
    expect(postSystemMessage).toHaveBeenCalledWith(
      { offerJoinId: JOIN },
      RESULT_DISPUTED_MESSAGE,
    );
  });

  it("refuses a result that's already settled", async () => {
    tx.matchResult.findUnique.mockResolvedValue({
      ...pendingResult,
      status: "DISPUTED",
    });

    await expect(disputeResult(RESULT)).resolves.toEqual({
      ok: false,
      message: "This result has already been settled.",
    });
  });
});
