import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  removePushSubscription,
  savePushSubscription,
  updateNotificationSetting,
} from "@/app/(member)/profile/notifications/actions";

const ME = "11111111-1111-4111-8111-111111111111";

const { pushUpsert, pushFindUnique, pushDeleteMany, userUpdate, captureEvent } =
  vi.hoisted(() => ({
    pushUpsert: vi.fn(),
    pushFindUnique: vi.fn(),
    pushDeleteMany: vi.fn(),
    userUpdate: vi.fn(),
    captureEvent: vi.fn(),
  }));

vi.mock("@/lib/auth/require-user", () => ({
  requireUser: () => Promise.resolve({ id: ME, email: undefined }),
}));
vi.mock("@/lib/db", () => ({
  db: {
    pushSubscription: {
      upsert: pushUpsert,
      findUnique: pushFindUnique,
      deleteMany: pushDeleteMany,
    },
    user: { update: userUpdate },
  },
}));
vi.mock("@/lib/analytics/posthog", () => ({ captureEvent }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const subscription = {
  endpoint: "https://push.example.com/abc",
  p256dh: "p256dh-key",
  auth: "auth-secret",
};

describe("savePushSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pushUpsert.mockResolvedValue(undefined);
    pushFindUnique.mockResolvedValue(null);
  });

  it("upserts by endpoint, scoped to the signed-in user", async () => {
    await expect(savePushSubscription(subscription)).resolves.toEqual({
      ok: true,
    });

    expect(pushUpsert).toHaveBeenCalledWith({
      where: { endpoint: subscription.endpoint },
      create: { ...subscription, userId: ME },
      update: { ...subscription, userId: ME },
    });
  });

  it("fires push_enabled for a brand-new subscription", async () => {
    pushFindUnique.mockResolvedValue(null);

    await savePushSubscription(subscription);

    expect(captureEvent).toHaveBeenCalledWith("push_enabled", ME, {});
  });

  it("doesn't re-fire push_enabled when the endpoint already existed", async () => {
    pushFindUnique.mockResolvedValue({ endpoint: subscription.endpoint });

    await savePushSubscription(subscription);

    expect(captureEvent).not.toHaveBeenCalled();
  });

  it("refuses an invalid subscription without writing", async () => {
    await expect(
      savePushSubscription({ endpoint: "not-a-url" }),
    ).resolves.toEqual({ ok: false, message: "Invalid subscription." });
    expect(pushUpsert).not.toHaveBeenCalled();
  });
});

describe("removePushSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pushDeleteMany.mockResolvedValue({ count: 1 });
  });

  it("deletes only the signed-in user's own row for that endpoint", async () => {
    await expect(
      removePushSubscription(subscription.endpoint),
    ).resolves.toEqual({ ok: true });

    expect(pushDeleteMany).toHaveBeenCalledWith({
      where: { endpoint: subscription.endpoint, userId: ME },
    });
  });

  it("refuses a non-URL endpoint without writing", async () => {
    await expect(removePushSubscription(42)).resolves.toEqual({
      ok: false,
      message: "Invalid subscription.",
    });
    expect(pushDeleteMany).not.toHaveBeenCalled();
  });
});

describe("updateNotificationSetting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userUpdate.mockResolvedValue(undefined);
  });

  it("saves exactly one switch's new value", async () => {
    await expect(
      updateNotificationSetting({ notifyMatches: false }),
    ).resolves.toEqual({ ok: true });

    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: ME },
      data: { notifyMatches: false },
    });
  });

  it.each(["notifyNewOffers", "notifyEmailFallback"] as const)(
    "also saves %s on its own",
    async (field) => {
      await updateNotificationSetting({ [field]: true });

      expect(userUpdate).toHaveBeenCalledWith({
        where: { id: ME },
        data: { [field]: true },
      });
    },
  );

  it("refuses more than one switch at a time", async () => {
    await expect(
      updateNotificationSetting({
        notifyMatches: false,
        notifyNewOffers: false,
      }),
    ).resolves.toEqual({ ok: false, message: "Invalid setting." });
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("refuses an empty update", async () => {
    await expect(updateNotificationSetting({})).resolves.toEqual({
      ok: false,
      message: "Invalid setting.",
    });
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("refuses a non-boolean value", async () => {
    await expect(
      updateNotificationSetting({ notifyMatches: "yes" }),
    ).resolves.toEqual({ ok: false, message: "Invalid setting." });
    expect(userUpdate).not.toHaveBeenCalled();
  });
});
