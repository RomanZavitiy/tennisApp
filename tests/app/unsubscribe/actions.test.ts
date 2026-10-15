import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { confirmUnsubscribe } from "@/app/unsubscribe/actions";
import { createUnsubscribeToken } from "@/lib/notifications/unsubscribe-token";

const { userUpdateMany } = vi.hoisted(() => ({ userUpdateMany: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { user: { updateMany: userUpdateMany } } }));

describe("confirmUnsubscribe", () => {
  const originalSecret = process.env.UNSUBSCRIBE_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.UNSUBSCRIBE_SECRET = "test-secret";
    userUpdateMany.mockResolvedValue({ count: 1 });
  });

  afterEach(() => {
    process.env.UNSUBSCRIBE_SECRET = originalSecret;
  });

  it("turns off email fallback for the token's user", async () => {
    const token = createUnsubscribeToken("user-1");

    await expect(confirmUnsubscribe(token)).resolves.toEqual({ ok: true });

    expect(userUpdateMany).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { notifyEmailFallback: false },
    });
  });

  it("refuses a forged token (the task's own checklist item) without writing", async () => {
    const token = createUnsubscribeToken("user-1");
    const forged = token.slice(0, -1) + (token.endsWith("A") ? "B" : "A");

    await expect(confirmUnsubscribe(forged)).resolves.toEqual({
      ok: false,
      message: "This link isn't valid.",
    });
    expect(userUpdateMany).not.toHaveBeenCalled();
  });

  it("refuses a missing token", async () => {
    await expect(confirmUnsubscribe(undefined)).resolves.toEqual({
      ok: false,
      message: "This link isn't valid.",
    });
    expect(userUpdateMany).not.toHaveBeenCalled();
  });
});
