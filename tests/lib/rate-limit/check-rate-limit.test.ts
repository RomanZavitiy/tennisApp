import { beforeEach, describe, expect, it, vi } from "vitest";

import { checkRateLimit } from "@/lib/rate-limit/check-rate-limit";

// The database is replaced: what's under test is the window math and the
// threshold itself, not Postgres's upsert.
const { upsert } = vi.hoisted(() => ({ upsert: vi.fn() }));

vi.mock("@/lib/db", () => ({ db: { rateLimitCounter: { upsert } } }));

describe("checkRateLimit", () => {
  beforeEach(() => {
    upsert.mockReset();
  });

  it("allows a count at the limit", async () => {
    upsert.mockResolvedValue({ count: 10 });

    await expect(checkRateLimit("user-1", "NEW_OFFER")).resolves.toEqual({
      ok: true,
    });
  });

  it("refuses a count over the limit", async () => {
    upsert.mockResolvedValue({ count: 11 });

    await expect(checkRateLimit("user-1", "NEW_OFFER")).resolves.toEqual({
      ok: false,
      message: "You've posted a lot of offers today. Try again tomorrow.",
    });
  });

  it("floors `now` to the action's window start", async () => {
    upsert.mockResolvedValue({ count: 1 });

    // A 10-minute window (MESSAGE): 10:07 and 10:09 fall in the same
    // window, 10:14 is the next one.
    await checkRateLimit("user-1", "MESSAGE", new Date("2026-10-15T10:07:30Z"));
    await checkRateLimit("user-1", "MESSAGE", new Date("2026-10-15T10:09:59Z"));
    await checkRateLimit("user-1", "MESSAGE", new Date("2026-10-15T10:14:00Z"));

    const windowStarts = upsert.mock.calls.map(
      (call: unknown[]) =>
        (
          call[0] as {
            where: { subject_action_windowStart: { windowStart: Date } };
          }
        ).where.subject_action_windowStart.windowStart,
    );
    expect(windowStarts[0]).toEqual(windowStarts[1]);
    expect(windowStarts[2]).not.toEqual(windowStarts[0]);
    expect(windowStarts[0]).toEqual(new Date("2026-10-15T10:00:00Z"));
    expect(windowStarts[2]).toEqual(new Date("2026-10-15T10:10:00Z"));
  });

  it.each([
    ["NEW_OFFER", 10],
    ["JOIN_REQUEST", 20],
    ["MESSAGE", 60],
    ["REPORT", 10],
    ["MAGIC_LINK", 5],
  ] as const)("%s's limit is %i", async (action, limit) => {
    upsert.mockResolvedValue({ count: limit });
    await expect(checkRateLimit("subject", action)).resolves.toEqual({
      ok: true,
    });

    upsert.mockResolvedValue({ count: limit + 1 });
    const result = await checkRateLimit("subject", action);
    expect(result.ok).toBe(false);
  });

  it("creates the row with count 1 and increments on update", async () => {
    upsert.mockResolvedValue({ count: 1 });
    const now = new Date("2026-10-15T10:00:00Z");

    await checkRateLimit("user-1", "REPORT", now);

    expect(upsert).toHaveBeenCalledWith({
      where: {
        subject_action_windowStart: {
          subject: "user-1",
          action: "REPORT",
          windowStart: new Date("2026-10-15T00:00:00Z"),
        },
      },
      create: {
        subject: "user-1",
        action: "REPORT",
        windowStart: new Date("2026-10-15T00:00:00Z"),
        count: 1,
      },
      update: { count: { increment: 1 } },
      select: { count: true },
    });
  });
});
