import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  autoConfirmExpiredDoublesResults,
  doublesSettlerIds,
  sendDoublesResultReminders,
} from "@/lib/rating/doubles-cron";

const {
  findMany,
  update,
  transaction,
  lockDoublesResult,
  settleDoublesResult,
  notify,
} = vi.hoisted(() => ({
  findMany: vi.fn(),
  update: vi.fn(),
  transaction: vi.fn(),
  lockDoublesResult: vi.fn(),
  settleDoublesResult: vi.fn(),
  notify: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    doublesResult: { findMany, update },
    $transaction: transaction,
  },
}));
vi.mock("@/lib/rating/apply-doubles", () => ({
  lockDoublesResult,
  settleDoublesResult,
}));
vi.mock("@/lib/notifications/notify", () => ({ notify }));

const NOW = new Date("2026-11-24T20:00:00Z");

const scored = {
  authorId: "author",
  authorPartnerId: "p1",
  opponent1Id: "p2",
  opponent2Id: "p3",
  reportedById: "p1",
  noShowUserId: null,
};

describe("doublesSettlerIds", () => {
  it("is the pair that didn't file a score", () => {
    expect(doublesSettlerIds(scored)).toEqual(["p2", "p3"]);
    expect(doublesSettlerIds({ ...scored, reportedById: "p3" })).toEqual([
      "author",
      "p1",
    ]);
  });

  it("skips the author's off-app partner", () => {
    expect(
      doublesSettlerIds({
        ...scored,
        authorPartnerId: null,
        reportedById: "p2",
      }),
    ).toEqual(["author"]);
  });

  it("is only the named player for a no-show report", () => {
    expect(doublesSettlerIds({ ...scored, noShowUserId: "p2" })).toEqual([
      "p2",
    ]);
  });
});

describe("autoConfirmExpiredDoublesResults", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transaction.mockImplementation((run: (tx: unknown) => unknown) =>
      run("tx"),
    );
  });

  it("settles what's still pending and skips what a human settled meanwhile", async () => {
    findMany.mockResolvedValue([{ id: "a" }, { id: "b" }]);
    lockDoublesResult
      .mockResolvedValueOnce({ id: "a", status: "PENDING" })
      .mockResolvedValueOnce({ id: "b", status: "CONFIRMED" });

    const count = await autoConfirmExpiredDoublesResults(NOW);

    expect(findMany).toHaveBeenCalledWith({
      where: { status: "PENDING", autoConfirmAt: { lte: NOW } },
      select: { id: true },
    });
    expect(count).toBe(1);
    expect(settleDoublesResult).toHaveBeenCalledTimes(1);
    expect(settleDoublesResult).toHaveBeenCalledWith("tx", {
      id: "a",
      status: "PENDING",
    });
  });
});

describe("sendDoublesResultReminders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks the result reminded and nudges the pair that hasn't answered", async () => {
    findMany.mockResolvedValue([
      {
        id: "r1",
        offerId: "o1",
        authorPartnerId: "p1",
        opponent1Id: "p2",
        opponent2Id: "p3",
        reportedById: "author",
        noShowUserId: null,
        offer: { authorId: "author" },
      },
    ]);

    const count = await sendDoublesResultReminders(NOW);

    expect(count).toBe(1);
    expect(update).toHaveBeenCalledWith({
      where: { id: "r1" },
      data: { resultReminderSentAt: NOW },
    });
    expect(notify.mock.calls.map((call) => call[0] as string)).toEqual([
      "p2",
      "p3",
    ]);
    expect(notify).toHaveBeenCalledWith(
      "p2",
      { kind: "CONFIRM_RESULT_REMINDER", offerId: "o1" },
      NOW,
    );
  });
});
