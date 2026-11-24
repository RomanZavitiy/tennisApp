import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  confirmDoublesResult,
  disputeDoublesResult,
  rateDoublesPlayer,
  submitDoublesNoShow,
  submitDoublesResult,
} from "@/app/offers/[id]/doubles-result-actions";

// Session, database and the settling transaction are stubs: what's under
// test is who may do what with a doubles result, and what gets written.

const AUTHOR = "22222222-2222-4222-8222-222222222222";
const P1 = "33333333-3333-4333-8333-333333333333";
const P2 = "44444444-4444-4444-8444-444444444441";
const P3 = "55555555-5555-4555-8555-555555555555";
const STRANGER = "99999999-9999-4999-8999-999999999999";
const OFFER = "66666666-6666-4666-8666-666666666666";
const RESULT = "77777777-7777-4777-8777-777777777777";

const VALID_SCORE = {
  sets: [
    { author: 6, player: 4 },
    { author: 6, player: 3 },
  ],
  winner: "AUTHOR",
};

const {
  requireOnboardedUser,
  offerFindUnique,
  createManyAndReturn,
  resultUpdate,
  lockDoublesResult,
  settleDoublesResult,
  notifyDoublesSettlers,
  submitDoublesFeedback,
} = vi.hoisted(() => ({
  requireOnboardedUser: vi.fn(),
  offerFindUnique: vi.fn(),
  createManyAndReturn: vi.fn(),
  resultUpdate: vi.fn(),
  lockDoublesResult: vi.fn(),
  settleDoublesResult: vi.fn(),
  notifyDoublesSettlers: vi.fn(),
  submitDoublesFeedback: vi.fn(),
}));

vi.mock("@/lib/auth/require-onboarded-user", () => ({ requireOnboardedUser }));
vi.mock("@/lib/db", () => {
  const tx = { doublesResult: { update: resultUpdate } };
  return {
    db: {
      sparringOffer: { findUnique: offerFindUnique },
      doublesResult: { createManyAndReturn },
      $transaction: (run: (client: typeof tx) => Promise<unknown>) => run(tx),
    },
  };
});
vi.mock("@/lib/rating/apply-doubles", () => ({
  lockDoublesResult,
  settleDoublesResult,
}));
vi.mock("@/lib/rating/doubles-cron", () => ({ notifyDoublesSettlers }));
vi.mock("@/lib/feedback/match-feedback", () => ({ submitDoublesFeedback }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const fullGame = {
  authorId: AUTHOR,
  format: "DOUBLES",
  status: "FULL",
  hasPartner: false,
  startsAt: new Date(Date.now() - 3 * 3_600_000),
  joins: [{ userId: P1 }, { userId: P2 }, { userId: P3 }],
  doublesResult: null,
};

const signIn = (id: string) => {
  requireOnboardedUser.mockResolvedValue({ id });
};

describe("submitDoublesResult", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    offerFindUnique.mockResolvedValue(fullGame);
    createManyAndReturn.mockImplementation(
      ({ data }: { data: Record<string, unknown>[] }) =>
        Promise.resolve([{ ...data[0], offerId: OFFER }]),
    );
  });

  it("files the pairs from the partner choice and notifies the other pair", async () => {
    signIn(P1);

    const result = await submitDoublesResult(OFFER, {
      ...VALID_SCORE,
      authorPartnerId: P2,
    });

    expect(result).toEqual({ ok: true });
    const [{ data }] = createManyAndReturn.mock.calls[0] as [
      { data: Record<string, unknown>[] },
    ];
    expect(data[0]).toMatchObject({
      offerId: OFFER,
      reportedById: P1,
      authorPartnerId: P2,
      opponent1Id: P1,
      opponent2Id: P3,
      winner: "AUTHOR",
    });
    expect(notifyDoublesSettlers).toHaveBeenCalledTimes(1);
  });

  it("refuses a partner who wasn't in the game", async () => {
    signIn(AUTHOR);

    const result = await submitDoublesResult(OFFER, {
      ...VALID_SCORE,
      authorPartnerId: STRANGER,
    });

    expect(result.ok).toBe(false);
    expect(createManyAndReturn).not.toHaveBeenCalled();
  });

  it("refuses an impossible score before touching the database", async () => {
    signIn(AUTHOR);

    const result = await submitDoublesResult(OFFER, {
      sets: [{ author: 6, player: 6 }],
      winner: "AUTHOR",
      authorPartnerId: P1,
    });

    expect(result.ok).toBe(false);
    expect(offerFindUnique).not.toHaveBeenCalled();
  });

  it("refuses someone who didn't play", async () => {
    signIn(STRANGER);

    const result = await submitDoublesResult(OFFER, {
      ...VALID_SCORE,
      authorPartnerId: P1,
    });

    expect(result).toEqual({ ok: false, message: "This isn't your game." });
  });

  it("refuses a second result for the same game", async () => {
    signIn(P1);
    createManyAndReturn.mockResolvedValue([]);

    const result = await submitDoublesResult(OFFER, {
      ...VALID_SCORE,
      authorPartnerId: P2,
    });

    expect(result).toEqual({
      ok: false,
      message: "A result has already been filed for this game.",
    });
    expect(notifyDoublesSettlers).not.toHaveBeenCalled();
  });
});

describe("submitDoublesNoShow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    offerFindUnique.mockResolvedValue(fullGame);
    createManyAndReturn.mockImplementation(
      ({ data }: { data: Record<string, unknown>[] }) =>
        Promise.resolve([{ ...data[0], offerId: OFFER }]),
    );
  });

  it("files a report naming one other player", async () => {
    signIn(AUTHOR);

    const result = await submitDoublesNoShow(OFFER, P3);

    expect(result).toEqual({ ok: true });
    const [{ data }] = createManyAndReturn.mock.calls[0] as [
      { data: Record<string, unknown>[] },
    ];
    expect(data[0]).toMatchObject({ reportedById: AUTHOR, noShowUserId: P3 });
  });

  it("refuses naming yourself or someone outside the game", async () => {
    signIn(AUTHOR);

    expect((await submitDoublesNoShow(OFFER, AUTHOR)).ok).toBe(false);
    expect((await submitDoublesNoShow(OFFER, STRANGER)).ok).toBe(false);
    expect(createManyAndReturn).not.toHaveBeenCalled();
  });
});

const lockedScore = {
  id: RESULT,
  status: "PENDING",
  winner: "AUTHOR",
  noShowUserId: null,
  authorPartnerId: P1,
  opponent1Id: P2,
  opponent2Id: P3,
  reportedById: AUTHOR,
  offer: { id: OFFER, sport: "PADEL", authorId: AUTHOR, joins: [] },
};

describe("confirmDoublesResult / disputeDoublesResult", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lockDoublesResult.mockResolvedValue(lockedScore);
  });

  it("lets the other pair confirm, which settles it", async () => {
    signIn(P3);

    expect(await confirmDoublesResult(RESULT)).toEqual({ ok: true });
    expect(settleDoublesResult).toHaveBeenCalledWith(
      expect.anything(),
      lockedScore,
    );
  });

  it("refuses the filer's own pair", async () => {
    signIn(P1);

    expect(await confirmDoublesResult(RESULT)).toEqual({
      ok: false,
      message: "Only the other pair can confirm or dispute this result.",
    });
    expect(settleDoublesResult).not.toHaveBeenCalled();
  });

  it("marks a dispute without settling anything", async () => {
    signIn(P2);

    expect(await disputeDoublesResult(RESULT)).toEqual({ ok: true });
    expect(resultUpdate).toHaveBeenCalledWith({
      where: { id: RESULT },
      data: { status: "DISPUTED" },
    });
    expect(settleDoublesResult).not.toHaveBeenCalled();
  });

  it("doesn't let the named player confirm a no-show — only dispute", async () => {
    lockDoublesResult.mockResolvedValue({
      ...lockedScore,
      winner: null,
      authorPartnerId: null,
      opponent1Id: null,
      opponent2Id: null,
      noShowUserId: P2,
    });
    signIn(P2);

    expect((await confirmDoublesResult(RESULT)).ok).toBe(false);
    expect(await disputeDoublesResult(RESULT)).toEqual({ ok: true });
  });

  it("refuses a result that's already settled", async () => {
    lockDoublesResult.mockResolvedValue({
      ...lockedScore,
      status: "CONFIRMED",
    });
    signIn(P3);

    expect(await confirmDoublesResult(RESULT)).toEqual({
      ok: false,
      message: "This result has already been settled.",
    });
  });
});

describe("rateDoublesPlayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signIn(P1);
  });

  it("passes only the tags on, never a level signal", async () => {
    submitDoublesFeedback.mockResolvedValue({ ok: true });

    const result = await rateDoublesPlayer(RESULT, P2, {
      tags: ["GOOD_GAME"],
      levelSignal: "HIGHER",
    });

    expect(result).toEqual({ ok: true });
    expect(submitDoublesFeedback).toHaveBeenCalledWith(RESULT, P1, P2, [
      "GOOD_GAME",
    ]);
  });

  it("turns a refusal into its message", async () => {
    submitDoublesFeedback.mockResolvedValue({
      ok: false,
      refusal: "ALREADY_GIVEN",
    });

    expect(
      await rateDoublesPlayer(RESULT, P2, { tags: [], levelSignal: null }),
    ).toEqual({
      ok: false,
      message: "You've already rated this opponent for this match.",
    });
  });
});
