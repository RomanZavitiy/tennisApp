import { beforeEach, describe, expect, it, vi } from "vitest";

import { notify } from "@/lib/notifications/notify";

const { userFindUnique, pushSubscriptionDelete, offerJoinUpdateMany } =
  vi.hoisted(() => ({
    userFindUnique: vi.fn(),
    pushSubscriptionDelete: vi.fn(),
    offerJoinUpdateMany: vi.fn(),
  }));
vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: userFindUnique },
    pushSubscription: { delete: pushSubscriptionDelete },
    offerJoin: { updateMany: offerJoinUpdateMany },
  },
}));

const { sendPush } = vi.hoisted(() => ({ sendPush: vi.fn() }));
vi.mock("@/lib/push/send-push", () => ({ sendPush }));

const { sendEmail } = vi.hoisted(() => ({ sendEmail: vi.fn() }));
vi.mock("@/lib/email/send", () => ({ sendEmail }));

const { createUnsubscribeToken } = vi.hoisted(() => ({
  createUnsubscribeToken: vi.fn().mockReturnValue("token"),
}));
vi.mock("@/lib/notifications/unsubscribe-token", () => ({
  createUnsubscribeToken,
}));

const USER = "user-1";
const SUB = { id: "sub-1", endpoint: "https://push/1", p256dh: "p", auth: "a" };
const NOW = new Date("2026-11-10T12:00:00Z");

function user(over: Partial<Record<string, unknown>> = {}) {
  return {
    email: "player@example.com",
    locale: "EN",
    notifyMatches: true,
    notifyNewOffers: true,
    notifyEmailFallback: true,
    pushSubscriptions: [SUB],
    ...over,
  };
}

describe("notify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    offerJoinUpdateMany.mockResolvedValue({ count: 1 });
    pushSubscriptionDelete.mockResolvedValue(undefined);
    sendEmail.mockResolvedValue({ ok: true });
  });

  it("does nothing for an unknown user", async () => {
    userFindUnique.mockResolvedValue(null);

    await notify(USER, { kind: "JOIN_REQUESTED", offerId: "offer-1" }, NOW);

    expect(sendPush).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("sends push to every subscription and skips email once one succeeds", async () => {
    userFindUnique.mockResolvedValue(user());
    sendPush.mockResolvedValue({ ok: true });

    await notify(USER, { kind: "JOIN_REQUESTED", offerId: "offer-1" }, NOW);

    expect(sendPush).toHaveBeenCalledWith(SUB, {
      title: "New request to join",
      body: "Someone asked to join your offer.",
      url: "/offers/offer-1",
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("falls back to email when there's no push subscription at all", async () => {
    userFindUnique.mockResolvedValue(user({ pushSubscriptions: [] }));

    await notify(USER, { kind: "JOIN_REQUESTED", offerId: "offer-1" }, NOW);

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "player@example.com" }),
    );
  });

  it("skips email for an event that isn't fallback-eligible", async () => {
    userFindUnique.mockResolvedValue(user({ pushSubscriptions: [] }));

    await notify(USER, { kind: "JOIN_DECLINED", offerId: "offer-1" }, NOW);

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("falls back to email once the only subscription turns out expired", async () => {
    userFindUnique.mockResolvedValue(user());
    sendPush.mockResolvedValue({ ok: false, expired: true });

    await notify(USER, { kind: "JOIN_ACCEPTED", offerId: "offer-1" }, NOW);

    expect(pushSubscriptionDelete).toHaveBeenCalledWith({
      where: { id: SUB.id },
    });
    expect(sendEmail).toHaveBeenCalled();
  });

  it("keeps an active subscription even if a different one just failed", async () => {
    const otherSub = { ...SUB, id: "sub-2" };
    userFindUnique.mockResolvedValue(
      user({ pushSubscriptions: [SUB, otherSub] }),
    );
    sendPush
      .mockResolvedValueOnce({ ok: false, expired: true })
      .mockResolvedValueOnce({ ok: true });

    await notify(USER, { kind: "JOIN_ACCEPTED", offerId: "offer-1" }, NOW);

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("never emails without an eligible event, even with no subscription", async () => {
    userFindUnique.mockResolvedValue(
      user({ pushSubscriptions: [], notifyEmailFallback: false }),
    );

    await notify(USER, { kind: "JOIN_REQUESTED", offerId: "offer-1" }, NOW);

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("never emails a user with no address on file", async () => {
    userFindUnique.mockResolvedValue(
      user({ pushSubscriptions: [], email: null }),
    );

    await notify(USER, { kind: "JOIN_REQUESTED", offerId: "offer-1" }, NOW);

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("gates on notifyMatches for a matches-category event", async () => {
    userFindUnique.mockResolvedValue(user({ notifyMatches: false }));

    await notify(USER, { kind: "COURT_BOOKED", offerId: "offer-1" }, NOW);

    expect(sendPush).not.toHaveBeenCalled();
  });

  it("gates NEW_OFFER_FOR_LEVEL on notifyNewOffers, not notifyMatches", async () => {
    userFindUnique.mockResolvedValue(
      user({ notifyMatches: false, notifyNewOffers: true }),
    );
    sendPush.mockResolvedValue({ ok: true });

    await notify(
      USER,
      { kind: "NEW_OFFER_FOR_LEVEL", offerId: "offer-1" },
      NOW,
    );

    expect(sendPush).toHaveBeenCalled();
  });

  it("claims the per-thread 5-minute throttle before loading the user", async () => {
    offerJoinUpdateMany.mockResolvedValue({ count: 0 });

    await notify(
      USER,
      { kind: "NEW_MESSAGE", offerId: "offer-1", offerJoinId: "join-1" },
      NOW,
    );

    expect(userFindUnique).not.toHaveBeenCalled();
    expect(sendPush).not.toHaveBeenCalled();
  });

  it("sends when the throttle slot is free", async () => {
    offerJoinUpdateMany.mockResolvedValue({ count: 1 });
    userFindUnique.mockResolvedValue(user());
    sendPush.mockResolvedValue({ ok: true });

    await notify(
      USER,
      { kind: "NEW_MESSAGE", offerId: "offer-1", offerJoinId: "join-1" },
      NOW,
    );

    expect(offerJoinUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "join-1",
        OR: [
          { lastMessagePushAt: null },
          { lastMessagePushAt: { lt: new Date(NOW.getTime() - 5 * 60_000) } },
        ],
      },
      data: { lastMessagePushAt: NOW },
    });
    expect(sendPush).toHaveBeenCalled();
  });
});
