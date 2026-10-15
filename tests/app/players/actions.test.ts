import { beforeEach, describe, expect, it, vi } from "vitest";

import { reportPlayer } from "@/app/players/[id]/actions";

const ME = "11111111-1111-4111-8111-111111111111";
const TARGET = "22222222-2222-4222-8222-222222222222";

const { requireOnboardedUser, userFindUnique, createReport } = vi.hoisted(
  () => ({
    requireOnboardedUser: vi.fn(),
    userFindUnique: vi.fn(),
    createReport: vi.fn(),
  }),
);

vi.mock("@/lib/auth/require-onboarded-user", () => ({ requireOnboardedUser }));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique: userFindUnique } } }));
vi.mock("@/lib/moderation/create-report", () => ({ createReport }));

describe("reportPlayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireOnboardedUser.mockResolvedValue({ id: ME });
    userFindUnique.mockResolvedValue({ id: TARGET });
    createReport.mockResolvedValue({ ok: true });
  });

  it("files a direct report against the player, with no offer or message context", async () => {
    await reportPlayer(TARGET, { reason: "NO_SHOW" });

    expect(createReport).toHaveBeenCalledWith({
      reporterId: ME,
      targetUserId: TARGET,
      input: { reason: "NO_SHOW", comment: undefined },
    });
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
