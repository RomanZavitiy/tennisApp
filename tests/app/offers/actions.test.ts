import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  acceptJoin,
  cancelOffer,
  declineJoin,
  requestToJoin,
  withdrawJoin,
} from "@/app/offers/[id]/actions";
import { THREAD_WELCOME_MESSAGE } from "@/lib/messages/post-system-message";

// Session and database are replaced: what's under test is who may change a
// join, which writes happen, and that the answer reveals nothing else.
const ME = "11111111-1111-4111-8111-111111111111";
const AUTHOR = "22222222-2222-4222-8222-222222222222";
const OFFER = "44444444-4444-4444-8444-444444444444";
const JOIN = "55555555-5555-4555-8555-555555555555";

const {
  requireOnboardedUser,
  offerFindUnique,
  joinFindUnique,
  joinCreateManyAndReturn,
  joinUpdateMany,
  recordLateCancellation,
  recordScheduledMatch,
  postSystemMessage,
  tx,
} = vi.hoisted(() => ({
  requireOnboardedUser: vi.fn(),
  offerFindUnique: vi.fn(),
  joinFindUnique: vi.fn(),
  joinCreateManyAndReturn: vi.fn(),
  joinUpdateMany: vi.fn(),
  recordLateCancellation: vi.fn(),
  recordScheduledMatch: vi.fn(),
  postSystemMessage: vi.fn(),
  // What the status-change transaction (3.12) sees.
  tx: {
    $queryRaw: vi.fn(),
    offerJoin: { findUnique: vi.fn(), update: vi.fn() },
    sparringOffer: {
      findFirst: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth/require-onboarded-user", () => ({ requireOnboardedUser }));
vi.mock("@/lib/db", () => ({
  db: {
    sparringOffer: { findUnique: offerFindUnique },
    offerJoin: {
      findUnique: joinFindUnique,
      createManyAndReturn: joinCreateManyAndReturn,
      updateMany: joinUpdateMany,
    },
    $transaction: (run: (client: typeof tx) => Promise<unknown>) => run(tx),
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
// isLateCancellation is pure and cheap: keep the real one, only replace the
// two stubs whose calls we're asserting on.
vi.mock("@/lib/rating/reliability", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/rating/reliability")>()),
  recordLateCancellation,
  recordScheduledMatch,
}));
// The welcome message (3.16) is its own concern, covered where
// postSystemMessage itself is tested; here only that it fires once per new
// thread, never on reopening a withdrawn one.
vi.mock("@/lib/messages/post-system-message", () => ({
  postSystemMessage,
  THREAD_WELCOME_MESSAGE: "Meet at the court. Never send money in advance.",
}));

const upcoming = {
  authorId: AUTHOR,
  status: "OPEN",
  startsAt: new Date(Date.now() + 86_400_000),
};

describe("requestToJoin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireOnboardedUser.mockResolvedValue({ id: ME, name: "Ola" });
    offerFindUnique.mockResolvedValue(upcoming);
    joinFindUnique.mockResolvedValue(null);
    joinCreateManyAndReturn.mockResolvedValue([{ id: JOIN }]);
    joinUpdateMany.mockResolvedValue({ count: 1 });
  });

  it("files a request as the signed-in player and opens its thread", async () => {
    await expect(requestToJoin(OFFER)).resolves.toEqual({ ok: true });

    expect(joinFindUnique).toHaveBeenCalledWith({
      where: { offerId_userId: { offerId: OFFER, userId: ME } },
      select: { id: true, status: true },
    });
    expect(joinCreateManyAndReturn).toHaveBeenCalledWith({
      data: [{ offerId: OFFER, userId: ME }],
      select: { id: true },
      skipDuplicates: true,
    });
    expect(postSystemMessage).toHaveBeenCalledWith(
      { offerJoinId: JOIN },
      THREAD_WELCOME_MESSAGE,
    );
  });

  it("refuses a request without a session or a finished profile", async () => {
    requireOnboardedUser.mockRejectedValue(new Error("NEXT_REDIRECT"));

    await expect(requestToJoin(OFFER)).rejects.toThrow("NEXT_REDIRECT");
    expect(joinCreateManyAndReturn).not.toHaveBeenCalled();
  });

  it.each([undefined, "", "not-a-uuid", 42])(
    "treats a bad offer id %j as a missing offer",
    async (offerId) => {
      await expect(requestToJoin(offerId)).resolves.toEqual({
        ok: false,
        message: "This offer doesn't exist.",
      });
      expect(offerFindUnique).not.toHaveBeenCalled();
    },
  );

  it("refuses an offer that doesn't exist", async () => {
    offerFindUnique.mockResolvedValue(null);

    const result = await requestToJoin(OFFER);

    expect(result).toEqual({ ok: false, message: "This offer doesn't exist." });
    expect(joinCreateManyAndReturn).not.toHaveBeenCalled();
  });

  it.each([
    ["own", { ...upcoming, authorId: ME }, null, "This is your own offer."],
    [
      "past",
      { ...upcoming, startsAt: new Date(Date.now() - 60_000) },
      null,
      "This game has already started.",
    ],
    [
      "full",
      { ...upcoming, status: "FULL" },
      null,
      "This offer is no longer taking players.",
    ],
    [
      "cancelled",
      { ...upcoming, status: "CANCELLED" },
      null,
      "This offer is no longer taking players.",
    ],
    [
      "already requested",
      upcoming,
      { id: JOIN, status: "REQUESTED" },
      "You have already asked to join.",
    ],
    [
      "declined",
      upcoming,
      { id: JOIN, status: "DECLINED" },
      "The author has declined your request.",
    ],
  ])(
    "refuses a %s offer without writing",
    async (_, offer, existing, message) => {
      offerFindUnique.mockResolvedValue(offer);
      joinFindUnique.mockResolvedValue(existing);

      await expect(requestToJoin(OFFER)).resolves.toEqual({
        ok: false,
        message,
      });
      expect(joinCreateManyAndReturn).not.toHaveBeenCalled();
      expect(joinUpdateMany).not.toHaveBeenCalled();
    },
  );

  it("reopens a withdrawn request instead of adding a second row, without a new welcome", async () => {
    joinFindUnique.mockResolvedValue({ id: JOIN, status: "WITHDRAWN" });

    await expect(requestToJoin(OFFER)).resolves.toEqual({ ok: true });

    expect(joinUpdateMany).toHaveBeenCalledWith({
      where: { id: JOIN, status: "WITHDRAWN" },
      data: { status: "REQUESTED" },
    });
    expect(joinCreateManyAndReturn).not.toHaveBeenCalled();
    expect(postSystemMessage).not.toHaveBeenCalled();
  });

  it("reports a request that another click already filed", async () => {
    joinCreateManyAndReturn.mockResolvedValue([]);

    await expect(requestToJoin(OFFER)).resolves.toEqual({
      ok: false,
      message: "You have already asked to join.",
    });
    expect(postSystemMessage).not.toHaveBeenCalled();
  });

  it("answers without anyone's details", async () => {
    const result = await requestToJoin(OFFER);

    expect(Object.keys(result)).toEqual(["ok"]);
  });
});

describe("accepting, declining and withdrawing", () => {
  const PLAYER = "33333333-3333-4333-8333-333333333333";

  function setUp({
    me = AUTHOR,
    joinStatus = "REQUESTED",
    offer = {},
    accepted = 0,
  }: {
    me?: string;
    joinStatus?: string;
    offer?: Record<string, unknown>;
    accepted?: number;
  } = {}) {
    requireOnboardedUser.mockResolvedValue({ id: me });
    tx.offerJoin.findUnique.mockResolvedValue({
      offerId: OFFER,
      userId: PLAYER,
      offer: { authorId: AUTHOR },
    });
    tx.sparringOffer.findUniqueOrThrow.mockResolvedValue({
      status: "OPEN",
      format: "SINGLES",
      hasPartner: false,
      startsAt: new Date(Date.now() + 86_400_000),
      joins: [{ status: joinStatus }],
      _count: { joins: accepted },
      ...offer,
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("locks the offer, then accepts and fills a singles offer", async () => {
    setUp();

    await expect(acceptJoin(JOIN)).resolves.toEqual({ ok: true });

    expect(tx.$queryRaw).toHaveBeenCalled();
    expect(tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
      tx.sparringOffer.findUniqueOrThrow.mock.invocationCallOrder[0] ?? 0,
    );
    expect(tx.offerJoin.update).toHaveBeenCalledWith({
      where: { id: JOIN },
      data: { status: "ACCEPTED" },
    });
    expect(tx.sparringOffer.update).toHaveBeenCalledWith({
      where: { id: OFFER },
      data: { status: "FULL" },
    });
    // The accepted singles join is a newly scheduled match (4.11-4.12).
    expect(recordScheduledMatch).toHaveBeenCalledWith(tx, [AUTHOR, PLAYER]);
  });

  it("accepts into doubles without filling it until the last place", async () => {
    setUp({ offer: { format: "DOUBLES" }, accepted: 1 });

    await acceptJoin(JOIN);

    expect(tx.offerJoin.update).toHaveBeenCalled();
    expect(tx.sparringOffer.update).not.toHaveBeenCalled();
    // Reliability only tracks singles (decision 2026-10-14).
    expect(recordScheduledMatch).not.toHaveBeenCalled();
  });

  it.each([
    ["doubles", { format: "DOUBLES" }, 2],
    ["doubles with a partner", { format: "DOUBLES", hasPartner: true }, 1],
  ])("fills %s with its last place", async (_, offer, accepted) => {
    setUp({ offer, accepted });

    await acceptJoin(JOIN);

    expect(tx.sparringOffer.update).toHaveBeenCalledWith({
      where: { id: OFFER },
      data: { status: "FULL" },
    });
  });

  it.each([
    ["singles", {}, 1],
    ["doubles", { format: "DOUBLES" }, 3],
    ["doubles with a partner", { format: "DOUBLES", hasPartner: true }, 2],
  ])("won't accept anyone more into full %s", async (_, offer, accepted) => {
    setUp({ offer: { ...offer, status: "FULL" }, accepted });

    await expect(acceptJoin(JOIN)).resolves.toEqual({
      ok: false,
      message: "Every place in this game is taken.",
    });
    expect(tx.offerJoin.update).not.toHaveBeenCalled();
  });

  it("only lets the author accept or decline", async () => {
    setUp({ me: PLAYER });

    for (const action of [acceptJoin, declineJoin]) {
      await expect(action(JOIN)).resolves.toEqual({
        ok: false,
        message: "This request doesn't exist.",
      });
    }
    expect(tx.$queryRaw).not.toHaveBeenCalled();
    expect(tx.offerJoin.update).not.toHaveBeenCalled();
  });

  it("only lets the player withdraw their own request", async () => {
    setUp({ me: ME });

    await expect(withdrawJoin(JOIN)).resolves.toEqual({
      ok: false,
      message: "This request doesn't exist.",
    });
    expect(tx.offerJoin.update).not.toHaveBeenCalled();
  });

  it("declines a request and leaves the offer as it is", async () => {
    setUp();

    await expect(declineJoin(JOIN)).resolves.toEqual({ ok: true });

    expect(tx.offerJoin.update).toHaveBeenCalledWith({
      where: { id: JOIN },
      data: { status: "DECLINED" },
    });
    expect(tx.sparringOffer.update).not.toHaveBeenCalled();
  });

  it("reopens a full offer when an accepted player withdraws", async () => {
    setUp({
      me: PLAYER,
      joinStatus: "ACCEPTED",
      offer: { status: "FULL" },
      accepted: 1,
    });

    await expect(withdrawJoin(JOIN)).resolves.toEqual({ ok: true });

    expect(tx.offerJoin.update).toHaveBeenCalledWith({
      where: { id: JOIN },
      data: { status: "WITHDRAWN" },
    });
    expect(tx.sparringOffer.update).toHaveBeenCalledWith({
      where: { id: OFFER },
      data: { status: "OPEN" },
    });
    // More than 12h out: not a late cancellation.
    expect(recordLateCancellation).not.toHaveBeenCalled();
  });

  it("flags a late cancellation when a player withdraws an accepted place close to the start", async () => {
    setUp({
      me: PLAYER,
      joinStatus: "ACCEPTED",
      offer: { startsAt: new Date(Date.now() + 3_600_000) },
      accepted: 1,
    });

    await expect(withdrawJoin(JOIN)).resolves.toEqual({ ok: true });

    expect(recordLateCancellation).toHaveBeenCalledWith(tx, PLAYER);
  });

  it("doesn't flag a late cancellation for withdrawing a merely requested place", async () => {
    setUp({
      me: PLAYER,
      offer: { startsAt: new Date(Date.now() + 3_600_000) },
    });

    await expect(withdrawJoin(JOIN)).resolves.toEqual({ ok: true });

    expect(recordLateCancellation).not.toHaveBeenCalled();
  });

  it("refuses a change the status no longer allows, read under the lock", async () => {
    // Another tab declined it after the page loaded.
    setUp({ joinStatus: "DECLINED" });

    await expect(acceptJoin(JOIN)).resolves.toEqual({
      ok: false,
      message: "This request can't be changed any more.",
    });
    expect(tx.offerJoin.update).not.toHaveBeenCalled();
  });

  it("treats a bad or missing join id as a missing request", async () => {
    setUp();
    await expect(acceptJoin("nope")).resolves.toEqual({
      ok: false,
      message: "This request doesn't exist.",
    });

    tx.offerJoin.findUnique.mockResolvedValue(null);
    await expect(acceptJoin(JOIN)).resolves.toEqual({
      ok: false,
      message: "This request doesn't exist.",
    });
    expect(tx.offerJoin.update).not.toHaveBeenCalled();
  });
});

describe("cancelOffer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireOnboardedUser.mockResolvedValue({ id: AUTHOR });
    tx.sparringOffer.findFirst.mockResolvedValue({
      status: "FULL",
      startsAt: new Date(Date.now() + 86_400_000),
      _count: { joins: 1 },
    });
  });

  it("locks and cancels the author's upcoming offer", async () => {
    await expect(cancelOffer(OFFER)).resolves.toEqual({ ok: true });

    expect(tx.$queryRaw).toHaveBeenCalled();
    expect(tx.sparringOffer.findFirst).toHaveBeenCalledWith({
      where: { id: OFFER, authorId: AUTHOR },
      select: {
        status: true,
        startsAt: true,
        _count: { select: { joins: { where: { status: "ACCEPTED" } } } },
      },
    });
    expect(tx.sparringOffer.update).toHaveBeenCalledWith({
      where: { id: OFFER },
      data: { status: "CANCELLED" },
    });
    // Joins keep their status: accepted players see the game as cancelled.
    expect(tx.offerJoin.update).not.toHaveBeenCalled();
    // More than 12h out: not a late cancellation.
    expect(recordLateCancellation).not.toHaveBeenCalled();
  });

  it("flags a late cancellation when players are already in", async () => {
    tx.sparringOffer.findFirst.mockResolvedValue({
      status: "FULL",
      startsAt: new Date(Date.now() + 3_600_000),
      _count: { joins: 1 },
    });

    await expect(cancelOffer(OFFER)).resolves.toEqual({ ok: true });

    expect(recordLateCancellation).toHaveBeenCalledWith(tx, AUTHOR);
  });

  it("doesn't flag a late cancellation when nobody has joined yet", async () => {
    tx.sparringOffer.findFirst.mockResolvedValue({
      status: "OPEN",
      startsAt: new Date(Date.now() + 3_600_000),
      _count: { joins: 0 },
    });

    await expect(cancelOffer(OFFER)).resolves.toEqual({ ok: true });

    expect(recordLateCancellation).not.toHaveBeenCalled();
  });

  it("treats someone else's offer as missing", async () => {
    requireOnboardedUser.mockResolvedValue({ id: ME });
    tx.sparringOffer.findFirst.mockResolvedValue(null);

    await expect(cancelOffer(OFFER)).resolves.toEqual({
      ok: false,
      message: "This offer doesn't exist.",
    });
    expect(tx.sparringOffer.update).not.toHaveBeenCalled();
  });

  it.each([
    [
      "already cancelled",
      {
        status: "CANCELLED",
        startsAt: new Date(Date.now() + 86_400_000),
        _count: { joins: 1 },
      },
      "This offer is already cancelled.",
    ],
    [
      "started",
      {
        status: "OPEN",
        startsAt: new Date(Date.now() - 60_000),
        _count: { joins: 1 },
      },
      "This game has already started.",
    ],
  ])("refuses an offer that has %s", async (_, offer, message) => {
    tx.sparringOffer.findFirst.mockResolvedValue(offer);

    await expect(cancelOffer(OFFER)).resolves.toEqual({ ok: false, message });
    expect(tx.sparringOffer.update).not.toHaveBeenCalled();
    expect(recordLateCancellation).not.toHaveBeenCalled();
  });

  it("refuses a request without a session", async () => {
    requireOnboardedUser.mockRejectedValue(new Error("NEXT_REDIRECT"));

    await expect(cancelOffer(OFFER)).rejects.toThrow("NEXT_REDIRECT");
    expect(tx.sparringOffer.update).not.toHaveBeenCalled();
  });

  it("treats a bad id as a missing offer", async () => {
    await expect(cancelOffer("nope")).resolves.toEqual({
      ok: false,
      message: "This offer doesn't exist.",
    });
    expect(tx.$queryRaw).not.toHaveBeenCalled();
  });
});
