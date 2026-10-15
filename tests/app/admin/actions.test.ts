import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  annulDisputedResult,
  blockFromReport,
  confirmDisputedResult,
  dismissReport,
  hideReport,
  unblockPlayer,
} from "@/app/admin/actions";

const ADMIN = "11111111-1111-4111-8111-111111111111";
const REPORT = "22222222-2222-4222-8222-222222222222";
const TARGET = "33333333-3333-4333-8333-333333333333";
const OFFER = "44444444-4444-4444-8444-444444444444";
const MESSAGE = "55555555-5555-4555-8555-555555555555";
const RESULT = "66666666-6666-4666-8666-666666666666";

const {
  requireAdmin,
  reportUpdateMany,
  reportFindUnique,
  reportUpdate,
  offerUpdate,
  messageUpdate,
  userUpdate,
  userUpdateMany,
  adminActionCreate,
  resultUpdateMany,
  applyMatchEloFromJoin,
  applyNoShow,
  tx,
} = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  reportUpdateMany: vi.fn(),
  reportFindUnique: vi.fn(),
  reportUpdate: vi.fn(),
  offerUpdate: vi.fn(),
  messageUpdate: vi.fn(),
  userUpdate: vi.fn(),
  userUpdateMany: vi.fn(),
  adminActionCreate: vi.fn(),
  resultUpdateMany: vi.fn(),
  applyMatchEloFromJoin: vi.fn(),
  applyNoShow: vi.fn(),
  tx: {
    $queryRaw: vi.fn(),
    matchResult: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/auth/require-admin", () => ({ requireAdmin }));
vi.mock("@/lib/db", () => ({
  db: {
    report: {
      updateMany: reportUpdateMany,
      findUnique: reportFindUnique,
      update: reportUpdate,
    },
    sparringOffer: { update: offerUpdate },
    message: { update: messageUpdate },
    user: { update: userUpdate, updateMany: userUpdateMany },
    adminAction: { create: adminActionCreate },
    matchResult: { updateMany: resultUpdateMany },
    $transaction: (run: (client: typeof tx) => Promise<unknown>) => run(tx),
  },
}));
vi.mock("@/lib/rating/apply-elo", () => ({ applyMatchEloFromJoin }));
vi.mock("@/lib/rating/reliability", () => ({ applyNoShow }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

describe("admin actions require an admin", () => {
  it("dismissReport propagates requireAdmin's 404", async () => {
    requireAdmin.mockRejectedValue(new Error("not-found"));

    await expect(dismissReport(REPORT)).rejects.toThrow("not-found");
    expect(reportUpdateMany).not.toHaveBeenCalled();
  });
});

describe("dismissReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdmin.mockResolvedValue({ id: ADMIN });
  });

  it("dismisses an open report and logs it", async () => {
    reportUpdateMany.mockResolvedValue({ count: 1 });

    await expect(dismissReport(REPORT, "spam")).resolves.toEqual({ ok: true });

    expect(reportUpdateMany).toHaveBeenCalledWith({
      where: { id: REPORT, status: "OPEN" },
      data: { status: "DISMISSED" },
    });
    expect(adminActionCreate).toHaveBeenCalledWith({
      data: {
        adminId: ADMIN,
        action: "DISMISS_REPORT",
        reason: "spam",
        reportId: REPORT,
      },
    });
  });

  it("refuses a report that's already handled", async () => {
    reportUpdateMany.mockResolvedValue({ count: 0 });

    await expect(dismissReport(REPORT)).resolves.toEqual({
      ok: false,
      message: "This report was already handled.",
    });
    expect(adminActionCreate).not.toHaveBeenCalled();
  });
});

describe("hideReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdmin.mockResolvedValue({ id: ADMIN });
  });

  it("cancels the offer for an offer report", async () => {
    reportFindUnique.mockResolvedValue({
      status: "OPEN",
      offerId: OFFER,
      messageId: null,
    });

    await expect(hideReport(REPORT)).resolves.toEqual({ ok: true });

    expect(offerUpdate).toHaveBeenCalledWith({
      where: { id: OFFER },
      data: { status: "CANCELLED" },
    });
    expect(messageUpdate).not.toHaveBeenCalled();
    expect(reportUpdate).toHaveBeenCalledWith({
      where: { id: REPORT },
      data: { status: "RESOLVED" },
    });
    expect(adminActionCreate).toHaveBeenCalledWith({
      data: {
        adminId: ADMIN,
        action: "HIDE_OFFER",
        reason: undefined,
        reportId: REPORT,
      },
    });
  });

  it("blanks the content for a message report", async () => {
    reportFindUnique.mockResolvedValue({
      status: "OPEN",
      offerId: null,
      messageId: MESSAGE,
    });

    await expect(hideReport(REPORT)).resolves.toEqual({ ok: true });

    expect(messageUpdate).toHaveBeenCalledWith({
      where: { id: MESSAGE },
      data: { content: "[Message removed by a moderator]" },
    });
    expect(offerUpdate).not.toHaveBeenCalled();
  });

  it("refuses a direct player report — nothing to hide", async () => {
    reportFindUnique.mockResolvedValue({
      status: "OPEN",
      offerId: null,
      messageId: null,
    });

    const result = await hideReport(REPORT);

    expect(result.ok).toBe(false);
    expect(reportUpdate).not.toHaveBeenCalled();
  });

  it("refuses a report that's already handled", async () => {
    reportFindUnique.mockResolvedValue({
      status: "RESOLVED",
      offerId: OFFER,
      messageId: null,
    });

    await expect(hideReport(REPORT)).resolves.toEqual({
      ok: false,
      message: "This report was already handled.",
    });
  });
});

describe("blockFromReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdmin.mockResolvedValue({ id: ADMIN });
  });

  it("blocks the report's target and resolves it", async () => {
    reportFindUnique.mockResolvedValue({
      status: "OPEN",
      targetUserId: TARGET,
    });

    await expect(blockFromReport(REPORT, "repeated abuse")).resolves.toEqual({
      ok: true,
    });

    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: TARGET },
      data: { blockedAt: expect.any(Date) as Date },
    });
    expect(reportUpdate).toHaveBeenCalledWith({
      where: { id: REPORT },
      data: { status: "RESOLVED" },
    });
    expect(adminActionCreate).toHaveBeenCalledWith({
      data: {
        adminId: ADMIN,
        action: "BLOCK_PLAYER",
        reason: "repeated abuse",
        reportId: REPORT,
        targetUserId: TARGET,
      },
    });
  });

  it("refuses a report that's already handled", async () => {
    reportFindUnique.mockResolvedValue({
      status: "DISMISSED",
      targetUserId: TARGET,
    });

    await expect(blockFromReport(REPORT)).resolves.toEqual({
      ok: false,
      message: "This report was already handled.",
    });
    expect(userUpdate).not.toHaveBeenCalled();
  });
});

describe("unblockPlayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdmin.mockResolvedValue({ id: ADMIN });
  });

  it("clears blockedAt and logs it", async () => {
    userUpdateMany.mockResolvedValue({ count: 1 });

    await expect(unblockPlayer(TARGET)).resolves.toEqual({ ok: true });

    expect(userUpdateMany).toHaveBeenCalledWith({
      where: { id: TARGET, blockedAt: { not: null } },
      data: { blockedAt: null },
    });
    expect(adminActionCreate).toHaveBeenCalledWith({
      data: {
        adminId: ADMIN,
        action: "UNBLOCK_PLAYER",
        reason: undefined,
        targetUserId: TARGET,
      },
    });
  });

  it("refuses a player who isn't blocked", async () => {
    userUpdateMany.mockResolvedValue({ count: 0 });

    await expect(unblockPlayer(TARGET)).resolves.toEqual({
      ok: false,
      message: "This player isn't blocked.",
    });
  });
});

const disputedScoreResult = {
  status: "DISPUTED",
  winner: "AUTHOR",
  noShowParty: null,
  offerJoin: {
    id: "join-1",
    userId: "player-1",
    offer: { authorId: "author-1", author: { elo: 1500, matchesPlayed: 3 } },
    user: { elo: 1480, matchesPlayed: 2 },
  },
};

describe("confirmDisputedResult", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdmin.mockResolvedValue({ id: ADMIN });
  });

  it("applies ELO for a disputed score", async () => {
    tx.matchResult.findUnique.mockResolvedValue(disputedScoreResult);

    await expect(confirmDisputedResult(RESULT)).resolves.toEqual({ ok: true });

    expect(applyMatchEloFromJoin).toHaveBeenCalledWith(tx, RESULT, {
      winner: "AUTHOR",
      offerJoin: disputedScoreResult.offerJoin,
    });
    expect(applyNoShow).not.toHaveBeenCalled();
    expect(adminActionCreate).toHaveBeenCalledWith({
      data: {
        adminId: ADMIN,
        action: "CONFIRM_RESULT",
        reason: undefined,
        matchResultId: RESULT,
      },
    });
  });

  it("applies the no-show counter for a disputed no-show report", async () => {
    tx.matchResult.findUnique.mockResolvedValue({
      ...disputedScoreResult,
      winner: null,
      noShowParty: "PLAYER",
    });

    await expect(confirmDisputedResult(RESULT)).resolves.toEqual({ ok: true });

    expect(applyNoShow).toHaveBeenCalledWith(tx, RESULT, {
      noShowParty: "PLAYER",
      offerJoin: disputedScoreResult.offerJoin,
    });
    expect(applyMatchEloFromJoin).not.toHaveBeenCalled();
  });

  it("refuses a result that isn't disputed", async () => {
    tx.matchResult.findUnique.mockResolvedValue({
      ...disputedScoreResult,
      status: "PENDING",
    });

    await expect(confirmDisputedResult(RESULT)).resolves.toEqual({
      ok: false,
      message: "This result isn't disputed.",
    });
    expect(applyMatchEloFromJoin).not.toHaveBeenCalled();
  });
});

describe("annulDisputedResult", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdmin.mockResolvedValue({ id: ADMIN });
  });

  it("annuls a disputed result without touching anyone's counters", async () => {
    resultUpdateMany.mockResolvedValue({ count: 1 });

    await expect(
      annulDisputedResult(RESULT, "unclear evidence"),
    ).resolves.toEqual({
      ok: true,
    });

    expect(resultUpdateMany).toHaveBeenCalledWith({
      where: { id: RESULT, status: "DISPUTED" },
      data: { status: "ANNULLED" },
    });
    expect(applyMatchEloFromJoin).not.toHaveBeenCalled();
    expect(applyNoShow).not.toHaveBeenCalled();
  });

  it("refuses a result that isn't disputed", async () => {
    resultUpdateMany.mockResolvedValue({ count: 0 });

    await expect(annulDisputedResult(RESULT)).resolves.toEqual({
      ok: false,
      message: "This result isn't disputed.",
    });
  });
});
