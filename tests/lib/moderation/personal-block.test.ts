import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  blockedCounterpartIds,
  getBlockedPlayers,
  isBlocked,
  isBlockedEitherWay,
} from "@/lib/moderation/personal-block";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

const { findUnique, findFirst, findMany } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: { userBlock: { findUnique, findFirst, findMany } },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("isBlocked", () => {
  it("is false when A has not blocked B", async () => {
    findUnique.mockResolvedValue(null);

    await expect(isBlocked(A, B)).resolves.toBe(false);
    expect(findUnique).toHaveBeenCalledWith({
      where: { blockerId_blockedId: { blockerId: A, blockedId: B } },
      select: { id: true },
    });
  });

  it("is true when A has blocked B", async () => {
    findUnique.mockResolvedValue({ id: "block-1" });

    await expect(isBlocked(A, B)).resolves.toBe(true);
  });
});

describe("isBlockedEitherWay", () => {
  it("is true whichever side did the blocking", async () => {
    findFirst.mockResolvedValue({ id: "block-1" });

    await expect(isBlockedEitherWay(A, B)).resolves.toBe(true);
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          { blockerId: A, blockedId: B },
          { blockerId: B, blockedId: A },
        ],
      },
      select: { id: true },
    });
  });

  it("is false with no block either way", async () => {
    findFirst.mockResolvedValue(null);

    await expect(isBlockedEitherWay(A, B)).resolves.toBe(false);
  });
});

describe("blockedCounterpartIds", () => {
  it("maps each row to the other side, whichever direction it was made", async () => {
    findMany.mockResolvedValue([
      { blockerId: A, blockedId: B },
      { blockerId: B, blockedId: A },
    ]);

    await expect(blockedCounterpartIds(A)).resolves.toEqual([B, B]);
  });
});

describe("getBlockedPlayers", () => {
  it("returns only the players this user has blocked, most recent first", async () => {
    findMany.mockResolvedValue([
      { blocked: { id: B, name: "Jan", avatarPath: null } },
    ]);

    await expect(getBlockedPlayers(A)).resolves.toEqual([
      { id: B, name: "Jan", avatarPath: null },
    ]);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { blockerId: A },
        orderBy: { createdAt: "desc" },
      }),
    );
  });
});
