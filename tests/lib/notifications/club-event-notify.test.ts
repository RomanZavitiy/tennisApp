import { beforeEach, describe, expect, it, vi } from "vitest";

import { notifyClubFollowers } from "@/lib/notifications/club-event-notify";

// The database and web-push are replaced: what's under test is which
// followers get a club's news as a push (slice PD5, task PD5.1), and that
// it's counted against the same daily cap as "new offer for my level".
const { followFindMany, userUpdate, subscriptionDelete, sendPush } = vi.hoisted(
  () => ({
    followFindMany: vi.fn(),
    userUpdate: vi.fn(),
    subscriptionDelete: vi.fn(),
    sendPush: vi.fn(),
  }),
);
vi.mock("@/lib/db", () => ({
  db: {
    clubFollow: { findMany: followFindMany },
    user: { update: userUpdate },
    pushSubscription: { delete: subscriptionDelete },
  },
}));
vi.mock("@/lib/push/send-push", () => ({ sendPush }));

const NOW = new Date("2026-11-10T11:00:00Z"); // noon Europe/Warsaw
const NIGHT = new Date("2026-11-10T22:30:00Z"); // 23:30 Europe/Warsaw
const EVENT = {
  clubId: "club-1",
  clubName: "Blonia Sport",
  title: "Padel night",
  body: "Friday from 19:00, all levels.",
  authorId: "staff-1",
};
const SUB = { id: "sub-1", endpoint: "https://push/1", p256dh: "p", auth: "a" };

function follower(id: string, over: Record<string, unknown> = {}) {
  return {
    user: {
      id,
      notifyNewOffers: true,
      offerPushSentOn: null,
      offerPushSentCount: 0,
      pushSubscriptions: [SUB],
      ...over,
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  sendPush.mockResolvedValue({ ok: true });
  userUpdate.mockResolvedValue(undefined);
  subscriptionDelete.mockResolvedValue(undefined);
});

describe("notifyClubFollowers", () => {
  it("asks only for opted-in, onboarded followers other than the author", async () => {
    followFindMany.mockResolvedValue([]);

    await notifyClubFollowers(EVENT, NOW);

    expect(followFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          clubId: "club-1",
          userId: { not: "staff-1" },
          user: { notifyNewOffers: true, onboardingCompletedAt: { not: null } },
        },
      }),
    );
  });

  it("pushes the news with the club's name and counts it against the cap", async () => {
    followFindMany.mockResolvedValue([follower("fan-1")]);

    expect(await notifyClubFollowers(EVENT, NOW)).toEqual(["fan-1"]);

    expect(sendPush).toHaveBeenCalledWith(SUB, {
      title: "Blonia Sport · Padel night",
      body: "Friday from 19:00, all levels.",
      url: "/clubs/club-1",
    });
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: "fan-1" },
      data: {
        offerPushSentOn: new Date("2026-11-10T00:00:00Z"),
        offerPushSentCount: 1,
      },
    });
  });

  it("shortens a long text for the push", async () => {
    followFindMany.mockResolvedValue([follower("fan-1")]);

    await notifyClubFollowers({ ...EVENT, body: "x".repeat(300) }, NOW);

    const payload = sendPush.mock.calls[0]?.[1] as { body: string };
    expect(payload.body).toHaveLength(140);
    expect(payload.body.endsWith("…")).toBe(true);
  });

  it("skips a follower at the daily cap or with no subscription", async () => {
    followFindMany.mockResolvedValue([
      follower("capped", {
        offerPushSentOn: new Date("2026-11-10T00:00:00Z"),
        offerPushSentCount: 99,
      }),
      follower("no-device", { pushSubscriptions: [] }),
    ]);

    expect(await notifyClubFollowers(EVENT, NOW)).toEqual([]);
    expect(sendPush).not.toHaveBeenCalled();
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("sends nothing during quiet hours", async () => {
    followFindMany.mockResolvedValue([follower("fan-1")]);

    expect(await notifyClubFollowers(EVENT, NIGHT)).toEqual([]);
    expect(sendPush).not.toHaveBeenCalled();
  });

  it("deletes a subscription the push service says is gone", async () => {
    followFindMany.mockResolvedValue([follower("fan-1")]);
    sendPush.mockResolvedValue({ ok: false, expired: true });

    await notifyClubFollowers(EVENT, NOW);

    expect(subscriptionDelete).toHaveBeenCalledWith({ where: { id: "sub-1" } });
  });

  it("never throws: the news is already saved", async () => {
    followFindMany.mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(await notifyClubFollowers(EVENT, NOW)).toEqual([]);
  });
});
