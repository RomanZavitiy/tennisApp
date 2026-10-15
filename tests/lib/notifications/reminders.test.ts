import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  sendHowDidItGoPrompts,
  sendMatchReminders,
  sendResultConfirmationReminders,
} from "@/lib/notifications/reminders";

const { offerFindMany, offerUpdate, resultFindMany, resultUpdate, notify } =
  vi.hoisted(() => ({
    offerFindMany: vi.fn(),
    offerUpdate: vi.fn(),
    resultFindMany: vi.fn(),
    resultUpdate: vi.fn(),
    notify: vi.fn(),
  }));
vi.mock("@/lib/db", () => ({
  db: {
    sparringOffer: { findMany: offerFindMany, update: offerUpdate },
    matchResult: { findMany: resultFindMany, update: resultUpdate },
  },
}));
vi.mock("@/lib/notifications/notify", () => ({ notify }));

const NOW = new Date("2026-11-10T12:00:00Z");

describe("sendMatchReminders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    offerUpdate.mockResolvedValue(undefined);
  });

  it("notifies the author and every accepted player, once each", async () => {
    offerFindMany.mockResolvedValue([
      { id: "offer-1", authorId: "author-1", joins: [{ userId: "player-1" }] },
    ]);

    const count = await sendMatchReminders(NOW);

    expect(count).toBe(1);
    expect(offerUpdate).toHaveBeenCalledWith({
      where: { id: "offer-1" },
      data: { matchReminderSentAt: NOW },
    });
    expect(notify).toHaveBeenCalledWith(
      "author-1",
      { kind: "MATCH_REMINDER_3H", offerId: "offer-1" },
      NOW,
    );
    expect(notify).toHaveBeenCalledWith(
      "player-1",
      { kind: "MATCH_REMINDER_3H", offerId: "offer-1" },
      NOW,
    );
  });

  it("only queries offers starting within the next 3 hours, not yet reminded", async () => {
    offerFindMany.mockResolvedValue([]);

    await sendMatchReminders(NOW);

    const [args] = offerFindMany.mock.calls[0] as [{ where: object }];
    expect(args.where).toEqual({
      matchReminderSentAt: null,
      status: { in: ["OPEN", "FULL"] },
      startsAt: { gt: NOW, lte: new Date(NOW.getTime() + 3 * 3_600_000) },
      joins: { some: { status: "ACCEPTED" } },
    });
  });
});

describe("sendHowDidItGoPrompts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    offerUpdate.mockResolvedValue(undefined);
  });

  it("notifies the author and every accepted player", async () => {
    offerFindMany.mockResolvedValue([
      { id: "offer-2", authorId: "author-2", joins: [{ userId: "player-2" }] },
    ]);

    const count = await sendHowDidItGoPrompts(NOW);

    expect(count).toBe(1);
    expect(notify).toHaveBeenCalledWith(
      "author-2",
      { kind: "HOW_DID_IT_GO", offerId: "offer-2" },
      NOW,
    );
    expect(notify).toHaveBeenCalledWith(
      "player-2",
      { kind: "HOW_DID_IT_GO", offerId: "offer-2" },
      NOW,
    );
  });

  it("only queries offers that started at least 2 hours ago", async () => {
    offerFindMany.mockResolvedValue([]);

    await sendHowDidItGoPrompts(NOW);

    const [args] = offerFindMany.mock.calls[0] as [{ where: object }];
    expect(args.where).toEqual({
      howDidItGoSentAt: null,
      status: { in: ["OPEN", "FULL"] },
      startsAt: { lte: new Date(NOW.getTime() - 2 * 3_600_000) },
      joins: { some: { status: "ACCEPTED" } },
    });
  });
});

describe("sendResultConfirmationReminders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resultUpdate.mockResolvedValue(undefined);
  });

  it("notifies the player when the author filed the result", async () => {
    resultFindMany.mockResolvedValue([
      {
        id: "result-1",
        reportedBy: "AUTHOR",
        offerJoin: {
          offerId: "offer-3",
          userId: "player-3",
          offer: { authorId: "author-3" },
        },
      },
    ]);

    const count = await sendResultConfirmationReminders(NOW);

    expect(count).toBe(1);
    expect(resultUpdate).toHaveBeenCalledWith({
      where: { id: "result-1" },
      data: { resultReminderSentAt: NOW },
    });
    expect(notify).toHaveBeenCalledWith(
      "player-3",
      { kind: "CONFIRM_RESULT_REMINDER", offerId: "offer-3" },
      NOW,
    );
  });

  it("notifies the author when the player filed the result", async () => {
    resultFindMany.mockResolvedValue([
      {
        id: "result-2",
        reportedBy: "PLAYER",
        offerJoin: {
          offerId: "offer-4",
          userId: "player-4",
          offer: { authorId: "author-4" },
        },
      },
    ]);

    await sendResultConfirmationReminders(NOW);

    expect(notify).toHaveBeenCalledWith(
      "author-4",
      { kind: "CONFIRM_RESULT_REMINDER", offerId: "offer-4" },
      NOW,
    );
  });

  it("only queries results pending for at least 24 hours, not yet reminded", async () => {
    resultFindMany.mockResolvedValue([]);

    await sendResultConfirmationReminders(NOW);

    expect(resultFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: "PENDING",
          resultReminderSentAt: null,
          createdAt: { lte: new Date(NOW.getTime() - 24 * 3_600_000) },
        },
      }),
    );
  });
});
