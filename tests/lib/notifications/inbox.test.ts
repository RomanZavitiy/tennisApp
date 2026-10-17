import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  countUnreadNotifications,
  listNotifications,
  markNotificationsRead,
  NOTIFICATIONS_SHOWN,
  recordNotification,
} from "@/lib/notifications/inbox";

const { create, updateMany, findMany, count } = vi.hoisted(() => ({
  create: vi.fn(),
  updateMany: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: { notification: { create, updateMany, findMany, count } },
}));

const USER = "user-1";
const NOW = new Date("2026-11-10T12:00:00Z");

describe("recordNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    create.mockResolvedValue({});
  });

  it("adds a row for an offer event, with no thread", async () => {
    await recordNotification(
      USER,
      { kind: "JOIN_ACCEPTED", offerId: "offer-1" },
      NOW,
    );

    expect(updateMany).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith({
      data: {
        userId: USER,
        kind: "JOIN_ACCEPTED",
        offerId: "offer-1",
        offerJoinId: null,
        createdAt: NOW,
      },
    });
  });

  it("refreshes a thread's unread message row instead of adding another", async () => {
    updateMany.mockResolvedValue({ count: 1 });

    await recordNotification(
      USER,
      { kind: "NEW_MESSAGE", offerId: "offer-1", offerJoinId: "join-1" },
      NOW,
    );

    expect(updateMany).toHaveBeenCalledWith({
      where: { userId: USER, offerJoinId: "join-1", readAt: null },
      data: { createdAt: NOW },
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("adds a message row when the thread has no unread one", async () => {
    updateMany.mockResolvedValue({ count: 0 });

    await recordNotification(
      USER,
      { kind: "NEW_MESSAGE", offerId: "offer-1", offerJoinId: "join-1" },
      NOW,
    );

    expect(create).toHaveBeenCalledWith({
      data: {
        userId: USER,
        kind: "NEW_MESSAGE",
        offerId: "offer-1",
        offerJoinId: "join-1",
        createdAt: NOW,
      },
    });
  });

  it("never throws when the database write fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    create.mockRejectedValue(new Error("offer is gone"));

    await expect(
      recordNotification(
        USER,
        { kind: "JOIN_REQUESTED", offerId: "offer-1" },
        NOW,
      ),
    ).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe("reading the list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists the player's own latest notifications, newest first", async () => {
    findMany.mockResolvedValue([]);

    await listNotifications(USER);

    const query = findMany.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(query.where).toEqual({ userId: USER });
    expect(query.orderBy).toEqual([{ createdAt: "desc" }, { id: "desc" }]);
    expect(query.take).toBe(NOTIFICATIONS_SHOWN);
  });

  it("counts only unread notifications", async () => {
    count.mockResolvedValue(3);

    await expect(countUnreadNotifications(USER)).resolves.toBe(3);
    expect(count).toHaveBeenCalledWith({
      where: { userId: USER, readAt: null },
    });
  });

  it("marks everything read, or only one offer's notifications", async () => {
    updateMany.mockResolvedValue({ count: 0 });

    await markNotificationsRead(USER, NOW);
    await markNotificationsRead(USER, NOW, "offer-1");

    expect(updateMany).toHaveBeenNthCalledWith(1, {
      where: { userId: USER, readAt: null },
      data: { readAt: NOW },
    });
    expect(updateMany).toHaveBeenNthCalledWith(2, {
      where: { userId: USER, readAt: null, offerId: "offer-1" },
      data: { readAt: NOW },
    });
  });
});
