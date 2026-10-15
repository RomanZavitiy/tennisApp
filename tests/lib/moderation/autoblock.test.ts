import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AUTOBLOCK_THRESHOLD,
  maybeAutoblock,
  shouldAutoblock,
} from "@/lib/moderation/autoblock";

describe("shouldAutoblock", () => {
  it("is false below the threshold", () => {
    expect(shouldAutoblock(AUTOBLOCK_THRESHOLD - 1)).toBe(false);
  });

  it("is true at and above the threshold", () => {
    expect(shouldAutoblock(AUTOBLOCK_THRESHOLD)).toBe(true);
    expect(shouldAutoblock(AUTOBLOCK_THRESHOLD + 1)).toBe(true);
  });
});

// The database is replaced: what's under test is whether maybeAutoblock
// blocks and logs, not the count query itself.
const { reportFindMany, userUpdateMany, adminActionCreate } = vi.hoisted(
  () => ({
    reportFindMany: vi.fn(),
    userUpdateMany: vi.fn(),
    adminActionCreate: vi.fn(),
  }),
);

vi.mock("@/lib/db", () => ({
  db: {
    report: { findMany: reportFindMany },
    user: { updateMany: userUpdateMany },
    adminAction: { create: adminActionCreate },
  },
}));

const TARGET = "11111111-1111-4111-8111-111111111111";

describe("maybeAutoblock", () => {
  beforeEach(() => {
    reportFindMany.mockReset();
    userUpdateMany.mockReset();
    adminActionCreate.mockReset();
    userUpdateMany.mockResolvedValue({ count: 1 });
  });

  it("does nothing below 3 distinct reporters", async () => {
    reportFindMany.mockResolvedValue([
      { reporterId: "a" },
      { reporterId: "b" },
    ]);

    await maybeAutoblock(TARGET);

    expect(userUpdateMany).not.toHaveBeenCalled();
    expect(adminActionCreate).not.toHaveBeenCalled();
  });

  it("blocks and logs at 3 distinct reporters", async () => {
    reportFindMany.mockResolvedValue([
      { reporterId: "a" },
      { reporterId: "b" },
      { reporterId: "c" },
    ]);
    const now = new Date("2026-10-15T09:00:00Z");

    await maybeAutoblock(TARGET, now);

    expect(userUpdateMany).toHaveBeenCalledWith({
      where: { id: TARGET, blockedAt: null },
      data: { blockedAt: now },
    });
    expect(adminActionCreate).toHaveBeenCalledWith({
      data: { action: "AUTOBLOCK_PLAYER", targetUserId: TARGET, adminId: null },
    });
  });

  it("only counts reports from the last 30 days", async () => {
    const now = new Date("2026-10-15T09:00:00Z");
    reportFindMany.mockResolvedValue([]);

    await maybeAutoblock(TARGET, now);

    expect(reportFindMany).toHaveBeenCalledWith({
      where: {
        targetUserId: TARGET,
        createdAt: { gte: new Date("2026-09-15T09:00:00Z") },
      },
      select: { reporterId: true },
      distinct: ["reporterId"],
    });
  });

  it("doesn't log a second time when the player is already blocked", async () => {
    reportFindMany.mockResolvedValue([
      { reporterId: "a" },
      { reporterId: "b" },
      { reporterId: "c" },
    ]);
    userUpdateMany.mockResolvedValue({ count: 0 });

    await maybeAutoblock(TARGET);

    expect(adminActionCreate).not.toHaveBeenCalled();
  });
});
