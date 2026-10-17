import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  markNotificationsReadAction,
  unreadNotificationCount,
} from "@/app/(member)/notifications/actions";

const ME = "11111111-1111-4111-8111-111111111111";
const OFFER = "22222222-2222-4222-8222-222222222222";

const { getCurrentUser, countUnreadNotifications, markNotificationsRead } =
  vi.hoisted(() => ({
    getCurrentUser: vi.fn(),
    countUnreadNotifications: vi.fn(),
    markNotificationsRead: vi.fn(),
  }));

vi.mock("@/lib/auth/require-user", () => ({ getCurrentUser }));
vi.mock("@/lib/notifications/inbox", () => ({
  countUnreadNotifications,
  markNotificationsRead,
}));

describe("notification actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUser.mockResolvedValue({ id: ME, email: undefined });
    countUnreadNotifications.mockResolvedValue(4);
    markNotificationsRead.mockResolvedValue(undefined);
  });

  it("counts the signed-in player's unread notifications", async () => {
    await expect(unreadNotificationCount()).resolves.toBe(4);
    expect(countUnreadNotifications).toHaveBeenCalledWith(ME);
  });

  it("shows no count once the session has ended", async () => {
    getCurrentUser.mockResolvedValue(null);

    await expect(unreadNotificationCount()).resolves.toBe(0);
    expect(countUnreadNotifications).not.toHaveBeenCalled();
  });

  it("marks everything read, or only one offer's notifications", async () => {
    await markNotificationsReadAction();
    await markNotificationsReadAction(OFFER);

    expect(markNotificationsRead).toHaveBeenNthCalledWith(
      1,
      ME,
      expect.any(Date),
      undefined,
    );
    expect(markNotificationsRead).toHaveBeenNthCalledWith(
      2,
      ME,
      expect.any(Date),
      OFFER,
    );
  });

  it("ignores an offer id that isn't a uuid", async () => {
    await markNotificationsReadAction("not-a-uuid");

    expect(markNotificationsRead).not.toHaveBeenCalled();
  });

  it("does nothing for a signed-out visitor", async () => {
    getCurrentUser.mockResolvedValue(null);

    await markNotificationsReadAction(OFFER);

    expect(markNotificationsRead).not.toHaveBeenCalled();
  });
});
