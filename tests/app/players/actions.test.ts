import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  blockPlayer,
  reportPlayer,
  unblockPlayer,
} from "@/app/players/[id]/actions";

const ME = "11111111-1111-4111-8111-111111111111";
const TARGET = "22222222-2222-4222-8222-222222222222";

const {
  requireOnboardedUser,
  userFindUnique,
  createReport,
  blockCreateMany,
  blockDeleteMany,
  revalidatePath,
} = vi.hoisted(() => ({
  requireOnboardedUser: vi.fn(),
  userFindUnique: vi.fn(),
  createReport: vi.fn(),
  blockCreateMany: vi.fn(),
  blockDeleteMany: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/require-onboarded-user", () => ({ requireOnboardedUser }));
vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: userFindUnique },
    userBlock: { createMany: blockCreateMany, deleteMany: blockDeleteMany },
  },
}));
vi.mock("@/lib/moderation/create-report", () => ({ createReport }));
vi.mock("next/cache", () => ({ revalidatePath }));

describe("reportPlayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireOnboardedUser.mockResolvedValue({ id: ME });
    userFindUnique.mockResolvedValue({ id: TARGET });
    createReport.mockResolvedValue({ ok: true });
  });

  it("files a direct report against the player, with no offer or message context", async () => {
    await reportPlayer(TARGET, { reason: "NO_SHOW" });

    expect(createReport).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterId: ME,
        targetUserId: TARGET,
        input: { reason: "NO_SHOW", comment: undefined },
      }),
    );
  });

  it("treats a player who doesn't exist as not found", async () => {
    userFindUnique.mockResolvedValue(null);

    await expect(reportPlayer(TARGET, { reason: "NO_SHOW" })).resolves.toEqual({
      ok: false,
      message: "This player doesn't exist.",
    });
    expect(createReport).not.toHaveBeenCalled();
  });
});

describe("blockPlayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireOnboardedUser.mockResolvedValue({ id: ME });
    userFindUnique.mockResolvedValue({ id: TARGET });
  });

  it("blocks the target for the signed-in player", async () => {
    const result = await blockPlayer(TARGET);

    expect(result).toEqual({ ok: true });
    expect(blockCreateMany).toHaveBeenCalledWith({
      data: [{ blockerId: ME, blockedId: TARGET }],
      skipDuplicates: true,
    });
    expect(revalidatePath).toHaveBeenCalledWith(`/players/${TARGET}`);
    expect(revalidatePath).toHaveBeenCalledWith("/profile");
  });

  it("blocking twice is a no-op, not an error", async () => {
    const first = await blockPlayer(TARGET);
    const second = await blockPlayer(TARGET);

    expect(first).toEqual({ ok: true });
    expect(second).toEqual({ ok: true });
    expect(blockCreateMany).toHaveBeenCalledTimes(2);
  });

  it("refuses to block yourself", async () => {
    const result = await blockPlayer(ME);

    expect(result).toEqual({
      ok: false,
      message: "This player doesn't exist.",
    });
    expect(blockCreateMany).not.toHaveBeenCalled();
  });

  it("treats a player who doesn't exist as not found", async () => {
    userFindUnique.mockResolvedValue(null);

    const result = await blockPlayer(TARGET);

    expect(result).toEqual({
      ok: false,
      message: "This player doesn't exist.",
    });
    expect(blockCreateMany).not.toHaveBeenCalled();
  });

  it("rejects a malformed target id", async () => {
    const result = await blockPlayer("not-a-uuid");

    expect(result).toEqual({
      ok: false,
      message: "This player doesn't exist.",
    });
    expect(blockCreateMany).not.toHaveBeenCalled();
  });
});

describe("unblockPlayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireOnboardedUser.mockResolvedValue({ id: ME });
    blockDeleteMany.mockResolvedValue({ count: 1 });
  });

  it("unblocks the target for the signed-in player", async () => {
    const result = await unblockPlayer(TARGET);

    expect(result).toEqual({ ok: true });
    expect(blockDeleteMany).toHaveBeenCalledWith({
      where: { blockerId: ME, blockedId: TARGET },
    });
    expect(revalidatePath).toHaveBeenCalledWith(`/players/${TARGET}`);
    expect(revalidatePath).toHaveBeenCalledWith("/profile");
  });

  it("unblocking a player never blocked is a no-op", async () => {
    blockDeleteMany.mockResolvedValue({ count: 0 });

    const result = await unblockPlayer(TARGET);

    expect(result).toEqual({ ok: true });
  });

  it("rejects a malformed target id", async () => {
    const result = await unblockPlayer("not-a-uuid");

    expect(result).toEqual({
      ok: false,
      message: "This player doesn't exist.",
    });
    expect(blockDeleteMany).not.toHaveBeenCalled();
  });
});
