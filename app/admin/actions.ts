"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db";
import type { AdminActionType } from "@/lib/generated/prisma/enums";
import {
  lockDoublesResult,
  settleDoublesResult,
} from "@/lib/rating/apply-doubles";
import { applyMatchEloFromJoin } from "@/lib/rating/apply-elo";
import { applyNoShow } from "@/lib/rating/reliability";

// The admin queue's actions (task 6.3): dismiss / hide / block for a
// report, unblock for a currently-blocked player, confirm / annul for a
// disputed result — singles, or doubles since slice PD4. Every one starts with requireAdmin() — the page's own
// 404 is only the first gate, not the only one (6.2's DoD) — and logs an
// AdminAction, same "who, what, when, why" shape regardless of which.

export type AdminActionResult = { ok: true } | { ok: false; message: string };

const REPORT_NOT_FOUND = "This report doesn't exist.";
const ALREADY_HANDLED = "This report was already handled.";
const PLAYER_NOT_FOUND = "This player doesn't exist.";
const RESULT_NOT_FOUND = "This result doesn't exist.";
const NOT_DISPUTED = "This result isn't disputed.";
const HIDE_MESSAGE_TEXT = "[Message removed by a moderator]";

async function logAction(
  adminId: string,
  action: AdminActionType,
  target: {
    reportId?: string;
    targetUserId?: string;
    matchResultId?: string;
    doublesResultId?: string;
  },
  reason: string | undefined,
): Promise<void> {
  await db.adminAction.create({
    data: { adminId, action, reason, ...target },
  });
}

export async function dismissReport(
  reportId: unknown,
  reason?: string,
): Promise<AdminActionResult> {
  const admin = await requireAdmin();

  const id = z.uuid().safeParse(reportId);
  if (!id.success) {
    return { ok: false, message: REPORT_NOT_FOUND };
  }

  const { count } = await db.report.updateMany({
    where: { id: id.data, status: "OPEN" },
    data: { status: "DISMISSED" },
  });
  if (count === 0) {
    return { ok: false, message: ALREADY_HANDLED };
  }
  await logAction(admin.id, "DISMISS_REPORT", { reportId: id.data }, reason);
  revalidatePath("/admin/reports");
  return { ok: true };
}

/**
 * Hides what a report is about: cancels a reported offer, same as the
 * author cancelling it (3.14), but without that action's own time-window
 * rule — an admin's call overrides it; blanks a reported message's content,
 * the same "[removed]" convention account deletion uses for a departed
 * player's messages (decision 2026-10-14). A direct report on a player has
 * no object to hide — block instead.
 */
export async function hideReport(
  reportId: unknown,
  reason?: string,
): Promise<AdminActionResult> {
  const admin = await requireAdmin();

  const id = z.uuid().safeParse(reportId);
  if (!id.success) {
    return { ok: false, message: REPORT_NOT_FOUND };
  }

  const report = await db.report.findUnique({
    where: { id: id.data },
    select: { status: true, offerId: true, messageId: true },
  });
  if (!report || report.status !== "OPEN") {
    return { ok: false, message: ALREADY_HANDLED };
  }
  if (!report.offerId && !report.messageId) {
    return {
      ok: false,
      message:
        "A direct report on a player has nothing to hide — block instead.",
    };
  }

  if (report.offerId) {
    await db.sparringOffer.update({
      where: { id: report.offerId },
      data: { status: "CANCELLED" },
    });
  } else if (report.messageId) {
    await db.message.update({
      where: { id: report.messageId },
      data: { content: HIDE_MESSAGE_TEXT },
    });
  }
  await db.report.update({
    where: { id: id.data },
    data: { status: "RESOLVED" },
  });
  await logAction(
    admin.id,
    report.offerId ? "HIDE_OFFER" : "HIDE_MESSAGE",
    { reportId: id.data },
    reason,
  );
  revalidatePath("/admin/reports");
  return { ok: true };
}

export async function blockFromReport(
  reportId: unknown,
  reason?: string,
): Promise<AdminActionResult> {
  const admin = await requireAdmin();

  const id = z.uuid().safeParse(reportId);
  if (!id.success) {
    return { ok: false, message: REPORT_NOT_FOUND };
  }

  const report = await db.report.findUnique({
    where: { id: id.data },
    select: { status: true, targetUserId: true },
  });
  if (!report || report.status !== "OPEN") {
    return { ok: false, message: ALREADY_HANDLED };
  }

  await db.user.update({
    where: { id: report.targetUserId },
    data: { blockedAt: new Date() },
  });
  await db.report.update({
    where: { id: id.data },
    data: { status: "RESOLVED" },
  });
  await logAction(
    admin.id,
    "BLOCK_PLAYER",
    { reportId: id.data, targetUserId: report.targetUserId },
    reason,
  );
  revalidatePath("/admin/reports");
  return { ok: true };
}

/** Unblocking isn't tied to any one report (6.3's own "розблокувати") — a player stays blocked, and listed, until this clears it, however many reports led there. */
export async function unblockPlayer(
  targetUserId: unknown,
  reason?: string,
): Promise<AdminActionResult> {
  const admin = await requireAdmin();

  const id = z.uuid().safeParse(targetUserId);
  if (!id.success) {
    return { ok: false, message: PLAYER_NOT_FOUND };
  }

  const { count } = await db.user.updateMany({
    where: { id: id.data, blockedAt: { not: null } },
    data: { blockedAt: null },
  });
  if (count === 0) {
    return { ok: false, message: "This player isn't blocked." };
  }
  await logAction(
    admin.id,
    "UNBLOCK_PLAYER",
    { targetUserId: id.data },
    reason,
  );
  revalidatePath("/admin/reports");
  return { ok: true };
}

/**
 * Settles a DISPUTED result in the reporter's favour: a disputed score
 * applies ELO (4.8's own transaction, applyMatchEloFromJoin); a disputed
 * no-show report applies the no-show counter (applyNoShow) instead — the
 * same split confirmResult/the auto-confirm cron already make between a
 * score and a no-show, just reached from DISPUTED instead of PENDING.
 */
export async function confirmDisputedResult(
  matchResultId: unknown,
  reason?: string,
): Promise<AdminActionResult> {
  const admin = await requireAdmin();

  const id = z.uuid().safeParse(matchResultId);
  if (!id.success) {
    return { ok: false, message: RESULT_NOT_FOUND };
  }

  const outcome = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1 FROM match_results WHERE id = ${id.data}::uuid FOR UPDATE`;
    const result = await tx.matchResult.findUnique({
      where: { id: id.data },
      select: {
        status: true,
        winner: true,
        noShowParty: true,
        offerJoin: {
          select: {
            id: true,
            userId: true,
            offer: {
              select: {
                authorId: true,
                author: { select: { elo: true, matchesPlayed: true } },
              },
            },
            user: { select: { elo: true, matchesPlayed: true } },
          },
        },
      },
    });
    if (!result || result.status !== "DISPUTED") {
      return { ok: false as const, message: NOT_DISPUTED };
    }

    if (result.noShowParty) {
      await applyNoShow(tx, id.data, {
        noShowParty: result.noShowParty,
        offerJoin: result.offerJoin,
      });
    } else if (result.winner) {
      await applyMatchEloFromJoin(tx, id.data, {
        winner: result.winner,
        offerJoin: result.offerJoin,
      });
    } else {
      throw new Error(
        "Disputed result has neither a winner nor a no-show party.",
      );
    }
    return { ok: true as const };
  });
  if (!outcome.ok) {
    return outcome;
  }

  await logAction(
    admin.id,
    "CONFIRM_RESULT",
    { matchResultId: id.data },
    reason,
  );
  revalidatePath("/admin/results");
  return { ok: true };
}

/** The mirror of confirm: the dispute stands, nobody's ELO or reliability counters move. */
export async function annulDisputedResult(
  matchResultId: unknown,
  reason?: string,
): Promise<AdminActionResult> {
  const admin = await requireAdmin();

  const id = z.uuid().safeParse(matchResultId);
  if (!id.success) {
    return { ok: false, message: RESULT_NOT_FOUND };
  }

  const { count } = await db.matchResult.updateMany({
    where: { id: id.data, status: "DISPUTED" },
    data: { status: "ANNULLED" },
  });
  if (count === 0) {
    return { ok: false, message: NOT_DISPUTED };
  }
  await logAction(admin.id, "ANNUL_RESULT", { matchResultId: id.data }, reason);
  revalidatePath("/admin/results");
  return { ok: true };
}

/**
 * Settles a DISPUTED doubles result in the filer's favour (slice PD4): the
 * same write as the other pair's confirm or the 72h cron —
 * settleDoublesResult — so a score moves padel ELO once and a no-show
 * report counts against the named player, just reached from DISPUTED.
 */
export async function confirmDisputedDoublesResult(
  doublesResultId: unknown,
  reason?: string,
): Promise<AdminActionResult> {
  const admin = await requireAdmin();

  const id = z.uuid().safeParse(doublesResultId);
  if (!id.success) {
    return { ok: false, message: RESULT_NOT_FOUND };
  }

  const outcome = await db.$transaction(async (tx) => {
    const result = await lockDoublesResult(tx, id.data);
    if (!result || result.status !== "DISPUTED") {
      return { ok: false as const, message: NOT_DISPUTED };
    }
    await settleDoublesResult(tx, result);
    return { ok: true as const };
  });
  if (!outcome.ok) {
    return outcome;
  }

  await logAction(
    admin.id,
    "CONFIRM_RESULT",
    { doublesResultId: id.data },
    reason,
  );
  revalidatePath("/admin/results");
  return { ok: true };
}

/** The doubles mirror of annul: the dispute stands, no counter or rating moves. */
export async function annulDisputedDoublesResult(
  doublesResultId: unknown,
  reason?: string,
): Promise<AdminActionResult> {
  const admin = await requireAdmin();

  const id = z.uuid().safeParse(doublesResultId);
  if (!id.success) {
    return { ok: false, message: RESULT_NOT_FOUND };
  }

  const { count } = await db.doublesResult.updateMany({
    where: { id: id.data, status: "DISPUTED" },
    data: { status: "ANNULLED" },
  });
  if (count === 0) {
    return { ok: false, message: NOT_DISPUTED };
  }
  await logAction(
    admin.id,
    "ANNUL_RESULT",
    { doublesResultId: id.data },
    reason,
  );
  revalidatePath("/admin/results");
  return { ok: true };
}
